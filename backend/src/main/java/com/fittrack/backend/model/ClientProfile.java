package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "client_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    private Integer age;
    private String gender;
    private Double heightCm;
    private Double weightKg;
    private String goalType;
    private String phone;

    // ── Goal weight for progress tracking ──
    private Double goalWeight;

    @Column(columnDefinition = "LONGTEXT")
    private String profileImage;
}