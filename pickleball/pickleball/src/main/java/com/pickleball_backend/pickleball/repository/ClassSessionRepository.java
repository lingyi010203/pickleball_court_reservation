package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ClassSessionRepository extends JpaRepository<ClassSession, Integer> {
    List<ClassSession> findByCoachIdAndStartTimeBetween(
            Integer coachId,
            LocalDateTime start,
            LocalDateTime end
    );

    List<ClassSession> findByCourtIdAndStartTimeBetween(
            Integer courtId,
            LocalDateTime start,
            LocalDateTime end
    );

    boolean existsByCourtIdAndStartTimeBetweenAndStatusNot(
            Integer courtId,
            LocalDateTime start,
            LocalDateTime end,
            String status
    );
}