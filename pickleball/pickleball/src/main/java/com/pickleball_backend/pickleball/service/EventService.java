package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.data.domain.Page;

public interface EventService {
    Event createEvent(Event event, String organizerUsername);
    Event updateEvent(Integer id, Event event, String organizerUsername, boolean notifyParticipants);
    void deleteEvent(Integer id);
    Event publishEvent(Integer id, String organizerUsername);
    
    // New methods for browsing events
    Page<Event> browseEvents(EventFilterDto filterDto, String username);
    EventDetailDto getEventDetails(Integer eventId, String username);
    Page<Event> getUpcomingEvents(String username);
    Page<Event> getEventsByType(String eventType, String username);
    Page<Event> getEventsBySkillLevel(String skillLevel, String username);
}
