package com.fittrack.backend;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@CrossOrigin(origins = "*")
public class ContactController {

    @Autowired
    private JavaMailSender mailSender;

    @PostMapping("/send")
    public ResponseEntity<Map<String, String>> sendContact(
            @RequestBody Map<String, String> body) {
        Map<String, String> response = new HashMap<>();
        try {
            String name    = body.get("name");
            String email   = body.get("email");
            String subject = body.getOrDefault("subject", "Contact Form Message");
            String message = body.get("message");

            // Email to FitTrack team
            SimpleMailMessage teamMail = new SimpleMailMessage();
            teamMail.setTo("FitTrack Team <34264d8e3fec71@inbox.mailtrap.io>");
            teamMail.setSubject("📩 New Contact: " + subject);
            teamMail.setText(
                "From: " + name + "\n" +
                "Email: " + email + "\n\n" +
                "Message:\n" + message
            );
            mailSender.send(teamMail);

            // Auto-reply to user
            SimpleMailMessage userMail = new SimpleMailMessage();
            userMail.setTo(email);
            userMail.setSubject("✅ We received your message – FitTrack");
            userMail.setText(
                "Hi " + name + ",\n\n" +
                "Thank you for contacting FitTrack! " +
                "We have received your message and " +
                "will get back to you within 24 hours.\n\n" +
                "Your message:\n" + message + "\n\n" +
                "Best regards,\n" +
                "The FitTrack Team\n" +
                "support@fittrack.lk"
            );
            mailSender.send(userMail);

            response.put("status", "success");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
}