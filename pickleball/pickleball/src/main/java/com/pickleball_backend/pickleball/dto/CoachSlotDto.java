package com.pickleball_backend.pickleball.dto;

import java.time.LocalDateTime;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
public class CoachSlotDto {
    private Integer courtId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    // Getters and setters
}