package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventDetailDto;
import com.pickleball_backend.pickleball.dto.EventFilterDto;
import com.pickleball_backend.pickleball.dto.EventCreateDto;
import com.pickleball_backend.pickleball.dto.EventUpdateDto;
import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.data.domain.Page;

public interface EventService {
    Event createEvent(EventCreateDto eventDto, String organizerUsername);
    Event updateEvent(Integer id, EventUpdateDto eventDto, String organizerUsername, boolean notifyParticipants);
    void deleteEvent(Integer id);
    Event publishEvent(Integer id, String organizerUsername);
    
    // New methods for browsing events
    Page<Event> browseEvents(EventFilterDto filterDto, String username);
    EventDetailDto getEventDetails(Integer eventId, String username);
    Page<Event> getUpcomingEvents(String username, int page, int size);
    Page<Event> getEventsByType(String eventType, String username);
}
