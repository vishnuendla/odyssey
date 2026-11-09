package com.odyssey.service;

import com.odyssey.exception.TooManyRequestsException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small in-memory sliding-window limiter for sensitive authentication actions.
 * Suitable for a single instance; swap for Redis when running multiple nodes.
 */
@Service
public class RateLimitService {

    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
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
}
