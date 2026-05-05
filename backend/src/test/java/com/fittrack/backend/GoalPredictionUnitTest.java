package com.fittrack.backend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class GoalPredictionUnitTest {

    @Test
    void shouldCalculateWeightDifference() {
        double currentWeight = 80;
        double targetWeight = 70;

        double difference = currentWeight - targetWeight;

        assertEquals(10, difference);
    }

    @Test
    void shouldIdentifyWeightLossGoal() {
        double currentWeight = 85;
        double targetWeight = 75;

        boolean isWeightLoss = currentWeight > targetWeight;

        assertTrue(isWeightLoss);
    }
}