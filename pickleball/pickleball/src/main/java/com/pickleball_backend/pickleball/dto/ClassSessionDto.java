package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ClassSessionDto {
    private Integer courtId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String note;
}