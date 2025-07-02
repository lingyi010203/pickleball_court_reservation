package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "helpdeskquery")
public class HelpdeskQuery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String question;
    private String aiResponse;
    private boolean escalated;
    private LocalDateTime timestamp = LocalDateTime.now();

    private String topic;
    private String message;
}