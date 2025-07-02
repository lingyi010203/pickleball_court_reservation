package com.pickleball_backend.pickleball.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class SlotResponseDto {
    private Integer id;
    private Integer courtId;
    private String courtName;
    private String courtLocation;
    private LocalDate date;
    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;
    private String status;
    private Integer courtNumber;
    private Integer durationHours;
}