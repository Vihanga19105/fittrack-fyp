package com.fittrack.backend.repository;

import com.fittrack.backend.model.TrainerReview;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface TrainerReviewRepository
        extends JpaRepository<TrainerReview, Long> {

    // get all reviews for a trainer
    List<TrainerReview> findByTrainerOrderByCreatedAtDesc(
            User trainer);

    // check if client already reviewed this trainer
    Optional<TrainerReview> findByTrainerAndClient(
            User trainer, User client);

    // get average rating for a trainer
    @Query("SELECT AVG(r.rating) FROM TrainerReview r " +
            "WHERE r.trainer = :trainer")
    Double getAverageRating(@Param("trainer") User trainer);

    // get review count for a trainer
    Long countByTrainer(User trainer);
}