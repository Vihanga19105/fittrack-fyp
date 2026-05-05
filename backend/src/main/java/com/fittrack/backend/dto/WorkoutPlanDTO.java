package com.fittrack.backend.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkoutPlanDTO {

    private Long id;
    private String title;
    private String description;
    private Long trainerId;
    private String trainerName;
    private Long clientId;
    private String clientName;
    private List<ExerciseDTO> exercises;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ExerciseDTO {
        private Long id;
        private Integer dayOfWeek;
        private String exerciseName;
        private Integer sets;
        private Integer reps;
        private String notes;
        private String mediaUrl;
    }
}