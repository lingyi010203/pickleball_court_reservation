package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CoachSlotDto;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.exception.ConflictException;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto;

public interface CoachCourtService {
    List<Court> getAvailableCourtsForCoach(Integer coachId);
    ClassSession createCoachSlot(Integer coachId, CoachSlotDto slotDto) throws ConflictException;
    void updateCoachSlot(Integer coachId, Integer sessionId, CoachSlotDto slotDto) throws ResourceNotFoundException;
    void removeCoachSlot(Integer coachId, Integer sessionId, boolean forceRemove) throws ResourceNotFoundException;
    List<ClassSession> findScheduleByCoachIdAndPeriod(Integer coachId, LocalDateTime from, LocalDateTime to);
    List<ClassSession> findAvailableSlotsByCoachAndCourt(Integer coachId, Integer courtId);
    void createRecurringClass(Integer coachId, RecurringSessionRequestDto dto);
    List<ClassSession> findScheduleByCoachIdAndPeriodWithVenue(Integer coachId, LocalDateTime from, LocalDateTime to);
    List<Object[]> getAllStudentsForCoach(Integer coachId);
    void updateSlotAllowReplacement(Integer coachId, Integer sessionId, Boolean allowReplacement);
    List<ClassSession> getReplacementSessionsByCoach(Integer coachId);
}