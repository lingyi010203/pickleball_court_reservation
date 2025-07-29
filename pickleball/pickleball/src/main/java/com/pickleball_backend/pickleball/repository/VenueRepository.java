package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface VenueRepository extends JpaRepository<Venue, Integer> {
    // boolean existsByNameAndLocation(String name, String location);

    // Find all venues for a given coach
    // @Query("SELECT v FROM Venue v JOIN v.coaches c WHERE c.id = :coachId")
    // List<Venue> findByCoachId(@Param("coachId") Integer coachId);

    // @Query("SELECT c FROM Court c JOIN c.venue v WHERE v.id IN (SELECT v.id FROM Venue v JOIN v.coaches c WHERE c.id = :coachId)")
    // List<Court> findCourtsByCoachId(@Param("coachId") Integer coachId);

    @Query("SELECT v FROM Venue v WHERE v.state = :state")
    List<Venue> findByState(@Param("state") String state);
    
    // 新增：查找所有場地
    @Query("SELECT v FROM Venue v ORDER BY v.name")
    List<Venue> findAllVenues();
    
    // 新增：根據州查找場地
    @Query("SELECT v FROM Venue v WHERE v.state = :state ORDER BY v.name")
    List<Venue> findVenuesByState(@Param("state") String state);
}