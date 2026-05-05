package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trainer_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainerProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private String bio;
    private String specialization;
    private Integer experienceYears;
    private Double pricePerMonth;
    private String certification;
    private String phone;

    @Column(name = "is_verified")
    private boolean isVerified = false;

    // ── PROFILE IMAGE (Base64) ──
    @Column(name = "profile_image",
            columnDefinition = "LONGTEXT")
    private String profileImage;

    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
}