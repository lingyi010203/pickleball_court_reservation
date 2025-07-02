package com.pickleball_backend.pickleball.dto;

import java.time.LocalDateTime;

public class ConversationDto {
    private String username;
    private String name;
    private String lastMessage;
    private LocalDateTime timestamp;

    public ConversationDto() {}

    public ConversationDto(String username, String name, String lastMessage, LocalDateTime timestamp) {
        this.username = username;
        this.name = name;
        this.lastMessage = lastMessage;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(String lastMessage) {
        this.lastMessage = lastMessage;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}