package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.dto.EventCreateDto;
import com.pickleball_backend.pickleball.dto.EventUpdateDto;
import com.pickleball_backend.pickleball.entity.Event;
import com.pickleball_backend.pickleball.entity.EventOrganizer;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.repository.EventOrganizerRepository;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.repository.EventRegistrationRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.service.VenueService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.time.LocalDate;
import java.time.LocalTime;

@Service
public class EventServiceImpl implements EventService {

    private static final Logger log = LoggerFactory.getLogger(EventServiceImpl.class);

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private EventOrganizerRepository eventOrganizerRepository;

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private VenueRepository venueRepository;
    @Autowired
    private VenueService venueService;

    @Override
    public Event createEvent(EventCreateDto eventDto, String organizerUsername) {
        UserAccount organizer = userAccountRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        // Check organizer status
        if (!("ACTIVE".equals(organizer.getStatus()) ||
                "PENDING".equals(organizer.getStatus()))) {
            throw new RuntimeException("Account not active or pending approval");
        }

        // Validate event times
        if (eventDto.getStartTime() != null && eventDto.getEndTime() != null) {
            if (eventDto.getStartTime().isAfter(eventDto.getEndTime())) {
                throw new RuntimeException("Start time must be before end time");
            }
            if (eventDto.getStartTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Start time cannot be in the past");
            }
        }

        Event event = new Event();
        event.setTitle(eventDto.getTitle());
        event.setStartTime(eventDto.getStartTime());
        event.setEndTime(eventDto.getEndTime());
        event.setEventType(eventDto.getEventType());
        event.setStatus(eventDto.getStatus());
        event.setSchedule(eventDto.getSchedule());
        event.setFeeAmount(eventDto.getFeeAmount());
        event.setOrganizerId(organizer.getUser().getId());
        // [全場地自動分配]：當自動分配時，會直接分配所有可用場地給活動，不再根據人數裁剪，也不檢查總容量是否足夠。
        Set<Court> courts;
        if ((eventDto.getCourtIds() == null || eventDto.getCourtIds().isEmpty()) && eventDto.getVenueId() != null && eventDto.getCapacity() != null) {
            // 自動分配 court
            LocalDate date = eventDto.getStartTime().toLocalDate();
            LocalTime startTime = eventDto.getStartTime().toLocalTime();
            LocalTime endTime = eventDto.getEndTime().toLocalTime();
            int peopleCount = eventDto.getCapacity();
            List<Court> availableCourts = venueService.getAvailableCourts(eventDto.getVenueId(), date, startTime, endTime, peopleCount);
            // 直接分配所有可用場地，不再根據人數裁剪，也不再丟出『此場地容量不足』
            courts = new java.util.HashSet<>(availableCourts);
        } else if (eventDto.getCourtIds() != null && !eventDto.getCourtIds().isEmpty()) {
            courts = new java.util.HashSet<>(courtRepository.findAllById(eventDto.getCourtIds()));
        } else {
            courts = new java.util.HashSet<>();
        }
        event.setCourts(courts);
        // capacity = courts.size() * 8 (每場8人)
        if (eventDto.getCapacity() != null) {
            event.setCapacity(eventDto.getCapacity());
        } else {
            event.setCapacity(courts.size() * 8);
        }
        // venue
        if (eventDto.getVenueId() != null) {
            Venue venue = venueRepository.findById(eventDto.getVenueId()).orElse(null);
            event.setVenue(venue);
        }
        else {
            event.setVenue(null);
        }
        event.setRegisteredCount(0);
        event.setStatus("PUBLISHED");
        Event savedEvent = eventRepository.save(event);

        // Notification logic
        List<User> allUsers = userRepository.findAll();
        int emailsSent = 0;
        int emailsSkipped = 0;
        for (User user : allUsers) {
            String userEmail = user.getEmail();
            if (userEmail == null || userEmail.trim().isEmpty()) {
                emailsSkipped++;
                continue;
            }
            try {
                emailService.sendEventNotification(userEmail, savedEvent);
                emailsSent++;
            } catch (Exception e) {
                emailsSkipped++;
            }
        }
        
        log.info("Event notification summary - Sent: {}, Skipped: {}, Total processed: {}", 
                emailsSent, emailsSkipped, allUsers.size());

        return savedEvent;
    }

    @Override
    public Event updateEvent(Integer id, EventUpdateDto eventDto, String organizerUsername, boolean notifyParticipants) {
        Optional<Event> existingOpt = eventRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }
        Event event = existingOpt.get();

        // Get the organizer's user id
        UserAccount organizerAccount = userAccountRepository.findByUsername(organizerUsername)
            .orElseThrow(() -> new RuntimeException("Organizer not found"));
        Integer organizerId = organizerAccount.getUser().getId();

