package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageDto {
    private Integer id;
    private String senderUsername;
    private String recipientUsername;
    private String content;
    private String timestamp;
    private boolean delivered;
    private boolean read;
    private String conversationId;
    private String imageUrl;
}