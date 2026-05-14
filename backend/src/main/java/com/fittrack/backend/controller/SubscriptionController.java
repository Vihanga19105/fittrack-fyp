package com.fittrack.backend.controller;

import java.util.Map;
import com.fittrack.backend.dto.SubscriptionDTO;
import com.fittrack.backend.model.Subscription;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.ClientProfileRepository;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.TrainerProfileRepository;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.service.EmailService;
import com.fittrack.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/subscriptions")
@CrossOrigin(origins = "http://localhost:5173")
public class SubscriptionController {

    private final SubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final ClientProfileRepository clientProfileRepository;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public SubscriptionController(
            SubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            TrainerProfileRepository trainerProfileRepository,
            ClientProfileRepository clientProfileRepository,
            EmailService emailService,
            NotificationService notificationService) {
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.emailService = emailService;
        this.notificationService = notificationService;
    }

    // ── CLIENT requests a trainer ──
    @PostMapping("/request/{trainerId}")
    public ResponseEntity<?> requestSubscription(
            @PathVariable Long trainerId, Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        User trainer = userRepository
                .findById(trainerId).orElseThrow();

        List<Subscription> existing =
                subscriptionRepository.findByClient(client);

        boolean hasPendingWithThisTrainer = existing.stream()
                .anyMatch(s -> s.getTrainer().getId().equals(trainerId)
                        && (s.getStatus().equals("PENDING")
                        || s.getStatus().equals("ACCEPTED")));

        if (hasPendingWithThisTrainer) {
            return ResponseEntity.badRequest()
                    .body("You already have a pending request with this trainer!");
        }

        boolean hasActiveAnywhere = existing.stream()
                .anyMatch(s -> s.getStatus().equals("ACTIVE"));

        if (hasActiveAnywhere) {
            return ResponseEntity.badRequest()
                    .body("You already have an active subscription!");
        }

        Subscription subscription = Subscription.builder()
                .client(client)
                .trainer(trainer)
                .status("PENDING")
                .startDate(LocalDate.now())
                .build();

        subscriptionRepository.save(subscription);

        // ── NOTIFICATION: trainer gets notified of new request ──
        notificationService.subscriptionRequest(trainer, client.getName());

        return ResponseEntity.ok("Subscription request sent successfully!");
    }

    // ── TRAINER accepts request ──
    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptSubscription(@PathVariable Long id) {

        Subscription sub = subscriptionRepository.findById(id).orElseThrow();
        sub.setStatus("ACCEPTED");
        subscriptionRepository.save(sub);

        // ── NOTIFICATION: client gets notified of acceptance ──
        notificationService.subscriptionAccepted(
                sub.getClient(), sub.getTrainer().getName());

        try {
            emailService.sendSubscriptionAcceptedToClient(
                    sub.getClient().getEmail(),
                    sub.getClient().getName(),
                    sub.getTrainer().getName());
        } catch (Exception e) {
            System.out.println("Acceptance email failed: " + e.getMessage());
        }

        return ResponseEntity.ok("Request accepted! Waiting for client payment.");
    }

    // ── TRAINER rejects request ──
    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {

        Subscription sub = subscriptionRepository.findById(id).orElseThrow();

        String reason = (body != null && body.get("reason") != null
                && !body.get("reason").trim().isEmpty())
                ? body.get("reason").trim()
                : "The trainer is not available at this time.";

        sub.setStatus("REJECTED");
        sub.setRejectionReason(reason);
        subscriptionRepository.save(sub);

        try {
            emailService.sendSubscriptionRejectedToClient(
                    sub.getClient().getEmail(),
                    sub.getClient().getName(),
                    sub.getTrainer().getName(),
                    reason);
        } catch (Exception e) {
            System.out.println("Rejection email failed: " + e.getMessage());
        }

        return ResponseEntity.ok("Subscription rejected!");
    }

    // ── CLIENT cancels subscription ──
    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelSubscription(@PathVariable Long id) {
        Subscription sub = subscriptionRepository.findById(id).orElseThrow();
        sub.setStatus("CANCELLED");
        subscriptionRepository.save(sub);
        return ResponseEntity.ok("Subscription cancelled!");
    }

    // ── ACTIVATE after payment ──
    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateSubscription(
            @PathVariable Long id,
            @RequestParam(required = false) String paymentRef) {

        Subscription sub = subscriptionRepository.findById(id).orElseThrow();
        sub.setStatus("ACTIVE");
        sub.setStartDate(LocalDate.now());
        sub.setEndDate(LocalDate.now().plusDays(30));

        if (paymentRef != null) {
            sub.setPaymentReference(paymentRef);
        }

        subscriptionRepository.save(sub);

        Double amount = trainerProfileRepository.findByUser(sub.getTrainer())
                .map(tp -> tp.getPricePerMonth()).orElse(0.0);

        try {
            emailService.sendPaymentSuccessToClient(
                    sub.getClient().getEmail(),
                    sub.getClient().getName(),
                    sub.getTrainer().getName(),
                    amount,
                    sub.getEndDate().toString());
        } catch (Exception e) {
            System.out.println("Email to client failed: " + e.getMessage());
        }

        try {
            emailService.sendPaymentNotificationToTrainer(
                    sub.getTrainer().getEmail(),
                    sub.getTrainer().getName(),
                    sub.getClient().getName(),
                    amount,
                    sub.getEndDate().toString());
        } catch (Exception e) {
            System.out.println("Email to trainer failed: " + e.getMessage());
        }

        return ResponseEntity.ok("Payment successful! Subscription active for 30 days.");
    }

