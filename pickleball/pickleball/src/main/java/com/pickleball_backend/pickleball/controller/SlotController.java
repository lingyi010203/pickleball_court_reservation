package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.SlotResponseDto;
import com.pickleball_backend.pickleball.service.SlotService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/member/slots")
@RequiredArgsConstructor
public class SlotController {

    private final SlotService slotService;

    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getSlots(
            @RequestParam(name = "courtids", required = false) List<Integer> courtIds,
            @RequestParam(name = "startDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(name = "endDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        // Validation - both dates required
        if (startDate == null || endDate == null) {
            return ResponseEntity.badRequest().body("Both startDate and endDate are required");
        }

        // Validation - start date must be before end date
        if (startDate.isAfter(endDate)) {
            return ResponseEntity.badRequest().body("Start date must be before end date");
        }

        // Service call - already implemented correctly
        List<SlotResponseDto> slots = slotService.getSlots(courtIds, startDate, endDate);

        return !slots.isEmpty()
                ? ResponseEntity.ok(slots)
                : ResponseEntity.ok("No slots found for selected date range/courts");
    }

    @GetMapping("/available")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAvailableSlots(
            @RequestParam Integer courtId) {

        List<SlotResponseDto> slots = slotService.getAvailableSlotsByCourt(courtId);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/available-range")
    @PreAuthorize("hasAnyRole('USER', 'EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAvailableSlotsForRange(
            @RequestParam Integer courtId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<SlotResponseDto> slots = slotService.getAvailableSlotsByCourtAndDateRange(courtId, startDate, endDate);
        return ResponseEntity.ok(slots);
    }

    @GetMapping("/available/grouped")
    @PreAuthorize("hasAnyRole('USER', 'EVENTORGANIZER')")
    public ResponseEntity<Map<String, List<SlotResponseDto>>> getAvailableSlotsGrouped(
            @RequestParam Integer courtId) {

        List<SlotResponseDto> slots = slotService.getAvailableSlotsByCourt(courtId);

        // Group slots by date
        Map<String, List<SlotResponseDto>> groupedSlots = slots.stream()
            .collect(Collectors.groupingBy(slot -> slot.getDate().toString()));

        return ResponseEntity.ok(groupedSlots);
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('USER', 'EVENTORGANIZER')")
    public ResponseEntity<List<SlotResponseDto>> getAllSlots(
            @RequestParam Integer courtId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        LocalDate start = startDate != null ? startDate : LocalDate.now();
        LocalDate end = endDate != null ? endDate : start.plusMonths(3);
        List<SlotResponseDto> slots = slotService.getAllSlotsByCourt(courtId, start, end);
        return ResponseEntity.ok(slots);
    }

}