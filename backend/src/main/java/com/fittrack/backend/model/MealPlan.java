package com.fittrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Entity
@Table(name = "meal_plans")
public class MealPlan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "trainer_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "subscriptions", "workoutPlans", "mealPlans", "password"})
    private User trainer;

    @ManyToOne
    @JoinColumn(name = "client_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler",
            "subscriptions", "workoutPlans", "mealPlans", "password"})
    private User client;

    @Column(name = "plan_name", nullable = false, length = 100)
    private String planName;

    @Column(name = "target_calories", nullable = false)
    private Integer targetCalories;

    @Column(name = "target_protein", nullable = false)
    private Double targetProtein;

    @Column(name = "target_carbs", nullable = false)
    private Double targetCarbs;

    @Column(name = "target_fats", nullable = false)
    private Double targetFats;

    @Column(columnDefinition = "TEXT")
    private String notes;

    // ── KEY FIX: explicit column name so Hibernate maps correctly ──
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @OneToMany(mappedBy = "mealPlan", cascade = CascadeType.ALL,
            fetch = FetchType.EAGER, orphanRemoval = true)
    @JsonIgnoreProperties("mealPlan")
    private List<MealPlanItem> items;
}