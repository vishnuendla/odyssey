package com.odyssey.dto;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(min = 2, max = 80, message = "Name must be between 2 and 80 characters")
    private String name;

    @Size(max = 500, message = "Avatar URL is too long")
    private String avatar;

    @Size(max = 200, message = "Bio must be 200 characters or less")
    private String bio;

    @Size(max = 100, message = "Location must be 100 characters or less")
    private String location;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getAvatar() {
        return avatar;
    }

    public void setAvatar(String avatar) {
        this.avatar = avatar;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }
}
