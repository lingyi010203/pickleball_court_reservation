package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class VoucherDto {
    private Integer id;
    private String code;
    private double discountValue;  // Changed from discountAmount to discountValue
    private String discountType;  // Added discount type field
    private int requestPoints;
    private LocalDate expiryDate;
    
    // Add constructor without discountType for backward compatibility
    public VoucherDto(Integer id, String code, double discountValue, int requestPoints, LocalDate expiryDate) {
        this.id = id;
        this.code = code;
        this.discountValue = discountValue;  // Changed from discountAmount
        this.discountType = "amount"; // Default to amount type
        this.requestPoints = requestPoints;
        this.expiryDate = expiryDate;
    }
}