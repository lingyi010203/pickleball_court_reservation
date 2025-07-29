package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class VenuePublicController {
    @Autowired
    private VenueRepository venueRepository;

    @GetMapping("/api/venues")
    @PreAuthorize("hasAnyRole('ADMIN', 'EVENTORGANIZER', 'USER', 'COACH')")
    public ResponseEntity<List<Venue>> getAllVenuesForAllRoles() {
        List<Venue> venues = venueRepository.findAll();
        return ResponseEntity.ok(venues);
    }

    @GetMapping("/api/venues/bystate")
    @PreAuthorize("hasAnyRole('ADMIN', 'EVENTORGANIZER', 'USER', 'COACH')")
    public ResponseEntity<List<Venue>> getVenuesByState(@RequestParam String state) {
        List<Venue> venues = venueRepository.findByState(state);
        return ResponseEntity.ok(venues);
    }
} 