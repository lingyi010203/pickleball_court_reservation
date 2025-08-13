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
    private Map<String, TimeSlotDetailData> timeSlotDetails; // 新增：详细的时段数据
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
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimeSlotDetailData {
        private String timeSlot; // 时段，如 "09:00-10:00"
        private Double utilizationRate; // 利用率百分比
        private Long totalSlots; // 总时段数
        private Long bookedSlots; // 已预订时段数
        private Long availableSlots; // 可用时段数
        private Long totalBookings; // 总预订数
        private Double totalRevenue; // 总收入
        private String promotionPotential; // 促销潜力：HIGH, MODERATE, LOW
    }
}
