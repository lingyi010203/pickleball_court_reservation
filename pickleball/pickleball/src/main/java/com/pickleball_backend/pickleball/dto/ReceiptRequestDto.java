package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReceiptRequestDto {
    private String bookingId;
    private String bookingType;
    private String courtName;
    private String location;
    private String date;
    private String startTime;
    private String endTime;
    private Double duration;
    private Integer numberOfPlayers;
    private Integer numPaddles;
    private Boolean buyBallSet;
    private Double originalAmount;
    private Double discountAmount;
    private Double totalAmount;
    private String paymentMethod;
    private String paymentStatus;
    private String voucherCode;
    private Integer pointsEarned;
    private String bookingDate;
}
