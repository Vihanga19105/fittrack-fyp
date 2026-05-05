package com.fittrack.backend.repository;

import com.fittrack.backend.model.TrainerAvailability;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TrainerAvailabilityRepository
        extends JpaRepository<TrainerAvailability, Long> {

    List<TrainerAvailability> findByUser(User user);

    List<TrainerAvailability> findByUserId(Long userId);

    void deleteByUser(User user);
}