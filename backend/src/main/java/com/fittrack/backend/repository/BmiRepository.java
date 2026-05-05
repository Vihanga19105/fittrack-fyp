package com.fittrack.backend.repository;

import com.fittrack.backend.model.BmiLog;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BmiRepository
        extends JpaRepository<BmiLog, Long> {

    List<BmiLog> findByUserOrderByLoggedAtDesc(User user);
}