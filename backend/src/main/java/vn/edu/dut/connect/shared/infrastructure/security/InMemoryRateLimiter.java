package vn.edu.dut.connect.shared.infrastructure.security;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Thread-safe fixed-window in-memory rate limiter.
 */
public class InMemoryRateLimiter {
    private final int maxRequests;
    private final long windowMillis;
    private final Map<String, Window> windows = new ConcurrentHashMap<>();

    public InMemoryRateLimiter(int maxRequests, long windowMillis) {
        if (maxRequests <= 0 || windowMillis <= 0) {
            throw new IllegalArgumentException("maxRequests and windowMillis must be positive");
        }
        this.maxRequests = maxRequests;
        this.windowMillis = windowMillis;
    }

    /**
     * Attempts to acquire a single permit for the specified key.
     *
     * @param key unique identifier (e.g., client IP)
     * @return true if permitted, false if rate limit exceeded
     */
    public boolean tryAcquire(String key) {
        long now = System.currentTimeMillis();
        Window window = windows.compute(key, (k, current) -> {
            if (current == null || now - current.startTime >= windowMillis) {
                return new Window(now, new AtomicInteger(1));
            }
            current.counter.incrementAndGet();
            return current;
        });
        return window.counter.get() <= maxRequests;
    }

    /**
     * Clears all tracking windows (useful for testing or cache eviction).
     */
    public void reset() {
        windows.clear();
    }

    private static final class Window {
        final long startTime;
        final AtomicInteger counter;

        Window(long startTime, AtomicInteger counter) {
            this.startTime = startTime;
            this.counter = counter;
        }
    }
}
