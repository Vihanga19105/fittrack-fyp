package com.fittrack.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "meal_plan_items")
public class MealPlanItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "meal_plan_id", nullable = false)
    @JsonIgnoreProperties({"items", "trainer", "client",
            "hibernateLazyInitializer", "handler"})
    private MealPlan mealPlan;

    // 1=Monday, 2=Tuesday, 3=Wednesday,
    // 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
    @Column(nullable = false)
    private Integer dayOfWeek = 1;

    @Column(nullable = false, length = 50)
    private String mealTime;

    @Column(nullable = false, length = 100)
    private String foodName;

    @Column(nullable = false)
    private Integer calories;

    @Column(nullable = false)
    private Double quantity;

    @Column(nullable = false, length = 30)
    private String unit;

    private Double protein;
    private Double carbs;
    private Double fats;
}
