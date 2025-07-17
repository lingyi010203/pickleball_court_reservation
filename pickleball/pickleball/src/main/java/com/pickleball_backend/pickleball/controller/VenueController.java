package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.VenueDto;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pickleball_backend.pickleball.repository.VenueRepository;

import java.util.List;

@RestController
@RequestMapping("/api/admin/venues")
public class VenueController {
    @Autowired
    private VenueService venueService;
    
    @Autowired
    private VenueRepository venueRepository;

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

    @PostMapping("/add")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public Integer addVenue(@RequestBody VenueDto venueDto) {
        Venue venue = new Venue();
        venue.setName(venueDto.getName());
        venue.setLocation(venueDto.getAddress());
        venue.setDescription(venueDto.getDescription());
        venue = venueRepository.save(venue);
        return venue.getId();
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<Venue>> getAllVenues() {
        List<Venue> venues = venueRepository.findAll();
        return ResponseEntity.ok(venues);
    }
}

