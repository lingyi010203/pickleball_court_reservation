package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class ContactFormRequest {
    private String name;
    private String email;
    private String subject;
    private String message;
}
