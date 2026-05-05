package com.fittrack.backend.service;

import com.fittrack.backend.model.Notification;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public void send(User user, String type,
                     String title, String message, String link) {
        Notification n = Notification.builder()
                .user(user)
                .type(type)
                .title(title)
                .message(message)
                .link(link)
                .isRead(false)
                .build();
        notificationRepository.save(n);
    }

    // ── Convenience methods ──

    public void workoutAssigned(User client, String trainerName) {
        send(client, "WORKOUT_ASSIGNED",
                "New Workout Plan 💪",
                trainerName + " assigned you a new workout plan.",
                "/client/workout-plan");
    }

    public void mealAssigned(User client, String trainerName) {
        send(client, "MEAL_ASSIGNED",
                "New Meal Plan 🥗",
                trainerName + " assigned you a new nutrition plan.",
                "/client/nutrition");
    }

    public void newMessage(User receiver, String senderName) {
        send(receiver, "NEW_MESSAGE",
                "New Message 💬",
                senderName + " sent you a message.",
                "/client/chat");
    }

    public void subscriptionRequest(User trainer, String clientName) {
        send(trainer, "SUBSCRIPTION_REQUEST",
                "New Client Request 🙋",
                clientName + " wants to subscribe to you.",
                "/trainer/client-requests");
    }

    public void subscriptionAccepted(User client, String trainerName) {
        send(client, "SUBSCRIPTION_ACCEPTED",
                "Request Accepted ✅",
                trainerName + " accepted your subscription request.",
                "/client/payments");
    }
}