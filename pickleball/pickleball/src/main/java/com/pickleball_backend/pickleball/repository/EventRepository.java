package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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

    // Find events by title containing keyword
    List<Event> findByTitleContainingIgnoreCase(String keyword);

    List<Event> findByStatus(String status);
    
    // New methods for browsing and filtering
    List<Event> findByEventType(String eventType);
    List<Event> findByEventTypeAndStatus(String eventType, String status);
    
    // Find published events by type
    List<Event> findByEventTypeAndStatusOrderByStartTimeAsc(String eventType, String status);
    
    // Find upcoming published events
    List<Event> findByStatusAndStartTimeAfterOrderByStartTimeAsc(String status, LocalDateTime date);
    
    // Complex query for filtering
    @Query("SELECT e FROM Event e WHERE " +
           "(:eventType IS NULL OR e.eventType = :eventType) AND " +
           "(:startDate IS NULL OR e.startTime >= :startDate) AND " +
           "(:endDate IS NULL OR e.startTime <= :endDate) AND " +
           "(:status IS NULL OR e.status = :status) AND " +
           "(:searchKeyword IS NULL OR LOWER(e.title) LIKE LOWER(CONCAT('%', :searchKeyword, '%')))")
    Page<Event> findEventsWithFilters(
            @Param("eventType") String eventType,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("status") String status,
            @Param("searchKeyword") String searchKeyword,
            Pageable pageable);

    List<Event> findByCourts_Id(Integer courtId);
    List<Event> findByVenue_Id(Integer venueId);

    @Query("SELECT DISTINCT DATE(e.startTime) FROM Event e WHERE e.venue.id = :venueId AND e.startTime BETWEEN :start AND :end")
List<LocalDate> findEventDatesByVenueIdAndDateRange(@Param("venueId") Integer venueId,
                                                    @Param("start") LocalDate start,
                                                    @Param("end") LocalDate end);
}