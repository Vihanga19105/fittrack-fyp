package com.fittrack.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "subscriptions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "client_id")
    private User client;

    @ManyToOne
    @JoinColumn(name = "trainer_id")
    private User trainer;

    // PENDING → ACCEPTED → ACTIVE → EXPIRED
    // PENDING → REJECTED
    // ACTIVE → CANCELLED
    private String status;

    private LocalDate startDate;

    // 30 days from payment date
    private LocalDate endDate;

    // PayHere payment details
    @Column(name = "payment_order_id")
    private String paymentOrderId;

    @Column(name = "payment_reference")
    private String paymentReference;

    // ── Rejection reason ──
    // set when trainer rejects client request
    // shown to client on payments page
    @Column(columnDefinition = "TEXT")
    private String rejectionReason;
}