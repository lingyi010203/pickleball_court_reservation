package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "event")
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String title;

    @Column(name = "startTime")
    private LocalDateTime startTime;

    @Column(name = "endTime")
    private LocalDateTime endTime;

    private String eventType;
    private Integer capacity;
    private String location;
    private String status;

    @Column(name = "organizer_id")
    private Integer organizerId;

}