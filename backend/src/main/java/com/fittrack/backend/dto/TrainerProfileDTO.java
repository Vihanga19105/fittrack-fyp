package com.fittrack.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrainerProfileDTO {

    private Long userId;
    private String name;
    private String email;
    private String bio;
    private String specialization;
    private Integer experienceYears;
    private Double pricePerMonth;
    private String certification;
    private String phone;
    private boolean isVerified;
    private String rejectionReason;

    // ── PROFILE IMAGE (Base64) ──
    private String profileImage;
}