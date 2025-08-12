package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class FriendlyMatchPaymentDto {
    private Integer numPaddles = 0;
    private Boolean buyBallSet = false;
    private Double totalPrice;
    private String paymentMethod; // "WALLET" or "CREDIT_CARD"
    private Boolean useVoucher = false;
    private Integer voucherRedemptionId;
} 