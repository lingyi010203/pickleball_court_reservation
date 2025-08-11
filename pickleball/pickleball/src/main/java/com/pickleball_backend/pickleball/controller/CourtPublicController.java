package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CourtPublicController {
    @Autowired
    private CourtRepository courtRepository;

    @GetMapping("/api/courts")
    public ResponseEntity<List<Court>> getAllCourtsForAllRoles() {
        // 只返回非DELETED状态的球场给用户
        List<Court> courts = courtRepository.findAll().stream()
                .filter(court -> !"DELETED".equalsIgnoreCase(court.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(courts);
    }

    @GetMapping("/api/courts/{id}")
    public ResponseEntity<Court> getCourtById(@PathVariable Integer id) {
        Court court = courtRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Court not found"));
        
        // 检查球场是否已被删除
        if ("DELETED".equalsIgnoreCase(court.getStatus())) {
            throw new RuntimeException("Court not found");
        }
        
        return ResponseEntity.ok(court);
    }

    @GetMapping("/api/courts/booked")
    public ResponseEntity<List<Court>> getBookedCourts() {
        // TODO: Implement logic to get courts booked by current user
        // 只返回非DELETED状态的球场
        List<Court> courts = courtRepository.findAll().stream()
                .filter(court -> !"DELETED".equalsIgnoreCase(court.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(courts);
    }

    @GetMapping("/api/courts/available")
    public ResponseEntity<List<Court>> getAvailableCourts(
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        // TODO: Implement logic to get available courts for given date and time
        // 只返回非DELETED状态的球场
        List<Court> courts = courtRepository.findAll().stream()
                .filter(court -> !"DELETED".equalsIgnoreCase(court.getStatus()))
                .collect(java.util.stream.Collectors.toList());
        return ResponseEntity.ok(courts);
    }
} 