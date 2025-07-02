package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.EventOrganizer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface EventOrganizerRepository extends JpaRepository<EventOrganizer, Integer> {
    Optional<EventOrganizer> findByUserId(Integer userId);
}
