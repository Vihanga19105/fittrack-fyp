package com.fittrack.backend.repository;

import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WeightLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WeightLogRepository
        extends JpaRepository<WeightLog, Long> {

    List<WeightLog> findByUserOrderByLoggedAtAsc(User user);

    // ── for trainer to see client history ──
    List<WeightLog> findByUserOrderByLoggedAtDesc(User user);
}