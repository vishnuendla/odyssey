package com.odyssey.dto;

public class AdminStatsDto {
    private long users;
    private long journals;
    private long publicJournals;
    private long comments;
    private long openReports;

    public long getUsers() {
        return users;
    }

    public void setUsers(long users) {
        this.users = users;
    }

    public long getJournals() {
        return journals;
    }

    public void setJournals(long journals) {
        this.journals = journals;
    }

    public long getPublicJournals() {
        return publicJournals;
    }

    public void setPublicJournals(long publicJournals) {
        this.publicJournals = publicJournals;
    }

    public long getComments() {
        return comments;
    }

    public void setComments(long comments) {
        this.comments = comments;
    }

    public long getOpenReports() {
        return openReports;
    }

    public void setOpenReports(long openReports) {
        this.openReports = openReports;
    }
}
