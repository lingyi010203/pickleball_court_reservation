package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventRegistrationResponseDto {
    private Integer registrationId;
    private Integer eventId;
    private Integer userId;
    private LocalDateTime registrationDate;
    private String paymentStatus;
    private Double feeAmount;
    private String status;
}
