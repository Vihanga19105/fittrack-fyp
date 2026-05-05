package com.fittrack.backend.repository;

import com.fittrack.backend.model.TrainerProfile;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TrainerProfileRepository
        extends JpaRepository<TrainerProfile, Long> {

    // ✅ Find trainer profile by user
    Optional<TrainerProfile> findByUser(User user);

    // ✅ Get all verified trainers for the trainer list page
    List<TrainerProfile> findByIsVerifiedTrue();
}