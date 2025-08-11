package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class BookingHistoryDto {
    private Integer id;
    private Integer courtId; // 新增：court ID
    private String courtName;
    private String location;
    private LocalDate date;
    private LocalTime startTime;
    private LocalTime endTime;
    private double amount;
    private String status; // UPCOMING, COMPLETED, CANCELLED
    private LocalDateTime createdAt;
    private String purpose;
    private Integer numberOfPlayers;
    private Integer durationHours;
    // 新增：球拍和球组信息
    private Integer numPaddles;
    private Boolean buyBallSet;
    
    // 新增：用户是否已经评价过这个预订
    private Boolean hasReviewed;
    
    // 新增：預訂類型（COURT_BOOKING, EVENT_REGISTRATION）
    private String bookingType = "COURT_BOOKING";
}