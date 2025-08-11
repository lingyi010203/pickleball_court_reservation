package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CourtUtilizationDto {
    private List<CourtUtilizationData> courtUtilizations;
    private Map<String, Double> timeSlotUtilizations; // 时段利用率，用于促销分析
    private String period; // "7d" 或 "30d"
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CourtUtilizationData {
        private Integer courtId;
        private String courtName;
        private String courtType; // 场地类型：STANDARD, VIP, OTHER
        private Double utilizationRate; // 百分比
        private Long totalSlots;
        private Long bookedSlots;
        private Long availableSlots;
    }
}
