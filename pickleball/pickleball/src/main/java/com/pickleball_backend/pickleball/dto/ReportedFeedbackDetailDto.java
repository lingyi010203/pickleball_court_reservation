package com.pickleball_backend.pickleball.dto;

import lombok.Data;


@Data
public class ReportedFeedbackDetailDto {
    private Integer reportId;
    private FeedbackResponseDto feedback;
    private String reporterName;
    private String reporterComment;
    private String severity;
    private String status;
    private ProfileDto commentedUserProfile; // For viewing the user's profile
}