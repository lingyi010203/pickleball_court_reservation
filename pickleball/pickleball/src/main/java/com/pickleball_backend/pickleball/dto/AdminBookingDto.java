package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class AdminBookingDto {
    private Integer id;
    private java.time.LocalDateTime bookingDate;
    public java.time.LocalDateTime getBookingDate() { return bookingDate; }
    public void setBookingDate(java.time.LocalDateTime bookingDate) { this.bookingDate = bookingDate; }
    private double totalAmount;
    private String status;
    private String memberName;
    private Integer memberId; // 新增：会员ID
    private String courtName;
    private LocalDate slotDate;
    private LocalTime startTime;
    private LocalTime endTime;
    private String purpose;
    private Integer numberOfPlayers;
    private String adminRemark;
    private String memberPhone;
    private String memberEmail;
    private CancellationRequestDto cancellationRequest;
    
    // Duration and payment information
    private Integer durationHours;
    private String paymentMethod;
    private String paymentType;
    private String paymentStatus;
    private String transactionId;
    private Integer paymentId; // 新增：支付ID
    
    // Additional booking details
    private Integer numPaddles;
    private Boolean buyBallSet;
    
    // Multi-slot booking support
    private List<BookingSlotDto> bookingSlots;
}