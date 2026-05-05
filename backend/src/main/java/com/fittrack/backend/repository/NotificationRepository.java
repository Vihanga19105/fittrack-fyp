package com.fittrack.backend.repository;

import com.fittrack.backend.model.Notification;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NotificationRepository
        extends JpaRepository<Notification, Long> {

    // Get all notifications for a user, newest first
    List<Notification> findByUserOrderByCreatedAtDesc(User user);

    // Count unread
    Long countByUserAndIsReadFalse(User user);

    // Mark all as read for a user
    @Modifying
    @Transactional
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.user = :user")
    void markAllAsRead(User user);
}