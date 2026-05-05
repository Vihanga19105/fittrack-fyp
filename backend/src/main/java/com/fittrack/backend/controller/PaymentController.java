package com.fittrack.backend.controller;

import com.fittrack.backend.model.Subscription;
import com.fittrack.backend.repository.SubscriptionRepository;
import com.fittrack.backend.repository.TrainerProfileRepository;
import com.fittrack.backend.service.EmailService;
import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "http://localhost:5173")
public class PaymentController {

    private final SubscriptionRepository
            subscriptionRepository;
    private final TrainerProfileRepository
            trainerProfileRepository;
    private final EmailService emailService;

    @Value("${stripe.secret.key}")
    private String stripeSecretKey;

    public PaymentController(
            SubscriptionRepository subscriptionRepository,
            TrainerProfileRepository trainerProfileRepository,
            EmailService emailService) {
        this.subscriptionRepository = subscriptionRepository;
        this.trainerProfileRepository = trainerProfileRepository;
        this.emailService = emailService;
    }

    // ── CREATE PAYMENT INTENT ──
    @PostMapping("/create-intent/{subscriptionId}")
    public ResponseEntity<?> createPaymentIntent(
            @PathVariable Long subscriptionId) {

        try {
            Stripe.apiKey = stripeSecretKey;

            Subscription sub = subscriptionRepository
                    .findById(subscriptionId)
                    .orElseThrow();

            // get trainer price
            Double price = trainerProfileRepository
                    .findByUser(sub.getTrainer())
                    .map(tp -> tp.getPricePerMonth())
                    .orElse(0.0);

            // convert LKR to cents
            // Stripe uses smallest currency unit
            // LKR uses cents (1 LKR = 100 cents)
            long amountInCents = Math.round(price * 100);

            PaymentIntentCreateParams params =
                    PaymentIntentCreateParams.builder()
                            .setAmount(amountInCents)
                            .setCurrency("lkr")
                            .setDescription(
                                    "FitTrack subscription - " +
                                            sub.getTrainer().getName())
                            .putMetadata("subscriptionId",
                                    String.valueOf(
                                            subscriptionId))
                            .putMetadata("clientName",
                                    sub.getClient().getName())
                            .putMetadata("trainerName",
                                    sub.getTrainer().getName())
                            .build();

            PaymentIntent intent =
                    PaymentIntent.create(params);

            Map<String, Object> response = new HashMap<>();
            response.put("clientSecret",
                    intent.getClientSecret());
            response.put("amount", price);
            response.put("currency", "LKR");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Payment intent creation failed: "
                            + e.getMessage());
        }
    }

    // ── CONFIRM PAYMENT + ACTIVATE SUBSCRIPTION ──
    @PostMapping("/confirm/{subscriptionId}")
    public ResponseEntity<?> confirmPayment(
            @PathVariable Long subscriptionId,
            @RequestBody Map<String, String> body) {

        try {
            Stripe.apiKey = stripeSecretKey;

            String paymentIntentId = body
                    .get("paymentIntentId");

            // verify payment with Stripe
            PaymentIntent intent = PaymentIntent
                    .retrieve(paymentIntentId);

            if (!"succeeded".equals(
                    intent.getStatus())) {
                return ResponseEntity.badRequest()
                        .body("Payment not completed");
            }

            // activate subscription
            Subscription sub = subscriptionRepository
                    .findById(subscriptionId)
                    .orElseThrow();

            sub.setStatus("ACTIVE");
            sub.setStartDate(LocalDate.now());
            sub.setEndDate(LocalDate.now().plusDays(30));
            sub.setPaymentReference(paymentIntentId);
            subscriptionRepository.save(sub);

            // get amount
            Double amount = trainerProfileRepository
                    .findByUser(sub.getTrainer())
                    .map(tp -> tp.getPricePerMonth())
                    .orElse(0.0);

            // send emails
            try {
                emailService.sendPaymentSuccessToClient(
                        sub.getClient().getEmail(),
                        sub.getClient().getName(),
                        sub.getTrainer().getName(),
                        amount,
                        sub.getEndDate().toString());
            } catch (Exception e) {
                System.out.println(
                        "Client email failed: "
                                + e.getMessage());
            }

            try {
                emailService
                        .sendPaymentNotificationToTrainer(
                                sub.getTrainer().getEmail(),
                                sub.getTrainer().getName(),
                                sub.getClient().getName(),
                                amount,
                                sub.getEndDate().toString());
            } catch (Exception e) {
                System.out.println(
                        "Trainer email failed: "
                                + e.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Payment successful!",
                    "subscriptionId", subscriptionId,
                    "endDate", sub.getEndDate().toString()
            ));

        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body("Payment confirmation failed: "
                            + e.getMessage());
        }
    }
}