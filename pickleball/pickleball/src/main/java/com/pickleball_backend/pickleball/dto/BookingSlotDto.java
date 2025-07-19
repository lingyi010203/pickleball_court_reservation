package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class BookingSlotDto {
    private Integer id;
    private SlotDto slot;
    private String status;
} 