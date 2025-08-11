package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/revenue")
    public ResponseEntity<Map<String, Object>> getRevenueReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateRevenueReport(startDate, endDate));
    }

    @GetMapping("/booking")
    public ResponseEntity<Map<String, Object>> getBookingReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateBookingReport(startDate, endDate));
    }

    @GetMapping("/user")
    public ResponseEntity<Map<String, Object>> getUserReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateUserReport(startDate, endDate));
    }
    
    // New specialized report endpoints
    @GetMapping("/monthly-revenue")
    public ResponseEntity<Map<String, Object>> getMonthlyRevenueReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateMonthlyRevenueReport(startDate, endDate));
    }

    @GetMapping("/peak-hour-revenue")
    public ResponseEntity<Map<String, Object>> getPeakHourRevenueReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generatePeakHourRevenueReport(startDate, endDate));
    }

    @GetMapping("/total-revenue")
    public ResponseEntity<Map<String, Object>> getTotalRevenueReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateTotalRevenueReport(startDate, endDate));
    }

    @GetMapping("/growth-rate")
    public ResponseEntity<Map<String, Object>> getGrowthRateReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateGrowthRateReport(startDate, endDate));
    }

    @GetMapping("/venue-comparison")
    public ResponseEntity<Map<String, Object>> getVenueComparisonReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateVenueComparisonReport(startDate, endDate));
    }

    @GetMapping("/venue-utilization")
    public ResponseEntity<Map<String, Object>> getVenueUtilizationReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateVenueUtilizationReport(startDate, endDate));
    }

    @GetMapping("/venue-ranking")
    public ResponseEntity<Map<String, Object>> getVenueRankingReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateVenueRankingReport(startDate, endDate));
    }

    @GetMapping("/peak-off-peak")
    public ResponseEntity<Map<String, Object>> getPeakOffPeakReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generatePeakOffPeakReport(startDate, endDate));
    }

    @GetMapping("/venue-type-preference")
    public ResponseEntity<Map<String, Object>> getVenueTypePreferenceReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(reportService.generateVenueTypePreferenceReport(startDate, endDate));
    }
} 