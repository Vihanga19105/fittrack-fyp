package com.fittrack.backend.controller;

import com.fittrack.backend.model.TrainerAvailability;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.TrainerAvailabilityRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/availability")
@RequiredArgsConstructor
public class AvailabilityController {

    private final TrainerAvailabilityRepository availabilityRepo;
    private final UserRepository userRepo;

    // ── GET MY AVAILABILITY (trainer) ──
    @GetMapping("/my")
    public ResponseEntity<?> getMyAvailability(
            Authentication auth) {
        try {
            User me = userRepo.findByEmail(auth.getName())
                    .orElseThrow();
            List<TrainerAvailability> list =
                    availabilityRepo.findByUser(me);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to load availability");
        }
    }

    // ── GET AVAILABILITY BY TRAINER ID (public) ──
    @GetMapping("/{trainerId}")
    public ResponseEntity<?> getAvailabilityByTrainer(
            @PathVariable Long trainerId) {
        try {
            List<TrainerAvailability> list =
                    availabilityRepo.findByUserId(trainerId);
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to load availability");
        }
    }

    // ── SAVE AVAILABILITY (replaces all existing) ──
    @PostMapping("/save")
    @Transactional
    public ResponseEntity<?> saveAvailability(
            @RequestBody List<Map<String, String>> payload,
            Authentication auth) {
        try {
            User me = userRepo.findByEmail(auth.getName())
                    .orElseThrow();

            // delete all existing for this trainer
            availabilityRepo.deleteByUser(me);

            // save new ones
            for (Map<String, String> item : payload) {
                TrainerAvailability avail =
                        TrainerAvailability.builder()
                                .user(me)
                                .day(item.get("day"))
                                .startTime(item.get("startTime"))
                                .endTime(item.get("endTime"))
                                .build();
                availabilityRepo.save(avail);
            }

            return ResponseEntity.ok(
                    Map.of("message",
                            "Availability saved successfully",
                            "count", payload.size())
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body("Failed to save availability: "
                            + e.getMessage());
        }
    }
}