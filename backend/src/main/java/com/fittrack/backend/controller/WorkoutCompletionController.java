package com.fittrack.backend.controller;

import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WorkoutCompletion;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.repository.WorkoutCompletionRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workout-completion")
@CrossOrigin(origins = "http://localhost:5173")
public class WorkoutCompletionController {

    private final WorkoutCompletionRepository
            completionRepository;
    private final UserRepository userRepository;

    public WorkoutCompletionController(
            WorkoutCompletionRepository completionRepository,
            UserRepository userRepository) {
        this.completionRepository = completionRepository;
        this.userRepository = userRepository;
    }

    // ── MARK EXERCISE COMPLETE ──
    @PostMapping("/complete")
    public ResponseEntity<?> markComplete(
            @RequestBody Map<String, Object> body,
            Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        Long exerciseId = Long.valueOf(
                body.get("exerciseId").toString());
        Integer dayOfWeek = Integer.valueOf(
                body.get("dayOfWeek").toString());

        LocalDate today = LocalDate.now();

        // check if already completed today
        boolean alreadyDone =
                completionRepository
                        .existsByClientAndExerciseIdAndCompletedDate(
                                client, exerciseId, today);

        if (alreadyDone) {
            return ResponseEntity.ok(
                    "Already completed today!");
        }

        WorkoutCompletion completion =
                WorkoutCompletion.builder()
                        .client(client)
                        .exerciseId(exerciseId)
                        .completedDate(today)
                        .dayOfWeek(dayOfWeek)
                        .createdAt(LocalDateTime.now())
                        .build();

        completionRepository.save(completion);

        return ResponseEntity.ok(
                "Exercise marked as complete!");
    }

    // ── GET TODAY'S COMPLETIONS ──
    @GetMapping("/today")
    public ResponseEntity<?> getTodayCompletions(
            Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        List<WorkoutCompletion> completions =
                completionRepository
                        .findByClientAndCompletedDate(
                                client, LocalDate.now());

        List<Long> completedExerciseIds = completions
                .stream()
                .map(WorkoutCompletion::getExerciseId)
                .collect(Collectors.toList());

        return ResponseEntity.ok(completedExerciseIds);
    }

    // ── GET WEEKLY COMPLETION STATS ──
    @GetMapping("/weekly-stats")
    public ResponseEntity<?> getWeeklyStats(
            Principal principal) {

        User client = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        // get last 7 days
        List<Map<String, Object>> stats =
                new java.util.ArrayList<>();

        for (int i = 6; i >= 0; i--) {
            LocalDate date =
                    LocalDate.now().minusDays(i);
            List<WorkoutCompletion> dayCompletions =
                    completionRepository
                            .findByClientAndCompletedDate(
                                    client, date);

            Map<String, Object> day = new HashMap<>();
            day.put("date", date.toString());
            day.put("count", dayCompletions.size());
            day.put("dayName", date.getDayOfWeek()
                    .toString().substring(0, 3));
            stats.add(day);
        }

        return ResponseEntity.ok(stats);
    }

    // ── GET ALL COMPLETIONS (trainer view) ──
    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getClientCompletions(
            @PathVariable Long clientId) {

        User client = userRepository
                .findById(clientId).orElseThrow();

        List<WorkoutCompletion> completions =
                completionRepository.findByClient(client);

        // group by date
        Map<String, Long> byDate = completions.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getCompletedDate().toString(),
                        Collectors.counting()));

        return ResponseEntity.ok(byDate);
    }
}