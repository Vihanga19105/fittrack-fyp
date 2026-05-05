package com.fittrack.backend.controller;

import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WeightLog;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.repository.WeightLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weight")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class WeightLogController {

    private final WeightLogRepository weightLogRepository;
    private final UserRepository userRepository;

    // ── LOG WEIGHT ──
    @PostMapping("/log")
    public ResponseEntity<?> logWeight(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        WeightLog log = new WeightLog();
        log.setUser(user);
        log.setWeightKg(Double.parseDouble(
                body.get("weightKg").toString()));
        log.setNote(body.getOrDefault(
                "note", "").toString());
        log.setLoggedAt(LocalDateTime.now());

        weightLogRepository.save(log);
        return ResponseEntity.ok(
                Map.of("message", "Weight logged!"));
    }

    // ── GET MY HISTORY ──
    @GetMapping("/history")
    public ResponseEntity<List<WeightLog>> getHistory(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        List<WeightLog> logs =
                weightLogRepository
                        .findByUserOrderByLoggedAtAsc(user);
        return ResponseEntity.ok(logs);
    }

    // ── GET CLIENT HISTORY (for trainer) ──
    @GetMapping("/history/{clientId}")
    public ResponseEntity<?> getClientHistory(
            @PathVariable Long clientId) {

        User client = userRepository
                .findById(clientId).orElseThrow();
        return ResponseEntity.ok(
                weightLogRepository
                        .findByUserOrderByLoggedAtDesc(client));
    }

    // ── DELETE A LOG ──
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLog(
            @PathVariable Long id,
            Principal principal) {

        weightLogRepository.deleteById(id);
        return ResponseEntity.ok(
                Map.of("message", "Log deleted!"));
    }
}