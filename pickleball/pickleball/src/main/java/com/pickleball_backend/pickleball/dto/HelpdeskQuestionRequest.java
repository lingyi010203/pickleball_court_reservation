package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class HelpdeskQuestionRequest {
    private String question;
    private String topic;
    private String message;
}
