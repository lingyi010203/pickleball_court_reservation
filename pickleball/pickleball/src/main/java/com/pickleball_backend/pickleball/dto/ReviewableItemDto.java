package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class ReviewableItemDto {
    private Integer bookingId;
    private Integer courtId;
    private String courtName;
    private String courtLocation;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDateTime bookingDate;
    private boolean hasReviewed;
}