package com.fittrack.backend.controller;

import com.fittrack.backend.model.TrainerReview;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.TrainerReviewRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class TrainerReviewController {

    private final TrainerReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final SubscriptionRepository
            subscriptionRepository;

    // ── SUBMIT REVIEW ──
    @PostMapping("/submit")
    public ResponseEntity<?> submitReview(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        Long trainerId = Long.parseLong(
                body.get("trainerId").toString());
        User trainer = userRepository
                .findById(trainerId).orElseThrow();

        // check if client has subscription with trainer
        boolean hasSubscription = subscriptionRepository
                .findByClient(client)
                .stream()
                .anyMatch(s ->
                        s.getTrainer().getId()
                                .equals(trainerId) &&
                                (s.getStatus().equals("ACTIVE") ||
                                        s.getStatus().equals("EXPIRED")));

        if (!hasSubscription) {
            return ResponseEntity.badRequest().body(
                    "You can only review trainers " +
                            "you have subscribed to!");
        }

        // check if already reviewed
        Optional<TrainerReview> existing =
                reviewRepository.findByTrainerAndClient(
                        trainer, client);

        TrainerReview reviewObj = existing
                .orElse(new TrainerReview());

        reviewObj.setTrainer(trainer);
        reviewObj.setClient(client);
        reviewObj.setRating(Integer.parseInt(
                body.get("rating").toString()));
        reviewObj.setReview(
                body.getOrDefault("review", "")
                        .toString());
        reviewObj.setCreatedAt(LocalDateTime.now());

        reviewRepository.save(reviewObj);

        return ResponseEntity.ok(
                Map.of("message",
                        "Review submitted successfully!"));
    }

    // ── GET REVIEWS FOR A TRAINER ──
    @GetMapping("/trainer/{trainerId}")
    public ResponseEntity<?> getTrainerReviews(
            @PathVariable Long trainerId) {

        User trainer = userRepository
                .findById(trainerId).orElseThrow();

        List<TrainerReview> reviews =
                reviewRepository
                        .findByTrainerOrderByCreatedAtDesc(
                                trainer);

        Double avgRating =
                reviewRepository.getAverageRating(trainer);
        Long reviewCount =
                reviewRepository.countByTrainer(trainer);

        List<Map<String, Object>> reviewList =
                reviews.stream().map(r -> {
                    Map<String, Object> map =
                            new HashMap<>();
                    map.put("id", r.getId());
                    map.put("clientName",
                            r.getClient().getName());
                    map.put("rating", r.getRating());
                    map.put("review", r.getReview());
                    map.put("createdAt",
                            r.getCreatedAt().toString());
                    return map;
                }).toList();

        return ResponseEntity.ok(Map.of(
                "reviews", reviewList,
                "averageRating", avgRating != null
                        ? Math.round(avgRating * 10.0) / 10.0
                        : 0.0,
                "totalReviews", reviewCount
        ));
    }

    // ── CHECK IF CLIENT ALREADY REVIEWED ──
    @GetMapping("/check/{trainerId}")
    public ResponseEntity<?> checkReview(
            @PathVariable Long trainerId,
            Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        User trainer = userRepository
                .findById(trainerId).orElseThrow();

        Optional<TrainerReview> existing =
                reviewRepository.findByTrainerAndClient(
                        trainer, client);

        if (existing.isPresent()) {
            return ResponseEntity.ok(Map.of(
                    "hasReviewed", true,
                    "rating", existing.get().getRating(),
                    "review", existing.get().getReview()
                            != null
                            ? existing.get().getReview()
                            : ""
            ));
        }

        return ResponseEntity.ok(
                Map.of("hasReviewed", false));
    }
}