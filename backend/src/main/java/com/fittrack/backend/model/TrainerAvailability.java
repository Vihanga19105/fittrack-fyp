package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "trainer_availability")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainerAvailability {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String day;        // e.g. "Mon", "Tue"

    @Column(name = "start_time")
    private String startTime;  // e.g. "09:00"

    @Column(name = "end_time")
    private String endTime;    // e.g. "18:00"
}