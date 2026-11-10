package com.odyssey.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * Sends transactional email. With MAIL_MODE=log (the default for local
 * development) messages are written to the application log instead of being
 * delivered, so no SMTP server is required.
 */
@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final String mode;
    private final String from;
    private final String frontendUrl;

    public MailService(ObjectProvider<JavaMailSender> mailSenderProvider,
                       @Value("${app.mail.mode:log}") String mode,
                       @Value("${app.mail.from:no-reply@odyssey.local}") String from,
                       @Value("${app.frontend-url:http://localhost:3000}") String frontendUrl) {
        this.mailSenderProvider = mailSenderProvider;
        this.mode = mode;
        this.from = from;
        this.frontendUrl = frontendUrl;
    }

    public void sendVerificationEmail(String to, String rawToken) {
        String link = frontendUrl + "/verify-email?token=" + encode(rawToken);
        send(to, "Verify your Odyssey email",
                "Welcome to Odyssey!\n\nConfirm your email address by opening this link:\n" + link
                        + "\n\nThis link expires in 24 hours. If you did not create an account, you can ignore this email.");
    }

    public void sendPasswordResetEmail(String to, String rawToken) {
        String link = frontendUrl + "/reset-password?token=" + encode(rawToken);
        send(to, "Reset your Odyssey password",
                "We received a request to reset your Odyssey password.\n\nChoose a new password here:\n" + link
                        + "\n\nThis link expires in 1 hour. If you did not request a reset, you can safely ignore this email.");
    }

    private void send(String to, String subject, String body) {
        if ("smtp".equalsIgnoreCase(mode)) {
            JavaMailSender sender = mailSenderProvider.getIfAvailable();
            if (sender == null) {
                log.warn("MAIL_MODE=smtp but no mail sender is configured; falling back to log output");
                log.info("Mail to {} — {}\n{}", to, subject, body);
                return;
            }
            try {
                MimeMessage message = sender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
                helper.setFrom(from);
                helper.setTo(to);
                helper.setSubject(subject);
                helper.setText(body, false);
                sender.send(message);
            } catch (Exception e) {
                log.error("Failed to send email to {}", to, e);
            }
            return;
        }

        log.info("MAIL_MODE=log — email to {} with subject \"{}\"\n{}", to, subject, body);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
