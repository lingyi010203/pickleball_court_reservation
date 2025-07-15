package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CancellationRequestDto {
    private Integer id;
    private String reason;
    private String status;
    private String adminRemark;
    private LocalDate requestDate;
} 