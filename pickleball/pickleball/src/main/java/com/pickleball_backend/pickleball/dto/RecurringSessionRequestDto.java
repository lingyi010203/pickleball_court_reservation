// RecurringSessionRequest.java
package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Data
public class RecurringSessionRequestDto {
    private String title;
    private String description;
    private Integer courtId;
    private Double price;
    private Integer maxParticipants;
    private List<DayOfWeek> daysOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate startDate;
    private LocalDate endDate;
}