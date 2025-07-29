package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.FriendlyMatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface FriendlyMatchRepository extends JpaRepository<FriendlyMatch, Integer> {
    List<FriendlyMatch> findByStatus(String status);
    List<FriendlyMatch> findByOrganizerId(Integer organizerId);
    List<FriendlyMatch> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    List<FriendlyMatch> findByIsInvitationAndStatus(boolean isInvitation, String status);
    List<FriendlyMatch> findByBookingIdAndStatusIn(Integer bookingId, List<String> statusList);
    List<FriendlyMatch> findByBookingId(Integer bookingId);
    @Query("SELECT m FROM FriendlyMatch m WHERE m.startTime < :now AND (m.status = 'OPEN' OR m.status = 'FULL')")
    List<FriendlyMatch> findAllExpired(@Param("now") LocalDateTime now);
}