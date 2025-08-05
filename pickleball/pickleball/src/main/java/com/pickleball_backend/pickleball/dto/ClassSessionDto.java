package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class ClassSessionDto {
    private Integer id;
    private Integer coachId;
    private String coachName;
    private Integer courtId;
    private String courtName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer maxParticipants;
    private Integer currentParticipants;
    private String description;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Double price;
    private String title;
    private String slotType; // 新增字段：课程类型
    private String recurringGroupId;
    private String venueName;
    private String venueState;
    private Boolean allowReplacement; // 新增：是否允許補課
    // 新增：報名名單
    private List<ClassRegistrationDto> registrations;
}