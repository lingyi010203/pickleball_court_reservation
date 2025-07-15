package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.VenueDto;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/venues")
public class VenueController {
    @Autowired
    private VenueService venueService;

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> createVenue(@RequestBody VenueDto venueDto) {
        try {
            Venue venue = venueService.createVenue(venueDto);
            return new ResponseEntity<>(venue, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error creating venue");
        }
    }
}

