
package com.odyssey.dto;

import java.util.ArrayList;
import java.util.List;

public class JournalRequest {
    private String title;
    private String content;
    private boolean isPublic;
    private LocationDto location;
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
