package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CourtPublicController {
    @Autowired
    private CourtRepository courtRepository;

    @GetMapping("/api/courts")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'EVENTORGANIZER', 'COACH')")
    public ResponseEntity<List<Court>> getAllCourtsForAllRoles() {
        List<Court> courts = courtRepository.findAll();
        return ResponseEntity.ok(courts);
    }
} 