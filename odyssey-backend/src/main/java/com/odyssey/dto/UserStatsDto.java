package com.odyssey.dto;

import java.util.List;

/**
 * Travel statistics for the signed-in user, computed from data the journals
 * already carry: locations, images, tags and timestamps.
 */
public record UserStatsDto(
        long journals,
        long countries,
        long cities,
        long photos,
        long words,
        double kilometres,
        List<MonthCount> journalsByMonth,
        List<TagCount> topTags) {

    /** Calendar month bucket, keyed as yyyy-MM, zero-filled for the last year. */
    public record MonthCount(String month, long count) {
    }

    public record TagCount(String tag, long count) {
    }
}