    // ── CLIENT renews expired subscription ──
    @PostMapping("/{id}/renew")
    public ResponseEntity<?> renewSubscription(
            @PathVariable Long id, Principal principal) {

        Subscription old = subscriptionRepository.findById(id).orElseThrow();

        if (!old.getStatus().equals("EXPIRED")
                && !old.getStatus().equals("CANCELLED")) {
            return ResponseEntity.badRequest()
                    .body("Only expired subscriptions can be renewed!");
        }

        Subscription newSub = Subscription.builder()
                .client(old.getClient())
                .trainer(old.getTrainer())
                .status("PENDING")
                .startDate(LocalDate.now())
                .build();

        subscriptionRepository.save(newSub);

        // ── NOTIFICATION: trainer gets notified of renewal request ──
        notificationService.subscriptionRequest(
                old.getTrainer(), old.getClient().getName());

        return ResponseEntity.ok("Renewal request sent to trainer!");
    }

    // ── CHECK AND EXPIRE OLD SUBSCRIPTIONS ──
    @GetMapping("/check-expiry")
    public ResponseEntity<?> checkExpiry() {
        List<Subscription> toExpire = subscriptionRepository.findAll()
                .stream()
                .filter(s -> s.getStatus().equals("ACTIVE")
                        && s.getEndDate() != null
                        && s.getEndDate().isBefore(LocalDate.now()))
                .collect(Collectors.toList());

        toExpire.forEach(s -> {
            s.setStatus("EXPIRED");
            subscriptionRepository.save(s);
        });

        return ResponseEntity.ok(toExpire.size() + " subscriptions expired!");
    }

    // ── CLIENT views their subscriptions ──
    @GetMapping("/my")
    public ResponseEntity<?> getMySubscriptions(Principal principal) {
        User client = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<Subscription> subs = subscriptionRepository.findByClient(client);
        List<SubscriptionDTO> dtos = subs.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── TRAINER gets PENDING requests ──
    @GetMapping("/requests")
    public ResponseEntity<?> getTrainerRequests(Principal principal) {
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<Subscription> pending =
                subscriptionRepository.findByTrainerAndStatus(trainer, "PENDING");
        List<SubscriptionDTO> dtos = pending.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── TRAINER gets ACTIVE clients ──
    @GetMapping("/clients")
    public ResponseEntity<?> getTrainerClients(Principal principal) {
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<Subscription> active = subscriptionRepository
                .findByTrainerAndStatusIn(trainer, Arrays.asList("ACTIVE"));
        List<SubscriptionDTO> dtos = active.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── TRAINER gets ALL clients (history) ──
    @GetMapping("/all-my-clients")
    public ResponseEntity<?> getAllTrainerClients(Principal principal) {
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<Subscription> all = subscriptionRepository.findByTrainer(trainer);
        List<SubscriptionDTO> dtos = all.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    // ── BUILD DTO ──
    private SubscriptionDTO buildDTO(Subscription sub) {
        SubscriptionDTO dto = new SubscriptionDTO();
        dto.setId(sub.getId());

        // Client info
        dto.setClientId(sub.getClient().getId());
        dto.setClientName(sub.getClient().getName());
        dto.setClientEmail(sub.getClient().getEmail());

        // ✅ Client profile image
        clientProfileRepository.findByUser(sub.getClient()).ifPresent(cp ->
            dto.setClientProfileImage(cp.getProfileImage())
        );

        // Trainer info
        dto.setTrainerId(sub.getTrainer().getId());
        dto.setTrainerName(sub.getTrainer().getName());
        dto.setTrainerEmail(sub.getTrainer().getEmail());

        // ✅ Trainer profile info including image
        trainerProfileRepository.findByUser(sub.getTrainer()).ifPresent(tp -> {
            dto.setTrainerSpecialization(tp.getSpecialization());
            dto.setTrainerPrice(tp.getPricePerMonth());
            dto.setTrainerProfileImage(tp.getProfileImage());
        });

        // Subscription info
        dto.setStatus(sub.getStatus());
        dto.setStartDate(sub.getStartDate() != null
                ? sub.getStartDate().toString() : null);
        dto.setEndDate(sub.getEndDate() != null
                ? sub.getEndDate().toString() : null);
        dto.setRejectionReason(sub.getRejectionReason());

        return dto;
    }
}