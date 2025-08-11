package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import com.pickleball_backend.pickleball.entity.CourtType;

@Data
public class CourtDto {
    private Integer venueId;  // 新增字段
    private String name;
    private String location;
    private String status;
    private String openingTime;
    private String closingTime;
    private String operatingDays;
    private Double peakHourlyPrice;
    private Double offPeakHourlyPrice;
    private Double dailyPrice;
    private String peakStartTime;
    private String peakEndTime;
    private CourtType courtType;  // 新增字段
}