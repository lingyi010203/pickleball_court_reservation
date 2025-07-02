package com.pickleball_backend.pickleball.dto;


import lombok.Data;


@Data
public class ReportedFeedbackDto {
    private Integer reportId;
    private Integer feedbackId;
    private String feedbackSummary;
    private String reporterName;
    private String severity;
    private String status;
}