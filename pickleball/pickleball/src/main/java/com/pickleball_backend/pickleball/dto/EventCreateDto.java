package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class EventCreateDto {
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String eventType;
    private Integer capacity;
    private String status;
    private String schedule;
    private Double feeAmount;
    private String location; // 新增：事件地點
    private Set<Integer> courtIds;
    private Integer venueId; // optional, for full venue booking
    private Boolean sendNotification = true; // 默認發送通知
} 