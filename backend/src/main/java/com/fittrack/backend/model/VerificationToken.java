package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "verification_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ The random token we send in email
    @Column(unique = true)
    private String token;

    // ✅ Which user this token belongs to
    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    // ✅ Token expires after 24 hours
    private LocalDateTime expiresAt;

    // ✅ Has it been used already?
    private boolean used = false;
}
