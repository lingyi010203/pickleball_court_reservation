package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TopUpResponseDto {
    private String transactionId;
    private Double amount;
    private String source;
    private Double newBalance;
    private LocalDateTime timestamp;
}