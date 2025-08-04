package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
public class ClassRegistrationDto {
    private Integer registrationId;
    private Integer memberId;
    private Integer userId;
    private String memberName;
    private String email;
    private LocalDateTime registrationDate;
    private String username;
    private String phone;
    private String attendanceStatus; // 新增：出席状态
}