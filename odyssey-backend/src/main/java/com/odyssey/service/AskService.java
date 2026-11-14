package com.odyssey.service;

import com.odyssey.dto.AskAnswer;
import com.odyssey.dto.SemanticSearchHit;
import com.odyssey.dto.SourceRef;
import com.odyssey.entity.JournalEmbedding;
import com.odyssey.entity.User;
import com.odyssey.exception.AiNotConfiguredException;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.JournalEmbeddingRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Retrieval-augmented answers over a user's own journals: embed the question,
 * rank the user's stored chunks by cosine similarity, hand the best excerpts to
 * the chat model with a strict "only these sources" instruction and return the
 * answer with numbered citations. Hidden journals are never searched.
 */
@Service
public class AskService {

    static final int TOP_K = 6;
    static final double MIN_SCORE = 0.05;
    static final int SNIPPET_LENGTH = 180;

    private final UserRepository userRepository;
    private final JournalEmbeddingRepository embeddingRepository;
    private final EmbeddingService embeddingService;
    private final ChatCompletionService chatCompletionService;
    private final JournalIndexService journalIndexService;

    public AskService(UserRepository userRepository,
                      JournalEmbeddingRepository embeddingRepository,
                      EmbeddingService embeddingService,
                      ChatCompletionService chatCompletionService,
                      JournalIndexService journalIndexService) {
        this.userRepository = userRepository;
        this.embeddingRepository = embeddingRepository;
        this.embeddingService = embeddingService;
        this.chatCompletionService = chatCompletionService;
        this.journalIndexService = journalIndexService;
    }

    @Transactional
    public AskAnswer ask(String userEmail, String question) {
        requireConfigured();
        User user = requireUser(userEmail);

        // First ask may need to backfill the index for older journals.
        journalIndexService.ensureUserIndexed(user);

        float[] questionVector = embeddingService.embed(question);
        if (questionVector == null) {
            throw new IllegalStateException("Embedding provider returned no vector");
        }
        List<Scored> hits = rank(user, questionVector);
        if (hits.isEmpty()) {
            return new AskAnswer(question,
                    "I couldn't find anything about that in your journals yet. "
                            + "Write more entries and ask again!",
                    List.of());
        }

        String answer = chatCompletionService.complete(systemPrompt(), userPrompt(hits, question));
        return new AskAnswer(question, answer, sources(hits));
    }

    @Transactional(readOnly = true)
    public List<SemanticSearchHit> search(String userEmail, String query) {
        requireConfigured();
        User user = requireUser(userEmail);
        float[] queryVector = embeddingService.embed(query);
        if (queryVector == null) {
            throw new IllegalStateException("Embedding provider returned no vector");
        }
        return rank(user, queryVector).stream()
                .map(hit -> new SemanticSearchHit(
                        hit.embedding().getJournal().getId(),
                        hit.embedding().getJournal().getTitle(),
                        hit.embedding().getChunkIndex(),
                        snippet(hit.embedding().getContent()),
                        round4(hit.score())))
                .toList();
    }

    private void requireConfigured() {
        if (!embeddingService.isConfigured() || !chatCompletionService.isConfigured()) {
            throw new AiNotConfiguredException(
                    "AI features are not configured on this server. Set AI_API_KEY to enable them.");
        }
    }

    private List<Scored> rank(User user, float[] questionVector) {
        List<JournalEmbedding> embeddings = embeddingRepository.findAllByUserId(user.getId()).stream()
                .filter(e -> e.getModel().equals(embeddingService.model()))
                .filter(e -> e.getDimensions() == questionVector.length)
                .toList();
        List<Scored> scored = new ArrayList<>(embeddings.size());
        for (JournalEmbedding embedding : embeddings) {
            double score = Vectors.cosine(questionVector, Vectors.parseJsonArray(embedding.getEmbedding()));
            if (score > MIN_SCORE) {
                scored.add(new Scored(embedding, score));
            }
        }
        scored.sort(Comparator.comparingDouble(Scored::score).reversed());
        return scored.subList(0, Math.min(TOP_K, scored.size()));
    }

    private String systemPrompt() {
        return """
                You answer questions about the user's personal travel journals. \
                Use ONLY the numbered journal excerpts provided. Cite the excerpts you \
                used inline as [1], [2] matching their numbers. If the excerpts do not \
                contain the answer, say so plainly. Keep the answer concise and warm.""";
    }

    private String userPrompt(List<Scored> hits, String question) {
        StringBuilder context = new StringBuilder("Journal excerpts:\n\n");
        for (int i = 0; i < hits.size(); i++) {
            JournalEmbedding embedding = hits.get(i).embedding();
            context.append('[').append(i + 1).append("] \"")
                    .append(embedding.getJournal().getTitle()).append("\"\n")
                    .append(embedding.getContent())
                    .append("\n\n");
        }
        return context.append("Question: ").append(question).append("\n").toString();
    }

    private List<SourceRef> sources(List<Scored> hits) {
        List<SourceRef> sources = new ArrayList<>(hits.size());
        for (int i = 0; i < hits.size(); i++) {
            JournalEmbedding embedding = hits.get(i).embedding();
            sources.add(new SourceRef(
                    i + 1,
                    embedding.getJournal().getId(),
                    embedding.getJournal().getTitle(),
                    embedding.getChunkIndex(),
                    snippet(embedding.getContent())));
        }
        return sources;
    }

    private static String snippet(String content) {
        String flat = content.strip().replaceAll("\\s+", " ");
        return flat.length() <= SNIPPET_LENGTH ? flat : flat.substring(0, SNIPPET_LENGTH) + "…";
    }

    private static double round4(double value) {
        return Math.round(value * 10000) / 10000.0;
    }

    private User requireUser(String userEmail) {
        return userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private record Scored(JournalEmbedding embedding, double score) {
    }
}
