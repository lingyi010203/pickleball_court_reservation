package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class MessageResponseDto {
    private Integer id;
    private String content;
    private LocalDateTime timestamp;
    private String senderUsername;
    private String senderProfileImage;
    private String receiverUsername;
    private boolean delivered;
    private boolean read;
    private String conversationId;
    private String imageUrl;
}