package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class FriendlyMatchResponseDto {
    private Integer id;
    private Integer maxPlayers;
    private int currentPlayers;
    private String skillLevel;
    private String matchRules;
    private String status;
    private String paymentStatus;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationHours;
    private String location;
    private Integer organizerId;
    private String organizerName;
    private Integer courtId;
    private Integer venueId;
    private String state;
    private boolean isInvitation;
    private String invitationType;
    private String message;
} 