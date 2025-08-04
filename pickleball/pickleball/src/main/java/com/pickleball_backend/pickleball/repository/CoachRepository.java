package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Coach;
import com.pickleball_backend.pickleball.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface CoachRepository extends JpaRepository<Coach, Integer> {
    // Find all coaches for a given venue
    @Query("SELECT c FROM Coach c JOIN c.venues v WHERE v.id = :venueId")
    List<Coach> findByVenueId(@Param("venueId") Integer venueId);
} 