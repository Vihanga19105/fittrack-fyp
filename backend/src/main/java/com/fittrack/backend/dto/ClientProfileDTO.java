package com.fittrack.backend.dto;

import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClientProfileDTO {

    private String name;
    private String email;
    private Integer age;
    private String gender;
    private Double heightCm;
    private Double weightKg;
    private String goalType;
    private String phone;
    private String profileImage;

    // ── Goal weight for progress tracking ──
    private Double goalWeight;
}