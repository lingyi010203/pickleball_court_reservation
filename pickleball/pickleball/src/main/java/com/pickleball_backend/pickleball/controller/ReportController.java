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
} 