package com.fittrack.backend.controller;

import com.fittrack.backend.dto.ClientProfileDTO;
import com.fittrack.backend.dto.TrainerProfileDTO;
import com.fittrack.backend.model.ClientProfile;
import com.fittrack.backend.model.TrainerProfile;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.ClientProfileRepository;
import com.fittrack.backend.repository.TrainerProfileRepository;
import com.fittrack.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final UserRepository userRepository;
    private final ClientProfileRepository
            clientProfileRepository;
    private final TrainerProfileRepository
            trainerProfileRepository;

    public ProfileController(
            UserRepository userRepository,
            ClientProfileRepository clientProfileRepository,
            TrainerProfileRepository trainerProfileRepository) {
        this.userRepository = userRepository;
        this.clientProfileRepository = clientProfileRepository;
        this.trainerProfileRepository = trainerProfileRepository;
    }

    // ── GET CLIENT PROFILE ──
    @GetMapping("/client")
    public ResponseEntity<?> getClientProfile(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        ClientProfile profile = clientProfileRepository
                .findByUser(user)
                .orElse(new ClientProfile());

        ClientProfileDTO dto = ClientProfileDTO.builder()
                .name(user.getName())
                .email(user.getEmail())
                .age(profile.getAge())
                .gender(profile.getGender())
                .heightCm(profile.getHeightCm())
                .weightKg(profile.getWeightKg())
                .goalType(profile.getGoalType())
                .phone(profile.getPhone())
                .profileImage(profile.getProfileImage())
                .goalWeight(profile.getGoalWeight())
                .build();

        return ResponseEntity.ok(dto);
    }

    // ── UPDATE CLIENT PROFILE ──
    @PutMapping("/client")
    public ResponseEntity<?> updateClientProfile(
            Principal principal,
            @RequestBody ClientProfileDTO dto) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        user.setName(dto.getName());
        userRepository.save(user);

        ClientProfile profile = clientProfileRepository
                .findByUser(user)
                .orElse(new ClientProfile());

        profile.setUser(user);
        profile.setAge(dto.getAge());
        profile.setGender(dto.getGender());
        profile.setHeightCm(dto.getHeightCm());
        profile.setWeightKg(dto.getWeightKg());
        profile.setGoalType(dto.getGoalType());
        profile.setPhone(dto.getPhone());
        profile.setGoalWeight(dto.getGoalWeight());

        if (dto.getProfileImage() != null &&
                !dto.getProfileImage().isEmpty()) {
            profile.setProfileImage(dto.getProfileImage());
        }

        clientProfileRepository.save(profile);
        return ResponseEntity.ok(
                "Profile updated successfully!");
    }

    // ── GET CLIENT PROFILE BY ID (trainer view) ──
    @GetMapping("/client/{userId}")
    public ResponseEntity<?> getClientProfileById(
            @PathVariable Long userId) {

        User user = userRepository
                .findById(userId).orElseThrow();

        ClientProfile profile = clientProfileRepository
                .findByUser(user)
                .orElse(new ClientProfile());

        ClientProfileDTO dto = ClientProfileDTO.builder()
                .name(user.getName())
                .email(user.getEmail())
                .age(profile.getAge())
                .gender(profile.getGender())
                .heightCm(profile.getHeightCm())
                .weightKg(profile.getWeightKg())
                .goalType(profile.getGoalType())
                .phone(profile.getPhone())
                .profileImage(profile.getProfileImage())
                .goalWeight(profile.getGoalWeight())
                .build();

        return ResponseEntity.ok(dto);
    }

    // ── GET MY TRAINER PROFILE ──
    @GetMapping("/trainer")
    public ResponseEntity<?> getTrainerProfile(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        TrainerProfile profile = trainerProfileRepository
                .findByUser(user)
                .orElse(new TrainerProfile());

        TrainerProfileDTO dto = TrainerProfileDTO.builder()
                .userId(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .bio(profile.getBio())
                .specialization(profile.getSpecialization())
                .experienceYears(profile.getExperienceYears())
                .pricePerMonth(profile.getPricePerMonth())
                .certification(profile.getCertification())
                .phone(profile.getPhone())
                .isVerified(profile.isVerified())
                .profileImage(profile.getProfileImage())
                .rejectionReason(profile.getRejectionReason())
                .build();

        return ResponseEntity.ok(dto);
    }

    // ── UPDATE TRAINER PROFILE ──
    @PutMapping("/trainer")
    public ResponseEntity<?> updateTrainerProfile(
            Principal principal,
            @RequestBody TrainerProfileDTO dto) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        user.setName(dto.getName());
        userRepository.save(user);

        Optional<TrainerProfile> existing =
                trainerProfileRepository.findByUser(user);

        TrainerProfile profile = existing
                .orElse(new TrainerProfile());

        profile.setUser(user);
        profile.setBio(dto.getBio());
        profile.setSpecialization(dto.getSpecialization());
        profile.setExperienceYears(dto.getExperienceYears());
        profile.setPricePerMonth(dto.getPricePerMonth());
        profile.setCertification(dto.getCertification());
        profile.setPhone(dto.getPhone());

        if (dto.getProfileImage() != null &&
                !dto.getProfileImage().isEmpty()) {
            profile.setProfileImage(dto.getProfileImage());
        }

        // ── clear rejection reason on update ──
        profile.setRejectionReason(null);

        trainerProfileRepository.save(profile);

        return ResponseEntity.ok(
                "Profile updated successfully!");
    }

    // ── GET ALL VERIFIED TRAINERS (public) ──
    @GetMapping("/trainers")
    public ResponseEntity<?> getAllTrainers() {

        List<TrainerProfile> trainers =
                trainerProfileRepository
                        .findByIsVerifiedTrue();

        List<TrainerProfileDTO> dtos = trainers.stream()
                .map(profile -> TrainerProfileDTO.builder()
                        .userId(profile.getUser().getId())
                        .name(profile.getUser().getName())
                        .email(profile.getUser().getEmail())
                        .bio(profile.getBio())
                        .specialization(
                                profile.getSpecialization())
                        .experienceYears(
                                profile.getExperienceYears())
                        .pricePerMonth(
                                profile.getPricePerMonth())
                        .certification(
                                profile.getCertification())
                        .isVerified(profile.isVerified())
                        .profileImage(
                                profile.getProfileImage())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    // ── GET CURRENT USER INFO ──
    @GetMapping("/me")
    public ResponseEntity<?> getMe(
            Principal principal) {

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"));

        return ResponseEntity.ok(Map.of(
                "name", user.getName(),
                "email", user.getEmail(),
                "role", user.getRole().toString()
                        .replace("ROLE_", "")
        ));
    }

    // ── UPDATE NAME ONLY ──
    @PutMapping("/update-name")
    public ResponseEntity<?> updateName(
            @RequestBody Map<String, String> body,
            Principal principal) {

        String newName = body.get("name");
        if (newName == null || newName.trim().isEmpty())
            return ResponseEntity.badRequest()
                    .body("Name cannot be empty");

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow(() ->
                        new RuntimeException(
                                "User not found"));

        user.setName(newName.trim());
        userRepository.save(user);

        return ResponseEntity.ok(Map.of(
                "message", "Name updated successfully",
                "name", user.getName()
        ));
    }
}