package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "event")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Start time is required")
    @Column(name = "start_time")
    private LocalDateTime startTime;

    @NotNull(message = "End time is required")
    @Column(name = "end_time")
    private LocalDateTime endTime;

    @NotBlank(message = "Event type is required")
    private String eventType;
    
    @Positive(message = "Capacity must be positive")
    private Integer capacity;
    
    @NotBlank(message = "Location is required")
    private String location;
    
    private String status;

    @Column(name = "organizer_id")
    private Integer organizerId;
    
    @NotBlank(message = "Skill level is required")
    private String skillLevel;

    @NotBlank(message = "Eligibility is required")
    private String eligibility;

    @NotBlank(message = "Schedule is required")
    @Column(columnDefinition = "TEXT")
    private String schedule;

    @Column(name = "fee_amount")
    private Double feeAmount;

    private int registeredCount = 0;

}