        // Check if the current user is the organizer of this event
        if (!event.getOrganizerId().equals(organizerId)) {
            throw new RuntimeException("You are not authorized to edit this event.");
        }

        // Validate event times
        if (eventDto.getStartTime() != null && eventDto.getEndTime() != null) {
            if (eventDto.getStartTime().isAfter(eventDto.getEndTime())) {
                throw new RuntimeException("Start time must be before end time");
            }
        }
        
        // Update fields as needed
        event.setTitle(eventDto.getTitle());
        event.setStartTime(eventDto.getStartTime());
        event.setEndTime(eventDto.getEndTime());
        event.setEventType(eventDto.getEventType());
        event.setStatus(eventDto.getStatus());
        event.setSchedule(eventDto.getSchedule());
        event.setFeeAmount(eventDto.getFeeAmount());
        // courts
        if (eventDto.getCourtIds() != null && !eventDto.getCourtIds().isEmpty()) {
            Set<Court> courts = new java.util.HashSet<>(courtRepository.findAllById(eventDto.getCourtIds()));
            event.setCourts(courts);
            int totalCapacity = courts.size() * 8;
            event.setCapacity(totalCapacity);
        }
        // venue
        if (eventDto.getVenueId() != null) {
            Venue venue = venueRepository.findById(eventDto.getVenueId()).orElse(null);
            event.setVenue(venue);
        } else {
            event.setVenue(null);
        }
        
        Event updatedEvent = eventRepository.save(event);
        
        // Send notifications if requested
        if (notifyParticipants) {
            log.info("Sending event update notifications for event: {}", updatedEvent.getTitle());
            sendEventUpdateNotifications(updatedEvent);
        } else {
            log.info("Event updated without sending notifications: {}", updatedEvent.getTitle());
        }
        
