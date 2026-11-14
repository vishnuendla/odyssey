package com.odyssey.service;

import com.odyssey.dto.UserStatsDto;
import com.odyssey.entity.Journal;
import com.odyssey.entity.Location;
import com.odyssey.entity.User;
import com.odyssey.exception.UnauthorizedException;
import com.odyssey.repository.JournalRepository;
import com.odyssey.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;

/**
 * Travel statistics derived entirely from data the journals already carry, so
 * the dashboard needs no extra bookkeeping when someone writes an entry.
 */
@Service
public class StatsService {

    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM", Locale.ROOT);
    private static final int MONTH_WINDOW = 12;
    private static final int TOP_TAGS = 8;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final JournalRepository journalRepository;
    private final UserRepository userRepository;
    private final Clock clock;

    public StatsService(JournalRepository journalRepository,
                        UserRepository userRepository,
                        Clock clock) {
        this.journalRepository = journalRepository;
        this.userRepository = userRepository;
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public UserStatsDto getMyStats(String userEmail) {
        User user = userRepository.findByEmailIgnoreCase(userEmail)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        List<Journal> journals = journalRepository.findByUserOrderByCreatedAtDesc(user);

        TreeSet<String> countries = new TreeSet<>();
        TreeSet<String> cities = new TreeSet<>();
        long photos = 0;
        long words = 0;
        Map<String, Long> tagCounts = new LinkedHashMap<>();
        Map<YearMonth, Long> monthCounts = new LinkedHashMap<>();

        for (Journal journal : journals) {
            Location location = journal.getLocation();
            if (location != null) {
                if (notBlank(location.getCountry())) {
                    countries.add(location.getCountry().trim());
                }
                if (notBlank(location.getCity())) {
                    cities.add(location.getCity().trim());
                }
            }
            photos += journal.getImages().size();
            words += countWords(journal.getContent());
            for (String tag : journal.getTags()) {
                tagCounts.merge(tag, 1L, Long::sum);
            }
            monthCounts.merge(YearMonth.from(journal.getCreatedAt()), 1L, Long::sum);
        }

        return new UserStatsDto(
                journals.size(),
                countries.size(),
                cities.size(),
                photos,
                words,
                round1(kilometresTravelled(journals)),
                journalsByMonth(monthCounts),
                topTags(tagCounts));
    }

    /**
     * Great-circle distance walked, driven or flown between each journal and the
     * next, in chronological order. Journals without a location are skipped.
     */
    static double kilometresTravelled(List<Journal> journals) {
        List<Journal> located = journals.stream()
                .filter(j -> j.getLocation() != null)
                .sorted(Comparator.comparing(Journal::getCreatedAt))
                .toList();
        double total = 0;
        Location previous = null;
        for (Journal journal : located) {
            Location current = journal.getLocation();
            if (previous != null) {
                total += haversineKm(previous.getLatitude(), previous.getLongitude(),
                        current.getLatitude(), current.getLongitude());
            }
            previous = current;
        }
        return total;
    }

    static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.pow(Math.sin(dLon / 2), 2);
        return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
    }

    private List<UserStatsDto.MonthCount> journalsByMonth(Map<YearMonth, Long> counts) {
        YearMonth current = YearMonth.from(LocalDate.now(clock));
        List<UserStatsDto.MonthCount> months = new ArrayList<>(MONTH_WINDOW);
        for (int i = MONTH_WINDOW - 1; i >= 0; i--) {
            YearMonth month = current.minusMonths(i);
            months.add(new UserStatsDto.MonthCount(month.format(MONTH_KEY), counts.getOrDefault(month, 0L)));
        }
        return months;
    }

    private List<UserStatsDto.TagCount> topTags(Map<String, Long> counts) {
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(TOP_TAGS)
                .map(entry -> new UserStatsDto.TagCount(entry.getKey(), entry.getValue()))
                .toList();
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    private static long countWords(String content) {
        if (content == null || content.isBlank()) {
            return 0;
        }
        return content.trim().split("\\s+").length;
    }

    private static double round1(double value) {
        return Math.round(value * 10) / 10.0;
    }
}
