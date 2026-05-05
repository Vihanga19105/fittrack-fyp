package com.fittrack.backend.repository;

import com.fittrack.backend.model.Subscription;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository
        extends JpaRepository<Subscription, Long> {

    List<Subscription> findByClient(User client);

    List<Subscription> findByTrainer(User trainer);

    List<Subscription> findByTrainerAndStatus(
            User trainer, String status);

    List<Subscription> findByClientAndStatus(
            User client, String status);

    Optional<Subscription> findByClientAndTrainer(
            User client, User trainer);

    List<Subscription> findByTrainerAndStatusIn(
            User trainer, List<String> statuses);

    // ── NEW: find current active subscription for a client ──
    Optional<Subscription> findTopByClientIdAndStatusOrderByIdDesc(
            Long clientId, String status);
}