package com.fittrack.backend.repository;

import com.fittrack.backend.model.ChatMessage;
import com.fittrack.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ChatRepository
        extends JpaRepository<ChatMessage, Long> {

    // get conversation between two users
    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.sender = :user1 AND m.receiver = :user2) OR " +
            "(m.sender = :user2 AND m.receiver = :user1) " +
            "ORDER BY m.sentAt ASC")
    List<ChatMessage> findConversation(
            @Param("user1") User user1,
            @Param("user2") User user2
    );

    // get unread message count for a user
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE " +
            "m.receiver = :user AND m.isRead = false")
    Long countUnread(@Param("user") User user);

    // get unread count from specific sender
    @Query("SELECT COUNT(m) FROM ChatMessage m WHERE " +
            "m.sender = :sender AND " +
            "m.receiver = :receiver AND " +
            "m.isRead = false")
    Long countUnreadFromSender(
            @Param("sender") User sender,
            @Param("receiver") User receiver
    );

    // mark all messages as read between two users
    @Query("UPDATE ChatMessage m SET m.isRead = true WHERE " +
            "m.sender = :sender AND m.receiver = :receiver")
    @org.springframework.data.jpa.repository
            .Modifying
    @org.springframework.transaction.annotation
            .Transactional
    void markAsRead(
            @Param("sender") User sender,
            @Param("receiver") User receiver
    );
}