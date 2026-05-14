package com.fittrack.backend.controller;

import com.fittrack.backend.model.ChatMessage;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.ChatRepository;
import com.fittrack.backend.repository.ClientProfileRepository;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.TrainerProfileRepository;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRepository chatRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final NotificationService notificationService;

    // ── SEND MESSAGE ──
    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User sender = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        User receiver = userRepository
                .findById(Long.parseLong(
                        body.get("receiverId").toString())).orElseThrow();

        ChatMessage msg = new ChatMessage();
        msg.setSender(sender);
        msg.setReceiver(receiver);
        msg.setMessage(body.get("message").toString());
        msg.setIsRead(false);
        msg.setSentAt(LocalDateTime.now());

        chatRepository.save(msg);

        notificationService.newMessage(receiver, sender.getName());

        return ResponseEntity.ok(msg);
    }

    // ── GET CONVERSATION ──
    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<?> getConversation(
            @PathVariable Long otherUserId, Principal principal) {

        User me = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        User other = userRepository
                .findById(otherUserId).orElseThrow();

        chatRepository.markAsRead(other, me);

        List<ChatMessage> messages =
                chatRepository.findConversation(me, other);

        return ResponseEntity.ok(messages);
    }

    // ── GET MY CHAT LIST ──
    @GetMapping("/my-chats")
    public ResponseEntity<?> getMyChatList(Principal principal) {

        User me = userRepository
                .findByEmail(principal.getName()).orElseThrow();

        String role = me.getRole().toString();
        boolean isTrainer = role.equals("TRAINER") || role.equals("ROLE_TRAINER");

        List<User> chatUsers;

        if (isTrainer) {
            // Trainer sees their active clients
            chatUsers = subscriptionRepository
                    .findByTrainerAndStatusIn(me, Arrays.asList("ACTIVE"))
                    .stream()
                    .map(s -> s.getClient())
                    .collect(Collectors.toList());
        } else {
            // Client sees their active trainer
            chatUsers = subscriptionRepository
                    .findByClient(me)
                    .stream()
                    .filter(s -> s.getStatus().equals("ACTIVE"))
                    .map(s -> s.getTrainer())
                    .collect(Collectors.toList());
        }

        List<Map<String, Object>> chatList = chatUsers.stream().map(user -> {
            List<ChatMessage> conv = chatRepository.findConversation(me, user);
            Map<String, Object> chat = new HashMap<>();
            chat.put("userId",    user.getId());
            chat.put("userName",  user.getName());
            chat.put("userEmail", user.getEmail());

            if (isTrainer) {
                // ✅ Trainer chat list: user is a CLIENT → use clientProfileRepository
                clientProfileRepository.findByUser(user).ifPresent(cp ->
                    chat.put("profileImage", cp.getProfileImage())
                );
            } else {
                // ✅ Client chat list: user is a TRAINER → use trainerProfileRepository
                trainerProfileRepository.findByUser(user).ifPresent(tp ->
                    chat.put("profileImage", tp.getProfileImage())
                );
            }

            if (!conv.isEmpty()) {
                ChatMessage last = conv.get(conv.size() - 1);
                chat.put("lastMessage",     last.getMessage());
                chat.put("lastMessageTime", last.getSentAt().toString());
            } else {
                chat.put("lastMessage",     "No messages yet");
                chat.put("lastMessageTime", null);
            }

            Long unread = chatRepository.countUnreadFromSender(user, me);
            chat.put("unreadCount", unread);
            return chat;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(chatList);
    }

    // ── GET UNREAD COUNT ──
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(Principal principal) {
        User me = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        Long count = chatRepository.countUnread(me);
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }
}