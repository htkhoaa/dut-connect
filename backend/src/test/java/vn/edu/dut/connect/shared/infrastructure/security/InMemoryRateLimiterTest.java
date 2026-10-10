package vn.edu.dut.connect.shared.infrastructure.security;

import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InMemoryRateLimiterTest {

    @Test
    @DisplayName("Allows requests up to the maximum limit and blocks subsequent requests")
    void allowsUpToLimitThenBlocks() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(3, 60_000);
        String ip = "192.168.1.100";

        assertThat(limiter.tryAcquire(ip)).isTrue();
        assertThat(limiter.tryAcquire(ip)).isTrue();
        assertThat(limiter.tryAcquire(ip)).isTrue();

        // 4th request exceeds limit of 3
        assertThat(limiter.tryAcquire(ip)).isFalse();
        // 5th request is still blocked
        assertThat(limiter.tryAcquire(ip)).isFalse();
    }

    @Test
    @DisplayName("Maintains independent rate limit counters for different keys (IPs)")
    void isolatesKeys() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(2, 60_000);
        String ipA = "10.0.0.1";
        String ipB = "10.0.0.2";

        assertThat(limiter.tryAcquire(ipA)).isTrue();
        assertThat(limiter.tryAcquire(ipA)).isTrue();
        assertThat(limiter.tryAcquire(ipA)).isFalse(); // ipA exhausted

        // ipB should still have full quota
        assertThat(limiter.tryAcquire(ipB)).isTrue();
        assertThat(limiter.tryAcquire(ipB)).isTrue();
        assertThat(limiter.tryAcquire(ipB)).isFalse(); // ipB exhausted
    }

    @Test
    @DisplayName("Resets quota when reset() is called")
    void resetsQuota() {
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(1, 60_000);
        String ip = "127.0.0.1";

        assertThat(limiter.tryAcquire(ip)).isTrue();
        assertThat(limiter.tryAcquire(ip)).isFalse();

        limiter.reset();

        assertThat(limiter.tryAcquire(ip)).isTrue();
    }

    @Test
    @DisplayName("Rejects invalid configuration parameters")
    void rejectsInvalidParameters() {
        assertThatThrownBy(() -> new InMemoryRateLimiter(0, 1000))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> new InMemoryRateLimiter(5, 0))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("Thread-safety stress test: 20 concurrent threads racing for 5 permits")
    void threadSafetyStressTest() throws InterruptedException {
        int maxPermits = 5;
        int totalThreads = 20;
        InMemoryRateLimiter limiter = new InMemoryRateLimiter(maxPermits, 60_000);
        String ip = "concurrent-client";

        ExecutorService executor = Executors.newFixedThreadPool(totalThreads);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(totalThreads);

        AtomicInteger successfulRequests = new AtomicInteger(0);
        AtomicInteger rejectedRequests = new AtomicInteger(0);

        for (int i = 0; i < totalThreads; i++) {
            executor.submit(() -> {
                try {
                    startGate.await(); // Wait for all threads to align at the start
                    if (limiter.tryAcquire(ip)) {
                        successfulRequests.incrementAndGet();
                    } else {
                        rejectedRequests.incrementAndGet();
                    }
                } catch (InterruptedException ignored) {
                    Thread.currentThread().interrupt();
                } finally {
                    endGate.countDown();
                }
            });
        }

        startGate.countDown(); // Trigger all threads simultaneously
        endGate.await();
        executor.shutdown();

        // Under high concurrency, exactly maxPermits must pass, remaining must be blocked
        assertThat(successfulRequests.get()).isEqualTo(maxPermits);
        assertThat(rejectedRequests.get()).isEqualTo(totalThreads - maxPermits);
    }
}
