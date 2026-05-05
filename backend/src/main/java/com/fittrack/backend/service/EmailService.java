package com.fittrack.backend.service;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    // ── WELCOME EMAIL (client - no verification link) ──
    public void sendWelcomeEmail(
            String toEmail, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Welcome to FitTrack! 🎉");
        message.setText(
                "Hi " + name + ",\n\n" +
                        "Welcome to FitTrack!\n\n" +
                        "Your account has been created successfully.\n\n" +
                        "You can now login and start your fitness journey:\n" +
                        "  → Browse certified trainers\n" +
                        "  → Subscribe to a trainer\n" +
                        "  → Track your progress\n" +
                        "  → Log your BMI and weight\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "Stay fit!\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── TRAINER REGISTRATION EMAIL ──
    public void sendTrainerRegistrationEmail(
            String toEmail, String name) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "FitTrack Trainer Application Received");
        message.setText(
                "Hi " + name + ",\n\n" +
                        "Thank you for registering as a trainer " +
                        "on FitTrack!\n\n" +
                        "Next steps:\n" +
                        "  1. Login to your account\n" +
                        "  2. Complete your trainer profile\n" +
                        "     (photo, bio, specialization,\n" +
                        "      certification, experience)\n" +
                        "  3. Submit your profile for admin review\n\n" +
                        "You will receive an email once your\n" +
                        "account is approved by our admin team.\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── OTP EMAIL FOR FORGOT PASSWORD ──
    public void sendOtpEmail(
            String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "FitTrack - Password Reset OTP");
        message.setText(
                "Hi,\n\n" +
                        "You requested to reset your " +
                        "FitTrack password.\n\n" +
                        "Your OTP code is:\n\n" +
                        "━━━━━━━━━━━━━━━━━\n" +
                        "   " + otp + "\n" +
                        "━━━━━━━━━━━━━━━━━\n\n" +
                        "This OTP is valid for 5 minutes only.\n\n" +
                        "If you did not request this, please " +
                        "ignore this email.\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── PAYMENT SUCCESS TO CLIENT ──
    public void sendPaymentSuccessToClient(
            String toEmail, String clientName,
            String trainerName, Double amount,
            String endDate) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Payment Successful - FitTrack Subscription");
        message.setText(
                "Hi " + clientName + ",\n\n" +
                        "Your payment was successful!\n\n" +
                        "Subscription Details:\n" +
                        "  Trainer    : " + trainerName + "\n" +
                        "  Amount Paid: LKR " + amount + "\n" +
                        "  Valid Until: " + endDate + "\n\n" +
                        "Your trainer will now assign your\n" +
                        "workout and meal plans.\n\n" +
                        "Stay fit!\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── PAYMENT NOTIFICATION TO TRAINER ──
    public void sendPaymentNotificationToTrainer(
            String toEmail, String trainerName,
            String clientName, Double amount,
            String endDate) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "New Client Payment - FitTrack");
        message.setText(
                "Hi " + trainerName + ",\n\n" +
                        "Great news! A client has paid.\n\n" +
                        "Payment Details:\n" +
                        "  Client     : " + clientName + "\n" +
                        "  Amount     : LKR " + amount + "\n" +
                        "  Valid Until: " + endDate + "\n\n" +
                        "Please login and assign workout\n" +
                        "and meal plans to your new client!\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── EXPIRY REMINDER TO CLIENT ──
    public void sendExpiryReminderToClient(
            String toEmail, String clientName,
            String trainerName, String endDate) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Subscription Expiring Soon - FitTrack");
        message.setText(
                "Hi " + clientName + ",\n\n" +
                        "Your subscription with " + trainerName +
                        " expires on " + endDate + ".\n\n" +
                        "Login to FitTrack to renew your plan " +
                        "and keep your fitness journey going!\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── TRAINER APPROVED ──
    public void sendTrainerApprovedEmail(
            String toEmail, String trainerName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Account Approved - FitTrack");
        message.setText(
                "Hi " + trainerName + ",\n\n" +
                        "Congratulations! Your trainer account\n" +
                        "has been approved by FitTrack admin.\n\n" +
                        "You can now login and start\n" +
                        "accepting clients!\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── TRAINER REJECTED ──
    public void sendTrainerRejectedEmail(
            String toEmail, String trainerName,
            String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Application Update - FitTrack");
        message.setText(
                "Hi " + trainerName + ",\n\n" +
                        "We have reviewed your trainer application\n" +
                        "on FitTrack.\n\n" +
                        "Unfortunately your application was\n" +
                        "not approved at this time.\n\n" +
                        "Reason: " + reason + "\n\n" +
                        "You may update your profile and\n" +
                        "resubmit for review.\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── SUBSCRIPTION REQUEST TO TRAINER ──
    public void sendSubscriptionRequestToTrainer(
            String toEmail, String trainerName,
            String clientName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "New Subscription Request - FitTrack");
        message.setText(
                "Hi " + trainerName + ",\n\n" +
                        "You have a new subscription request!\n\n" +
                        "Client: " + clientName + "\n\n" +
                        "Login to FitTrack to review the\n" +
                        "client's profile and accept or\n" +
                        "decline the request.\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── SUBSCRIPTION ACCEPTED TO CLIENT ──
    public void sendSubscriptionAcceptedToClient(
            String toEmail, String clientName,
            String trainerName) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Subscription Request Accepted - FitTrack");
        message.setText(
                "Hi " + clientName + ",\n\n" +
                        "Great news! " + trainerName +
                        " has accepted\nyour subscription request.\n\n" +
                        "Next step:\n" +
                        "  → Login and complete your payment\n" +
                        "    to activate your subscription\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }

    // ── SUBSCRIPTION REJECTED TO CLIENT ──
    public void sendSubscriptionRejectedToClient(
            String toEmail, String clientName,
            String trainerName, String reason) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(
                "Subscription Request Update - FitTrack");
        message.setText(
                "Hi " + clientName + ",\n\n" +
                        "Your subscription request to\n" +
                        trainerName + " was not accepted.\n\n" +
                        "Reason: " + reason + "\n\n" +
                        "You can browse other certified\n" +
                        "trainers on FitTrack.\n\n" +
                        "Login at: http://localhost:5173/login\n\n" +
                        "The FitTrack Team"
        );
        mailSender.send(message);
    }
    // ── SUBSCRIPTION EXPIRED EMAIL ──
    public void sendSubscriptionExpiredEmail(
            String to, String clientName,
            String trainerName) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject("FitTrack — Subscription Expired");
        msg.setText(
                "Hi " + clientName + ",\n\n" +
                        "Your subscription with " + trainerName +
                        " has expired.\n\n" +
                        "Login to FitTrack to renew your subscription " +
                        "and continue your fitness journey!\n\n" +
                        "👉 http://localhost:5173/client/payments\n\n" +
                        "Best regards,\nFitTrack Team"
        );
        mailSender.send(msg);
    }

    // ── SUBSCRIPTION EXPIRY REMINDER EMAIL ──
    public void sendSubscriptionExpiryReminderEmail(
            String to, String clientName,
            String trainerName, String expiryDate) {
        SimpleMailMessage msg = new SimpleMailMessage();
        msg.setTo(to);
        msg.setSubject(
                "FitTrack — Subscription Expiring in 3 Days!"
        );
        msg.setText(
                "Hi " + clientName + ",\n\n" +
                        "Your subscription with " + trainerName +
                        " will expire on " + expiryDate + ".\n\n" +
                        "Renew now to keep your workout and meal " +
                        "plans active!\n\n" +
                        "👉 http://localhost:5173/client/payments\n\n" +
                        "Best regards,\nFitTrack Team"
        );
        mailSender.send(msg);
    }
}