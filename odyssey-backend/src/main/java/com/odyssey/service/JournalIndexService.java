package com.odyssey.service;

import com.odyssey.entity.Journal;
import com.odyssey.entity.JournalEmbedding;
import com.odyssey.repository.JournalEmbeddingRepository;
import com.odyssey.repository.JournalRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Set;

/**
 * Keeps the {@code journal_embeddings} table in step with journal writes:
 * chunking, embedding and storage all happen after the saving transaction
 * commits, and every failure is logged and swallowed so a broken or missing
 * AI provider can never fail a journal save. Deletes are covered both by the
 * database cascade (V8) and by an explicit pre-delete cleanup for test schemas
 * built by Hibernate, whose foreign keys do not cascade.
 */
@Service
public class JournalIndexService {

    private static final Logger log = LoggerFactory.getLogger(JournalIndexService.class);
    /** Upper bound for the lazy backfill so an ask request stays responsive. */
    static final int BACKFILL_LIMIT = 20;

    private final JournalRepository journalRepository;
    private final JournalEmbeddingRepository embeddingRepository;
    private final EmbeddingService embeddingService;
    private final TransactionTemplate writeTx;

    public JournalIndexService(JournalRepository journalRepository,
                               JournalEmbeddingRepository embeddingRepository,
                               EmbeddingService embeddingService,
                               PlatformTransactionManager transactionManager) {
        this.journalRepository = journalRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingService = embeddingService;
        this.writeTx = new TransactionTemplate(transactionManager);
        // afterCommit callbacks run while the completed transaction is still
        // bound to the thread; joining it would write into a transaction that
        // has already committed, so the writes need their own transaction.
        this.writeTx.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
    }

    /**
     * Re-indexes the journal once the current transaction has committed, so the
     * slow provider call never holds a database transaction open.
     */
    public void indexAfterCommit(String journalId) {
        if (!embeddingService.isConfigured()) {
            return;
        }
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    indexJournal(journalId);
                }
            });
        } else {
            indexJournal(journalId);
        }
    }

    /** Best-effort: embeds and stores paragraph chunks, replacing old rows. */
    public void indexJournal(String journalId) {
        if (!embeddingService.isConfigured()) {
            return;
        }
        try {
            Journal journal = journalRepository.findById(journalId).orElse(null);
            if (journal == null || journal.getContent() == null || journal.getContent().isBlank()) {
                return;
            }
            List<String> chunks = TextChunker.chunk(journal.getContent());
            if (chunks.isEmpty()) {
                writeTx.executeWithoutResult(status -> embeddingRepository.deleteByJournalId(journalId));
                return;
            }
            // Provider call outside the transaction; only the DB writes are.
            List<float[]> vectors = embeddingService.embedAll(chunks);
            writeTx.executeWithoutResult(status -> {
                embeddingRepository.deleteByJournalId(journalId);
                for (int i = 0; i < chunks.size() && i < vectors.size(); i++) {
                    JournalEmbedding embedding = new JournalEmbedding();
                    embedding.setJournal(journal);
                    embedding.setChunkIndex(i);
                    embedding.setContent(chunks.get(i));
                    embedding.setEmbedding(toJson(vectors.get(i)));
                    embedding.setModel(embeddingService.model());
                    embedding.setDimensions(vectors.get(i).length);
                    embeddingRepository.save(embedding);
                }
            });
            log.debug("Indexed journal {} into {} chunks", journalId, chunks.size());
        } catch (Exception ex) {
            log.warn("Could not index journal {}: {}", journalId, ex.getMessage());
        }
    }

    /**
     * Indexes up to {@link #BACKFILL_LIMIT} of the user's journals that have no
     * embeddings yet, so the first ask after enabling AI still has something to
     * search. Already-indexed journals are skipped.
     */
    public void ensureUserIndexed(com.odyssey.entity.User user) {
        if (!embeddingService.isConfigured()) {
            return;
        }
        try {
            Set<String> indexed = Set.copyOf(embeddingRepository.findIndexedJournalIds(user.getId()));
            List<Journal> journals = journalRepository.findByUserOrderByCreatedAtDesc(user);
            int budget = BACKFILL_LIMIT;
            for (Journal journal : journals) {
                if (budget <= 0) {
                    break;
                }
                if (!indexed.contains(journal.getId()) && journal.getContent() != null
                        && !journal.getContent().isBlank()) {
                    indexJournal(journal.getId());
                    budget--;
                }
            }
        } catch (Exception ex) {
            log.warn("Backfill indexing failed for user {}: {}", user.getId(), ex.getMessage());
        }
    }

    /** Explicit cleanup so schemas without the cascade FK stay consistent. */
    public void deleteIndex(String journalId) {
        try {
            embeddingRepository.deleteByJournalId(journalId);
        } catch (Exception ex) {
            log.warn("Could not delete embeddings for journal {}: {}", journalId, ex.getMessage());
        }
    }

    private static String toJson(float[] vector) {
        StringBuilder json = new StringBuilder(vector.length * 8);
        json.append('[');
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                json.append(',');
            }
            json.append(vector[i]);
        }
        return json.append(']').toString();
    }
}
