package com.odyssey.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.odyssey.dto.AskAnswer;
import com.odyssey.dto.SemanticSearchHit;
import com.odyssey.entity.Journal;
import com.odyssey.entity.JournalEmbedding;
import com.odyssey.entity.User;
import com.odyssey.exception.AiNotConfiguredException;
import com.odyssey.repository.JournalEmbeddingRepository;
import com.odyssey.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The retrieval half of RAG is pure logic and gets real coverage here with
 * deterministic fake providers: ranking must be relevance-ordered, answers
 * must come back with numbered sources, and a missing key must fail loudly
 * before any provider is contacted.
 */
class AskServiceTest {

    private static final String MODEL = "fake-embedding";

    /**
     * Small keyword dictionary mapped to orthogonal coordinates: no hash
     * collisions, so relevance ordering is fully deterministic.
     */
    private static final List<String> VOCAB = List.of(
            "jaipur", "kyoto", "dal", "baati", "churma", "pink", "city", "bazaars",
            "torii", "gates", "dawn", "matcha", "eat", "sunset");

    private static float[] localVector(String text) {
        float[] vector = new float[VOCAB.size()];
        for (String word : text.toLowerCase().split("[^a-z]+")) {
            int index = VOCAB.indexOf(word);
            if (index >= 0) {
                vector[index] += 1;
            }
        }
        float norm = 0;
        for (float v : vector) {
            norm += v * v;
        }
        norm = (float) Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] /= norm;
            }
        }
        return vector;
    }

    private static String json(float[] vector) {
        StringBuilder b = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) {
                b.append(',');
            }
            b.append(vector[i]);
        }
        return b.append(']').toString();
    }

    /** EmbeddingService whose provider responses are computed locally. */
    static class FakeEmbeddings extends EmbeddingService {
        FakeEmbeddings(String apiKey) {
            super(apiKey, "http://fake", MODEL, new ObjectMapper());
        }

        @Override
        protected String fetch(String path, List<String> texts) {
            StringBuilder data = new StringBuilder("\"data\":[");
            for (int i = 0; i < texts.size(); i++) {
                if (i > 0) {
                    data.append(',');
                }
                data.append("{\"embedding\":").append(json(localVector(texts.get(i)))).append('}');
            }
            data.append(']');
            return "{" + data + "}";
        }
    }

    /** ChatCompletionService returning a canned completion. */
    static class FakeChat extends ChatCompletionService {
        FakeChat(String apiKey) {
            super(apiKey, "http://fake", "fake-chat", new ObjectMapper());
        }

        @Override
        protected String fetch(String path, String systemPrompt, String userPrompt) {
            return "{\"choices\":[{\"message\":{\"content\":\"Canned answer [1]\"}}]}";
        }
    }

    private final UserRepository userRepository = mock(UserRepository.class);
    private final JournalEmbeddingRepository embeddingRepository = mock(JournalEmbeddingRepository.class);
    private final JournalIndexService indexService = mock(JournalIndexService.class);

    private AskService service(boolean configured) {
        return new AskService(userRepository, embeddingRepository,
                new FakeEmbeddings(configured ? "test-key" : ""),
                new FakeChat(configured ? "test-key" : ""),
                indexService);
    }

    private User user() {
        User user = new User();
        user.setId("u1");
        user.setEmail("me@odyssey.app");
        when(userRepository.findByEmailIgnoreCase("me@odyssey.app")).thenReturn(Optional.of(user));
        return user;
    }

    private JournalEmbedding chunk(Journal journal, int index, String content) {
        JournalEmbedding embedding = new JournalEmbedding();
        embedding.setJournal(journal);
        embedding.setChunkIndex(index);
        embedding.setContent(content);
        embedding.setEmbedding(json(localVector(content)));
        embedding.setModel(MODEL);
        embedding.setDimensions(VOCAB.size());
        return embedding;
    }

    private void seed(JournalEmbedding... embeddings) {
        when(embeddingRepository.findAllByUserId("u1")).thenReturn(List.of(embeddings));
    }

    private static Journal journal(String id, String title) {
        Journal journal = new Journal();
        journal.setId(id);
        journal.setTitle(title);
        return journal;
    }

    @Test
    void askRanksRelevantJournalsFirstAndCitesThem() {
        user();
        Journal jaipur = journal("j1", "Five mornings in Jaipur");
        Journal kyoto = journal("j2", "Torii gates before breakfast");
        seed(
                chunk(kyoto, 0, "We walked through the torii gates at dawn in Kyoto and drank matcha."),
                chunk(jaipur, 0, "In Jaipur we ate dal baati churma and explored the pink city bazaars."));

        AskAnswer answer = service(true).ask("me@odyssey.app", "What did I eat in Jaipur?");

        assertThat(answer.answer()).isEqualTo("Canned answer [1]");
        assertThat(answer.sources()).isNotEmpty();
        assertThat(answer.sources().get(0).journalTitle()).isEqualTo("Five mornings in Jaipur");
        assertThat(answer.sources().get(0).index()).isEqualTo(1);
        assertThat(answer.sources().get(0).journalId()).isEqualTo("j1");
    }

    @Test
    void askWithoutAnyRelevantChunkAnswersWithoutCallingTheProvider() {
        user();
        seed(); // nothing indexed

        AskAnswer answer = service(true).ask("me@odyssey.app", "What did I eat in Jaipur?");

        assertThat(answer.sources()).isEmpty();
        assertThat(answer.answer()).contains("couldn't find anything");
    }

    @Test
    void askWithoutConfiguredProviderFailsBeforeAnyProviderCall() {
        user();
        assertThatThrownBy(() -> service(false).ask("me@odyssey.app", "Where did I eat dal?"))
                .isInstanceOf(AiNotConfiguredException.class);
    }

    @Test
    void chunksFromAnotherModelOrDimensionAreIgnored() {
        user();
        Journal jaipur = journal("j1", "Five mornings in Jaipur");
        JournalEmbedding stale = chunk(jaipur, 0, "In Jaipur we ate dal baati churma.");
        stale.setModel("old-model");
        JournalEmbedding wrongDims = chunk(jaipur, 1, "In Jaipur we drank lassi.");
        wrongDims.setDimensions(9);
        seed(stale, wrongDims);

        AskAnswer answer = service(true).ask("me@odyssey.app", "What did I eat in Jaipur?");

        assertThat(answer.sources()).isEmpty();
    }

    @Test
    void searchReturnsRelevanceOrderedHitsWithScores() {
        user();
        Journal jaipur = journal("j1", "Five mornings in Jaipur");
        Journal kyoto = journal("j2", "Torii gates before breakfast");
        seed(
                chunk(kyoto, 0, "We walked through the torii gates at dawn in Kyoto and drank matcha."),
                chunk(jaipur, 0, "In Jaipur we ate dal baati churma and explored the pink city bazaars."),
                chunk(kyoto, 1, "A pink sunset over the gates in Kyoto."));

        List<SemanticSearchHit> hits = service(true).search("me@odyssey.app", "pink city bazaars");

        assertThat(hits).isNotEmpty();
        assertThat(hits.get(0).journalTitle()).isEqualTo("Five mornings in Jaipur");
        assertThat(hits.get(0).score()).isGreaterThan(hits.get(hits.size() - 1).score());
        for (int i = 1; i < hits.size(); i++) {
            assertThat(hits.get(i).score()).isLessThanOrEqualTo(hits.get(i - 1).score());
        }
    }
}
