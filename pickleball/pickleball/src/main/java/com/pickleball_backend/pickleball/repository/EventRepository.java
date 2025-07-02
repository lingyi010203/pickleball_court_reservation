package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Integer> {

    // Find all events
    List<Event> findAll();

    // Find events by organizer
    List<Event> findByOrganizerId(Integer organizerId);

    // Find upcoming events
    List<Event> findByStartTimeAfter(LocalDateTime date);

    // Find events by location
    List<Event> findByLocationContainingIgnoreCase(String location);

    // Find events by title containing keyword
    List<Event> findByTitleContainingIgnoreCase(String keyword);
}