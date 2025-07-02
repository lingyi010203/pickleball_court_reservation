package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.service.CoachScheduleService;
import com.pickleball_backend.pickleball.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/coach/schedule")
@RequiredArgsConstructor
public class CoachScheduleController {
    private final CoachScheduleService scheduleService;
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<List<ClassSession>> getSchedule(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        Integer coachId = userService.getCurrentUserId();
        return ResponseEntity.ok(scheduleService.getCoachSchedule(coachId, startDate, endDate));
    }

    @PostMapping
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<ClassSession> createAvailability(@RequestBody ClassSessionDto sessionDto) {
        Integer coachId = userService.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(scheduleService.createAvailability(coachId, sessionDto));
    }

    @PutMapping("/{sessionId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<ClassSession> updateSession(
            @PathVariable Integer sessionId,
            @RequestBody ClassSessionDto sessionDto
    ) {
        Integer coachId = userService.getCurrentUserId();
        return ResponseEntity.ok(scheduleService.updateSession(coachId, sessionId, sessionDto));
    }

    @DeleteMapping("/{sessionId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Void> removeSession(@PathVariable Integer sessionId) {
        Integer coachId = userService.getCurrentUserId();
        scheduleService.removeSession(coachId, sessionId);
        return ResponseEntity.noContent().build();
    }
}