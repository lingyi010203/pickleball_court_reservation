package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.dto.EventCreateDto;
import com.pickleball_backend.pickleball.dto.EventUpdateDto;
import com.pickleball_backend.pickleball.entity.Event;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;
    private final EventRepository eventRepository;

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
        String username = principal.getName();
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
        String username = principal.getName();
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
        String username = principal.getName();
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
        String username = principal.getName();
        Page<Event> events = eventService.getEventsByType(eventType, username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get friendly matches specifically
     */
    @GetMapping("/friendly-matches")
    public ResponseEntity<Page<Event>> getFriendlyMatches(Principal principal) {
        String username = principal.getName();
        Page<Event> events = eventService.getEventsByType("friendly match", username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get tournaments specifically
     */
    @GetMapping("/tournaments")
    public ResponseEntity<Page<Event>> getTournaments(Principal principal) {
        String username = principal.getName();
        Page<Event> events = eventService.getEventsByType("tournament", username);
        return ResponseEntity.ok(events);
    }
    
    /**
     * Get leagues specifically
     */
    @GetMapping("/leagues")
    public ResponseEntity<Page<Event>> getLeagues(Principal principal) {
        String username = principal.getName();
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
        String username = principal.getName();
        
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
}