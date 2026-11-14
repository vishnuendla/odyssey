package com.odyssey.service;

import com.odyssey.dto.UserStatsDto;
import com.odyssey.entity.Image;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Location;
import com.odyssey.entity.User;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * The stats dashboard is derived data: the same numbers must fall out whenever
 * the same journals go in, and the month window must stay fixed-length even
 * when nothing was written for months.
 */
class StatsServiceTest {

    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2026-11-14T10:00:00Z"), ZoneId.of("UTC"));

    private final JournalRepository journalRepository = mock(JournalRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final StatsService statsService = new StatsService(journalRepository, userRepository, CLOCK);

    private static Journal journal(String title, String content, Location location,
                                   LocalDateTime createdAt, String... tags) {
        Journal journal = new Journal();
        journal.setId(title);
        journal.setTitle(title);
        journal.setContent(content);
        journal.setCreatedAt(createdAt);
        journal.setTags(new java.util.LinkedHashSet<>(Set.of(tags)));
        journal.setLocation(location);
        return journal;
    }

    private static Location at(double lat, double lon, String country, String city) {
        Location location = new Location();
        location.setLatitude(lat);
        location.setLongitude(lon);
        location.setCountry(country);
        location.setCity(city);
        return location;
    }

    private UserStatsDto statsFor(List<Journal> journals) {
        User user = new User();
        user.setId("u1");
        user.setEmail("me@odyssey.app");
        when(userRepository.findByEmailIgnoreCase("me@odyssey.app")).thenReturn(java.util.Optional.of(user));
        when(journalRepository.findByUserOrderByCreatedAtDesc(user)).thenReturn(journals);
        return statsService.getMyStats("me@odyssey.app");
    }

    @Test
    void emptyHistoryStillYieldsAFullYearOfZeroes() {
        UserStatsDto stats = statsFor(List.of());

        assertThat(stats.journals()).isZero();
        assertThat(stats.countries()).isZero();
        assertThat(stats.kilometres()).isZero();
        assertThat(stats.journalsByMonth()).hasSize(12);
        assertThat(stats.journalsByMonth().get(11).month()).isEqualTo("2026-11");
        assertThat(stats.journalsByMonth().get(0).month()).isEqualTo("2025-12");
        assertThat(stats.journalsByMonth().stream().allMatch(m -> m.count() == 0)).isTrue();
    }

    @Test
    void countsDistinctPlacesPhotosWordsAndTags() {
        Journal india = journal("Jaipur", "One two three four five. Six seven.",
                at(26.9, 75.8, "India", "Jaipur"),
                LocalDateTime.of(2026, 10, 5, 9, 0), "india", "architecture");
        Image photo = new Image();
        india.setImages(new java.util.ArrayList<>(List.of(photo)));

        Journal japan = journal("Kyoto", "Short entry.",
                at(35.0, 135.8, "Japan", "Kyoto"),
                LocalDateTime.of(2026, 11, 1, 9, 0), "japan", "india");

        UserStatsDto stats = statsFor(List.of(japan, india));

        assertThat(stats.journals()).isEqualTo(2);
        assertThat(stats.countries()).isEqualTo(2);
        assertThat(stats.cities()).isEqualTo(2);
        assertThat(stats.photos()).isEqualTo(1);
        assertThat(stats.words()).isEqualTo(9);
        assertThat(stats.topTags().stream().map(UserStatsDto.TagCount::tag))
                .containsExactly("india", "architecture", "japan");
        assertThat(stats.topTags().get(0).count()).isEqualTo(2);
    }

    @Test
    void sumsGreatCircleDistanceBetweenConsecutiveJournals() {
        // Roughly 700 km from Hyderabad to Jaipur, then back the next month.
        Journal hyderabad = journal("Hyderabad", "Home.",
                at(17.385, 78.4867, "India", "Hyderabad"),
                LocalDateTime.of(2026, 9, 1, 9, 0));
        Journal jaipur = journal("Jaipur", "Pink city.",
                at(26.9124, 75.7873, "India", "Jaipur"),
                LocalDateTime.of(2026, 10, 1, 9, 0));
        Journal back = journal("Hyderabad again", "Home again.",
                at(17.385, 78.4867, "India", "Hyderabad"),
                LocalDateTime.of(2026, 11, 1, 9, 0));

        UserStatsDto stats = statsFor(List.of(back, jaipur, hyderabad));

        // Order in the list must not matter: the service walks chronologically.
        assertThat(stats.kilometres()).isGreaterThan(2000).isLessThan(2400);
    }

    @Test
    void ignoresJournalsWithoutALocationForDistance() {
        Journal located = journal("Jaipur", "Pink city.",
                at(26.9124, 75.7873, "India", "Jaipur"),
                LocalDateTime.of(2026, 10, 1, 9, 0));
        Journal nowhere = journal("Draft", "No coordinates.", null,
                LocalDateTime.of(2026, 10, 2, 9, 0));

        UserStatsDto stats = statsFor(List.of(nowhere, located));

        assertThat(stats.kilometres()).isZero();
        assertThat(stats.cities()).isEqualTo(1);
    }

    @Test
    void haversineMatchesKnownDistance() {
        double jaipurToDelhi = StatsService.haversineKm(26.9124, 75.7873, 28.6139, 77.2090);
        assertThat(jaipurToDelhi).isGreaterThan(230).isLessThan(290);
    }
}
