package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.SlotDto;
import com.pickleball_backend.pickleball.dto.SlotResponseDto;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Slot;

import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.SlotRepository;
import com.pickleball_backend.pickleball.repository.ClassSessionRepository;
import com.pickleball_backend.pickleball.repository.BookingSlotRepository; // 新增：檢查預訂狀態

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SlotServiceImpl implements SlotService {

    private final SlotRepository slotRepository;
    private final CourtRepository courtRepository;
    private final ClassSessionRepository classSessionRepository;
    private final BookingSlotRepository bookingSlotRepository; // 新增：檢查預訂狀態

    @Override
    public List<SlotResponseDto> getSlots(List<Integer> courtIds, LocalDate startDate, LocalDate endDate) {
        List<Slot> slots;

        if (courtIds == null || courtIds.isEmpty()) {
            slots = slotRepository.findByDateBetween(startDate, endDate);
        } else {
            slots = new ArrayList<>();
            for (Integer courtId : courtIds) {
                slots.addAll(slotRepository.findByCourtIdAndDateBetween(courtId, startDate, endDate));
            }
        }

        if (slots.isEmpty()) {
            return Collections.emptyList();
        }

        // Get court details in bulk
        Set<Integer> courtIdsInSlots = slots.stream()
                .map(Slot::getCourtId)
                .collect(Collectors.toSet());

        Map<Integer, Court> courts = courtIdsInSlots.isEmpty()
                ? Collections.emptyMap()
                : courtRepository.findAllById(courtIdsInSlots).stream()
                .collect(Collectors.toMap(Court::getId, court -> court));

        return slots.stream().map(slot -> {
            SlotResponseDto dto = new SlotResponseDto();
            dto.setId(slot.getId());
            dto.setCourtId(slot.getCourtId());
            dto.setDate(slot.getDate());
            dto.setStartTime(slot.getStartTime());
            dto.setEndTime(slot.getEndTime());

            // 动态计算持续时间
            dto.setDurationHours(calculateDurationHours(slot));

            Court court = courts.get(slot.getCourtId());
            if (court != null) {
                dto.setCourtName(court.getName());
                dto.setCourtLocation(court.getLocation());
                dto.setStatus(determineSlotStatus(slot, court));
            } else {
                dto.setStatus("UNKNOWN");
            }

            return dto;
        }).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void createSlots(List<SlotDto> slotDtos) {
        System.out.println("==> createSlots called with " + slotDtos.size() + " slots");
        
        slotDtos.forEach(dto -> {
            if (dto.getStartTime() == null) {
                throw new ValidationException("Start time is required for slot creation");
            }
            if (dto.getEndTime() == null) {
                throw new ValidationException("End time is required for slot creation");
            }

            Slot slot = new Slot();
            slot.setCourtId(dto.getCourtId());
            slot.setDate(dto.getDate());
            slot.setStartTime(dto.getStartTime());
            slot.setEndTime(dto.getEndTime());
            slot.setAvailable(dto.isAvailable());
            slot.setStatus("AVAILABLE"); // 确保新创建的slots状态为AVAILABLE

            // 设置持续时间（如果提供）
            if (dto.getDurationHours() != null) {
                slot.setDurationHours(dto.getDurationHours());
            }

            Slot savedSlot = slotRepository.save(slot);
            System.out.println("==> Created slot: ID=" + savedSlot.getId() + 
                ", Date=" + savedSlot.getDate() + 
                ", Time=" + savedSlot.getStartTime() + "-" + savedSlot.getEndTime() + 
                ", Status=" + savedSlot.getStatus() + 
                ", Available=" + savedSlot.isAvailable());
        });
        
        System.out.println("==> All slots created successfully");
    }

    @Override
    public List<SlotResponseDto> getAvailableSlotsByCourt(Integer courtId) {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusMonths(3); // Next 3 months

        Court court = courtRepository.findById(courtId)
                .orElseThrow(() -> new ResourceNotFoundException("Court not found with id: " + courtId));

        // 查找所有slots，包括isAvailable=false的，然后过滤掉PENDING状态的
        List<Slot> allSlots = slotRepository.findByCourtIdAndDateBetween(courtId, today, endDate);
        List<Slot> slots = allSlots.stream()
            .filter(slot -> !"PENDING".equals(slot.getStatus()))
            .collect(Collectors.toList());
        
        System.out.println("=== getAvailableSlotsByCourt Debug ===");
        System.out.println("Court ID: " + courtId);
        System.out.println("Total slots found: " + allSlots.size());
        System.out.println("Slots after PENDING filter: " + slots.size());
        
        // 显示被过滤掉的PENDING slots
        List<Slot> pendingSlots = allSlots.stream()
            .filter(slot -> "PENDING".equals(slot.getStatus()))
            .collect(Collectors.toList());
        
        if (!pendingSlots.isEmpty()) {
            System.out.println("PENDING slots found:");
            for (Slot slot : pendingSlots) {
                System.out.println("  - Slot ID: " + slot.getId() + 
                    ", Date: " + slot.getDate() + 
                    ", Time: " + slot.getStartTime() + "-" + slot.getEndTime() + 
                    ", Status: " + slot.getStatus());
            }
        }
        
        // 显示SPECIAL_CIRCUMSTANCE slots
        List<Slot> specialSlots = allSlots.stream()
            .filter(slot -> "SPECIAL_CIRCUMSTANCE".equals(slot.getStatus()))
            .collect(Collectors.toList());
        
        if (!specialSlots.isEmpty()) {
            System.out.println("SPECIAL_CIRCUMSTANCE slots found:");
            for (Slot slot : specialSlots) {
                System.out.println("  - Slot ID: " + slot.getId() + 
                    ", Date: " + slot.getDate() + 
                    ", Time: " + slot.getStartTime() + "-" + slot.getEndTime() + 
                    ", Status: " + slot.getStatus() + " (Booked but outside new operating days)");
            }
        }
        System.out.println("=== End Debug ===");

        // 查詢所有未取消的 class session
        final List<com.pickleball_backend.pickleball.entity.ClassSession> filteredSessions = classSessionRepository.findByCourtIdAndStartTimeBetween(
            courtId,
            today.atStartOfDay(),
            endDate.atTime(23, 59, 59)
        ).stream().filter(s -> !"CANCELLED".equalsIgnoreCase(s.getStatus())).toList();

        System.out.println("=== Filtering slots ===");
        System.out.println("Total slots to filter: " + slots.size());
        System.out.println("Class sessions found: " + filteredSessions.size());
        
        List<SlotResponseDto> availableSlots = slots.stream().filter(slot -> {
            LocalDateTime slotStart = LocalDateTime.of(slot.getDate(), slot.getStartTime());
            LocalDateTime slotEnd = LocalDateTime.of(slot.getDate(), slot.getEndTime());
            
            // 只要有任何 class session 時間重疊，該 slot 就不能預約
            boolean overlap = filteredSessions.stream().anyMatch(s ->
                slotStart.isBefore(s.getEndTime()) && slotEnd.isAfter(s.getStartTime())
            );
            
            // 檢查是否有已預訂的 BookingSlot
            boolean isBooked = bookingSlotRepository.existsBySlotIdAndStatus(slot.getId(), "BOOKED");
            
            if (overlap) {
                System.out.println("Slot " + slot.getId() + " overlaps with class session");
            }
            if (isBooked) {
                System.out.println("Slot " + slot.getId() + " is booked");
            }
            
            boolean isAvailable = !overlap && !isBooked;
            if (isAvailable) {
                System.out.println("Slot " + slot.getId() + " is available: " + slot.getDate() + " " + slot.getStartTime() + "-" + slot.getEndTime());
            }
            
            return isAvailable; // 只有沒有課程重疊且未預訂的時段才可用
        }).map(slot -> {
            SlotResponseDto dto = new SlotResponseDto();
            dto.setId(slot.getId());
            dto.setCourtId(slot.getCourtId());
            dto.setDate(slot.getDate());
            dto.setStartTime(slot.getStartTime());
            dto.setEndTime(slot.getEndTime());
            dto.setStatus("AVAILABLE");
            dto.setDurationHours(calculateDurationHours(slot));
            dto.setCourtName(court.getName());
            dto.setCourtLocation(court.getLocation());
            return dto;
        }).collect(Collectors.toList());
        
        System.out.println("=== Final result ===");
        System.out.println("Available slots: " + availableSlots.size());
        return availableSlots;
    }

    public List<SlotResponseDto> getAllSlotsByCourt(Integer courtId, LocalDate startDate, LocalDate endDate) {
        Court court = courtRepository.findById(courtId)
            .orElseThrow(() -> new ResourceNotFoundException("Court not found with id: " + courtId));

        List<Slot> slots = slotRepository.findByCourtIdAndDateBetween(courtId, startDate, endDate);

        return slots.stream().map(slot -> {
            SlotResponseDto dto = new SlotResponseDto();
            dto.setId(slot.getId());
            dto.setCourtId(slot.getCourtId());
            dto.setDate(slot.getDate());
            dto.setStartTime(slot.getStartTime());
            dto.setEndTime(slot.getEndTime());
            dto.setDurationHours(slot.getDurationHours());
            dto.setCourtName(court.getName());
            dto.setCourtLocation(court.getLocation());
            
            // 檢查是否有已預訂的 BookingSlot
            boolean isBooked = bookingSlotRepository.existsBySlotIdAndStatus(slot.getId(), "BOOKED");
            dto.setStatus(isBooked ? "BOOKED" : (slot.isAvailable() ? "AVAILABLE" : "UNAVAILABLE"));
            
            return dto;
        }).collect(Collectors.toList());
    }

    private int calculateDurationHours(Slot slot) {
        if (slot.getDurationHours() != null) {
            return slot.getDurationHours();
        }

        LocalTime start = slot.getStartTime();
        LocalTime end = slot.getEndTime();

        long hours = Duration.between(start, end).toHours();

        if (hours < 0) {
            hours = 24 + hours;
        }

        return (int) hours;
    }

    private String determineSlotStatus(Slot slot, Court court) {
        if (!slot.isAvailable()) {
            return "BOOKED";
        }
        if ("MAINTENANCE".equals(court.getStatus())) {
            return "MAINTENANCE";
        }
        if (!isOperatingDay(slot, court)) {
            return "CLOSED";
        }
        if (!isDuringOperatingHours(slot, court)) {
            return "CLOSED";
        }
        return "AVAILABLE";
    }

    private boolean isOperatingDay(Slot slot, Court court) {
        if (court.getOperatingDays() == null) return false;

        DayOfWeek slotDay = slot.getDate().getDayOfWeek();
        String[] operatingDays = court.getOperatingDays().split(",");

        for (String day : operatingDays) {
            try {
                DayOfWeek courtDay = DayOfWeek.valueOf(day.trim().toUpperCase());
                if (courtDay == slotDay) {
                    return true;
                }
            } catch (IllegalArgumentException ignored) {
                // 忽略无效日期格式
            }
        }
        return false;
    }

    private boolean isDuringOperatingHours(Slot slot, Court court) {
        try {
            LocalTime opening = LocalTime.parse(court.getOpeningTime());
            LocalTime closing = LocalTime.parse(court.getClosingTime());
            return !slot.getStartTime().isBefore(opening) &&
                    !slot.getEndTime().isAfter(closing);
        } catch (Exception e) {
            return false;
        }
    }

}