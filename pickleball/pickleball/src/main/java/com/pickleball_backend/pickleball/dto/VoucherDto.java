package com.pickleball_backend.pickleball.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
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
    private Double discountValue;  // Changed from discountAmount to discountValue
    private String discountType;  // Added discount type field
    private Integer requestPoints;
    private String tierName;  // Added tier name field
    
    @JsonFormat(pattern = "dd-MM-yyyy")
    private LocalDate expiryDate;
}