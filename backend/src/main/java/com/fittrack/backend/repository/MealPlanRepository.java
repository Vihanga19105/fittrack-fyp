package com.fittrack.backend.repository;

import com.fittrack.backend.model.MealPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MealPlanRepository extends JpaRepository<MealPlan, Long> {

    List<MealPlan> findByClientId(Long clientId);

    List<MealPlan> findByTrainerIdAndClientId(Long trainerId, Long clientId);

    Optional<MealPlan> findByClientIdAndIsActiveTrue(Long clientId);

    List<MealPlan> findByClientIdOrderByIdDesc(Long clientId);

    // ── NEW: find active plan by client + specific trainer ──
    Optional<MealPlan> findTopByClientIdAndTrainerIdAndIsActiveTrueOrderByIdDesc(
            Long clientId, Long trainerId);
}