// RecurringSessionRequest.java
package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
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
    private LocalTime startTime;
    private LocalTime endTime;
    private LocalDate startDate;
    private LocalDate endDate;
    private String dayOfWeek; // 例如: "MON,WED,FRI" 或 "TUES,THURS"
}