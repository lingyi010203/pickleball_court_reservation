package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.CoachSlotDto;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.service.CoachCourtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/coach/schedule")
public class CoachScheduleController {

    private final CoachCourtService coachCourtService;

    public CoachScheduleController(CoachCourtService coachCourtService) {
        this.coachCourtService = coachCourtService;
    }

    @GetMapping("/courts")
    public ResponseEntity<List<Court>> getAvailableCourtsForCoach(@RequestParam Integer coachId) {
        List<Court> courts = coachCourtService.getAvailableCourtsForCoach(coachId);
        return ResponseEntity.ok(courts);
    }

    @PostMapping("/slots")
    public ResponseEntity<ClassSession> addAvailabilitySlot(
            @RequestParam Integer coachId,
            @RequestBody CoachSlotDto slotDto) {
        ClassSession newSlot = coachCourtService.createCoachSlot(coachId, slotDto);
        return ResponseEntity.status(HttpStatus.CREATED).body(newSlot);
    }

    @PutMapping("/slots/{slotId}")
    public ResponseEntity<Void> updateAvailabilitySlot(
            @PathVariable Integer slotId,
            @RequestParam Integer coachId,
            @RequestBody CoachSlotDto slotDto) {
        coachCourtService.updateCoachSlot(coachId, slotId, slotDto);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/slots/{slotId}")
    public ResponseEntity<Void> removeAvailabilitySlot(
            @PathVariable Integer slotId,
            @RequestParam Integer coachId,
            @RequestParam(required = false, defaultValue = "false") boolean forceRemove) {
        coachCourtService.removeCoachSlot(coachId, slotId, forceRemove);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/coach/{coachId}/schedule")
    public List<ClassSession> getCoachSchedule(
            @PathVariable Integer coachId,
            @RequestParam LocalDateTime from,
            @RequestParam LocalDateTime to) {
        return coachCourtService.findScheduleByCoachIdAndPeriod(coachId, from, to);
    }

    @GetMapping("/coach/{coachId}/court/{courtId}/available-slots")
    public List<ClassSession> getAvailableSlotsByCoachAndCourt(
            @PathVariable Integer coachId,
            @PathVariable Integer courtId) {
        return coachCourtService.findAvailableSlotsByCoachAndCourt(coachId, courtId);
    }
}