        return updatedEvent;
    }

    @Override
    public void deleteEvent(Integer id) {
        Optional<Event> eventOpt = eventRepository.findById(id);
        if (eventOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }
        
        Event event = eventOpt.get();
        
        // Send cancellation notifications before deleting
        log.info("Sending event cancellation notifications for event: {}", event.getTitle());
        sendEventCancellationNotifications(event);
        
        eventRepository.deleteById(id);
        log.info("Event deleted successfully: {}", event.getTitle());
    }

    @Override
    public Event publishEvent(Integer id, String organizerUsername) {
        Event event = eventRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Event not found"));

        UserAccount organizer = userAccountRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        // Verify ownership
        if (!event.getOrganizerId().equals(organizer.getUser().getId())) {
            throw new RuntimeException("Not authorized to publish this event");
        }

        event.setStatus("PUBLISHED");
        eventRepository.save(event);

        // 通知所有 user
        List<User> allUsers = userRepository.findAll();
        int emailsSent = 0;
        int emailsSkipped = 0;
        for (User user : allUsers) {
            String userEmail = user.getEmail();
            if (userEmail == null || userEmail.trim().isEmpty()) {
                emailsSkipped++;
                continue;
            }
            try {
                emailService.sendEventNotification(userEmail, event);
                emailsSent++;
            } catch (Exception e) {
                emailsSkipped++;
            }
        }
        log.info("Event notification summary - Sent: {}, Skipped: {}, Total processed: {}", emailsSent, emailsSkipped, allUsers.size());
        return event;
    }
    
    /**
     * Sends event update notifications to eligible users
     */
    private void sendEventUpdateNotifications(Event event) {
        List<User> registeredUsers = eventRegistrationRepository.findUsersRegisteredForEvent(event.getId());
        log.info("Event update - total registered users found: {}", registeredUsers.size());

        int emailsSent = 0;
        int emailsSkipped = 0;

        for (User user : registeredUsers) {
            String userEmail = user.getEmail();
            if (userEmail == null || userEmail.trim().isEmpty()) {
                log.warn("Skipping user {} - no valid email address", user.getName());
                emailsSkipped++;
                continue;
            }
            try {
                emailService.sendEventUpdateNotification(userEmail, event);
                emailsSent++;
                log.info("Event update notification sent successfully to: {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send event update notification to {}: {}", userEmail, e.getMessage());
                emailsSkipped++;
            }
        }
        log.info("Event update notification summary - Sent: {}, Skipped: {}, Total processed: {}", 
                emailsSent, emailsSkipped, registeredUsers.size());
    }
    
    /**
     * Sends event cancellation notifications to eligible users
     */
    private void sendEventCancellationNotifications(Event event) {
        // Notification logic
        List<User> allUsers = userRepository.findAll();
        int emailsSent = 0;
        int emailsSkipped = 0;
        for (User user : allUsers) {
            String userEmail = user.getEmail();
            if (userEmail == null || userEmail.trim().isEmpty()) {
                emailsSkipped++;
                continue;
            }
            try {
                emailService.sendEventCancellationNotification(userEmail, event);
                emailsSent++;
            } catch (Exception e) {
                emailsSkipped++;
            }
        }
        log.info("Event cancellation notification summary - Sent: {}, Skipped: {}, Total processed: {}", emailsSent, emailsSkipped, allUsers.size());
    }
    
    // New methods for browsing events
    
    @Override
    public Page<Event> browseEvents(EventFilterDto filterDto, String username) {
        // Create pageable with sorting
        Sort sort = Sort.by(
            filterDto.getSortDirection().equalsIgnoreCase("DESC") ? 
            Sort.Direction.DESC : Sort.Direction.ASC, 
            filterDto.getSortBy()
        );
        Pageable pageable = PageRequest.of(filterDto.getPage(), filterDto.getSize(), sort);
        
        // Set default status to PUBLISHED if not specified
        String status = filterDto.getStatus() != null ? filterDto.getStatus() : "PUBLISHED";
        
        log.info("Browsing events with filters: eventType={}, location={}, status={}", 
                filterDto.getEventType(), filterDto.getLocation(), status);
        
        return eventRepository.findEventsWithFilters(
            filterDto.getEventType(),
            filterDto.getStartDate(),
            filterDto.getEndDate(),
            status,
            filterDto.getSearchKeyword(),
            pageable
        );
    }
    
    @Override
    public EventDetailDto getEventDetails(Integer eventId, String username) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        EventDetailDto detailDto = new EventDetailDto();
        detailDto.setId(event.getId());
        detailDto.setTitle(event.getTitle());
        detailDto.setStartTime(event.getStartTime());
        detailDto.setEndTime(event.getEndTime());
        detailDto.setEventType(event.getEventType());
        detailDto.setCapacity(event.getCapacity());
        detailDto.setVenueId(event.getVenue() != null ? event.getVenue().getId() : null);
        detailDto.setVenueName(event.getVenue() != null ? event.getVenue().getName() : "N/A");
        detailDto.setVenueState(event.getVenue() != null ? event.getVenue().getState() : "N/A");
        detailDto.setVenueLocation(event.getVenue() != null ? event.getVenue().getLocation() : "N/A");
        detailDto.setStatus(event.getStatus());
        detailDto.setSchedule(event.getSchedule());
        detailDto.setFeeAmount(event.getFeeAmount());
        detailDto.setOrganizerId(event.getOrganizerId());
        
        // Get organizer details
        try {
            UserAccount organizerAccount = userAccountRepository.findById(event.getOrganizerId())
                    .orElse(null);
            if (organizerAccount != null) {
                detailDto.setOrganizerName(organizerAccount.getUser().getName());
                detailDto.setOrganizerEmail(organizerAccount.getUser().getEmail());
                
                // Get organizer rating
                Optional<EventOrganizer> organizerOpt = eventOrganizerRepository.findByUserId(event.getOrganizerId());
                if (organizerOpt.isPresent()) {
                    detailDto.setOrganizerRating(organizerOpt.get().getOrganizerRating());
                }
            }
        } catch (Exception e) {
            log.warn("Could not fetch organizer details for event {}: {}", eventId, e.getMessage());
        }
        
        // Calculate time until event
        LocalDateTime now = LocalDateTime.now();
        if (event.getStartTime().isAfter(now)) {
            long days = ChronoUnit.DAYS.between(now, event.getStartTime());
            long hours = ChronoUnit.HOURS.between(now, event.getStartTime()) % 24;
            
            if (days > 0) {
                detailDto.setTimeUntilEvent(days + " day" + (days > 1 ? "s" : ""));
            } else if (hours > 0) {
                detailDto.setTimeUntilEvent(hours + " hour" + (hours > 1 ? "s" : ""));
            } else {
                detailDto.setTimeUntilEvent("Less than 1 hour");
            }
            detailDto.setUpcoming(true);
        } else {
            detailDto.setUpcoming(false);
            detailDto.setTimeUntilEvent("Event has passed");
        }
        
        return detailDto;
    }
    
    @Override
    public Page<Event> getUpcomingEvents(String username, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.ASC, "startTime"));
        LocalDateTime now = LocalDateTime.now();
        log.info("Getting upcoming events for user: {} page: {} size: {}", username, page, size);
        return eventRepository.findEventsWithFilters(
            null, // eventType
            null, // startDate
            null, // endDate
            "PUBLISHED", // status
            null, // searchKeyword
            pageable
        );
    }
    
    @Override
    public Page<Event> getEventsByType(String eventType, String username) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "startTime"));
        
        log.info("Getting events by type: {} for user: {}", eventType, username);
        
        return eventRepository.findEventsWithFilters(
            eventType, // eventType
            null, // startDate
            null, // endDate
            "PUBLISHED", // status
            null, // searchKeyword
            pageable
        );
    }
}