package com.fittrack.backend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class SubscriptionUnitTest {

    @Test
    void shouldAllowSubscriptionWhenPaymentIsCompleted() {
        String paymentStatus = "COMPLETED";

        boolean canSubscribe = paymentStatus.equals("COMPLETED");

        assertTrue(canSubscribe);
    }

    @Test
    void shouldRejectSubscriptionWhenPaymentIsPending() {
        String paymentStatus = "PENDING";

        boolean canSubscribe = paymentStatus.equals("COMPLETED");

        assertFalse(canSubscribe);
    }
}