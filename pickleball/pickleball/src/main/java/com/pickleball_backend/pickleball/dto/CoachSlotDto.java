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
    private Integer experienceYear;
    private String title;
    private String description;
    private Integer maxParticipants;
    private Double price;

    // Getters and setters
}