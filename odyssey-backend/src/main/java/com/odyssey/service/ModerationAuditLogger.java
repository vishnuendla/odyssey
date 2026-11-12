package com.odyssey.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Structured trail for moderation decisions. Kept separate from the auth audit
 * log so operators can filter the two event streams independently.
 */
@Component
public class ModerationAuditLogger {

    private static final Logger log = LoggerFactory.getLogger("com.odyssey.audit");

    public void reportResolved(String adminEmail, String reportId, String targetType,
                               String targetId, String action, String note) {
        log.info("moderation_event=report_resolved admin={} report={} target_type={} target={} action={} note={}",
                adminEmail, reportId, targetType, targetId, action, note == null ? "" : note);
    }

    public void visibilityChanged(String adminEmail, String targetType, String targetId, boolean hidden) {
        log.info("moderation_event=visibility_changed admin={} target_type={} target={} hidden={}",
                adminEmail, targetType, targetId, hidden);
    }
}
