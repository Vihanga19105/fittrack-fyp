package com.fittrack.backend.repository;

import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WorkoutCompletion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface WorkoutCompletionRepository
        extends JpaRepository<WorkoutCompletion, Long> {

    List<WorkoutCompletion> findByClientAndCompletedDate(
            User client, LocalDate date);

    List<WorkoutCompletion> findByClient(User client);

    boolean existsByClientAndExerciseIdAndCompletedDate(
            User client, Long exerciseId,
            LocalDate date);
}