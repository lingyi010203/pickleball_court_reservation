package com.pickleball_backend.pickleball.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class InvitationRegistrationDto {
    private String name;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String password;
}