
package com.odyssey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ReactionDto {
    @NotBlank(message = "Reaction type is required")
    @Size(max = 20, message = "Unknown reaction type")
    private String type;

    // Getters and setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }
}
