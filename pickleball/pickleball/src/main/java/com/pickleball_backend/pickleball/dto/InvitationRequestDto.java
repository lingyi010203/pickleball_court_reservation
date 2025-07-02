package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class InvitationRequestDto {
    private String email;
    private String role; // "ADMIN", "COACH", "EVENT_ORGANIZER", "USER"
}