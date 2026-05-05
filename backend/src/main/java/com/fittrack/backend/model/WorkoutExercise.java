package com.fittrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "workout_exercises")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutExercise {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "workout_plan_id")
    @JsonIgnoreProperties({"exercises", "trainer", "client",
            "hibernateLazyInitializer", "handler"})
    private WorkoutPlan workoutPlan;

    // 1=Monday, 2=Tuesday ... 7=Sunday
    @Column(name = "day_of_week", nullable = false)
    @Builder.Default
    private Integer dayOfWeek = 1;

    private String exerciseName;
    private Integer sets;
    private Integer reps;
    private String notes;

    @Column(name = "media_url")
    private String mediaUrl;
}