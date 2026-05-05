package com.fittrack.backend.service;

import com.fittrack.backend.model.Subscription;
import com.fittrack.backend.repository.SubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;

@Component
public class SubscriptionScheduler {

    private final SubscriptionRepository
            subscriptionRepository;
    private final EmailService emailService;

    public SubscriptionScheduler(
            SubscriptionRepository subscriptionRepository,
            EmailService emailService) {
        this.subscriptionRepository = subscriptionRepository;
        this.emailService = emailService;
    }

    // ── RUNS EVERY DAY AT MIDNIGHT ──
    @Scheduled(cron = "0 0 0 * * *")
    public void expireSubscriptions() {
        System.out.println("⏰ Running subscription " +
                "expiry check: " + LocalDate.now());

        List<Subscription> toExpire =
                subscriptionRepository.findAll()
                        .stream()
                        .filter(s ->
                                s.getStatus().equals("ACTIVE")
                                        && s.getEndDate() != null
                                        && s.getEndDate()
                                        .isBefore(LocalDate.now()))
                        .toList();

        for (Subscription s : toExpire) {
            s.setStatus("EXPIRED");
            subscriptionRepository.save(s);

            // send expiry email to client
            try {
                emailService.sendSubscriptionExpiredEmail(
                        s.getClient().getEmail(),
                        s.getClient().getName(),
                        s.getTrainer().getName());
            } catch (Exception e) {
                System.out.println("Expiry email failed: "
                        + e.getMessage());
            }
        }

        System.out.println("✅ Expired " + toExpire.size()
                + " subscriptions");
    }

    // ── RUNS EVERY DAY AT 9AM ──
    // Send reminder to clients expiring in 3 days
    @Scheduled(cron = "0 0 9 * * *")
    public void sendExpiryReminders() {

        LocalDate threeDaysLater =
                LocalDate.now().plusDays(3);

        List<Subscription> expiringSoon =
                subscriptionRepository.findAll()
                        .stream()
                        .filter(s ->
                                s.getStatus().equals("ACTIVE")
                                        && s.getEndDate() != null
                                        && s.getEndDate().equals(
                                        threeDaysLater))
                        .toList();

        for (Subscription s : expiringSoon) {
            try {
                emailService.sendSubscriptionExpiryReminderEmail(
                        s.getClient().getEmail(),
                        s.getClient().getName(),
                        s.getTrainer().getName(),
                        s.getEndDate().toString());
            } catch (Exception e) {
                System.out.println(
                        "Reminder email failed: "
                                + e.getMessage());
            }
        }

        System.out.println("✅ Sent " +
                expiringSoon.size() + " expiry reminders");
    }
}