package com.fittrack.backend.controller;

import com.fittrack.backend.model.Role;
import com.fittrack.backend.model.TrainerProfile;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.TrainerProfileRepository;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final UserRepository userRepository;
    private final TrainerProfileRepository trainerProfileRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final EmailService emailService;

    public AdminController(
            UserRepository userRepository,
            TrainerProfileRepository trainerProfileRepository,
            SubscriptionRepository subscriptionRepository,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.emailService = emailService;
    }

    // ── GET ALL USERS ──
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userRepository
                .findAll().stream().map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId",   u.getId());
                    map.put("name",     u.getName());
                    map.put("email",    u.getEmail());
                    map.put("role",     u.getRole());
                    map.put("approved", u.isApproved());
                    map.put("createdAt", u.getCreatedAt() != null
                            ? u.getCreatedAt().toString() : null);
                    return map;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    // ── GET ALL TRAINERS ──
    @GetMapping("/trainers")
    public ResponseEntity<?> getAllTrainers() {
        List<Map<String, Object>> trainers = userRepository
                .findAll().stream()
                .filter(u -> u.getRole() == Role.TRAINER)
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("userId",   u.getId());
                    map.put("name",     u.getName());
                    map.put("email",    u.getEmail());
                    map.put("approved", u.isApproved());
                    map.put("createdAt", u.getCreatedAt() != null
                            ? u.getCreatedAt().toString() : null);
                    trainerProfileRepository.findByUser(u).ifPresent(tp -> {
                        map.put("specialization",  tp.getSpecialization());
                        map.put("certification",   tp.getCertification());
                        map.put("experienceYears", tp.getExperienceYears());
                        map.put("pricePerMonth",   tp.getPricePerMonth());
                        map.put("isVerified",      tp.isVerified());
                        map.put("bio",             tp.getBio());
                        map.put("rejectionReason", tp.getRejectionReason());
                        map.put("phone",           tp.getPhone());
                        map.put("profileImage",    tp.getProfileImage());
                    });
                    return map;
                }).collect(Collectors.toList());
        return ResponseEntity.ok(trainers);
    }

    // ── GET ALL PENDING TRAINERS ──
    @GetMapping("/pending-trainers")
    public ResponseEntity<?> getPendingTrainers() {
        List<User> pendingTrainers = userRepository
                .findAll().stream()
                .filter(u -> {
                    if (u.getRole() != Role.TRAINER) return false;
                    if (u.isApproved()) return false;
                    return trainerProfileRepository.findByUser(u)
                            .map(tp -> {
                                if (tp.isVerified()) return false;
                                if (tp.getRejectionReason() != null &&
                                        !tp.getRejectionReason().trim().isEmpty())
                                    return false;
                                return true;
                            }).orElse(true);
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> result = pendingTrainers.stream().map(u -> {
            Map<String, Object> map = new HashMap<>();
            map.put("userId",   u.getId());
            map.put("name",     u.getName());
            map.put("email",    u.getEmail());
            map.put("approved", u.isApproved());
            map.put("createdAt", u.getCreatedAt() != null
                    ? u.getCreatedAt().toString() : null);
            trainerProfileRepository.findByUser(u).ifPresent(tp -> {
                map.put("specialization",  tp.getSpecialization());
                map.put("certification",   tp.getCertification());
                map.put("experienceYears", tp.getExperienceYears());
                map.put("pricePerMonth",   tp.getPricePerMonth());
                map.put("bio",             tp.getBio());
                map.put("phone",           tp.getPhone());
                map.put("profileImage",    tp.getProfileImage());
            });
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }

    // ── APPROVE TRAINER ──
    @PutMapping("/approve-trainer/{userId}")
    public ResponseEntity<?> approveTrainer(
            @PathVariable Long userId) {
        return userRepository.findById(userId).map(user -> {
            user.setApproved(true);
            userRepository.save(user);

            TrainerProfile profile = trainerProfileRepository
                    .findByUser(user)
                    .orElse(TrainerProfile.builder().user(user).build());
            profile.setVerified(true);
            profile.setRejectionReason(null);
            trainerProfileRepository.save(profile);

            try {
                emailService.sendTrainerApprovedEmail(
                        user.getEmail(), user.getName());
            } catch (Exception e) {
                System.out.println("Approval email failed: " + e.getMessage());
            }

            return ResponseEntity.ok("Trainer approved successfully!");
        }).orElse(ResponseEntity.badRequest().body("User not found"));
    }

    // ── REJECT TRAINER ──
    @PutMapping("/reject-trainer/{userId}")
    public ResponseEntity<?> rejectTrainer(
            @PathVariable Long userId,
            @RequestBody(required = false) Map<String, String> body) {
        return userRepository.findById(userId).map(user -> {
            user.setApproved(false);
            userRepository.save(user);

            String reason = (body != null &&
                    body.get("reason") != null &&
                    !body.get("reason").trim().isEmpty())
                    ? body.get("reason").trim()
                    : "Your profile did not meet our requirements. " +
                    "Please update your details and resubmit.";

            TrainerProfile profile = trainerProfileRepository
                    .findByUser(user)
                    .orElse(TrainerProfile.builder().user(user).build());
            profile.setVerified(false);
            profile.setRejectionReason(reason);
            trainerProfileRepository.save(profile);

            try {
                emailService.sendTrainerRejectedEmail(
                        user.getEmail(), user.getName(), reason);
            } catch (Exception e) {
                System.out.println("Rejection email failed: " + e.getMessage());
            }

            return ResponseEntity.ok("Trainer rejected and notified!");
        }).orElse(ResponseEntity.badRequest().body("User not found"));
    }

    // ── GET ALL SUBSCRIPTIONS (payment monitoring) ──
    @GetMapping("/subscriptions")
    public ResponseEntity<?> getAllSubscriptions() {
        List<Map<String, Object>> result = subscriptionRepository
                .findAll().stream().map(s -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id",        s.getId());
                    map.put("status",    s.getStatus());
                    map.put("startDate", s.getStartDate() != null
                            ? s.getStartDate().toString() : null);
                    map.put("endDate",   s.getEndDate() != null
                            ? s.getEndDate().toString() : null);

                    if (s.getClient() != null) {
                        map.put("clientId",    s.getClient().getId());
                        map.put("clientName",  s.getClient().getName());
                        map.put("clientEmail", s.getClient().getEmail());
                    }
                    if (s.getTrainer() != null) {
                        map.put("trainerId",   s.getTrainer().getId());
                        map.put("trainerName", s.getTrainer().getName());
                        trainerProfileRepository
                                .findByUser(s.getTrainer())
                                .ifPresent(tp -> map.put(
                                        "trainerPrice",
                                        tp.getPricePerMonth()));
                    }
                    return map;
                }).collect(Collectors.toList());

        return ResponseEntity.ok(result);
    }
}