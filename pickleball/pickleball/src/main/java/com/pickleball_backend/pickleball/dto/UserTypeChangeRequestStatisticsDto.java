package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTypeChangeRequestStatisticsDto {
    private long totalRequests;
    private long pendingRequests;
    private long approvedRequests;
    private long rejectedRequests;
    private long cancelledRequests;
    private long coachRequests;
    private long eventOrganizerRequests;
    private long userRequests;
    private double averageProcessingTime; // in hours
    private long requestsThisWeek;
    private long requestsThisMonth;
}
