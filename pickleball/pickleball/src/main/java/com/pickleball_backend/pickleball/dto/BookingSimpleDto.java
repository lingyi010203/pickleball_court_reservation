package com.pickleball_backend.pickleball.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;

public class BookingSimpleDto {
    public Integer id;
    public String courtName;
    public LocalDate slotDate;
    public LocalTime startTime;
    public LocalTime endTime;
    public String bookingStatus;
    public LocalDateTime bookingDate;
    public Integer numberOfPlayers;

    public BookingSimpleDto(Integer id, String courtName, LocalDate slotDate, LocalTime startTime, LocalTime endTime, String bookingStatus, LocalDateTime bookingDate, Integer numberOfPlayers) {
        this.id = id;
        this.courtName = courtName;
        this.slotDate = slotDate;
        this.startTime = startTime;
        this.endTime = endTime;
        this.bookingStatus = bookingStatus;
        this.bookingDate = bookingDate;
        this.numberOfPlayers = numberOfPlayers;
    }

    // getters and setters (可選)
} 