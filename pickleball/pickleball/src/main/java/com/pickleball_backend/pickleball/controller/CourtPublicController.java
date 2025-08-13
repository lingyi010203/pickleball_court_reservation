package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.CourtImage;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.CourtImageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class CourtPublicController {
    @Autowired
    private CourtRepository courtRepository;
    
    @Autowired
    private CourtImageRepository courtImageRepository;

    @GetMapping("/api/courts")
    public ResponseEntity<List<Court>> getAllCourtsForAllRoles() {
        // 使用 findActiveCourts 来确保 venue 信息被加载
        List<Court> courts = courtRepository.findActiveCourts();
        return ResponseEntity.ok(courts);
    }

    @GetMapping("/api/courts/{id}")
    public ResponseEntity<Court> getCourtById(@PathVariable Integer id) {
        // 使用 findActiveCourts 然后过滤来确保 venue 信息被加载
        Court court = courtRepository.findActiveCourts().stream()
                .filter(c -> c.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Court not found"));
        
        return ResponseEntity.ok(court);
    }

    @GetMapping("/api/courts/booked")
    public ResponseEntity<List<Court>> getBookedCourts() {
        // TODO: Implement logic to get courts booked by current user
        // 使用 findActiveCourts 来确保 venue 信息被加载
        List<Court> courts = courtRepository.findActiveCourts();
        return ResponseEntity.ok(courts);
    }

    @GetMapping("/api/courts/available")
    public ResponseEntity<List<Court>> getAvailableCourts(
            @RequestParam String date,
            @RequestParam String startTime,
            @RequestParam String endTime) {
        // TODO: Implement logic to get available courts for given date and time
        // 使用 findActiveCourts 来确保 venue 信息被加载
        List<Court> courts = courtRepository.findActiveCourts();
        return ResponseEntity.ok(courts);
    }
    
    // 真正的公开图片接口 - 所有人都可以访问
    @GetMapping("/api/courts/{courtId}/images")
    public ResponseEntity<List<CourtImage>> getCourtImagesPublic(@PathVariable Integer courtId) {
        List<CourtImage> images = courtImageRepository.findByCourtId(courtId);
        return ResponseEntity.ok(images);
    }
} 