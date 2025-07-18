package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.ClassSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    boolean existsByCoachIdAndStartTimeBetweenAndStatusNot(
            Integer coachId,
            LocalDateTime start,
            LocalDateTime end,
            String status
    );

    boolean existsByCourtIdAndStartTimeBetweenAndStatusNot(
            Integer courtId,
            LocalDateTime start,
            LocalDateTime end,
            String status
    );

    @Query("SELECT COUNT(s) > 0 FROM ClassSession s " +
            "WHERE s.id <> :sessionId " +
            "AND s.court.id = :courtId " +
            "AND s.status <> 'CANCELLED' " +
            "AND ((s.startTime < :endTime AND s.endTime > :startTime))")
    boolean existsConflictForUpdate(
            @Param("sessionId") Integer sessionId,
            @Param("courtId") Integer courtId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    // 查詢某個教練的所有課程（可加上狀態、時間區間等條件）
    @Query("SELECT cs FROM ClassSession cs WHERE cs.coach.id = :coachId ORDER BY cs.startTime")
    List<ClassSession> findScheduleByCoachId(@Param("coachId") Integer coachId);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.coach.id = :coachId AND cs.startTime >= :from AND cs.endTime <= :to ORDER BY cs.startTime")
    List<ClassSession> findScheduleByCoachIdAndPeriod(@Param("coachId") Integer coachId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.coach.id = :coachId AND cs.court.id = :courtId AND cs.slotType = 'COACH_AVAILABILITY' AND cs.status = 'AVAILABLE' ORDER BY cs.startTime")
    List<ClassSession> findAvailableSlotsByCoachAndCourt(@Param("coachId") Integer coachId, @Param("courtId") Integer courtId);
}