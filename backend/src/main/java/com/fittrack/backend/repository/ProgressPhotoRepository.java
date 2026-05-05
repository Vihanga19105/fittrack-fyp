package com.fittrack.backend.repository;

import com.fittrack.backend.model.ProgressPhoto;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgressPhotoRepository
        extends JpaRepository<ProgressPhoto, Long> {

    // Get all photos for a user ordered by date
    List<ProgressPhoto> findByUserOrderByPhotoDateAsc(User user);

    // Delete a specific photo by id and user
    void deleteByIdAndUser(Long id, User user);
}