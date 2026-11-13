package com.odyssey.service;

import com.odyssey.entity.Comment;
import com.odyssey.entity.Image;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Location;
import com.odyssey.entity.Reaction;
import com.odyssey.entity.User;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.UserRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Guards PERF-01: converting a feed page to DTOs must not run one query per
 * journal. Associations are lazy and batch-fetched, while the author and
 * location are fetched with the page through an entity graph.
 */
@SpringBootTest
@ActiveProfiles("test")
@Transactional
class JournalQueryCountTest {

    @Autowired
    private JournalService journalService;

    @Autowired
    private JournalRepository journalRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EntityManager entityManager;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    private Statistics statistics;

    @BeforeEach
    void setUp() {
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
    }

    @Test
    void publicFeedConversionDoesNotUsePerJournalQueries() {
        seedJournals(5);

        entityManager.flush();
        entityManager.clear();
        statistics.clear();

        var page = journalService.getPublicJournals(PageRequest.of(0, 20), null);

        assertThat(page.getContent()).hasSize(5);
        assertThat(page.getContent().get(0).getTags()).isNotEmpty();
        assertThat(page.getContent().get(0).getImages()).isNotEmpty();
        assertThat(page.getContent().get(0).getComments()).isNotEmpty();

        // One page query plus a handful of batched collection queries. The
        // pre-fix implementation needed roughly five queries per journal.
        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(12);
    }

    @Test
    void searchFeedConversionDoesNotUsePerJournalQueries() {
        seedJournals(5);

        entityManager.flush();
        entityManager.clear();
        statistics.clear();

        var page = journalService.searchPublicJournals(null, null, null, PageRequest.of(0, 20), false, null);

        assertThat(page.getContent()).hasSize(5);
        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(12);
    }

    private void seedJournals(int count) {
        User author = new User();
        author.setName("Query Counter");
        author.setEmail("query-count-" + System.nanoTime() + "@example.com");
        author.setPassword("test-password");
        author.setEmailVerified(true);
        author = userRepository.save(author);

        for (int i = 0; i < count; i++) {
            Journal journal = new Journal();
            journal.setTitle("Journal " + i);
            journal.setContent("Body " + i);
            journal.setPublic(true);
            journal.setUser(author);
            journal.setTags(new LinkedHashSet<>(List.of("tag-a", "tag-b")));

            Location location = new Location();
            location.setName("Place " + i);
            location.setLatitude(10.0 + i);
            location.setLongitude(20.0 + i);
            location.setJournal(journal);
            journal.setLocation(location);

            Image image = new Image();
            image.setUrl("/api/storage/files/image-" + i + ".png");
            image.setJournal(journal);
            journal.getImages().add(image);

            Comment comment = new Comment();
            comment.setContent("Comment " + i);
            comment.setJournal(journal);
            comment.setUser(author);
            comment.setCreatedAt(LocalDateTime.now());
            journal.getComments().add(comment);

            Reaction reaction = new Reaction();
            reaction.setJournal(journal);
            reaction.setUser(author);
            reaction.setType(Reaction.ReactionType.LIKE);
            journal.getReactions().add(reaction);

            journalRepository.save(journal);
        }
    }
}
