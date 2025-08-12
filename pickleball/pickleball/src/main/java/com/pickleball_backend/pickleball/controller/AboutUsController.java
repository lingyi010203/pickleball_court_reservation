package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.AboutUsStatisticsDto;
import com.pickleball_backend.pickleball.service.AboutUsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/about-us")
@RequiredArgsConstructor
@Slf4j
public class AboutUsController {

    private final AboutUsService aboutUsService;

    @GetMapping("/statistics")
    public ResponseEntity<AboutUsStatisticsDto> getAboutUsStatistics() {
        try {
            log.info("Fetching About Us statistics");
            AboutUsStatisticsDto statistics = aboutUsService.getAboutUsStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error fetching About Us statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
