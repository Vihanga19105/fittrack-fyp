package com.fittrack.backend.controller;

import com.fittrack.backend.model.Notification;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.NotificationRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    // GET /api/notifications — get all for logged-in user
    @GetMapping
    public ResponseEntity<List<Notification>> getAll(
            Principal principal) {
        User user = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        return ResponseEntity.ok(
                notificationRepository
                        .findByUserOrderByCreatedAtDesc(user));
    }

    // GET /api/notifications/unread-count
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(
            Principal principal) {
        User user = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        Long count = notificationRepository
                .countByUserAndIsReadFalse(user);
        return ResponseEntity.ok(Map.of("count", count));
    }

    // PUT /api/notifications/mark-all-read
    @PutMapping("/mark-all-read")
    public ResponseEntity<?> markAllRead(Principal principal) {
        User user = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        notificationRepository.markAllAsRead(user);
        return ResponseEntity.ok(
                Map.of("message", "All marked as read"));
    }

    // PUT /api/notifications/{id}/read — mark single as read
    @PutMapping("/{id}/read")
    public ResponseEntity<?> markOneRead(
            @PathVariable Long id, Principal principal) {
        Notification n = notificationRepository
                .findById(id).orElseThrow();
        n.setIsRead(true);
        notificationRepository.save(n);
        return ResponseEntity.ok(Map.of("message", "Marked as read"));
    }
}