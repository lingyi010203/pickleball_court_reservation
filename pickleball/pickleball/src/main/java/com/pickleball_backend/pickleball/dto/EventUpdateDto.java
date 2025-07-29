package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.Set;

@Data
public class EventUpdateDto {
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String eventType;
    private Integer capacity;
    private String status;
    private String schedule;
    private Double feeAmount;
    private Set<Integer> courtIds;
    private Integer venueId; // optional, for full venue booking
} 