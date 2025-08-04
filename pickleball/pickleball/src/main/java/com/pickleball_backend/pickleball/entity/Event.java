package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Set;

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
    
    private String status;

    @Column(name = "organizer_id")
    private Integer organizerId;

    @NotBlank(message = "Schedule is required")
    @Column(columnDefinition = "TEXT")
    private String schedule;

    @Column(name = "fee_amount")
    private Double feeAmount;

    private int registeredCount = 0;

    @ManyToMany
    @JoinTable(
        name = "event_court",
        joinColumns = @JoinColumn(name = "event_id"),
        inverseJoinColumns = @JoinColumn(name = "court_id")
    )
    private Set<Court> courts;

    @ManyToOne
    @JoinColumn(name = "venue_id")
    private Venue venue; // optional, for full venue booking

}