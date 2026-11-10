package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class ReportResolveRequest {

    @NotBlank(message = "Action is required")
    @Pattern(regexp = "HIDE|DISMISS", message = "Action must be HIDE or DISMISS")
    private String action;

    @Size(max = 500, message = "Note must be 500 characters or fewer")
    private String note;

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
