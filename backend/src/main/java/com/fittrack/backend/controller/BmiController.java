package com.fittrack.backend.controller;

import com.fittrack.backend.model.BmiLog;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.BmiRepository;
import com.fittrack.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bmi")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class BmiController {

    private final BmiRepository bmiRepository;
    private final UserRepository userRepository;

    // ── SAVE BMI LOG ──
    @PostMapping("/save")
    public ResponseEntity<?> saveBmi(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        BmiLog log = new BmiLog();
        log.setUser(user);
        log.setHeightCm(Double.parseDouble(
                body.get("heightCm").toString()));
        log.setWeightKg(Double.parseDouble(
                body.get("weightKg").toString()));
        log.setBmiValue(Double.parseDouble(
                body.get("bmiValue").toString()));
        log.setCategory(body.get("category").toString());
        log.setLoggedAt(LocalDateTime.now());

        bmiRepository.save(log);
        return ResponseEntity.ok(
                Map.of("message", "BMI saved successfully"));
    }

    // ── GET MY BMI HISTORY ──
    @GetMapping("/history")
    public ResponseEntity<List<BmiLog>> getHistory(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        List<BmiLog> logs =
                bmiRepository
                        .findByUserOrderByLoggedAtDesc(user);
        return ResponseEntity.ok(logs);
    }

    // ── GET CLIENT BMI HISTORY (for trainer) ──
    @GetMapping("/history/{clientId}")
    public ResponseEntity<?> getClientBmiHistory(
            @PathVariable Long clientId) {

        User client = userRepository
                .findById(clientId).orElseThrow();
        return ResponseEntity.ok(
                bmiRepository
                        .findByUserOrderByLoggedAtDesc(client));
    }
}