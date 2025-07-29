package com.pickleball_backend.pickleball.dto;

import com.pickleball_backend.pickleball.entity.LeaveRequest;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class LeaveRequestDto {
    private Integer id;
    private Integer studentId;
    private String studentName;
    private String studentEmail;
    private Integer coachId;
    private String coachName;
    private Integer originalSessionId;
    private String originalSessionTitle;
    private LocalDateTime originalDate;
    private LocalDateTime preferredDate;
    private LocalDateTime originalSessionStartTime;
    private LocalDateTime originalSessionEndTime;
    private String reason;
    private LeaveRequest.LeaveRequestStatus status;
    private LocalDateTime requestDate;
    private String coachNotes;
    private Integer replacementSessionId;
    private String replacementSessionTitle;
    private LocalDateTime resolvedDate;
    
    // 場地信息
    private String venue;
    private String state;
    private String court;
} 