package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "workout_plans")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WorkoutPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Which trainer created this plan
    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private User trainer;

    // ✅ Which client this plan is assigned to
    @ManyToOne
    @JoinColumn(name = "client_id")
    private User client;

    private String title;
    private String description;

    // ✅ List of exercises
    @OneToMany(mappedBy = "workoutPlan",
            cascade = CascadeType.ALL,
            fetch = FetchType.EAGER)
    private List<WorkoutExercise> exercises;
}