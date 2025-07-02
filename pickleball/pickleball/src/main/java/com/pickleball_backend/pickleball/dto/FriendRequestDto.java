package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class FriendRequestDto {
    private Long id;
    private String senderUsername;
    private String senderName;
    private String senderProfileImage;
    private String status;
    private String createdAt;

    // Add constructor
    public FriendRequestDto(Long id, String senderUsername, String senderName,
                            String senderProfileImage, String status, String createdAt) {
        this.id = id;
        this.senderUsername = senderUsername;
        this.senderName = senderName;
        this.senderProfileImage = senderProfileImage;
        this.status = status;
        this.createdAt = createdAt;
    }
}