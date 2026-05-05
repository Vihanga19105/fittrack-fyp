package com.fittrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "weight_logs")
public class WeightLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer",
            "handler", "password"})
    private User user;

    @Column(nullable = false)
    private Double weightKg;

    private String note;

    @Column(nullable = false)
    private LocalDateTime loggedAt = LocalDateTime.now();
}