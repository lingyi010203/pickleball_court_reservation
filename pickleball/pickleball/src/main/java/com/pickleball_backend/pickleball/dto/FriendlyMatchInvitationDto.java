package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class FriendlyMatchInvitationDto {
    private Integer id;
    private Integer bookingId;
    private Integer organizerId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private int maxPlayers;
    private int currentPlayers;
    private Double price;
    private String status;
    private String invitationType;
    private String court; // 可根據需求擴充為 CourtDto
    private String courtName;
    private String venueName;
    private String courtLocation;
    private String organizerUsername;
    private List<JoinRequestDto> joinRequests;

    // 新增：booking 狀態
    private String bookingStatus;
    // 新增：比賽日期
    private java.time.LocalDate slotDate;
    // 新增：付款狀態
    private String paymentStatus;
    // 新增：是否為邀請類型
    private boolean isInvitation;
    
    public java.time.LocalDate getSlotDate() { return slotDate; }
    public void setSlotDate(java.time.LocalDate slotDate) { this.slotDate = slotDate; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public String getBookingStatus() { return bookingStatus; }
    public void setBookingStatus(String bookingStatus) { this.bookingStatus = bookingStatus; }
    public boolean isInvitation() { return isInvitation; }
    public void setIsInvitation(boolean isInvitation) { this.isInvitation = isInvitation; }
} 