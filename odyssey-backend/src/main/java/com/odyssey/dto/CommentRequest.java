package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class CommentRequest {

    @Size(max = 2000, message = "Comment must be 2000 characters or fewer")
    private String content;

    private String parentId;

    @Size(max = 3, message = "You can attach up to 3 photos, GIFs or one short video")
    private List<@NotBlank(message = "Attachment URL cannot be empty")
            @Size(max = 512, message = "Attachment URL is too long") String> attachments = new ArrayList<>();

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getParentId() {
        return parentId;
    }

    public void setParentId(String parentId) {
        this.parentId = parentId;
    }

    public List<String> getAttachments() {
        return attachments;
    }

    public void setAttachments(List<String> attachments) {
        this.attachments = attachments == null ? new ArrayList<>() : attachments;
    }
}
