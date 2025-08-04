package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventFilterDto {
    private String eventType; // tournament, league, friendly match
    private String location;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String status; // PUBLISHED, DRAFT, CANCELLED
    private String searchKeyword; // search in title
    private Integer page = 0;
    private Integer size = 10;
    private String sortBy = "startTime";
    private String sortDirection = "ASC";
} 