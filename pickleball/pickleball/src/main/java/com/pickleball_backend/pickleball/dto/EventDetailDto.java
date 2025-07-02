package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class EventDetailDto {
    private Integer id;
    private String title;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String eventType;
    private Integer capacity;
    private String location;
    private String status;
    private String skillLevel;
    private String eligibility;
    private String schedule;
    private Double feeAmount;
    
    // Organizer information
    private Integer organizerId;
    private String organizerName;
    private String organizerEmail;
    private Double organizerRating;
    
    // Additional details for browsing
    private boolean isUpcoming;
    private boolean isEligible; // based on user's tier
    private String timeUntilEvent; // e.g., "2 days", "3 hours"
    private Integer currentParticipants; // if tracking participants
    private List<String> availableSlots; // if applicable
} 