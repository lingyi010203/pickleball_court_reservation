package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfileDto {
    private Integer id;
    private String username;
    private String name;
    private String email;
    private String phone;
    private LocalDate dob;
    private String gender;
    private String userType;
    private String requestedUserType;
    private String status;
    private String profileImage;
    private int bookingsMade;
    private double bookingHours;
    private int sumosJoined;
    private double amountSpent;
    private String theme;
    private boolean emailNotifications;
    private boolean pushNotifications;
    private String verificationDocuments;
    private String verificationStatus;
    
    // 用户统计数据
    private Integer totalBookings;
    private Integer totalFeedback;
    private Double avgRating;
    private Integer points;
    
    // 用户创建时间
    private LocalDateTime createdAt;

    public ProfileDto(Integer id, String name, String email, String phone) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.phone = phone;
    }
}