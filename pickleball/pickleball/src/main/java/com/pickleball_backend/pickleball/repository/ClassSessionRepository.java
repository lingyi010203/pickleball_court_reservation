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

    @Query("SELECT cs FROM ClassSession cs LEFT JOIN FETCH cs.venue LEFT JOIN FETCH cs.court c LEFT JOIN FETCH c.venue LEFT JOIN FETCH cs.registrations r LEFT JOIN FETCH r.member m LEFT JOIN FETCH m.user u LEFT JOIN FETCH u.userAccount WHERE cs.coach.id = :coachId AND cs.startTime >= :from AND cs.startTime <= :to ORDER BY cs.startTime")
    List<ClassSession> findScheduleByCoachIdAndPeriodWithVenue(@Param("coachId") Integer coachId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT DISTINCT cs FROM ClassSession cs " +
           "LEFT JOIN FETCH cs.venue " +
           "LEFT JOIN FETCH cs.court c " +
           "LEFT JOIN FETCH c.venue " +
           "LEFT JOIN FETCH cs.registrations r " +
           "LEFT JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.user u " +
           "LEFT JOIN FETCH u.userAccount " +
           "LEFT JOIN FETCH r.payment " +
           "WHERE cs.coach.id = :coachId AND cs.startTime >= :from AND cs.startTime <= :to " +
           "ORDER BY cs.startTime")
    List<ClassSession> findScheduleByCoachIdAndPeriodWithFullRegistrations(@Param("coachId") Integer coachId, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT cs FROM ClassSession cs WHERE cs.coach.id = :coachId AND cs.court.id = :courtId AND cs.slotType = 'COACH_AVAILABILITY' AND cs.status = 'AVAILABLE' ORDER BY cs.startTime")
    List<ClassSession> findAvailableSlotsByCoachAndCourt(@Param("coachId") Integer coachId, @Param("courtId") Integer courtId);

    @Query("SELECT COUNT(r) FROM ClassRegistration r WHERE r.classSession.id = :classSessionId")
    int countRegistrations(@Param("classSessionId") int classSessionId);

    List<ClassSession> findByStatus(String status);

    @Query("SELECT cs FROM ClassSession cs WHERE (:courtId IS NULL OR cs.court.id = :courtId) AND cs.status IN ('AVAILABLE', 'FULL', 'CONFIRMED') AND cs.startTime >= :start AND cs.endTime <= :end")
    List<ClassSession> findAvailableSessions(
            @Param("courtId") Integer courtId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    @Query("SELECT DISTINCT cs FROM ClassSession cs " +
           "LEFT JOIN FETCH cs.venue " +
           "LEFT JOIN FETCH cs.court c " +
           "LEFT JOIN FETCH c.venue " +
           "LEFT JOIN FETCH cs.registrations r " +
           "LEFT JOIN FETCH r.member m " +
           "LEFT JOIN FETCH m.user u " +
           "LEFT JOIN FETCH u.userAccount " +
           "WHERE (:courtId IS NULL OR cs.court.id = :courtId) AND cs.status IN ('AVAILABLE', 'FULL', 'CONFIRMED') AND cs.startTime >= :start AND cs.endTime <= :end " +
           "ORDER BY cs.startTime")
    List<ClassSession> findAvailableSessionsWithRegistrations(
            @Param("courtId") Integer courtId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end);

    List<ClassSession> findByCourtIdAndStartTimeBetween(
        Integer courtId,
        LocalDateTime start,
        LocalDateTime end
    );

    @Query("SELECT cs FROM ClassSession cs WHERE cs.status = 'AVAILABLE' AND cs.startTime > CURRENT_TIMESTAMP AND cs.currentParticipants = 0")
    List<ClassSession> findUpcomingSessionsWithoutParticipants();

    @Query("SELECT cs FROM ClassSession cs LEFT JOIN FETCH cs.court c LEFT JOIN FETCH c.venue WHERE cs.id IN :ids")
    List<ClassSession> findAllByIdWithCourt(@Param("ids") List<Integer> ids);

    List<ClassSession> findByRecurringGroupId(String recurringGroupId);

    // 查詢所有 replacement class（replacementForSessionId 不為 null）for 某教練
    List<ClassSession> findByReplacementForSessionIdNotNullAndCoachId(Integer coachId);
    
    // 查詢指定狀態和時間範圍內的課程
    List<ClassSession> findByStatusAndStartTimeBetween(String status, LocalDateTime start, LocalDateTime end);
    
    // 查詢指定時間範圍和狀態的課程（用於收入分配）
    List<ClassSession> findByStartTimeBetweenAndStatus(LocalDateTime start, LocalDateTime end, String status);
    
    // 根據教練ID查詢課程，按開始時間降序排列
    List<ClassSession> findByCoachIdOrderByStartTimeDesc(Integer coachId);
}