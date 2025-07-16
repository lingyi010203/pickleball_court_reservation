package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class CancellationRequestDto {
    private Integer id;
    private String reason;
    private String status;
    private String adminRemark;
    private LocalDateTime requestDate;
} 