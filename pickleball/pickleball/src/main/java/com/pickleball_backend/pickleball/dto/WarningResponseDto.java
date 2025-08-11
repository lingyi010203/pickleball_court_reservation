package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarningResponseDto {
    private Integer id;
    private String deliveryStatus; // SENT, FAILED, PENDING
    private long warningCount;
}


