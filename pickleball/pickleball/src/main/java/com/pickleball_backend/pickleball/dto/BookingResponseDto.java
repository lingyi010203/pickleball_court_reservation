package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingResponseDto {
    private Integer bookingId;
    private String courtName;
    private String courtLocation;
    private LocalDate slotDate;  // Added this field
    private LocalTime startTime;
    private LocalTime endTime;
    private double totalAmount;
    private String bookingStatus;
    private String purpose;
    private Integer numberOfPlayers;
    private Integer durationHours;
    private String paymentMethod;
    private String paymentStatus;
    private Double walletBalance;
    private Integer pointsEarned;  // Points earned from this booking
    private Integer currentPointBalance;  // Current total point balance
}