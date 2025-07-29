package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class FriendlyMatchPaymentDto {
    private Integer numPaddles = 0;
    private Boolean buyBallSet = false;
    private Double totalPrice;
} 