package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.FriendlyMatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface FriendlyMatchRepository extends JpaRepository<FriendlyMatch, Integer> {
    List<FriendlyMatch> findByStatus(String status);
    List<FriendlyMatch> findByOrganizerId(Integer organizerId);
    List<FriendlyMatch> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
}