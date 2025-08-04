package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class CourseScheduleDto {
    private String title;
    private String description;
    private Integer venueId;
    private Integer courtId;
    private Double price;
    private Integer maxParticipants;
    
    // 每週重複設定
    private DayOfWeek dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    
    // 課程期間
    private LocalDate startDate;
    private LocalDate endDate;
}