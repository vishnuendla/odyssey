
package com.odyssey.dto;

public class ReactionSummaryDto {
    private String type;
    private long count;

    // Constructors
    public ReactionSummaryDto() {
    }

    public ReactionSummaryDto(String type, long count) {
        this.type = type;
        this.count = count;
    }

    // Getters and setters
    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
    }
}
