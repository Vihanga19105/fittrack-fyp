package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Base64 image — consistent with profile image storage
    @Column(name = "photo", columnDefinition = "LONGTEXT")
    private String photo;

    // Optional note e.g. "After 1 month", "Before starting"
    @Column(name = "note")
    private String note;

    // Date of the photo — client picks this
    @Column(name = "photo_date")
    private LocalDate photoDate;

    // When it was uploaded
    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    public void prePersist() {
        this.uploadedAt = LocalDateTime.now();
    }
}