package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FeedbackResponseDto {
    private Integer id;
    private String targetType;
    private Integer targetId;
    private Integer rating;
    private String review;
    private String userName;
    private String userEmail;
    private Integer userId; // 新增：用户ID
    private LocalDateTime createdAt;
    private List<String> tags;
    private String targetName;
    private Double averageRating;
    
    // 新增：预订ID
    private Integer bookingId;
}