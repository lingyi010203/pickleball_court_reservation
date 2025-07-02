package com.pickleball_backend.pickleball.dto;
import lombok.*;
import java.time.LocalDate;

@Data
public class AdminUpdateUserDto {
    private String name;
    private String email;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String status;
    // getters & setters
}