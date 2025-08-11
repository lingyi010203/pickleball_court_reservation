package com.pickleball_backend.pickleball.service;

import java.util.Map;

public interface ReportService {
    Map<String, Object> generateRevenueReport(String startDate, String endDate);
    Map<String, Object> generateBookingReport(String startDate, String endDate);
    Map<String, Object> generateUserReport(String startDate, String endDate);
    
    // New specialized report methods
    Map<String, Object> generateMonthlyRevenueReport(String startDate, String endDate);
    Map<String, Object> generatePeakHourRevenueReport(String startDate, String endDate);
    Map<String, Object> generateTotalRevenueReport(String startDate, String endDate);
    Map<String, Object> generateGrowthRateReport(String startDate, String endDate);
    Map<String, Object> generateVenueComparisonReport(String startDate, String endDate);
    
    // Venue utilization report methods
    Map<String, Object> generateVenueUtilizationReport(String startDate, String endDate);
    Map<String, Object> generateVenueRankingReport(String startDate, String endDate);
    Map<String, Object> generatePeakOffPeakReport(String startDate, String endDate);
    Map<String, Object> generateVenueTypePreferenceReport(String startDate, String endDate);
} 