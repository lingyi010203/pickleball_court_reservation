package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.entity.ClassSession;
import java.time.LocalDate;
import java.util.List;

public interface CoachScheduleService {
    List<ClassSession> getCoachSchedule(Integer coachId, LocalDate startDate, LocalDate endDate);
    ClassSession createAvailability(Integer coachId, ClassSessionDto sessionDto);
    ClassSession updateSession(Integer coachId, Integer sessionId, ClassSessionDto sessionDto);
    void removeSession(Integer coachId, Integer sessionId);
}