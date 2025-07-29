package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.Court;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import com.pickleball_backend.pickleball.entity.Venue;

public interface CourtRepository extends JpaRepository<Court, Integer> {
    boolean existsByNameAndLocation(String name, String location);
    List<Court> findByIsArchivedFalseOrIsArchivedIsNull();
    List<Court> findAll();
    @Query("SELECT c FROM Court c WHERE c.isArchived = false OR c.isArchived IS NULL")
    List<Court> findActiveCourts();
    // Add this new method
    Optional<Court> findById(Integer id);

    @Modifying
    @Query("UPDATE Court c SET c.isArchived = true, c.archiveTimestamp = :timestamp WHERE c.id = :id")
    void softDeleteCourt(@Param("id") Integer id, @Param("timestamp") LocalDateTime timestamp);

    @Query("SELECT DISTINCT cs.court FROM ClassSession cs WHERE cs.coach.id = :coachId")
    List<Court> findCourtsByCoachId(@Param("coachId") Integer coachId);

    List<Court> findByVenueIn(Set<Venue> venues);
    
    // 新增：根據場地ID查找球場
    List<Court> findByVenueId(Integer venueId);
    
    // 新增：查找所有可用的球場
    @Query("SELECT c FROM Court c WHERE c.isArchived = false OR c.isArchived IS NULL")
    List<Court> findAvailableCourts();
}