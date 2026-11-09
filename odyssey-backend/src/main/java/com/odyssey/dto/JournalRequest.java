
package com.odyssey.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.ArrayList;
import java.util.List;

public class JournalRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title must be 150 characters or less")
    private String title;

    @NotBlank(message = "Content is required")
    @Size(max = 50000, message = "Content is too long")
    private String content;

    private boolean isPublic;

    @Valid
    private LocationDto location;

    @Size(max = 10, message = "You can attach at most 10 images")
    private List<String> images = new ArrayList<>();

    // Getters and setters
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

    public boolean getIsPublic() { 
        return isPublic;
    }

    public void setIsPublic(boolean isPublic) { 
        this.isPublic = isPublic;
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
}
