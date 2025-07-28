package com.pickleball_backend.pickleball.service;

import java.util.Map;

public interface ReportService {
    Map<String, Object> generateRevenueReport(String startDate, String endDate);
    Map<String, Object> generateBookingReport(String startDate, String endDate);
    Map<String, Object> generateUserReport(String startDate, String endDate);
} 