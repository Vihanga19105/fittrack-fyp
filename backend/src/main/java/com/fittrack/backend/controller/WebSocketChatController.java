package com.fittrack.backend.controller;

import com.fittrack.backend.model.ChatMessage;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.ChatRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRepository chatRepository;
    private final UserRepository userRepository;

    // ── HANDLE INCOMING MESSAGE ──
    // client sends to /app/chat.send
    @MessageMapping("/chat.send")
    public void sendMessage(
            @Payload Map<String, Object> payload) {

        Long senderId = Long.parseLong(
                payload.get("senderId").toString());
        Long receiverId = Long.parseLong(
                payload.get("receiverId").toString());
        String messageText =
                payload.get("message").toString();

        User sender = userRepository
                .findById(senderId).orElseThrow();
        User receiver = userRepository
                .findById(receiverId).orElseThrow();

        // save to database
        ChatMessage msg = new ChatMessage();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setMessage(messageText);
        msg.setIsRead(false);
        msg.setSentAt(LocalDateTime.now());
        chatRepository.save(msg);

        // build response payload
        Map<String, Object> response = Map.of(
                "id", msg.getId(),
                "senderId", senderId,
                "senderName", sender.getName(),
                "receiverId", receiverId,
                "message", messageText,
                "sentAt", msg.getSentAt().toString(),
                "isRead", false
        );

        // send to receiver's personal queue
        messagingTemplate.convertAndSendToUser(
                receiverId.toString(),
                "/queue/messages",
                response
        );

        // send back to sender to confirm
        messagingTemplate.convertAndSendToUser(
                senderId.toString(),
                "/queue/messages",
                response
        );
    }
}