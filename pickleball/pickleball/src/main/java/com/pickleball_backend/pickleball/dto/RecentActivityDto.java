package com.pickleball_backend.pickleball.dto;

import java.time.LocalDateTime;

public class RecentActivityDto {
    private String type;
    private String user;
    private String detail;
    private LocalDateTime timestamp;
    private String icon;

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getUser() { return user; }
    public void setUser(String user) { this.user = user; }
    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
} 