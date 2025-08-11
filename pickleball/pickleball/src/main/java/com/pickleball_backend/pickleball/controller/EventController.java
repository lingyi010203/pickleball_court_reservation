package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.dto.EventCreateDto;
import com.pickleball_backend.pickleball.dto.EventUpdateDto;
import com.pickleball_backend.pickleball.dto.SlotDto;
import com.pickleball_backend.pickleball.entity.Event;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Slot;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.SlotRepository;
import com.pickleball_backend.pickleball.repository.BookingSlotRepository;
import com.pickleball_backend.pickleball.repository.ClassSessionRepository;
import com.pickleball_backend.pickleball.service.EventService;
import com.pickleball_backend.pickleball.service.SlotService;
import com.pickleball_backend.pickleball.dto.SlotResponseDto;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRepository eventRepository;
    private final SlotService slotService;
    private final CourtRepository courtRepository;
    private final SlotRepository slotRepository;
    private final BookingSlotRepository bookingSlotRepository;
    private final ClassSessionRepository classSessionRepository;

    @PostMapping
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Event> createEvent(@Valid @RequestBody EventCreateDto eventDto, Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(eventService.createEvent(eventDto, username));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Event> updateEvent(
            @PathVariable Integer id,
            @Valid @RequestBody EventUpdateDto eventDto,
            Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(eventService.updateEvent(id, eventDto, username));
    }

    /**
     * Update event with notifications enabled
     * Use this endpoint when you want to notify participants about event changes
     * Example: PUT /api/events/1?notifyParticipants=true
     */
    @PutMapping("/{id}/notify")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Event> updateEventWithNotification(
            @PathVariable Integer id,
            @Valid @RequestBody EventUpdateDto eventDto,
            Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(eventService.updateEvent(id, eventDto, username));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Void> deleteEvent(@PathVariable Integer id) {
        eventService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Event> publishEvent(
            @PathVariable Integer id,
            Principal principal
    ) {
        String username = principal.getName();
        Event publishedEvent = eventService.publishEvent(id, username);
        return ResponseEntity.ok(publishedEvent);
    }

    // New endpoints for browsing events
    
    /**
     * Browse events with advanced filtering
     * Supports filtering by event type, skill level, location, date range, etc.
     */
    @GetMapping("/browse")
    public ResponseEntity<Page<Event>> browseEvents(
            @ModelAttribute EventFilterDto filterDto,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.browseEvents(filterDto, username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get detailed information about a specific event
     * Includes organizer details, eligibility check, and time calculations
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<EventDetailDto> getEventDetails(
            @PathVariable Integer id,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        EventDetailDto eventDetails = eventService.getEventDetails(id, username);
        return ResponseEntity.ok(eventDetails);
    }
    
    /**
     * Get all upcoming events
     */
    @GetMapping("/upcoming")
    public ResponseEntity<Page<Event>> getUpcomingEvents(
            Principal principal,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.getUpcomingEvents(username, page, size);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get events by type (tournament, league, friendly match)
     */
    @GetMapping("/type/{eventType}")
    public ResponseEntity<Page<Event>> getEventsByType(
            @PathVariable String eventType,
            Principal principal) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.getEventsByType(eventType, username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get friendly matches specifically
     */
    @GetMapping("/friendly-matches")
    public ResponseEntity<Page<Event>> getFriendlyMatches(Principal principal) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.getEventsByType("friendly match", username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get tournaments specifically
     */
    @GetMapping("/tournaments")
    public ResponseEntity<Page<Event>> getTournaments(Principal principal) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.getEventsByType("tournament", username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get leagues specifically
     */
    @GetMapping("/leagues")
    public ResponseEntity<Page<Event>> getLeagues(Principal principal) {
        String username = principal != null ? principal.getName() : null;
        Page<Event> events = eventService.getEventsByType("league", username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get available event types for filtering
     */
    @GetMapping("/types")
    public ResponseEntity<List<String>> getAvailableEventTypes() {
        List<String> eventTypes = List.of("tournament", "league", "friendly match", "workshop", "social");
        return ResponseEntity.ok(eventTypes);
    }
    
    /**
     * Get event statistics (count by type, upcoming events, etc.)
     */
    @GetMapping("/stats")
    public ResponseEntity<Object> getEventStats(Principal principal) {
        String username = principal != null ? principal.getName() : null;
        
        // Get counts for different event types
        Page<Event> tournaments = eventService.getEventsByType("tournament", username);
        Page<Event> leagues = eventService.getEventsByType("league", username);
        Page<Event> friendlyMatches = eventService.getEventsByType("friendly match", username);
        Page<Event> upcomingEvents = eventService.getUpcomingEvents(username, 0, 9);
        
        var stats = new Object() {
            public final long totalTournaments = tournaments.getTotalElements();
            public final long totalLeagues = leagues.getTotalElements();
            public final long totalFriendlyMatches = friendlyMatches.getTotalElements();
            public final long totalUpcomingEvents = upcomingEvents.getTotalElements();
        };
        
        return ResponseEntity.ok(stats);
    }

    // New endpoints for event organizer available slots
    @GetMapping("/organizer/available-slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAvailableSlotsForEventOrganizer(
            @RequestParam(required = false) Integer courtId,
            @RequestParam(required = false) String date) {
        try {
            List<SlotResponseDto> slots;
            if (courtId != null && date != null) {
                LocalDate localDate = LocalDate.parse(date);
                slots = slotService.getAvailableSlotsByCourtAndDateRange(courtId, localDate, localDate);
            } else if (courtId != null) {
                slots = slotService.getAvailableSlotsByCourt(courtId);
            } else {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/available-slots-range")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAvailableSlotsRangeForEventOrganizer(
            @RequestParam Integer courtId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        try {
            LocalDate start = LocalDate.parse(startDate);
            LocalDate end = LocalDate.parse(endDate);
            List<SlotResponseDto> slots = slotService.getAvailableSlotsByCourtAndDateRange(courtId, start, end);
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/all-slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAllSlotsForEventOrganizer(
            @RequestParam Integer courtId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            List<SlotResponseDto> slots;
            if (startDate != null && endDate != null) {
                LocalDate start = LocalDate.parse(startDate);
                LocalDate end = LocalDate.parse(endDate);
                slots = slotService.getAllSlotsByCourt(courtId, start, end);
            } else {
                LocalDate today = LocalDate.now();
                LocalDate defaultEndDate = today.plusMonths(3);
                slots = slotService.getAllSlotsByCourt(courtId, today, defaultEndDate);
            }
            return ResponseEntity.ok(slots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/time-slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<Map<String, Object>>> getTimeSlotsForEventOrganizer() {
        try {
            // Generate available time slots (hourly slots from 8 AM to 10 PM)
            List<Map<String, Object>> timeSlots = new java.util.ArrayList<>();
            for (int hour = 8; hour <= 22; hour++) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("startTime", String.format("%02d:00", hour));
                slot.put("endTime", String.format("%02d:00", hour + 1));
                slot.put("displayTime", String.format("%02d:00 - %02d:00", hour, hour + 1));
                timeSlots.add(slot);
            }
            return ResponseEntity.ok(timeSlots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/available-times")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<Map<String, String>>> getAvailableTimesForEventOrganizer(
            @RequestParam Integer courtId,
            @RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            LocalDate startOfDay = localDate.atStartOfDay().toLocalDate();
            LocalDate endOfDay = localDate.atTime(23, 59, 59).toLocalDate();
            
            List<SlotResponseDto> slots = slotService.getAvailableSlotsByCourtAndDateRange(courtId, startOfDay, endOfDay);
            
            List<Map<String, String>> busySlots = slots.stream()
                .map(slot -> Map.of(
                    "start", slot.getDate() + "T" + slot.getStartTime(),
                    "end", slot.getDate() + "T" + slot.getEndTime()
                ))
                .collect(java.util.stream.Collectors.toList());
            
            return ResponseEntity.ok(busySlots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/venue-available-slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAvailableSlotsForVenue(
            @RequestParam Integer venueId,
            @RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            List<SlotResponseDto> allSlots = slotService.getAvailableSlotsByVenueAndDate(venueId, localDate);
            return ResponseEntity.ok(allSlots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/venue-booked-dates")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<String>> getBookedDatesForVenue(
            @RequestParam Integer venueId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String state) {
        try {
            LocalDate start = startDate != null ? LocalDate.parse(startDate) : LocalDate.now();
            LocalDate end = endDate != null ? LocalDate.parse(endDate) : start.plusMonths(3);
            
            List<String> bookedDates = slotService.getBookedDatesForVenue(venueId, start, end);
            return ResponseEntity.ok(bookedDates);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/organizer/debug/slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Map<String, Object>> debugSlots(
            @RequestParam Integer venueId,
            @RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            
            // 獲取該venue下所有court的ID
            List<Court> venueCourts = courtRepository.findByVenueId(venueId);
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("venueId", venueId);
            debugInfo.put("date", date);
            debugInfo.put("totalCourts", venueCourts.size());
            
            List<Map<String, Object>> courtDebugInfo = new ArrayList<>();
            for (Court court : venueCourts) {
                Map<String, Object> courtInfo = new HashMap<>();
                courtInfo.put("courtId", court.getId());
                courtInfo.put("courtName", court.getName());
                
                // 獲取該court在指定日期的所有slots
                List<Slot> allSlots = slotRepository.findByCourtIdAndDateBetween(court.getId(), localDate, localDate);
                courtInfo.put("totalSlots", allSlots.size());
                
                // 統計不同狀態的slots
                Map<String, Long> statusCounts = allSlots.stream()
                    .collect(Collectors.groupingBy(slot -> slot.getStatus() != null ? slot.getStatus() : "NULL", Collectors.counting()));
                courtInfo.put("statusCounts", statusCounts);
                
                // 統計isAvailable的slots
                long availableCount = allSlots.stream().filter(Slot::isAvailable).count();
                courtInfo.put("availableCount", availableCount);
                
                // 檢查BookingSlot
                long bookedCount = 0;
                for (Slot slot : allSlots) {
                    if (bookingSlotRepository.existsBySlotIdAndStatus(slot.getId(), "BOOKED")) {
                        bookedCount++;
                    }
                }
                courtInfo.put("bookedCount", bookedCount);
                
                // 檢查ClassSession衝突
                List<ClassSession> classSessions = classSessionRepository.findByCourtIdAndStartTimeBetween(
                    court.getId(),
                    localDate.atStartOfDay(),
                    localDate.atTime(23, 59, 59)
                );
                courtInfo.put("classSessionsCount", classSessions.size());
                
                // 檢查Event衝突
                List<Event> events = eventRepository.findByCourtsIdAndStartTimeBetweenAndStatusNot(
                    court.getId(),
                    localDate.atStartOfDay(),
                    localDate.atTime(23, 59, 59),
                    "CANCELLED"
                );
                courtInfo.put("eventsCount", events.size());
                
                courtDebugInfo.add(courtInfo);
            }
            debugInfo.put("courts", courtDebugInfo);
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/organizer/generate-slots")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<Map<String, Object>> generateSlotsForDate(
            @RequestParam Integer venueId,
            @RequestParam String date) {
        try {
            LocalDate localDate = LocalDate.parse(date);
            
            // 獲取該venue下所有court的ID
            List<Court> venueCourts = courtRepository.findByVenueId(venueId);
            Map<String, Object> result = new HashMap<>();
            result.put("venueId", venueId);
            result.put("date", date);
            result.put("totalCourts", venueCourts.size());
            
            int totalSlotsGenerated = 0;
            List<Map<String, Object>> courtResults = new ArrayList<>();
            
            for (Court court : venueCourts) {
                Map<String, Object> courtResult = new HashMap<>();
                courtResult.put("courtId", court.getId());
                courtResult.put("courtName", court.getName());
                
                // 檢查是否已經有slots
                List<Slot> existingSlots = slotRepository.findByCourtIdAndDateBetween(court.getId(), localDate, localDate);
                if (!existingSlots.isEmpty()) {
                    courtResult.put("message", "Slots already exist for this date");
                    courtResult.put("existingSlots", existingSlots.size());
                    courtResults.add(courtResult);
                    continue;
                }
                
                // 生成slots
                List<SlotDto> slotsToCreate = new ArrayList<>();
                
                // 解析營業時間
                LocalTime opening = LocalTime.parse(court.getOpeningTime());
                LocalTime closing = LocalTime.parse(court.getClosingTime());
                
                // 生成每小時的slot
                LocalTime slotStart = opening;
                while (slotStart.isBefore(closing)) {
                    LocalTime slotEnd = slotStart.plusHours(1);
                    if (slotEnd.isAfter(closing)) {
                        break;
                    }
                    
                    SlotDto slot = new SlotDto();
                    slot.setCourtId(court.getId());
                    slot.setDate(localDate);
                    slot.setStartTime(slotStart);
                    slot.setEndTime(slotEnd);
                    slot.setAvailable(true);
                    slot.setDurationHours(1);
                    slotsToCreate.add(slot);
                    
                    slotStart = slotStart.plusHours(1);
                }
                
                // 創建slots
                slotService.createSlots(slotsToCreate);
                
                courtResult.put("slotsGenerated", slotsToCreate.size());
                courtResult.put("message", "Successfully generated slots");
                totalSlotsGenerated += slotsToCreate.size();
                
                courtResults.add(courtResult);
            }
            
            result.put("totalSlotsGenerated", totalSlotsGenerated);
            result.put("courts", courtResults);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }
}