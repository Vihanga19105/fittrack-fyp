package com.fittrack.backend.controller;

import com.fittrack.backend.config.JwtUtil;
import com.fittrack.backend.dto.AuthResponse;
import com.fittrack.backend.dto.LoginRequest;
import com.fittrack.backend.dto.RegisterRequest;
import com.fittrack.backend.model.User;
import com.fittrack.backend.repository.UserRepository;
import com.fittrack.backend.repository.VerificationTokenRepository;
import com.fittrack.backend.service.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final VerificationTokenRepository tokenRepository;

    private final ConcurrentHashMap<String, String>
            otpStore = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, LocalDateTime>
            otpExpiry = new ConcurrentHashMap<>();

    public AuthController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtUtil jwtUtil,
            EmailService emailService,
            VerificationTokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
        this.tokenRepository = tokenRepository;
    }

    // ── REGISTER ──
    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest request) {

        // ── check email first — stop immediately ──
        if (userRepository.existsByEmail(
                request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body("Email already exists. " +
                            "Please use a different email.");
        }

        boolean isClient = request.getRole()
                .name().equals("CLIENT");

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(
                        request.getPassword()))
                .role(request.getRole())
                .isApproved(isClient)
                .build();

        userRepository.save(user);

        // ── send welcome email ──
        try {
            if (isClient) {
                emailService.sendWelcomeEmail(
                        user.getEmail(), user.getName());
            } else {
                emailService.sendTrainerRegistrationEmail(
                        user.getEmail(), user.getName());
            }
        } catch (Exception e) {
            System.out.println("Welcome email failed: "
                    + e.getMessage());
        }

        if (isClient) {
            return ResponseEntity.ok(
                    "Registration successful! " +
                            "You can now login.");
        } else {
            return ResponseEntity.ok(
                    "Registration successful! " +
                            "Login and complete your profile " +
                            "to get admin approval.");
        }
    }

    // ── LOGIN ──
    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest request) {

        return userRepository
                .findByEmail(request.getEmail())
                .map(user -> {

                    // ── check password ──
                    if (!passwordEncoder.matches(
                            request.getPassword(),
                            user.getPassword())) {
                        return ResponseEntity.status(401)
                                .body("Wrong email or password");
                    }

                    // ── ADMIN ──
                    if (user.getRole().name()
                            .equals("ADMIN")) {
                        if (!user.isApproved()) {
                            return ResponseEntity.status(403)
                                    .body("Admin account " +
                                            "not approved");
                        }
                        String token = jwtUtil.generateToken(
                                user.getEmail(),
                                user.getRole().name(),
                                user.getId());
                        return ResponseEntity.ok(
                                new AuthResponse(
                                        token,
                                        user.getRole().name(),
                                        user.getId(),
                                        user.getName()));
                    }

                    // ── CLIENT ──
                    if (user.getRole().name()
                            .equals("CLIENT")) {
                        if (!user.isApproved()) {
                            return ResponseEntity.status(403)
                                    .body("Your account is " +
                                            "not active. " +
                                            "Please contact support.");
                        }
                    }

                    // ── TRAINER ──
                    // Always allowed to login
                    // Dashboard shows pending/rejected/approved

                    String token = jwtUtil.generateToken(
                            user.getEmail(),
                            user.getRole().name(),
                            user.getId());

                    return ResponseEntity.ok(new AuthResponse(
                            token,
                            user.getRole().name(),
                            user.getId(),
                            user.getName()));

                }).orElse(ResponseEntity.status(401)
                        .body("Wrong email or password"));
    }

    // ── CHANGE PASSWORD ──
    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            java.security.Principal principal) {

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null ||
                newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body("Password must be at least " +
                            "6 characters");
        }

        User user = userRepository
                .findByEmail(principal.getName())
                .orElseThrow();

        if (!passwordEncoder.matches(
                currentPassword, user.getPassword())) {
            return ResponseEntity.status(400)
                    .body("Current password is incorrect");
        }

        user.setPassword(
                passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return ResponseEntity.ok(
                "Password changed successfully!");
    }

    // ── SEND OTP ──
    @PostMapping("/forgot-password/send-otp")
    public ResponseEntity<?> sendOtp(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");

        if (email == null || !email.contains("@")) {
            return ResponseEntity.badRequest()
                    .body("Please enter a valid email");
        }

        if (!userRepository.existsByEmail(email)) {
            return ResponseEntity.badRequest()
                    .body("No account found with this email");
        }

        String otp = String.format("%06d",
                new Random().nextInt(999999));

        otpStore.put(email, otp);
        otpExpiry.put(email,
                LocalDateTime.now().plusMinutes(5));

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Failed to send OTP email");
        }

        return ResponseEntity.ok(
                Map.of("message", "OTP sent to your email!"));
    }

    // ── VERIFY OTP ──
    @PostMapping("/forgot-password/verify-otp")
    public ResponseEntity<?> verifyOtp(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        String otp = body.get("otp");

        if (!otpStore.containsKey(email)) {
            return ResponseEntity.badRequest()
                    .body("No OTP sent to this email");
        }

        if (otpExpiry.get(email)
                .isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            otpExpiry.remove(email);
            return ResponseEntity.badRequest()
                    .body("OTP has expired. " +
                            "Please request a new one");
        }

        if (!otpStore.get(email).equals(otp)) {
            return ResponseEntity.badRequest()
                    .body("Invalid OTP. Please try again");
        }

        return ResponseEntity.ok(
                Map.of("message", "OTP verified!"));
    }

    // ── RESET PASSWORD ──
    @PostMapping("/forgot-password/reset")
    public ResponseEntity<?> resetPassword(
            @RequestBody Map<String, String> body) {

        String email = body.get("email");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");

        if (!otpStore.containsKey(email)) {
            return ResponseEntity.badRequest()
                    .body("Session expired. " +
                            "Please start again");
        }

        if (otpExpiry.get(email)
                .isBefore(LocalDateTime.now())) {
            otpStore.remove(email);
            otpExpiry.remove(email);
            return ResponseEntity.badRequest()
                    .body("OTP expired. Please start again");
        }

        if (!otpStore.get(email).equals(otp)) {
            return ResponseEntity.badRequest()
                    .body("Invalid OTP");
        }

        if (newPassword == null ||
                newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body("Password must be at least " +
                            "6 characters");
        }

        User user = userRepository
                .findByEmail(email).orElseThrow();
        user.setPassword(
                passwordEncoder.encode(newPassword));
        userRepository.save(user);

        otpStore.remove(email);
        otpExpiry.remove(email);

        return ResponseEntity.ok(Map.of(
                "message", "Password reset successfully!"));
    }
}