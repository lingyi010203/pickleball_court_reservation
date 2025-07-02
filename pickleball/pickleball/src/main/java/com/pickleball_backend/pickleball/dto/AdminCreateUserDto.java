package com.pickleball_backend.pickleball.dto;
import lombok.*;

import java.time.LocalDate;

import jakarta.validation.constraints.*;

@Data
public class AdminCreateUserDto {

    @NotBlank
    private String name;

    @Email
    @NotBlank
    private String email;

    @Pattern(regexp = "^\\d{9,12}$", message = "Phone number must be valid")
    private String phone;

    @Past
    private LocalDate dob;

    @NotBlank
    private String gender;

    @NotBlank
    private String userType;

    @NotBlank
    private String username;

    @NotBlank
    @Size(min = 6, message = "Password must be at least 6 characters")
    private String password;
}
