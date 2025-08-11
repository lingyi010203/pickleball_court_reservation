package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.util.List;

@Data
public class CourtDeletePreviewDto {
    private List<AffectedBookingDto> activeBookings;
    private List<AffectedFriendlyMatchDto> friendlyMatches;
    
    @Data
    public static class AffectedBookingDto {
        private String memberName;
        private String slotDate;
        private String slotTime;
        private Double totalAmount;
        private String bookingStatus;
    }
    
    @Data
    public static class AffectedFriendlyMatchDto {
        private String title;
        private String date;
        private Integer participantCount;
        private String status;
    }
}
