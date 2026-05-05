package com.fittrack.backend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class WorkoutPlanUnitTest {

    @Test
    void shouldAcceptValidWorkoutPlanName() {
        String workoutPlanName = "Weight Loss Beginner Plan";

        boolean isValid = workoutPlanName != null && !workoutPlanName.isBlank();

        assertTrue(isValid);
    }

    @Test
    void shouldRejectEmptyWorkoutPlanName() {
        String workoutPlanName = "";

        boolean isValid = workoutPlanName != null && !workoutPlanName.isBlank();

        assertFalse(isValid);
    }
}