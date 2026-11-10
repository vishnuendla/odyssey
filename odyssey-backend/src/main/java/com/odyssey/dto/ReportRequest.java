package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ReportRequest {

    @NotBlank(message = "Target type is required")
    @Pattern(regexp = "JOURNAL|COMMENT", message = "Target type must be JOURNAL or COMMENT")
    private String targetType;

    @NotBlank(message = "Target id is required")
    private String targetId;

    @NotBlank(message = "Please choose a reason")
    @Size(max = 32, message = "Reason is too long")
    private String reason;

    @Size(max = 1000, message = "Details must be 1000 characters or fewer")
    private String details;

    public String getTargetType() {
        return targetType;
    }

    public void setTargetType(String targetType) {
        this.targetType = targetType;
    }

    public String getTargetId() {
        return targetId;
    }

    public void setTargetId(String targetId) {
        this.targetId = targetId;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}
