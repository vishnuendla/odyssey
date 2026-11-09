package com.odyssey.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Structured audit trail for security-relevant account events. Never logs
 * passwords or raw tokens.
 */
@Component
public class AuthAuditLogger {

    private static final Logger log = LoggerFactory.getLogger("com.odyssey.audit");

    public void loginSucceeded(String email, String ip) {
        log.info("auth_event=login_succeeded email={} ip={}", email, ip);
    }

    public void loginFailed(String email, String ip) {
        log.warn("auth_event=login_failed email={} ip={}", email, ip);
    }

    public void registered(String email, String ip) {
        log.info("auth_event=registered email={} ip={}", email, ip);
    }

    public void passwordChanged(String email, String ip) {
        log.info("auth_event=password_changed email={} ip={}", email, ip);
    }

    public void passwordReset(String email, String ip) {
        log.info("auth_event=password_reset email={} ip={}", email, ip);
    }

    public void emailVerified(String email, String ip) {
        log.info("auth_event=email_verified email={} ip={}", email, ip);
    }

    public void sessionsRevoked(String email, String ip) {
        log.info("auth_event=sessions_revoked email={} ip={}", email, ip);
    }

    public void accountDeleted(String email, String ip) {
        log.info("auth_event=account_deleted email={} ip={}", email, ip);
    }
}
