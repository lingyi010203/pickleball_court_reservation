package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    List<Event> findByStatus(String status);
    List<Event> findByStatusAndEligibilityContaining(String status, String tier);
    
    // New methods for browsing and filtering
    List<Event> findByEventType(String eventType);
    List<Event> findBySkillLevel(String skillLevel);
    List<Event> findByEventTypeAndStatus(String eventType, String status);
    List<Event> findBySkillLevelAndStatus(String skillLevel, String status);
    
    // Find published events by type
    List<Event> findByEventTypeAndStatusOrderByStartTimeAsc(String eventType, String status);
    
    // Find published events by skill level
    List<Event> findBySkillLevelAndStatusOrderByStartTimeAsc(String skillLevel, String status);
    
    // Find upcoming published events
    List<Event> findByStatusAndStartTimeAfterOrderByStartTimeAsc(String status, LocalDateTime date);
    
    // Complex query for filtering
    @Query("SELECT e FROM Event e WHERE " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:skillLevel IS NULL OR e.skillLevel = :skillLevel) AND " +
           "(:location IS NULL OR LOWER(e.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:startDate IS NULL OR e.startTime >= :startDate) AND " +
           "(:endDate IS NULL OR e.startTime <= :endDate) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:eligibility IS NULL OR e.eligibility LIKE CONCAT('%', :eligibility, '%')) AND " +
           "(:searchKeyword IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :searchKeyword, '%')))")
    Page<Event> findEventsWithFilters(
            @Param("eventType") String eventType,
            @Param("skillLevel") String skillLevel,
            @Param("location") String location,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("status") String status,
            @Param("eligibility") String eligibility,
            @Param("searchKeyword") String searchKeyword,
            Pageable pageable);
}