package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.VenueDto;
import com.pickleball_backend.pickleball.dto.VenueWithCourtCountDto;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.service.VenueService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import com.pickleball_backend.pickleball.repository.VenueRepository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.entity.Booking;
import java.util.Set;
import java.util.ArrayList;
import java.util.stream.Collectors;
import com.pickleball_backend.pickleball.repository.BookingSlotRepository;
import com.pickleball_backend.pickleball.repository.EventRepository;
import java.util.HashSet;

@RestController
@RequestMapping("/api/admin/venues")
public class VenueController {
    @Autowired
    private VenueService venueService;
    
    @Autowired
    private VenueRepository venueRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private BookingSlotRepository bookingSlotRepository;

    @Autowired
    private EventRepository eventRepository;

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
    public ResponseEntity<List<VenueWithCourtCountDto>> getAllVenues() {
        List<Venue> venues = venueRepository.findAll();
        List<VenueWithCourtCountDto> venueDtos = venues.stream()
            .map(venue -> new VenueWithCourtCountDto(
                venue.getId(),
                venue.getName(),
                venue.getLocation(),
                venue.getState(),
                venue.getDescription(),
                venue.getIsArchived(),
                venue.getCourts().size()
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(venueDtos);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<Venue> getVenueById(@PathVariable Integer id) {
        Venue venue = venueRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venue not found with id: " + id));
        return ResponseEntity.ok(venue);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> updateVenue(@PathVariable Integer id, @RequestBody VenueDto venueDto) {
        try {
            Venue existingVenue = venueRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Venue not found with id: " + id));
            
            // Check for duplicate name and location (excluding current venue)
            List<Venue> existingVenues = venueRepository.findAll();
            boolean duplicate = existingVenues.stream()
                    .filter(v -> !v.getId().equals(id)) // Exclude current venue
                    .anyMatch(v -> v.getName().equalsIgnoreCase(venueDto.getName()) &&
                                 v.getLocation().equalsIgnoreCase(venueDto.getAddress()));
            
            if (duplicate) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Venue with the same name and location already exists");
            }
            
            // Update venue fields
            existingVenue.setName(venueDto.getName());
            existingVenue.setLocation(venueDto.getAddress());
            existingVenue.setDescription(venueDto.getDescription());
            
            Venue updatedVenue = venueRepository.save(existingVenue);
            return ResponseEntity.ok(updatedVenue);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error updating venue: " + e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> deleteVenue(@PathVariable Integer id) {
        try {
            Venue venue = venueRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Venue not found with id: " + id));
            
            // Check if venue has any courts
            if (!venue.getCourts().isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Cannot delete venue that has courts. Please delete all courts first.");
            }
            
            venueRepository.delete(venue);
            return ResponseEntity.ok("Venue deleted successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error deleting venue: " + e.getMessage());
        }
    }

    @GetMapping("/bystate")
    public ResponseEntity<List<Venue>> getVenuesByState(@RequestParam String state) {
        List<Venue> venues = venueRepository.findByState(state);
        return ResponseEntity.ok(venues);
    }

    @GetMapping("/check-availability")
    public ResponseEntity<?> checkVenueAvailability(@RequestParam Integer venueId,
                                                    @RequestParam String date,
                                                    @RequestParam String startTime,
                                                    @RequestParam String endTime,
                                                    @RequestParam int peopleCount) {
        LocalDate localDate = LocalDate.parse(date);
        LocalTime localStartTime = LocalTime.parse(startTime);
        LocalTime localEndTime = LocalTime.parse(endTime);
        List<Court> availableCourts = venueService.getAvailableCourts(venueId, localDate, localStartTime, localEndTime, peopleCount);
        int courtsNeeded = (int)Math.ceil(peopleCount / 4.0);
        if (availableCourts.size() >= courtsNeeded) {
            return ResponseEntity.ok(availableCourts);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("此場地容量不足");
        }
    }

    @GetMapping("/{venueId}/booked-dates")
    public ResponseEntity<List<String>> getBookedDates(@PathVariable Integer venueId,
                                                  @RequestParam(required = false) String startDate,
                                                  @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now();
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : start.plusYears(1);

        // 1. 查詢已被 booking 的日期
        List<LocalDate> bookedDates = bookingSlotRepository.findBookedDatesByVenueIdAndDateRange(venueId, start, end);

        // 2. 查詢該 venue 下所有 event 的日期
        List<LocalDate> eventDates = eventRepository.findEventDatesByVenueIdAndDateRange(venueId, start, end);

        // 3. 合併去重
        Set<String> allDates = new HashSet<>();
        bookedDates.forEach(d -> allDates.add(d.toString()));
        eventDates.forEach(d -> allDates.add(d.toString()));

        return ResponseEntity.ok(new ArrayList<>(allDates));
    }

    // 公共端點，供非管理員用戶使用
    @GetMapping("/public/{venueId}/booked-dates")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER', 'EVENTORGANIZER', 'COACH')")
    public ResponseEntity<List<String>> getBookedDatesPublic(@PathVariable Integer venueId,
                                                  @RequestParam(required = false) String startDate,
                                                  @RequestParam(required = false) String endDate) {
        LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now();
        LocalDate end = endDate != null ? LocalDate.parse(endDate) : start.plusYears(1);

        // 1. 查詢已被 booking 的日期
        List<LocalDate> bookedDates = bookingSlotRepository.findBookedDatesByVenueIdAndDateRange(venueId, start, end);

        // 2. 查詢該 venue 下所有 event 的日期
        List<LocalDate> eventDates = eventRepository.findEventDatesByVenueIdAndDateRange(venueId, start, end);

        // 3. 合併去重
        Set<String> allDates = new HashSet<>();
        bookedDates.forEach(d -> allDates.add(d.toString()));
        eventDates.forEach(d -> allDates.add(d.toString()));

        return ResponseEntity.ok(new ArrayList<>(allDates));
    }
}
