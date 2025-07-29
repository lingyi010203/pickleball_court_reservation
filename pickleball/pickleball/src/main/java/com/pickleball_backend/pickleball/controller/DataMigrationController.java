package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.service.DataMigrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/migration")
@RequiredArgsConstructor
@Slf4j
public class DataMigrationController {

    private final DataMigrationService dataMigrationService;

    @PostMapping("/historical-bookings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> migrateHistoricalBookings() {
        try {
            log.info("Admin triggered historical booking migration");
            dataMigrationService.migrateHistoricalBookingTransactions();
            return ResponseEntity.ok().body(Map.of(
                "message", "Historical booking migration completed successfully",
                "status", "SUCCESS"
            ));
        } catch (Exception e) {
            log.error("Historical booking migration failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Migration failed: " + e.getMessage(),
                "status", "FAILED"
            ));
        }
    }

    @PostMapping("/historical-refunds")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> migrateHistoricalRefunds() {
        try {
            log.info("Admin triggered historical refund migration");
            dataMigrationService.migrateHistoricalRefundTransactions();
            return ResponseEntity.ok().body(Map.of(
                "message", "Historical refund migration completed successfully",
                "status", "SUCCESS"
            ));
        } catch (Exception e) {
            log.error("Historical refund migration failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Migration failed: " + e.getMessage(),
                "status", "FAILED"
            ));
        }
    }

    @PostMapping("/full")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> performFullMigration() {
        try {
            log.info("Admin triggered full data migration");
            dataMigrationService.performFullMigration();
            return ResponseEntity.ok().body(Map.of(
                "message", "Full data migration completed successfully",
                "status", "SUCCESS"
            ));
        } catch (Exception e) {
            log.error("Full data migration failed: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Migration failed: " + e.getMessage(),
                "status", "FAILED"
            ));
        }
    }
} 