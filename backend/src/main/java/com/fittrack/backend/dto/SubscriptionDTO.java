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
public class SubscriptionDTO {

    private Long id;

    // Client info
    private Long clientId;
    private String clientName;
    private String clientEmail;

    // Trainer info
    private Long trainerId;
    private String trainerName;
    private String trainerEmail;
    private String trainerSpecialization;
    private Double trainerPrice;
    private String trainerProfileImage;

    // Subscription info
    private String status;
    private String startDate;
    private String endDate;

    // ── Rejection reason ──
    // shown to client when trainer rejects request
    private String rejectionReason;
}