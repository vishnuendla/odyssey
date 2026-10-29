
package com.odyssey.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class JournalDto {
    private String id;
    private String title;
    private String content;
    private boolean isPublic;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String userId;
    private LocationDto location;
    private List<String> images = new ArrayList<>();
    private List<CommentDto> comments = new ArrayList<>();
    private List<ReactionSummaryDto> reactions = new ArrayList<>();

    // Getters and setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public boolean getIsPublic() {  // 🔥 FIXED
        return isPublic;
    }

    public void setIsPublic(boolean isPublic) {  // 🔥 FIXED
        this.isPublic = isPublic;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocationDto getLocation() {
        return location;
    }

    public void setLocation(LocationDto location) {
        this.location = location;
    }

    public List<String> getImages() {
        return images;
    }

    public void setImages(List<String> images) {
        this.images = images;
    }

    public List<CommentDto> getComments() {
        return comments;
    }

    public void setComments(List<CommentDto> comments) {
        this.comments = comments;
    }

    public List<ReactionSummaryDto> getReactions() {
        return reactions;
    }

    public void setReactions(List<ReactionSummaryDto> reactions) {
        this.reactions = reactions;
    }
}
