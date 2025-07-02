package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.entity.Event;
import com.pickleball_backend.pickleball.entity.EventOrganizer;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.repository.EventOrganizerRepository;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.repository.EventRegistrationRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.service.EmailService;
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

    @Override
    public Event createEvent(Event event, String organizerUsername) {
        UserAccount organizer = userAccountRepository.findByUsername(organizerUsername)
                .orElseThrow(() -> new RuntimeException("Organizer not found"));

        // Check organizer status
        if (!("ACTIVE".equals(organizer.getStatus()) ||
                "PENDING".equals(organizer.getStatus()))) {
            throw new RuntimeException("Account not active or pending approval");
        }

        // Validate event times
        if (event.getStartTime() != null && event.getEndTime() != null) {
            if (event.getStartTime().isAfter(event.getEndTime())) {
                throw new RuntimeException("Start time must be before end time");
            }
            if (event.getStartTime().isBefore(LocalDateTime.now())) {
                throw new RuntimeException("Start time cannot be in the past");
            }
        }

        event.setOrganizerId(organizer.getUser().getId());
        event.setStatus("PUBLISHED");
        Event savedEvent = eventRepository.save(event);

        // Notification logic
        String[] eligibleTiers = event.getEligibility().split(",");
        log.info("Event eligibility tiers: {}", Arrays.toString(eligibleTiers));
        
        // Clean up tier names (remove whitespace and convert to uppercase)
        List<String> cleanTierNames = Arrays.stream(eligibleTiers)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(tier -> !tier.isEmpty())
                .toList();
        
        log.info("Cleaned tier names: {}", cleanTierNames);
        
        // Find eligible users by membership tier
        List<User> eligibleUsers = userRepository.findByMembershipTierNameIn(cleanTierNames);
        log.info("Total eligible users found: {}", eligibleUsers.size());
        
        // Fallback: if no users found by membership tier, try userType
        if (eligibleUsers.isEmpty()) {
            log.info("No users found by membership tier, trying userType fallback...");
            eligibleUsers = userRepository.findByUserTypeIn(cleanTierNames);
            log.info("Fallback: {} users found by userType", eligibleUsers.size());
        }
        
        int emailsSent = 0;
        int emailsSkipped = 0;
        
        for (User user : eligibleUsers) {
            String userEmail = user.getEmail();
            String userTier = user.getMember() != null && user.getMember().getTier() != null ? 
                    user.getMember().getTier().getTierName().toString() : "NO_TIER";
            String userType = user.getUserType();
            
            log.info("Processing user: {} | Email: {} | Tier: {} | UserType: {}", 
                    user.getName(), userEmail, userTier, userType);
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                log.warn("Skipping user {} - no valid email address", user.getName());
                emailsSkipped++;
                continue;
            }
            
            try {
                emailService.sendEventNotification(userEmail, savedEvent);
                emailsSent++;
                log.info("Event notification sent successfully to: {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send event notification to {}: {}", userEmail, e.getMessage());
                emailsSkipped++;
            }
        }
        
        log.info("Event notification summary - Sent: {}, Skipped: {}, Total processed: {}", 
                emailsSent, emailsSkipped, eligibleUsers.size());

        return savedEvent;
    }

    @Override
    public Event updateEvent(Integer id, Event event, String organizerUsername, boolean notifyParticipants) {
        Optional<Event> existingOpt = eventRepository.findById(id);
        if (existingOpt.isEmpty()) {
            throw new RuntimeException("Event not found");
        }
        Event existing = existingOpt.get();

        // Get the organizer's user id
        UserAccount organizerAccount = userAccountRepository.findByUsername(organizerUsername)
            .orElseThrow(() -> new RuntimeException("Organizer not found"));
        Integer organizerId = organizerAccount.getUser().getId();

        // Check if the current user is the organizer of this event
        if (!existing.getOrganizerId().equals(organizerId)) {
            throw new RuntimeException("You are not authorized to edit this event.");
        }

        // Validate event times
        if (event.getStartTime() != null && event.getEndTime() != null) {
            if (event.getStartTime().isAfter(event.getEndTime())) {
                throw new RuntimeException("Start time must be before end time");
            }
        }
        
        // Update fields as needed
        existing.setTitle(event.getTitle());
        existing.setStartTime(event.getStartTime());
        existing.setEndTime(event.getEndTime());
        existing.setEventType(event.getEventType());
        existing.setCapacity(event.getCapacity());
        existing.setLocation(event.getLocation());
        existing.setStatus(event.getStatus());
        existing.setEligibility(event.getEligibility());
        existing.setSchedule(event.getSchedule());
        // OrganizerId should not change
        
        Event updatedEvent = eventRepository.save(existing);
        
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

        // Notification logic
        String[] eligibleTiers = event.getEligibility().split(",");
        log.info("Event eligibility tiers: {}", Arrays.toString(eligibleTiers));
        
        // Clean up tier names (remove whitespace and convert to uppercase)
        List<String> cleanTierNames = Arrays.stream(eligibleTiers)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(tier -> !tier.isEmpty())
                .toList();
        
        log.info("Cleaned tier names: {}", cleanTierNames);
        
        // Find eligible users by membership tier
        List<User> eligibleUsers = userRepository.findByMembershipTierNameIn(cleanTierNames);
        log.info("Total eligible users found: {}", eligibleUsers.size());
        
        // Fallback: if no users found by membership tier, try userType
        if (eligibleUsers.isEmpty()) {
            log.info("No users found by membership tier, trying userType fallback...");
            eligibleUsers = userRepository.findByUserTypeIn(cleanTierNames);
            log.info("Fallback: {} users found by userType", eligibleUsers.size());
        }
        
        int emailsSent = 0;
        int emailsSkipped = 0;
        
        for (User user : eligibleUsers) {
            String userEmail = user.getEmail();
            String userTier = user.getMember() != null && user.getMember().getTier() != null ? 
                    user.getMember().getTier().getTierName().toString() : "NO_TIER";
            String userType = user.getUserType();
            
            log.info("Processing user: {} | Email: {} | Tier: {} | UserType: {}", 
                    user.getName(), userEmail, userTier, userType);
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                log.warn("Skipping user {} - no valid email address", user.getName());
                emailsSkipped++;
                continue;
            }
            
            try {
                emailService.sendEventNotification(userEmail, event);
                emailsSent++;
                log.info("Event notification sent successfully to: {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send event notification to {}: {}", userEmail, e.getMessage());
                emailsSkipped++;
            }
        }
        
        log.info("Event notification summary - Sent: {}, Skipped: {}, Total processed: {}", 
                emailsSent, emailsSkipped, eligibleUsers.size());
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
        String[] eligibleTiers = event.getEligibility().split(",");
        log.info("Event cancellation - eligibility tiers: {}", Arrays.toString(eligibleTiers));
        
        // Clean up tier names (remove whitespace and convert to uppercase)
        List<String> cleanTierNames = Arrays.stream(eligibleTiers)
                .map(String::trim)
                .map(String::toUpperCase)
                .filter(tier -> !tier.isEmpty())
                .toList();
        
        log.info("Event cancellation - cleaned tier names: {}", cleanTierNames);
        
        // Find eligible users by membership tier
        List<User> eligibleUsers = userRepository.findByMembershipTierNameIn(cleanTierNames);
        log.info("Event cancellation - total eligible users found: {}", eligibleUsers.size());
        
        // Fallback: if no users found by membership tier, try userType
        if (eligibleUsers.isEmpty()) {
            log.info("Event cancellation - no users found by membership tier, trying userType fallback...");
            eligibleUsers = userRepository.findByUserTypeIn(cleanTierNames);
            log.info("Event cancellation - fallback: {} users found by userType", eligibleUsers.size());
        }
        
        int emailsSent = 0;
        int emailsSkipped = 0;
        
        for (User user : eligibleUsers) {
            String userEmail = user.getEmail();
            String userTier = user.getMember() != null && user.getMember().getTier() != null ? 
                    user.getMember().getTier().getTierName().toString() : "NO_TIER";
            String userType = user.getUserType();
            
            log.info("Event cancellation - processing user: {} | Email: {} | Tier: {} | UserType: {}", 
                    user.getName(), userEmail, userTier, userType);
            
            if (userEmail == null || userEmail.trim().isEmpty()) {
                log.warn("Event cancellation - skipping user {} - no valid email address", user.getName());
                emailsSkipped++;
                continue;
            }
            
            try {
                emailService.sendEventCancellationNotification(userEmail, event);
                emailsSent++;
                log.info("Event cancellation notification sent successfully to: {}", userEmail);
            } catch (Exception e) {
                log.error("Failed to send event cancellation notification to {}: {}", userEmail, e.getMessage());
                emailsSkipped++;
            }
        }
        
        log.info("Event cancellation notification summary - Sent: {}, Skipped: {}, Total processed: {}", 
                emailsSent, emailsSkipped, eligibleUsers.size());
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
        
        log.info("Browsing events with filters: eventType={}, skillLevel={}, location={}, status={}", 
                filterDto.getEventType(), filterDto.getSkillLevel(), filterDto.getLocation(), status);
        
        return eventRepository.findEventsWithFilters(
            filterDto.getEventType(),
            filterDto.getSkillLevel(),
            filterDto.getLocation(),
            filterDto.getStartDate(),
            filterDto.getEndDate(),
            status,
            filterDto.getEligibility(),
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
        detailDto.setLocation(event.getLocation());
        detailDto.setStatus(event.getStatus());
        detailDto.setSkillLevel(event.getSkillLevel());
        detailDto.setEligibility(event.getEligibility());
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
        
        // Check if user is eligible (based on membership tier)
        try {
            UserAccount userAccount = userAccountRepository.findByUsername(username)
                    .orElse(null);
            if (userAccount != null) {
                User user = userAccount.getUser();
                String userTier = user.getMember() != null && user.getMember().getTier() != null ? 
                        user.getMember().getTier().getTierName().toString() : "NO_TIER";
                
                detailDto.setEligible(event.getEligibility().toUpperCase().contains(userTier));
            }
        } catch (Exception e) {
            log.warn("Could not check eligibility for user {}: {}", username, e.getMessage());
            detailDto.setEligible(false);
        }
        
        return detailDto;
    }
    
    @Override
    public Page<Event> getUpcomingEvents(String username) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "startTime"));
        LocalDateTime now = LocalDateTime.now();
        
        log.info("Getting upcoming events for user: {}", username);
        
        return eventRepository.findEventsWithFilters(
            null, // eventType
            null, // skillLevel
            null, // location
            now,  // startDate (from now)
            null, // endDate
            "PUBLISHED", // status
            null, // eligibility
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
            null, // skillLevel
            null, // location
            null, // startDate
            null, // endDate
            "PUBLISHED", // status
            null, // eligibility
            null, // searchKeyword
            pageable
        );
    }
    
    @Override
    public Page<Event> getEventsBySkillLevel(String skillLevel, String username) {
        Pageable pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.ASC, "startTime"));
        
        log.info("Getting events by skill level: {} for user: {}", skillLevel, username);
        
        return eventRepository.findEventsWithFilters(
            null, // eventType
            skillLevel, // skillLevel
            null, // location
            null, // startDate
            null, // endDate
            "PUBLISHED", // status
            null, // eligibility
            null, // searchKeyword
            pageable
        );
    }
}