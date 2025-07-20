package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoucherRedemptionDto {
    private Integer id;
    private Integer voucherId;
    private String voucherCode;
    private String voucherTitle;
    private String discountType;
    private double discountValue;
    private Integer userId;
    private String userName;
    private LocalDate redemptionDate;
    private LocalDate expiryDate;
    private String status;
    private String voucherDescription;
} 