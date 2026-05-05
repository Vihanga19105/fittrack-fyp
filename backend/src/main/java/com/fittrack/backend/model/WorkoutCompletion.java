package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "workout_completions")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class WorkoutCompletion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private User client;

    @Column(name = "exercise_id")
    private Long exerciseId;

    @Column(name = "completed_date")
    private LocalDate completedDate;

    @Column(name = "day_of_week")
    private Integer dayOfWeek;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}