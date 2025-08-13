package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CancellationResponse {
    private Integer requestId;
    private Integer bookingId;
    private String status;
    private LocalDateTime requestDate;
    private String message;
    
    // 新增字段用于显示详细信息
    private Double originalAmount;
    private Double refundAmount;
    private String refundMethod;
    private String refundStatus;
    private String courtName;
    private String slotDate;
    private String slotTime;
    private Boolean isAutoApproved;
    private String adminRemark;
}