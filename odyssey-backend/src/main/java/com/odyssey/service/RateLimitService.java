package com.odyssey.service;

import com.odyssey.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Small in-memory sliding-window limiter for sensitive authentication actions.
 * Suitable for a single instance; swap for Redis when running multiple nodes.
 */
@Service
public class RateLimitService {

    private static final long MAX_TRACKED_WINDOW_MS = 3_600_000L;
    private static final int CLEANUP_THRESHOLD = 500;

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanup = new AtomicLong(System.currentTimeMillis());
    private final boolean enabled;

    public RateLimitService(@Value("${app.rate-limit.enabled:true}") boolean enabled) {
        this.enabled = enabled;
    }

    public void check(String key, int limit, long windowSeconds) {
        if (!enabled) {
            return;
        }
        long now = System.currentTimeMillis();
        long windowStart = now - windowSeconds * 1000L;
        maybeCleanup(now);

        Deque<Long> timestamps = hits.computeIfAbsent(key, k -> new ArrayDeque<>());

        synchronized (timestamps) {
            while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
                timestamps.pollFirst();
            }
            if (timestamps.size() >= limit) {
                throw new TooManyRequestsException("Too many attempts. Please wait a while and try again.");
            }
            timestamps.addLast(now);
        }
    }

    private void maybeCleanup(long now) {
        if (hits.size() < CLEANUP_THRESHOLD || now - lastCleanup.get() < 60_000L) {
            return;
        }
        lastCleanup.set(now);
        long cutoff = now - MAX_TRACKED_WINDOW_MS;
        hits.entrySet().removeIf(entry -> {
            Deque<Long> timestamps = entry.getValue();
            synchronized (timestamps) {
                return timestamps.isEmpty() || timestamps.peekLast() < cutoff;
            }
        });
    }
}
