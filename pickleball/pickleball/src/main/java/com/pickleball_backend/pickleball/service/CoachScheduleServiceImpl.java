package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CoachScheduleServiceImpl implements CoachScheduleService {
    private final ClassSessionRepository sessionRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Override
    public List<ClassSession> getCoachSchedule(Integer coachId, LocalDate startDate, LocalDate endDate) {
        return sessionRepository.findByCoachIdAndStartTimeBetween(
                coachId,
                startDate.atStartOfDay(),
                endDate.atTime(23, 59)
        );
    }

    @Override
    @Transactional
    public ClassSession createAvailability(Integer coachId, ClassSessionDto sessionDto) {
        // Validate court exists
        Court court = courtRepository.findById(sessionDto.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court", "id", sessionDto.getCourtId()));

        // Validate coach exists
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", coachId));

        // Check for time conflicts
        if (sessionRepository.existsByCourtIdAndStartTimeBetweenAndStatusNot(
                sessionDto.getCourtId(),
                sessionDto.getStartTime(),
                sessionDto.getEndTime(),
                "CANCELLED"
        )) {
            throw new ConflictException("Time slot conflicts with existing session");
        }

        ClassSession session = new ClassSession();
        session.setCoach(coach);
        session.setCourt(court);
        session.setStartTime(sessionDto.getStartTime());
        session.setEndTime(sessionDto.getEndTime());
        session.setStatus("AVAILABLE");

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public ClassSession updateSession(Integer coachId, Integer sessionId, ClassSessionDto sessionDto) { // Add coachId
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassSession", "id", sessionId));

        // Verify coach owns the session
        if (!session.getCoach().getId().equals(coachId)) {
            throw new UnauthorizedException("You don't own this session");
        }

        // Only allow updates to available sessions
        if (!"AVAILABLE".equals(session.getStatus())) {
            throw new ValidationException("Only available sessions can be modified");
        }

        session.setStartTime(sessionDto.getStartTime());
        session.setEndTime(sessionDto.getEndTime());
        session.setNote(sessionDto.getNote());

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public void removeSession(Integer coachId, Integer sessionId) { // Add coachId
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("ClassSession", "id", sessionId));

        // Verify coach owns the session
        if (!session.getCoach().getId().equals(coachId)) {
            throw new UnauthorizedException("You don't own this session");
        }

        if ("BOOKED".equals(session.getStatus())) {
            // Notify player about cancellation
            emailService.sendSessionCancellation(
                    session.getPlayer().getEmail(),
                    session.getStartTime(),
                    session.getCoach().getName()
            );
            // Refund logic would go here
        }

        sessionRepository.delete(session);
    }
}