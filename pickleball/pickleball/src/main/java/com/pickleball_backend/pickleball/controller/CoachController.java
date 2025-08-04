package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.CoachSlotDto;
import com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.service.CoachCourtService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.time.LocalDate;
import org.springframework.transaction.annotation.Transactional;
import java.time.OffsetDateTime;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Page;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.entity.WalletTransaction;

@RestController
@RequestMapping("/api/coach")
@RequiredArgsConstructor
public class CoachController {

    private final CoachCourtService coachCourtService;
    private final UserRepository userRepository;
    private final VenueRepository venueRepository;
    private final CoachRepository coachRepository;
    private final ClassSessionRepository sessionRepository;
    private final CourtRepository courtRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final MemberRepository memberRepository;

    // 獲取教練可用的球場
    @GetMapping("/available-courts")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getAvailableCourts() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            return ResponseEntity.ok(coachCourtService.getAvailableCourtsForCoach(coach.getId()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving courts");
        }
    }

    // 建立教練可用時段（需包含 experienceYear）
    @PostMapping("/slots")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> createCoachSlot(@RequestBody CoachSlotDto slotDto) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            ClassSession session = coachCourtService.createCoachSlot(coach.getId(), slotDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(session);
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating slot");
        }
    }

    // 更新教練可用時段（需包含 experienceYear）
    @PutMapping("/slots/{slotId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> updateCoachSlot(
            @PathVariable Integer slotId,
            @RequestBody CoachSlotDto slotDto) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            coachCourtService.updateCoachSlot(coach.getId(), slotId, slotDto);
            return ResponseEntity.ok("Slot updated successfully");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ValidationException | ConflictException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error updating slot");
        }
    }

    // 刪除教練時段
    @DeleteMapping("/slots/{slotId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> removeCoachSlot(
            @PathVariable Integer slotId,
            @RequestParam(required = false, defaultValue = "false") boolean force) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            coachCourtService.removeCoachSlot(coach.getId(), slotId, force);
            return ResponseEntity.ok("Slot cancelled successfully");
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (ConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error removing slot");
        }
    }

    // 獲取教練排程
    @GetMapping("/schedule")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachSchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 新增防呆
            if (coach == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Coach not found for user: " + username);
            }

            LocalDateTime from = start != null ? start.toLocalDateTime() : LocalDateTime.now();
            LocalDateTime to = end != null ? end.toLocalDateTime() : from.plusMonths(1);

            // 獲取課程數據
            List<ClassSession> sessions = coachCourtService.findScheduleByCoachIdAndPeriodWithVenue(
                    coach.getId(), from, to
            );

            // 轉換為 DTO 確保場地信息正確傳遞
            List<Map<String, Object>> sessionDtos = sessions.stream().map(session -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", session.getId());
                dto.put("title", session.getTitle());
                dto.put("startTime", session.getStartTime());
                dto.put("endTime", session.getEndTime());
                dto.put("status", session.getStatus());
                dto.put("maxParticipants", session.getMaxParticipants());
                dto.put("currentParticipants", session.getCurrentParticipants());
                dto.put("description", session.getDescription());
                dto.put("price", session.getPrice());
                dto.put("slotType", session.getSlotType());
                dto.put("recurringGroupId", session.getRecurringGroupId());
                dto.put("isRecurring", session.getIsRecurring());
                dto.put("recurrencePattern", session.getRecurrencePattern());
                dto.put("recurrenceDays", session.getRecurrenceDays());
                dto.put("recurrenceEndDate", session.getRecurrenceEndDate());

                // 場地信息
                if (session.getCourt() != null) {
                    dto.put("courtId", session.getCourt().getId());
                    dto.put("courtName", session.getCourt().getName());
                    dto.put("court", session.getCourt());
                }

                // 場館信息 - 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
                Venue venue = session.getVenue();
                if (venue == null && session.getCourt() != null) {
                    venue = session.getCourt().getVenue();
                }
                if (venue != null) {
                    dto.put("venueId", venue.getId());
                    dto.put("venueName", venue.getName());
                    dto.put("venueState", venue.getState());
                    dto.put("venue", venue);
                }

                return dto;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(sessionDtos);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving schedule: " + e.getMessage());
        }
    }

    // 新增：獲取教練排程（包含完整註冊信息）
    @GetMapping("/schedule-with-registrations")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachScheduleWithRegistrations(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime end) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            LocalDateTime from = start != null ? start.toLocalDateTime() : LocalDateTime.now();
            LocalDateTime to = end != null ? end.toLocalDateTime() : from.plusMonths(1);

            // 獲取課程並手動加載註冊信息
            List<ClassSession> sessions = sessionRepository.findScheduleByCoachIdAndPeriodWithFullRegistrations(
                    coach.getId(), from, to
            );

            return ResponseEntity.ok(sessions);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving schedule: " + e.getMessage());
        }
    }

    // 新增：測試端點來檢查課程數據
    @GetMapping("/debug/sessions")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getDebugSessions() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取所有課程
            List<ClassSession> allSessions = sessionRepository.findAll();
            
            // 獲取該教練的課程
            List<ClassSession> coachSessions = sessionRepository.findScheduleByCoachId(coach.getId());
            
            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("totalSessions", allSessions.size());
            debugInfo.put("coachSessions", coachSessions.size());
            debugInfo.put("coachId", coach.getId());
            debugInfo.put("username", username);
            debugInfo.put("coachSessionsList", coachSessions);
            
            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // 新增：調試端點來檢查課程的原始數據
    @GetMapping("/debug/sessions-raw")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getDebugSessionsRaw() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取原始數據
            List<ClassSession> sessions = sessionRepository.findScheduleByCoachIdAndPeriodWithVenue(
                    coach.getId(), LocalDateTime.now().minusDays(30), LocalDateTime.now().plusDays(30)
            );

            // 手動構建詳細的調試信息
            List<Map<String, Object>> debugInfo = sessions.stream().map(session -> {
                Map<String, Object> info = new HashMap<>();
                info.put("sessionId", session.getId());
                info.put("title", session.getTitle());
                info.put("startTime", session.getStartTime());

                // Court 信息
                if (session.getCourt() != null) {
                    Map<String, Object> courtInfo = new HashMap<>();
                    courtInfo.put("courtId", session.getCourt().getId());
                    courtInfo.put("courtName", session.getCourt().getName());
                    courtInfo.put("courtLocation", session.getCourt().getLocation());

                    // Venue 信息（通過 court）
                    if (session.getCourt().getVenue() != null) {
                        Map<String, Object> venueInfo = new HashMap<>();
                        venueInfo.put("venueId", session.getCourt().getVenue().getId());
                        venueInfo.put("venueName", session.getCourt().getVenue().getName());
                        venueInfo.put("venueState", session.getCourt().getVenue().getState());
                        venueInfo.put("venueLocation", session.getCourt().getVenue().getLocation());
                        courtInfo.put("venue", venueInfo);
                    } else {
                        courtInfo.put("venue", "NULL");
                    }

                    info.put("court", courtInfo);
                } else {
                    info.put("court", "NULL");
                }

                // 直接關聯的 Venue 信息
                if (session.getVenue() != null) {
                    Map<String, Object> directVenueInfo = new HashMap<>();
                    directVenueInfo.put("venueId", session.getVenue().getId());
                    directVenueInfo.put("venueName", session.getVenue().getName());
                    directVenueInfo.put("venueState", session.getVenue().getState());
                    directVenueInfo.put("venueLocation", session.getVenue().getLocation());
                    info.put("directVenue", directVenueInfo);
                } else {
                    info.put("directVenue", "NULL");
                }

                return info;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(debugInfo);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving debug info: " + e.getMessage());
        }
    }

    // 新增：檢查特定 court 的詳細信息
    @GetMapping("/debug/court/{courtId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getDebugCourt(@PathVariable Integer courtId) {
        try {
            // 查找 court
            Court court = courtRepository.findById(courtId).orElse(null);

            Map<String, Object> debugInfo = new HashMap<>();
            debugInfo.put("courtId", courtId);

            if (court != null) {
                debugInfo.put("courtExists", true);
                debugInfo.put("courtName", court.getName());
                debugInfo.put("courtLocation", court.getLocation());
                debugInfo.put("courtStatus", court.getStatus());

                // 檢查 venue 信息
                Venue venue = court.getVenue();
                if (venue != null) {
                    debugInfo.put("venueExists", true);
                    debugInfo.put("venueId", venue.getId());
                    debugInfo.put("venueName", venue.getName());
                    debugInfo.put("venueState", venue.getState());
                    debugInfo.put("venueLocation", venue.getLocation());
                } else {
                    debugInfo.put("venueExists", false);
                }
            } else {
                debugInfo.put("courtExists", false);
            }

            return ResponseEntity.ok(debugInfo);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    // Get all venues for the current coach
    @GetMapping("/venues")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachVenues() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coachUser = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));
            Integer coachId = coachUser.getId();
            Coach coach = coachRepository.findById(coachId).orElseThrow(() -> new ResourceNotFoundException("Coach not found"));
            Set<Venue> venues = coach.getVenues();
            return ResponseEntity.ok(venues != null ? venues : new HashSet<>());
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving venues: " + e.getMessage());
        }
    }

    // Get public available coaching sessions for all users
    @GetMapping("/public/sessions")
    public ResponseEntity<?> getPublicCoachingSessions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        try {
            LocalDateTime from = start != null ? start : LocalDateTime.now();
            LocalDateTime to = end != null ? end : from.plusMonths(1);

            // Get all available coaching sessions
            List<ClassSession> allSessions = sessionRepository.findScheduleByCoachIdAndPeriodWithVenue(null, from, to);
            List<ClassSession> availableSessions = allSessions.stream()
                    .filter(session -> "AVAILABLE".equals(session.getStatus()))
                    .collect(Collectors.toList());

            return ResponseEntity.ok(availableSessions);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving public sessions: " + e.getMessage());
        }
    }

    // Debug endpoint to check coach status
    @GetMapping("/debug/status")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachDebugStatus() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coachUser = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            Coach coach = coachRepository.findById(coachUser.getId()).orElse(null);
            
            Map<String, Object> status = new HashMap<>();
            status.put("username", username);
            status.put("userId", coachUser.getId());
            status.put("userType", coachUser.getUserType());
            status.put("hasCoachEntity", coach != null);
            status.put("coachId", coach != null ? coach.getId() : null);
            status.put("venues", coach != null ? coach.getVenues() : null);
            
            // 如果沒有 Coach 實體，創建一個
            if (coach == null && "COACH".equalsIgnoreCase(coachUser.getUserType())) {
                Coach newCoach = new Coach();
                newCoach.setUser(coachUser);
                newCoach.setExperienceYear(1); // 默認經驗年數
                coachRepository.save(newCoach);
                status.put("coachCreated", true);
                status.put("newCoachId", newCoach.getId());
            }
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error checking coach status: " + e.getMessage());
        }
    }

    // 獲取所有場地（用於下拉選單）
    @GetMapping("/all-venues")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getAllVenues() {
        try {
            List<Venue> venues = venueRepository.findAllVenues();
            
            // 如果沒有場地，創建一些測試場地
            if (venues.isEmpty()) {
                Venue venue1 = new Venue();
                venue1.setName("Pickleball Center");
                venue1.setLocation("123 Main Street, New York, NY 10001");
                venue1.setState("NY");
                venue1.setDescription("Professional pickleball facility with multiple courts");
                venueRepository.save(venue1);
                
                Venue venue2 = new Venue();
                venue2.setName("Sports Complex");
                venue2.setLocation("456 Oak Avenue, Los Angeles, CA 90210");
                venue2.setState("CA");
                venue2.setDescription("Multi-sport complex with dedicated pickleball courts");
                venueRepository.save(venue2);
                
                venues = venueRepository.findAllVenues();
            }
            
            return ResponseEntity.ok(venues);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving venues: " + e.getMessage());
        }
    }

    // 根據場地ID獲取球場
    @GetMapping("/courts-by-venue/{venueId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCourtsByVenue(@PathVariable Integer venueId) {
        try {
            List<Court> courts = courtRepository.findByVenueId(venueId);
            return ResponseEntity.ok(courts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving courts: " + e.getMessage());
        }
    }

    // 獲取所有可用的球場
    @GetMapping("/all-courts")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getAllCourts() {
        try {
            List<Court> courts = courtRepository.findAvailableCourts();
            
            // 如果沒有球場，創建一些測試球場
            if (courts.isEmpty()) {
                List<Venue> venues = venueRepository.findAllVenues();
                if (!venues.isEmpty()) {
                    Venue venue1 = venues.get(0);
                    
                    Court court1 = new Court();
                    court1.setName("Court 1");
                    court1.setLocation("Indoor");
                    court1.setStatus("AVAILABLE");
                    court1.setOpeningTime("08:00");
                    court1.setClosingTime("22:00");
                    court1.setOperatingDays("Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
                    court1.setPeakHourlyPrice(25.0);
                    court1.setOffPeakHourlyPrice(20.0);
                    court1.setDailyPrice(150.0);
                    court1.setPeakStartTime("18:00");
                    court1.setPeakEndTime("21:00");
                    court1.setVenue(venue1);
                    courtRepository.save(court1);
                    
                    Court court2 = new Court();
                    court2.setName("Court 2");
                    court2.setLocation("Outdoor");
                    court2.setStatus("AVAILABLE");
                    court2.setOpeningTime("06:00");
                    court2.setClosingTime("22:00");
                    court2.setOperatingDays("Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
                    court2.setPeakHourlyPrice(20.0);
                    court2.setOffPeakHourlyPrice(15.0);
                    court2.setDailyPrice(120.0);
                    court2.setPeakStartTime("18:00");
                    court2.setPeakEndTime("21:00");
                    court2.setVenue(venue1);
                    courtRepository.save(court2);
                    
                    if (venues.size() > 1) {
                        Venue venue2 = venues.get(1);
                        
                        Court court3 = new Court();
                        court3.setName("Premium Court");
                        court3.setLocation("Indoor");
                        court3.setStatus("AVAILABLE");
                        court3.setOpeningTime("07:00");
                        court3.setClosingTime("23:00");
                        court3.setOperatingDays("Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday");
                        court3.setPeakHourlyPrice(30.0);
                        court3.setOffPeakHourlyPrice(25.0);
                        court3.setDailyPrice(180.0);
                        court3.setPeakStartTime("18:00");
                        court3.setPeakEndTime("21:00");
                        court3.setVenue(venue2);
                        courtRepository.save(court3);
                    }
                    
                    courts = courtRepository.findAvailableCourts();
                }
            }
            
            return ResponseEntity.ok(courts);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving courts: " + e.getMessage());
        }
    }

    // 獲取時段信息
    @GetMapping("/time-slots")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getTimeSlots() {
        try {
            // 生成可用的時段（每小時一個時段，從早上8點到晚上10點）
            List<Map<String, Object>> timeSlots = new ArrayList<>();
            for (int hour = 8; hour <= 22; hour++) {
                Map<String, Object> slot = new HashMap<>();
                slot.put("startTime", String.format("%02d:00", hour));
                slot.put("endTime", String.format("%02d:00", hour + 1));
                slot.put("displayTime", String.format("%02d:00 - %02d:00", hour, hour + 1));
                timeSlots.add(slot);
            }
            return ResponseEntity.ok(timeSlots);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error generating time slots: " + e.getMessage());
        }
    }

    @PostMapping("/recurring-sessions")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> createRecurringClass(@RequestBody RecurringSessionRequestDto dto) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));
            coachCourtService.createRecurringClass(coach.getId(), dto);
            return ResponseEntity.ok("Recurring class created");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error: " + e.getMessage());
        }
    }

    @GetMapping("/available-times")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getAvailableTimes(
        @RequestParam Integer courtId,
        @RequestParam String date // e.g. "2025-08-01"
    ) {
        LocalDate localDate = LocalDate.parse(date);
        LocalDateTime startOfDay = localDate.atStartOfDay();
        LocalDateTime endOfDay = localDate.atTime(23, 59, 59);
        List<ClassSession> sessions = sessionRepository.findByCourtIdAndStartTimeBetween(
            courtId, startOfDay, endOfDay
        );
        List<Map<String, String>> busySlots = sessions.stream().map(s -> Map.of(
            "start", s.getStartTime().toString(),
            "end", s.getEndTime().toString()
        )).collect(Collectors.toList());
        return ResponseEntity.ok(busySlots);
    }

    @GetMapping("/students")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getAllStudentsForCoach() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User coach = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));
        List<Object[]> raw = coachCourtService.getAllStudentsForCoach(coach.getId());
        List<Map<String, Object>> students = raw.stream().map(arr -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", arr[0]);
            map.put("name", arr[1]);
            map.put("email", arr[2]);
            map.put("sessionCount", arr[3]);
            return map;
        }).toList();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/class-sessions/{sessionId}/students")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getStudentsForSession(@PathVariable Integer sessionId) {
        List<ClassRegistration> regs = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found")).getRegistrations();
        List<Map<String, Object>> students = regs.stream().map(r -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", r.getMember().getId());
            map.put("name", r.getMember().getUser().getName());
            map.put("email", r.getMember().getUser().getEmail());
            map.put("attendanceStatus", r.getAttendanceStatus());
            map.put("registrationId", r.getId());
            return map;
        }).toList();
        return ResponseEntity.ok(students);
    }

    @PutMapping("/class-registrations/{registrationId}/attendance")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> updateAttendance(
        @PathVariable Integer registrationId,
        @RequestBody Map<String, String> body
    ) {
        String status = body.get("attendanceStatus");
        ClassRegistration reg = registrationRepository.findById(registrationId)
            .orElseThrow(() -> new ResourceNotFoundException("Registration not found"));
        reg.setAttendanceStatus(status);
        registrationRepository.save(reg);
        return ResponseEntity.ok("Attendance updated");
    }

    // 新增：保存出席記錄和反饋
    @PostMapping("/session/{sessionId}/attendance")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> saveAttendanceAndFeedback(
            @PathVariable Integer sessionId,
            @RequestBody Map<String, Object> requestBody) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 驗證課程是否存在且屬於該教練
            ClassSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

            if (!session.getCoach().getId().equals(coach.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only record attendance for your own sessions");
            }

            @SuppressWarnings("unchecked")
            Map<String, Boolean> attendance = (Map<String, Boolean>) requestBody.get("attendance");
            @SuppressWarnings("unchecked")
            Map<String, String> feedbacks = (Map<String, String>) requestBody.get("feedbacks");

            // 保存出席記錄和反饋
            List<ClassRegistration> updatedRegistrations = new ArrayList<>();

            for (Map.Entry<String, Boolean> entry : attendance.entrySet()) {
                String memberId = entry.getKey();
                Boolean isPresent = entry.getValue();
                String feedback = feedbacks.getOrDefault(memberId, "");

                // 查找對應的註冊記錄
                List<ClassRegistration> registrations = registrationRepository.findByClassSessionId(sessionId);
                ClassRegistration registration = registrations.stream()
                        .filter(r -> r.getMember().getId().toString().equals(memberId))
                        .findFirst()
                        .orElse(null);

                if (registration != null) {
                    // 更新出席狀態
                    registration.setAttendanceStatus(isPresent ? "PRESENT" : "ABSENT");
                    registration.setCoachComment(feedback); // 使用 coachComment 字段保存反饋

                    updatedRegistrations.add(registrationRepository.save(registration));
                }
            }

            // 更新課程狀態為已完成（如果所有學生都已記錄出席）
            if (!updatedRegistrations.isEmpty()) {
                session.setStatus("COMPLETED");
                sessionRepository.save(session);
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Attendance and feedback saved successfully");
            response.put("updatedRegistrations", updatedRegistrations.size());
            response.put("sessionId", sessionId);

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving attendance: " + e.getMessage());
        }
    }

    // 新增：獲取學生的出席記錄和反饋
    @GetMapping("/student/{memberId}/attendance-history")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getStudentAttendanceHistory(@PathVariable Integer memberId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取該學生的所有註冊記錄（只限於該教練的課程）
            List<ClassRegistration> registrations = registrationRepository.findByMemberUserId(memberId);

            // 過濾出該教練的課程
            List<Map<String, Object>> attendanceHistory = registrations.stream()
                    .filter(r -> r.getClassSession().getCoach().getId().equals(coach.getId()))
                    .map(r -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("sessionId", r.getClassSession().getId());
                        record.put("sessionTitle", r.getClassSession().getTitle());
                        record.put("sessionDate", r.getClassSession().getStartTime());
                        record.put("attendanceStatus", r.getAttendanceStatus());
                        record.put("coachComment", r.getCoachComment());
                        record.put("rating", r.getRating());
                        record.put("registrationDate", r.getRegistrationDate());
                        return record;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("memberId", memberId);
            response.put("attendanceHistory", attendanceHistory);
            response.put("totalSessions", attendanceHistory.size());
            response.put("presentCount", attendanceHistory.stream()
                    .filter(r -> "PRESENT".equals(r.get("attendanceStatus")))
                    .count());
            response.put("absentCount", attendanceHistory.stream()
                    .filter(r -> "ABSENT".equals(r.get("attendanceStatus")))
                    .count());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving attendance history: " + e.getMessage());
        }
    }

    // 新增：獲取特定session的已保存考勤數據
    @GetMapping("/session/{sessionId}/attendance")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getSessionAttendance(@PathVariable Integer sessionId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 驗證課程是否存在且屬於該教練
            ClassSession session = sessionRepository.findById(sessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

            if (!session.getCoach().getId().equals(coach.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You can only view attendance for your own sessions");
            }

            // 獲取該session的所有註冊記錄
            List<ClassRegistration> registrations = registrationRepository.findByClassSessionId(sessionId);

            Map<String, Boolean> attendance = new HashMap<>();
            Map<String, String> feedbacks = new HashMap<>();

            for (ClassRegistration registration : registrations) {
                String memberId = registration.getMember().getId().toString();

                // 設置出席狀態
                if ("PRESENT".equals(registration.getAttendanceStatus())) {
                    attendance.put(memberId, true);
                } else if ("ABSENT".equals(registration.getAttendanceStatus())) {
                    attendance.put(memberId, false);
                }

                // 設置反饋
                if (registration.getCoachComment() != null && !registration.getCoachComment().trim().isEmpty()) {
                    feedbacks.put(memberId, registration.getCoachComment());
                }
            }

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", sessionId);
            response.put("attendance", attendance);
            response.put("feedbacks", feedbacks);
            response.put("hasAttendanceData", !attendance.isEmpty());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving session attendance: " + e.getMessage());
        }
    }

    // 新增：獲取教練收入歷史
    @GetMapping("/income-history")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachIncomeHistory(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取教練的收入記錄
            List<Payment> coachIncomePayments = paymentRepository.findByPaymentTypeAndStatus("COACH_INCOME", "COMPLETED")
                    .stream()
                    .filter(payment -> {
                        // 檢查是否屬於當前教練（通過 session 關聯）
                        if (payment.getTransactionId() != null && payment.getTransactionId().startsWith("SETTLEMENT_")) {
                            String sessionIdStr = payment.getTransactionId().replace("SETTLEMENT_", "");
                            try {
                                Integer sessionId = Integer.parseInt(sessionIdStr);
                                ClassSession session = sessionRepository.findById(sessionId).orElse(null);
                                return session != null && session.getCoach().getId().equals(coach.getId());
                            } catch (NumberFormatException e) {
                                return false;
                            }
                        }
                        return false;
                    })
                    .collect(Collectors.toList());

            // 按日期過濾
            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDateTime.parse(startDate);
                LocalDateTime end = LocalDateTime.parse(endDate);
                coachIncomePayments = coachIncomePayments.stream()
                        .filter(payment -> {
                            LocalDateTime paymentDate = payment.getPaymentDate();
                            return paymentDate != null && !paymentDate.isBefore(start) && !paymentDate.isAfter(end);
                        })
                        .collect(Collectors.toList());
            }

            // 構建收入歷史記錄
            List<Map<String, Object>> incomeHistory = coachIncomePayments.stream()
                    .map(payment -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("paymentId", payment.getId());
                        record.put("amount", payment.getAmount());
                        record.put("paymentDate", payment.getPaymentDate());
                        record.put("transactionId", payment.getTransactionId());

                        // 獲取相關課程信息
                        if (payment.getTransactionId() != null && payment.getTransactionId().startsWith("SETTLEMENT_")) {
                            String sessionIdStr = payment.getTransactionId().replace("SETTLEMENT_", "");
                            try {
                                Integer sessionId = Integer.parseInt(sessionIdStr);
                                ClassSession session = sessionRepository.findById(sessionId).orElse(null);
                                if (session != null) {
                                    record.put("sessionId", session.getId());
                                    record.put("sessionTitle", session.getTitle());
                                    record.put("sessionDate", session.getStartTime());
                                    record.put("studentCount", session.getCurrentParticipants());
                                    record.put("totalSessionRevenue", session.getPrice() * session.getCurrentParticipants());
                                }
                            } catch (NumberFormatException e) {
                                // 忽略無效的 session ID
                            }
                        }

                        return record;
                    })
                    .sorted((a, b) -> {
                        LocalDateTime dateA = (LocalDateTime) a.get("paymentDate");
                        LocalDateTime dateB = (LocalDateTime) b.get("paymentDate");
                        return dateB.compareTo(dateA); // 降序排列
                    })
                    .collect(Collectors.toList());

            // 計算統計信息
            double totalIncome = incomeHistory.stream()
                    .mapToDouble(record -> (Double) record.get("amount"))
                    .sum();

            double monthlyIncome = incomeHistory.stream()
                    .filter(record -> {
                        LocalDateTime paymentDate = (LocalDateTime) record.get("paymentDate");
                        LocalDateTime oneMonthAgo = LocalDateTime.now().minusMonths(1);
                        return paymentDate != null && paymentDate.isAfter(oneMonthAgo);
                    })
                    .mapToDouble(record -> (Double) record.get("amount"))
                    .sum();

            Map<String, Object> response = new HashMap<>();
            response.put("coachId", coach.getId());
            response.put("coachName", coach.getName());
            response.put("totalIncome", totalIncome);
            response.put("monthlyIncome", monthlyIncome);
            response.put("incomeHistory", incomeHistory);
            response.put("totalRecords", incomeHistory.size());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving income history: " + e.getMessage());
        }
    }

    @GetMapping("/test")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> testEndpoint() {
        return ResponseEntity.ok(Map.of("message", "Coach controller is working", "timestamp", System.currentTimeMillis()));
    }

    // 新增：獲取教練錢包餘額
    @GetMapping("/wallet-balance")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachWalletBalance() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取教練的Member記錄
            Member coachMember = memberRepository.findByUser(coach);
            if (coachMember == null) {
                throw new ResourceNotFoundException("Coach member not found");
            }

            // 獲取教練的錢包
            Wallet coachWallet = walletRepository.findByMemberId(coachMember.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Coach wallet not found"));

            // 獲取最近的交易記錄
            Pageable pageable = PageRequest.of(0, 10);
            Page<WalletTransaction> transactionsPage = walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(coachWallet.getId(), pageable);
            List<WalletTransaction> recentTransactions = transactionsPage.getContent();

            Map<String, Object> response = new HashMap<>();
            response.put("coachId", coach.getId());
            response.put("coachName", coach.getName());
            response.put("balance", coachWallet.getBalance());
            response.put("walletStatus", coachWallet.getStatus());
            response.put("recentTransactions", recentTransactions.stream()
                    .map(transaction -> {
                        Map<String, Object> tx = new HashMap<>();
                        tx.put("id", transaction.getId());
                        tx.put("type", transaction.getTransactionType());
                        tx.put("amount", transaction.getAmount());
                        tx.put("balanceBefore", transaction.getBalanceBefore());
                        tx.put("balanceAfter", transaction.getBalanceAfter());
                        tx.put("description", transaction.getDescription());
                        tx.put("createdAt", transaction.getCreatedAt());
                        return tx;
                    })
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving wallet balance: " + e.getMessage());
        }
    }

    @GetMapping("/wallet-transactions")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachWalletTransactions(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取教練的Member記錄
            Member coachMember = memberRepository.findByUser(coach);
            if (coachMember == null) {
                throw new ResourceNotFoundException("Coach member not found");
            }

            // 獲取教練的錢包
            Wallet coachWallet = walletRepository.findByMemberId(coachMember.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Coach wallet not found"));

            // 獲取錢包交易記錄
            List<WalletTransaction> transactions = walletTransactionRepository.findByWalletIdOrderByCreatedAtDesc(coachWallet.getId(), Pageable.unpaged()).getContent();

            // 按日期過濾
            if (startDate != null && endDate != null) {
                LocalDateTime start = LocalDateTime.parse(startDate);
                LocalDateTime end = LocalDateTime.parse(endDate);
                transactions = transactions.stream()
                        .filter(transaction -> {
                            LocalDateTime transactionDate = transaction.getCreatedAt();
                            return transactionDate != null && !transactionDate.isBefore(start) && !transactionDate.isAfter(end);
                        })
                        .collect(Collectors.toList());
            }

            // 構建交易記錄
            List<Map<String, Object>> transactionHistory = transactions.stream()
                    .map(transaction -> {
                        Map<String, Object> record = new HashMap<>();
                        record.put("transactionId", transaction.getId());
                        record.put("amount", transaction.getAmount());
                        record.put("transactionType", transaction.getTransactionType());
                        record.put("transactionDate", transaction.getCreatedAt());
                        record.put("description", transaction.getDescription());
                        record.put("balanceAfter", transaction.getBalanceAfter());
                        record.put("referenceType", transaction.getReferenceType());
                        record.put("referenceId", transaction.getReferenceId());
                        
                        // 判斷是收入還是支出
                        boolean isIncome = "DEPOSIT".equals(transaction.getTransactionType()) || 
                                         "REFUND".equals(transaction.getTransactionType());
                        record.put("isIncome", isIncome);
                        
                        return record;
                    })
                    .collect(Collectors.toList());

            // 計算統計信息
            double totalIncome = transactionHistory.stream()
                    .filter(record -> (Boolean) record.get("isIncome"))
                    .mapToDouble(record -> (Double) record.get("amount"))
                    .sum();

            double totalExpense = transactionHistory.stream()
                    .filter(record -> !(Boolean) record.get("isIncome"))
                    .mapToDouble(record -> (Double) record.get("amount"))
                    .sum();

            double netIncome = totalIncome - totalExpense;

            Map<String, Object> response = new HashMap<>();
            response.put("coachId", coach.getId());
            response.put("coachName", coach.getName());
            response.put("walletBalance", coachWallet.getBalance());
            response.put("totalIncome", totalIncome);
            response.put("totalExpense", totalExpense);
            response.put("netIncome", netIncome);
            response.put("transactions", transactionHistory);
            response.put("totalRecords", transactionHistory.size());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving wallet transactions: " + e.getMessage());
        }
    }

    @GetMapping("/revenue-status")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getCoachRevenueStatus() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 獲取教練的課程收入狀態
            List<ClassSession> sessions = sessionRepository.findByCoachIdOrderByStartTimeDesc(coach.getId());
            
            List<Map<String, Object>> revenueStatus = sessions.stream()
                    .filter(session -> session.getRegistrations() != null && !session.getRegistrations().isEmpty())
                    .map(session -> {
                        Map<String, Object> status = new HashMap<>();
                        status.put("sessionId", session.getId());
                        status.put("title", session.getTitle());
                        status.put("startTime", session.getStartTime());
                        status.put("status", session.getStatus());
                        status.put("revenueDistributed", session.getRevenueDistributed());
                        
                        // 計算收入
                        double totalRevenue = 0.0;
                        if (session.getRegistrations() != null) {
                            totalRevenue = session.getRegistrations().size() * session.getPrice();
                        }
                        status.put("totalRevenue", totalRevenue);
                        status.put("coachShare", totalRevenue * 0.80);
                        status.put("platformShare", totalRevenue * 0.20);
                        
                        // 計算距離課程開始的時間
                        if (session.getStartTime() != null) {
                            LocalDateTime now = LocalDateTime.now();
                            LocalDateTime sessionStart = session.getStartTime();
                            long hoursUntilStart = java.time.Duration.between(now, sessionStart).toHours();
                            status.put("hoursUntilStart", hoursUntilStart);
                            status.put("willDistributeSoon", hoursUntilStart <= 24 && hoursUntilStart > 0);
                        }
                        
                        return status;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("coachId", coach.getId());
            response.put("coachName", coach.getName());
            response.put("revenueStatus", revenueStatus);
            response.put("totalSessions", revenueStatus.size());
            response.put("pendingDistributions", revenueStatus.stream()
                    .filter(status -> !(Boolean) status.get("revenueDistributed"))
                    .count());

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving revenue status: " + e.getMessage());
        }
    }
}