package com.fittrack.backend.controller;

import com.fittrack.backend.dto.WorkoutPlanDTO;
import com.fittrack.backend.model.User;
import com.fittrack.backend.model.WorkoutExercise;
import com.fittrack.backend.model.WorkoutPlan;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.repository.WorkoutPlanRepository;
import com.fittrack.backend.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/workout")
@CrossOrigin(origins = "http://localhost:5173")
public class WorkoutPlanController {

    private final WorkoutPlanRepository workoutPlanRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public WorkoutPlanController(
            WorkoutPlanRepository workoutPlanRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.workoutPlanRepository = workoutPlanRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    @PostMapping("/assign/{clientId}")
    public ResponseEntity<?> assignWorkoutPlan(
            @PathVariable Long clientId,
            @RequestBody WorkoutPlanDTO dto,
            Principal principal) {

        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        User client = userRepository
                .findById(clientId).orElseThrow();

        WorkoutPlan plan = WorkoutPlan.builder()
                .trainer(trainer)
                .client(client)
                .title(dto.getTitle())
                .description(dto.getDescription())
                .build();

        if (dto.getExercises() != null) {
            List<WorkoutExercise> exercises =
                    dto.getExercises().stream()
                            .map(e -> WorkoutExercise.builder()
                                    .workoutPlan(plan)
                                    .dayOfWeek(e.getDayOfWeek() != null
                                            ? e.getDayOfWeek() : 1)
                                    .exerciseName(e.getExerciseName())
                                    .sets(e.getSets())
                                    .reps(e.getReps())
                                    .notes(e.getNotes())
                                    .mediaUrl(e.getMediaUrl())
                                    .build())
                            .collect(Collectors.toList());
            plan.setExercises(exercises);
        }

        workoutPlanRepository.save(plan);

        // ── NOTIFICATION ──
        notificationService.workoutAssigned(
                client, trainer.getName());

        return ResponseEntity.ok("Workout plan assigned successfully!");
    }

    @GetMapping("/my-plans")
    public ResponseEntity<?> getMyPlans(Principal principal) {
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<WorkoutPlan> plans =
                workoutPlanRepository.findByTrainer(trainer);
        List<WorkoutPlanDTO> dtos = plans.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/client/{clientId}")
    public ResponseEntity<?> getClientPlan(
            @PathVariable Long clientId, Principal principal) {
        User client = userRepository
                .findById(clientId).orElseThrow();
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<WorkoutPlan> plans =
                workoutPlanRepository.findByTrainerAndClient(trainer, client);
        List<WorkoutPlanDTO> dtos = plans.stream()
                .map(this::buildDTO).collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyWorkoutPlan(Principal principal) {
        User client = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        List<WorkoutPlan> plans =
                workoutPlanRepository.findByClientOrderByIdDesc(client);
        if (plans.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }
        WorkoutPlanDTO latestDTO = buildDTO(plans.get(0));
        return ResponseEntity.ok(List.of(latestDTO));
    }

    @PutMapping("/{planId}")
    public ResponseEntity<?> updateWorkoutPlan(
            @PathVariable Long planId,
            @RequestBody WorkoutPlanDTO dto,
            Principal principal) {

        WorkoutPlan plan = workoutPlanRepository
                .findById(planId).orElseThrow();
        plan.setTitle(dto.getTitle());
        plan.setDescription(dto.getDescription());

        if (dto.getExercises() != null) {
            List<WorkoutExercise> exercises =
                    dto.getExercises().stream()
                            .map(e -> WorkoutExercise.builder()
                                    .workoutPlan(plan)
                                    .dayOfWeek(e.getDayOfWeek() != null
                                            ? e.getDayOfWeek() : 1)
                                    .exerciseName(e.getExerciseName())
                                    .sets(e.getSets())
                                    .reps(e.getReps())
                                    .notes(e.getNotes())
                                    .mediaUrl(e.getMediaUrl())
                                    .build())
                            .collect(Collectors.toList());
            plan.getExercises().clear();
            plan.getExercises().addAll(exercises);
        }

        workoutPlanRepository.save(plan);

        // ── NOTIFICATION ──
        User trainer = userRepository
                .findByEmail(principal.getName()).orElseThrow();
        if (plan.getClient() != null) {
            notificationService.workoutAssigned(
                    plan.getClient(), trainer.getName());
        }

        return ResponseEntity.ok("Workout plan updated successfully!");
    }

    @DeleteMapping("/{planId}")
    public ResponseEntity<?> deletePlan(
            @PathVariable Long planId, Principal principal) {
        workoutPlanRepository.deleteById(planId);
        return ResponseEntity.ok("Workout plan deleted!");
    }

    private WorkoutPlanDTO buildDTO(WorkoutPlan plan) {
        List<WorkoutPlanDTO.ExerciseDTO> exercises =
                plan.getExercises() != null
                        ? plan.getExercises().stream()
                        .map(e -> WorkoutPlanDTO.ExerciseDTO.builder()
                                .id(e.getId())
                                .dayOfWeek(e.getDayOfWeek())
                                .exerciseName(e.getExerciseName())
                                .sets(e.getSets())
                                .reps(e.getReps())
                                .notes(e.getNotes())
                                .mediaUrl(e.getMediaUrl())
                                .build())
                        .collect(Collectors.toList())
                        : List.of();

        return WorkoutPlanDTO.builder()
                .id(plan.getId())
                .title(plan.getTitle())
                .description(plan.getDescription())
                .trainerId(plan.getTrainer().getId())
                .trainerName(plan.getTrainer().getName())
                .clientId(plan.getClient() != null
                        ? plan.getClient().getId() : null)
                .clientName(plan.getClient() != null
                        ? plan.getClient().getName() : null)
                .exercises(exercises)
                .build();
    }
}