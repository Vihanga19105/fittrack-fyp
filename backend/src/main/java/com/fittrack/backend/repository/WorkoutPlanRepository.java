package com.fittrack.backend.repository;

import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WorkoutPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorkoutPlanRepository
        extends JpaRepository<WorkoutPlan, Long> {

    // ── Get all plans by trainer ──
    List<WorkoutPlan> findByTrainer(User trainer);

    // ── Get all plans for a client ──
    List<WorkoutPlan> findByClient(User client);

    // ── Get plans by trainer for specific client ──
    List<WorkoutPlan> findByTrainerAndClient(
            User trainer, User client);

    // ── Get latest plan for client (highest ID first) ──
    List<WorkoutPlan> findByClientOrderByIdDesc(
            User client);
}