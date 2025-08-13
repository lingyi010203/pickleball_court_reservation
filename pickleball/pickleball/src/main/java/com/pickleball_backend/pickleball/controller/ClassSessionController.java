package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.dto.ClassRegistrationDto;
import com.pickleball_backend.pickleball.dto.LeaveRequestDto;
import com.pickleball_backend.pickleball.exception.ConflictException;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.UnauthorizedException;
import com.pickleball_backend.pickleball.service.EscrowAccountService;
import com.pickleball_backend.pickleball.entity.Feedback;
import java.time.LocalDateTime;
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import com.pickleball_backend.pickleball.service.ClassSessionService;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.service.LeaveRequestService;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/class-sessions")
public class ClassSessionController {

    private final ClassSessionService classSessionService;
    private final UserRepository userRepository;
    private final ClassRegistrationRepository classRegistrationRepository;
    private final PaymentRepository paymentRepository;
    private final EmailService emailService;
    private final ClassSessionRepository classSessionRepository;
    private final MemberRepository memberRepository;
    private final LeaveRequestService leaveRequestService;
    private final EscrowAccountService escrowAccountService;
    private final FeedbackRepository feedbackRepository;
    private final UserAccountRepository userAccountRepository;

    @Autowired
    public ClassSessionController(ClassSessionService classSessionService, UserRepository userRepository, ClassRegistrationRepository classRegistrationRepository, PaymentRepository paymentRepository, EmailService emailService, ClassSessionRepository classSessionRepository, MemberRepository memberRepository, LeaveRequestService leaveRequestService, EscrowAccountService escrowAccountService, FeedbackRepository feedbackRepository, UserAccountRepository userAccountRepository) {
        this.classSessionService = classSessionService;
        this.userRepository = userRepository;
        this.classRegistrationRepository = classRegistrationRepository;
        this.paymentRepository = paymentRepository;
        this.emailService = emailService;
        this.classSessionRepository = classSessionRepository;
        this.memberRepository = memberRepository;
        this.leaveRequestService = leaveRequestService;
        this.escrowAccountService = escrowAccountService;
        this.feedbackRepository = feedbackRepository;
        this.userAccountRepository = userAccountRepository;
    }

    // 教练创建课程
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> createClassSession(@RequestBody ClassSessionDto sessionDto, @RequestParam(value = "makeupForSessionId", required = false) Integer makeupForSessionId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));

            // 確保設置了課程類型
            if (sessionDto.getSlotType() == null || sessionDto.getSlotType().isEmpty()) {
                sessionDto.setSlotType("COACH_SESSION");
            }

            ClassSession session = classSessionService.createClassSession(sessionDto, coach);

            // 新增：如果是補課，設置 replacementForSessionId 並通知原本 session 的學生
            if (makeupForSessionId != null) {
                session.setReplacementForSessionId(makeupForSessionId);
                classSessionRepository.save(session);
                ClassSession origin = classSessionService.getSessionById(makeupForSessionId);
                if (origin != null && origin.getRegistrations() != null) {
                    for (var reg : origin.getRegistrations()) {
                        if (reg.getMember() != null && reg.getMember().getUser() != null) {
                            String email = reg.getMember().getUser().getEmail();
                            String registerUrl = "http://localhost:3000/class-session/" + session.getId();
                            String msg = String.format(
                                "Dear student,\n\n" +
                                "Your original class (%s, %s) has been cancelled by the coach.\n\n" +
                                "A make-up class has been scheduled for you:\n" +
                                "Make-up Time: %s\n" +
                                "Venue: %s\n" +
                                "Class Title: %s\n\n" +
                                "Please click the link below to register for the make-up class:\n%s\n\n" +
                                "If you have any questions, please contact customer service or your coach.",
                                origin.getTitle(),
                                origin.getStartTime(),
                                session.getStartTime(),
                                session.getVenue() != null ? session.getVenue().getName() : "",
                                session.getTitle(),
                                registerUrl
                            );
                            // 获取用户对象以检查通知偏好
                            User user = userRepository.findByEmail(email).orElse(null);
                            if (user != null) {
                                emailService.sendEmailIfEnabled(user, "Make-up Class Notification - Please Register", msg);
                            } else {
                                // 如果找不到用户，直接发送邮件（向后兼容）
                                emailService.sendEmail(email, "Make-up Class Notification - Please Register", msg);
                            }
                        }
                    }
                }
            }

            return ResponseEntity.ok(session);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 用户报名课程
    @PostMapping("/{sessionId}/register")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> registerForSession(
            @PathVariable Integer sessionId,
            @RequestParam Integer userId) {
        try {
            boolean success = classSessionService.registerUserForSession(sessionId, userId);
            return ResponseEntity.ok(Map.of("success", success));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 一次註冊多堂課
    @PostMapping("/register-multi")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> registerForMultipleSessions(@RequestBody com.pickleball_backend.pickleball.dto.RegisterMultiSessionRequest request, Principal principal) {
        try {
            // 驗證請求數據
            if (request.getSessionIds() == null || request.getSessionIds().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Session IDs cannot be null or empty"));
            }
            
            if (request.getPaymentMethod() == null || request.getPaymentMethod().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Payment method is required"));
            }
            
            String username = principal.getName();
            UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new com.pickleball_backend.pickleball.exception.ResourceNotFoundException("User account not found"));

            // Validate user status - prevent suspended/inactive users from booking
            if ("SUSPENDED".equals(userAccount.getStatus()) || "INACTIVE".equals(userAccount.getStatus())) {
                throw new UnauthorizedException("Your account is " + userAccount.getStatus().toLowerCase() + 
                    ". You cannot make bookings. Please contact support for assistance.");
            }

            User user = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new com.pickleball_backend.pickleball.exception.ResourceNotFoundException("User not found"));
            Integer userId = user.getId();
            
            Map<String, Object> result = classSessionService.registerUserForMultipleSessions(userId, request.getSessionIds(), request.getPaymentMethod(), request.getNumPaddles(), request.getBuyBallSet());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace(); // 添加詳細錯誤日誌
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 获取教练课程表
    @GetMapping("/coach/{coachId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<List<ClassSession>> getCoachSchedule(
            @PathVariable Integer coachId,
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end) {
        List<ClassSession> schedule = classSessionService.getCoachSchedule(coachId, start, end);
        return ResponseEntity.ok(schedule);
    }

    // 取得可用課程（只顯示教練保留時段在前一天或當天的，否則不顯示）
    @GetMapping("/available")
    public ResponseEntity<List<ClassSessionDto>> getAvailableSessions(
            @RequestParam(required = false) Integer courtId,
            @RequestParam String start,
            @RequestParam String end) {
        
        System.out.println("=== getAvailableSessions called ===");
        System.out.println("courtId: " + courtId);
        System.out.println("start: " + start);
        System.out.println("end: " + end);
        
        // 支援 ISO 格式（含 Z/時區）
        LocalDateTime startDateTime = OffsetDateTime.parse(start).toLocalDateTime();
        LocalDateTime endDateTime = OffsetDateTime.parse(end).toLocalDateTime();
        
        List<ClassSession> sessions = classSessionService.getAvailableSessions(courtId, startDateTime, endDateTime);
        System.out.println("Found " + sessions.size() + " sessions");
        
        // 檢查每個 session 的 registrations
        sessions.forEach(s -> {
            System.out.println("Session " + s.getId() + " has " + (s.getRegistrations() != null ? s.getRegistrations().size() : 0) + " registrations");
            if (s.getRegistrations() != null && !s.getRegistrations().isEmpty()) {
                s.getRegistrations().forEach(r -> {
                    System.out.println("  - Registration " + r.getId() + " for user " + 
                        (r.getMember() != null && r.getMember().getUser() != null ? r.getMember().getUser().getId() : "unknown"));
                });
            }
        });
        
        // 顯示所有非取消/完成的課程，包括 AVAILABLE, CONFIRMED, FULL 等
        List<ClassSession> filtered = sessions.stream()
                .filter(s -> !s.getStatus().equals("CANCELLED") && !s.getStatus().equals("COMPLETED"))
                .toList();
        
        System.out.println("=== Session Status Debug ===");
        System.out.println("Total sessions found: " + sessions.size());
        sessions.forEach(s -> {
            System.out.println("Session " + s.getId() + " status: " + s.getStatus());
        });
        System.out.println("Filtered sessions: " + filtered.size());
        filtered.forEach(s -> {
            System.out.println("Filtered Session " + s.getId() + " status: " + s.getStatus());
        });
        System.out.println("=== End Session Status Debug ===");
        
        List<ClassSessionDto> dtos = filtered.stream().map(s -> {
            ClassSessionDto dto = new ClassSessionDto();
            dto.setId(s.getId());
            dto.setCoachId(s.getCoach() != null ? s.getCoach().getId() : null);
            dto.setCoachName(s.getCoach() != null ? s.getCoach().getName() : null);
            dto.setCourtId(s.getCourt() != null ? s.getCourt().getId() : null);
            dto.setCourtName(s.getCourt() != null ? s.getCourt().getName() : null);
            dto.setStartTime(s.getStartTime());
            dto.setEndTime(s.getEndTime());
            dto.setMaxParticipants(s.getMaxParticipants());
            dto.setCurrentParticipants(s.getCurrentParticipants());
            dto.setDescription(s.getDescription());
            dto.setStatus(s.getStatus());
            dto.setCreatedAt(s.getCreatedAt());
            dto.setUpdatedAt(s.getUpdatedAt());
            dto.setPrice(s.getPrice());
            dto.setTitle(s.getTitle());
            dto.setSlotType(s.getSlotType());
            dto.setRecurringGroupId(s.getRecurringGroupId());
            // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
            Venue venue = s.getVenue();
            if (venue == null && s.getCourt() != null) {
                venue = s.getCourt().getVenue();
            }
            dto.setVenueName(venue != null ? venue.getName() : null);
            dto.setVenueState(venue != null ? venue.getState() : null);
            // 添加 registrations 數據
            if (s.getRegistrations() != null) {
                System.out.println("Session " + s.getId() + " has " + s.getRegistrations().size() + " registrations");
                dto.setRegistrations(s.getRegistrations().stream().map(reg -> {
                    String userName = reg.getMember() != null && reg.getMember().getUser() != null ? 
                        reg.getMember().getUser().getName() : null;
                    Integer userId = reg.getMember() != null && reg.getMember().getUser() != null ? 
                        reg.getMember().getUser().getId() : null;
                    Integer memberId = reg.getMember() != null ? reg.getMember().getId() : null;
                    String email = reg.getMember() != null && reg.getMember().getUser() != null ? 
                        reg.getMember().getUser().getEmail() : null;
                    String username = reg.getMember() != null && reg.getMember().getUser() != null && 
                        reg.getMember().getUser().getUserAccount() != null ? 
                        reg.getMember().getUser().getUserAccount().getUsername() : null;
                    
                    System.out.println("Registration " + reg.getId() + " for user " + userId + " (" + userName + ")");
                    
                    return new ClassRegistrationDto(
                        reg.getId(), // registrationId
                        memberId,
                        userId,
                        userName, // memberName
                        email,
                        reg.getRegistrationDate(),
                        username,
                        null, // phone - 設為 null
                        reg.getAttendanceStatus() // attendanceStatus
                    );
                }).collect(Collectors.toList()));
            } else {
                System.out.println("Session " + s.getId() + " has no registrations");
                dto.setRegistrations(new ArrayList<>()); // 設置為空列表而不是 null
            }
            return dto;
        }).toList();
        
        System.out.println("Returning " + dtos.size() + " DTOs");
        // 調試：檢查所有DTO的狀態
        dtos.forEach(dto -> {
            System.out.println("Final DTO " + dto.getId() + " status: " + dto.getStatus());
        });
        return ResponseEntity.ok(dtos);
    }

    // 新增：建立 recurring 課程（多日期）
    @PostMapping("/recurring")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> createRecurringSessions(@RequestBody com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto request) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User coach = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Coach not found"));
            List<ClassSession> sessions = classSessionService.createRecurringSessions(request, coach);
            return ResponseEntity.ok(sessions);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 新增：即時檢查 court 多日期是否有衝突
    @PostMapping("/check-court-availability")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> checkCourtAvailability(@RequestBody Map<String, Object> body) {
        try {
            Integer courtId = (Integer) body.get("courtId");
            List<Map<String, String>> dateTimes = (List<Map<String, String>>) body.get("dateTimes");
            List<String> conflicts = new java.util.ArrayList<>();
            for (Map<String, String> dt : dateTimes) {
                java.time.LocalDateTime start = java.time.LocalDateTime.parse(dt.get("startTime"));
                java.time.LocalDateTime end = java.time.LocalDateTime.parse(dt.get("endTime"));
                boolean conflict = classSessionService.hasCourtConflict(courtId, start, end);
                if (conflict) {
                    conflicts.add(dt.get("startTime"));
                }
            }
            return ResponseEntity.ok(Map.of("conflicts", conflicts));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 新增：根據 id 批量查詢課程詳情（for receipt）
    @PostMapping("/details-batch")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<ClassSessionDto>> getSessionDetailsBatch(@RequestBody List<Integer> sessionIds) {
        List<ClassSession> sessions = classSessionService.getSessionsByIds(sessionIds);
        List<ClassSessionDto> dtos = sessions.stream().map(s -> {
            ClassSessionDto dto = new ClassSessionDto();
            dto.setId(s.getId());
            dto.setCoachId(s.getCoach() != null ? s.getCoach().getId() : null);
            dto.setCoachName(s.getCoach() != null ? s.getCoach().getName() : null);
            dto.setCourtId(s.getCourt() != null ? s.getCourt().getId() : null);
            dto.setCourtName(s.getCourt() != null ? s.getCourt().getName() : null);
            dto.setStartTime(s.getStartTime());
            dto.setEndTime(s.getEndTime());
            dto.setMaxParticipants(s.getMaxParticipants());
            dto.setCurrentParticipants(s.getCurrentParticipants());
            dto.setDescription(s.getDescription());
            dto.setStatus(s.getStatus());
            dto.setCreatedAt(s.getCreatedAt());
            dto.setUpdatedAt(s.getUpdatedAt());
            dto.setPrice(s.getPrice());
            dto.setTitle(s.getTitle());
            dto.setSlotType(s.getSlotType());
            dto.setRecurringGroupId(s.getRecurringGroupId());
            // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
            Venue venue = s.getVenue();
            if (venue == null && s.getCourt() != null) {
                venue = s.getCourt().getVenue();
            }
            dto.setVenueName(venue != null ? venue.getName() : null);
            dto.setVenueState(venue != null ? venue.getState() : null);
            return dto;
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    // 新增：查詢單一課程詳情，補課自動加 allowedMemberIds
    @GetMapping("/{sessionId}/details")
    public ResponseEntity<?> getSessionDetails(@PathVariable Integer sessionId) {
        ClassSession session = classSessionService.getSessionById(sessionId);
        if (session == null) return ResponseEntity.notFound().build();
        Map<String, Object> dto = new java.util.HashMap<>();
        dto.put("id", session.getId());
        dto.put("title", session.getTitle());
        dto.put("description", session.getDescription());
        dto.put("startTime", session.getStartTime());
        dto.put("endTime", session.getEndTime());
        dto.put("maxParticipants", session.getMaxParticipants());
        dto.put("price", session.getPrice());
        dto.put("allowReplacement", session.getAllowReplacement());
        dto.put("replacementForSessionId", session.getReplacementForSessionId());
        
        // 場地信息 - 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
        Venue venue = session.getVenue();
        if (venue == null && session.getCourt() != null) {
            venue = session.getCourt().getVenue();
        }
        if (venue != null) {
            dto.put("venueId", venue.getId());
            dto.put("venueName", venue.getName());
            dto.put("venue", venue);
        }
        
        // 球場信息
        if (session.getCourt() != null) {
            dto.put("courtId", session.getCourt().getId());
            dto.put("courtName", session.getCourt().getName());
            dto.put("court", session.getCourt());
        }
        
        // 如果是補課，補上 allowedMemberIds
        if (session.getReplacementForSessionId() != null) {
            ClassSession origin = classSessionService.getSessionById(session.getReplacementForSessionId());
            if (origin != null && origin.getRegistrations() != null) {
                java.util.List<Integer> allowed = new java.util.ArrayList<>();
                for (var reg : origin.getRegistrations()) {
                    if (reg.getMember() != null && reg.getMember().getUser() != null) {
                        allowed.add(reg.getMember().getUser().getId());
                    }
                }
                dto.put("allowedMemberIds", allowed);
            }
        }
        return ResponseEntity.ok(dto);
    }

    // 新增：查詢 class session 的學生名單
    @GetMapping("/{sessionId}/students")
    public ResponseEntity<List<Map<String, Object>>> getSessionStudents(@PathVariable Integer sessionId) {
        List<ClassRegistration> regs = classRegistrationRepository.findByClassSessionId(sessionId);
        List<Map<String, Object>> students = regs.stream()
            .filter(reg -> {
                if (reg.getGroupBookingId() != null) {
                    String gbid = reg.getGroupBookingId().trim().toLowerCase();
                    return paymentRepository.findByGroupBookingId(gbid)
                        .map(payment -> "completed".equalsIgnoreCase(payment.getStatus().trim()))
                        .orElse(false);
                }
                // fallback: 單堂課
                if (reg.getPayment() != null) {
                    return "COMPLETED".equalsIgnoreCase(reg.getPayment().getStatus().trim());
                }
                return false;
            })
            .map(reg -> {
                Map<String, Object> m = new java.util.HashMap<>();
                m.put("memberId", reg.getMember().getId());
                m.put("userId", reg.getMember().getUser().getId());
                m.put("name", reg.getMember().getUser().getName());
                m.put("email", reg.getMember().getUser().getEmail());
                m.put("username", reg.getMember().getUser().getUserAccount() != null ? reg.getMember().getUser().getUserAccount().getUsername() : null);
                m.put("phone", reg.getMember().getUser().getPhone());
                return m;
            }).toList();
        return ResponseEntity.ok(students);
    }

    // 改為：查詢 recurring_group_id 下所有 class session 及其報名名單
    @GetMapping("/recurring/{recurringGroupId}/full-details")
    public ResponseEntity<?> getRecurringClassFullDetails(@PathVariable String recurringGroupId) {
        List<ClassSession> sessions = classSessionService.getSessionsByRecurringGroupId(recurringGroupId);
        List<ClassSessionDto> dtos = sessions.stream().map(session -> {
            ClassSessionDto dto = new ClassSessionDto();
            dto.setId(session.getId());
            dto.setCoachId(session.getCoach() != null ? session.getCoach().getId() : null);
            dto.setCoachName(session.getCoach() != null ? session.getCoach().getName() : null);
            dto.setCourtId(session.getCourt() != null ? session.getCourt().getId() : null);
            dto.setCourtName(session.getCourt() != null ? session.getCourt().getName() : null);
            dto.setStartTime(session.getStartTime());
            dto.setEndTime(session.getEndTime());
            dto.setMaxParticipants(session.getMaxParticipants());
            dto.setCurrentParticipants(session.getCurrentParticipants());
            dto.setDescription(session.getDescription());
            dto.setStatus(session.getStatus());
            dto.setCreatedAt(session.getCreatedAt());
            dto.setUpdatedAt(session.getUpdatedAt());
            dto.setPrice(session.getPrice());
            dto.setTitle(session.getTitle());
            dto.setSlotType(session.getSlotType());
            dto.setRecurringGroupId(session.getRecurringGroupId());
            // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
            Venue venue = session.getVenue();
            if (venue == null && session.getCourt() != null) {
                venue = session.getCourt().getVenue();
            }
            dto.setVenueName(venue != null ? venue.getName() : null);
            dto.setVenueState(venue != null ? venue.getState() : null);
            dto.setAllowReplacement(session.getAllowReplacement());
            // 報名名單
            List<ClassRegistrationDto> regDtos = session.getRegistrations() == null ? List.of() : session.getRegistrations().stream().map(reg ->
                new ClassRegistrationDto(
                    reg.getId(), // registrationId
                    reg.getMember() != null ? reg.getMember().getId() : null, // memberId
                    reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getId() : null, // userId
                    reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getName() : null, // memberName
                    reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getEmail() : null, // email
                    reg.getRegistrationDate(), // registrationDate
                    reg.getMember() != null && reg.getMember().getUser() != null && reg.getMember().getUser().getUserAccount() != null ? reg.getMember().getUser().getUserAccount().getUsername() : null, // username
                    reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getPhone() : null, // phone
                    reg.getAttendanceStatus() // attendanceStatus
                )
            ).toList();
            dto.setRegistrations(regDtos);
            return dto;
        }).toList();
        return ResponseEntity.ok(dtos);
    }

    // 查詢所有 replacement class for coach
    @GetMapping("/replacements")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> getReplacementClasses(@RequestParam Integer coachId) {
        List<ClassSession> replacements = classSessionRepository.findByReplacementForSessionIdNotNullAndCoachId(coachId);
        return ResponseEntity.ok(replacements);
    }

    // 測試端點：檢查 registrations 數據
    @GetMapping("/test-registrations")
    public ResponseEntity<?> testRegistrations() {
        List<ClassSession> sessions = classSessionRepository.findAvailableSessionsWithRegistrations(null, LocalDateTime.now(), LocalDateTime.now().plusMonths(1));
        List<Map<String, Object>> result = sessions.stream().map(s -> {
            Map<String, Object> map = new HashMap<>();
            map.put("sessionId", s.getId());
            map.put("title", s.getTitle());
            map.put("registrationsCount", s.getRegistrations() != null ? s.getRegistrations().size() : 0);
            if (s.getRegistrations() != null && !s.getRegistrations().isEmpty()) {
                map.put("registrations", s.getRegistrations().stream().map(reg -> {
                    Map<String, Object> regMap = new HashMap<>();
                    regMap.put("registrationId", reg.getId());
                    regMap.put("userId", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getId() : null);
                    regMap.put("userName", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getName() : null);
                    return regMap;
                }).collect(Collectors.toList()));
            }
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // 測試端點：手動創建一個 registration
    @PostMapping("/test-create-registration")
    public ResponseEntity<?> testCreateRegistration(@RequestParam Integer sessionId, @RequestParam Integer userId) {
        try {
            boolean success = classSessionService.registerUserForSession(sessionId, userId);
            return ResponseEntity.ok(Map.of("success", success, "message", "Registration created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 測試端點：檢查所有 registrations
    @GetMapping("/test-all-registrations")
    public ResponseEntity<?> testAllRegistrations() {
        List<ClassRegistration> allRegistrations = classRegistrationRepository.findAll();
        List<Map<String, Object>> result = allRegistrations.stream().map(reg -> {
            Map<String, Object> map = new HashMap<>();
            map.put("registrationId", reg.getId());
            map.put("sessionId", reg.getClassSession() != null ? reg.getClassSession().getId() : null);
            map.put("memberId", reg.getMember() != null ? reg.getMember().getId() : null);
            map.put("userId", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getId() : null);
            map.put("userName", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getName() : null);
            map.put("registrationDate", reg.getRegistrationDate());
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // 測試端點：創建一個測試 registration
    @PostMapping("/test-create-sample-registration")
    public ResponseEntity<?> testCreateSampleRegistration() {
        try {
            // 獲取第一個可用的 session
            List<ClassSession> sessions = classSessionRepository.findAvailableSessionsWithRegistrations(null, LocalDateTime.now(), LocalDateTime.now().plusMonths(1));
            if (sessions.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No available sessions found"));
            }
            
            ClassSession session = sessions.get(0);
            
            // 獲取第一個用戶
            List<User> users = userRepository.findAll();
            if (users.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No users found"));
            }
            
            User user = users.get(0);
            Member member = memberRepository.findByUserId(user.getId());
            if (member == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User is not a member"));
            }
            
            // 創建 registration
            ClassRegistration registration = new ClassRegistration();
            registration.setClassSession(session);
            registration.setMember(member);
            registration.setRegistrationDate(LocalDateTime.now());
            classRegistrationRepository.save(registration);
            
            // 更新 session 人數
            session.setCurrentParticipants(session.getCurrentParticipants() + 1);
            classSessionRepository.save(session);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Test registration created",
                "sessionId", session.getId(),
                "userId", user.getId(),
                "userName", user.getName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 測試端點：檢查特定 session 的 registrations
    @GetMapping("/test-session-registrations/{sessionId}")
    public ResponseEntity<?> testSessionRegistrations(@PathVariable Integer sessionId) {
        try {
            ClassSession session = classSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Session not found"));
            }
            
            Map<String, Object> result = new HashMap<>();
            result.put("sessionId", session.getId());
            result.put("title", session.getTitle());
            result.put("registrationsCount", session.getRegistrations() != null ? session.getRegistrations().size() : 0);
            
            if (session.getRegistrations() != null && !session.getRegistrations().isEmpty()) {
                result.put("registrations", session.getRegistrations().stream().map(reg -> {
                    Map<String, Object> regMap = new HashMap<>();
                    regMap.put("registrationId", reg.getId());
                    regMap.put("userId", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getId() : null);
                    regMap.put("userName", reg.getMember() != null && reg.getMember().getUser() != null ? reg.getMember().getUser().getName() : null);
                    regMap.put("memberId", reg.getMember() != null ? reg.getMember().getId() : null);
                    return regMap;
                }).collect(Collectors.toList()));
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 測試端點：檢查當前用戶的 token 信息
    @GetMapping("/test-current-user")
    public ResponseEntity<?> testCurrentUser() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User user = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            Map<String, Object> result = new HashMap<>();
            result.put("userId", user.getId());
            result.put("userName", user.getName());
            result.put("username", username);
            result.put("email", user.getEmail());
            
            // 檢查是否是 member
            Member member = memberRepository.findByUserId(user.getId());
            if (member != null) {
                result.put("isMember", true);
                result.put("memberId", member.getId());
            } else {
                result.put("isMember", false);
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 獲取所有教練的資料
    @GetMapping("/coaches")
    public ResponseEntity<?> getAllCoaches() {
        try {
            System.out.println("=== getAllCoaches called ===");
            
            // 獲取所有用戶類型為 COACH 的用戶
            List<User> coaches = userRepository.findByUserTypeIn(List.of("COACH"));
            System.out.println("Found " + coaches.size() + " coaches");
            
            coaches.forEach(coach -> {
                System.out.println("Coach: " + coach.getName() + " (ID: " + coach.getId() + ", Type: " + coach.getUserType() + ")");
            });
            
            List<Map<String, Object>> coachData = coaches.stream().map(coach -> {
                Map<String, Object> coachInfo = new HashMap<>();
                coachInfo.put("id", coach.getId());
                coachInfo.put("name", coach.getName());
                coachInfo.put("email", coach.getEmail());
                coachInfo.put("rating", 4.5); // 默認評分
                coachInfo.put("avatar", coach.getName().substring(0, 2).toUpperCase()); // 取名字前兩個字母
                
                // 獲取教練的場地信息 - 使用更寬泛的查詢
                                        List<ClassSession> allSessions = classSessionRepository.findAll();
                        List<ClassSession> coachSessions = allSessions.stream()
                            .filter(s -> s.getCoach() != null && s.getCoach().getId().equals(coach.getId()))
                            .collect(Collectors.toList());

                        // 計算可用的課程數量
                        long availableSessionsCount = coachSessions.stream()
                            .filter(s -> "AVAILABLE".equals(s.getStatus()))
                            .count();

                        System.out.println("Coach " + coach.getName() + " has " + coachSessions.size() + " total sessions, " + availableSessionsCount + " available");
                
                // 獲取場地信息
                Set<String> venues = new HashSet<>();
                Set<String> states = new HashSet<>();
                
                coachSessions.forEach(session -> {
                    if (session.getVenue() != null) {
                        venues.add(session.getVenue().getName());
                        states.add(session.getVenue().getState());
                        System.out.println("  - Session " + session.getId() + " at venue: " + session.getVenue().getName() + ", state: " + session.getVenue().getState());
                    } else if (session.getCourt() != null && session.getCourt().getVenue() != null) {
                        venues.add(session.getCourt().getVenue().getName());
                        states.add(session.getCourt().getVenue().getState());
                        System.out.println("  - Session " + session.getId() + " at court venue: " + session.getCourt().getVenue().getName() + ", state: " + session.getCourt().getVenue().getState());
                    }
                });
                
                String venue = venues.isEmpty() ? "Sunway Arena" : venues.iterator().next();
                String state = states.isEmpty() ? "Selangor" : states.iterator().next();
                
                coachInfo.put("venue", venue);
                coachInfo.put("state", state);
                coachInfo.put("specialties", List.of("Pickleball", "Training")); // 默認專長
                coachInfo.put("sessionsCount", (int) availableSessionsCount);
                
                System.out.println("Coach info: " + coachInfo);
                return coachInfo;
            }).collect(Collectors.toList());
            
            System.out.println("Returning " + coachData.size() + " coaches");
            return ResponseEntity.ok(coachData);
        } catch (Exception e) {
            System.out.println("Error in getAllCoaches: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 獲取用戶的所有課程
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getUserSessions(@PathVariable Integer userId) {
        try {
            System.out.println("=== getUserSessions called for userId: " + userId + " ===");
            
            // 檢查用戶是否存在
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            // 獲取用戶的所有課程註冊
            List<ClassRegistration> registrations = classRegistrationRepository.findByMemberUserId(userId);
            System.out.println("Found " + registrations.size() + " registrations for user " + userId);
            
            List<Map<String, Object>> userSessions = registrations.stream().map(reg -> {
                ClassSession session = reg.getClassSession();
                Map<String, Object> sessionInfo = new HashMap<>();
                
                sessionInfo.put("id", session.getId());
                sessionInfo.put("title", session.getTitle());
                sessionInfo.put("startTime", session.getStartTime());
                sessionInfo.put("endTime", session.getEndTime());
                sessionInfo.put("status", session.getStatus());
                sessionInfo.put("price", session.getPrice());
                sessionInfo.put("recurringGroupId", session.getRecurringGroupId());
                sessionInfo.put("replacementForSessionId", session.getReplacementForSessionId());
                
                // 教練信息
                if (session.getCoach() != null) {
                    sessionInfo.put("coachName", session.getCoach().getName());
                    sessionInfo.put("coachId", session.getCoach().getId());
                }
                
                // 場地信息
                if (session.getVenue() != null) {
                    sessionInfo.put("venue", session.getVenue().getName());
                    sessionInfo.put("state", session.getVenue().getState());
                } else if (session.getCourt() != null && session.getCourt().getVenue() != null) {
                    sessionInfo.put("venue", session.getCourt().getVenue().getName());
                    sessionInfo.put("state", session.getCourt().getVenue().getState());
                }
                
                // 球場信息
                if (session.getCourt() != null) {
                    sessionInfo.put("court", session.getCourt().getName());
                }
                
                // 註冊信息
                sessionInfo.put("registrationId", reg.getId());
                sessionInfo.put("registrationDate", reg.getRegistrationDate());
                sessionInfo.put("attendanceStatus", reg.getAttendanceStatus());
                
                // 教練對用戶的評價（如果有）
                sessionInfo.put("coachComment", reg.getCoachComment());
                
                // 用戶對教練的評價（從 feedback 表獲取）
                try {
                    if (session.getCoach() != null) {
                        // 查找用戶對這個教練的評價
                        List<Feedback> userFeedbacks = feedbackRepository.findByUserId(user.getId());
                        
                        if (!userFeedbacks.isEmpty()) {
                            // 找到用戶對這個教練的評價
                            Feedback userFeedback = userFeedbacks.stream()
                                .filter(feedback -> 
                                    feedback.getTargetType() == Feedback.TargetType.COACH && 
                                    feedback.getTargetId().equals(session.getCoach().getId())
                                )
                                .findFirst()
                                .orElse(null);
                            
                            if (userFeedback != null) {
                                sessionInfo.put("userRating", userFeedback.getRating());
                                sessionInfo.put("userComment", userFeedback.getReview());
                                System.out.println("Found user feedback for session " + session.getId() + ": rating=" + userFeedback.getRating() + ", comment=" + userFeedback.getReview());
                            } else {
                                sessionInfo.put("userRating", null);
                                sessionInfo.put("userComment", null);
                            }
                        } else {
                            sessionInfo.put("userRating", null);
                            sessionInfo.put("userComment", null);
                        }
                    } else {
                        sessionInfo.put("userRating", null);
                        sessionInfo.put("userComment", null);
                    }
                } catch (Exception e) {
                    System.out.println("Error fetching user feedback for session " + session.getId() + ": " + e.getMessage());
                    sessionInfo.put("userRating", null);
                    sessionInfo.put("userComment", null);
                }
                
                System.out.println("Session " + session.getId() + " for user " + userId + ": " + sessionInfo);
                return sessionInfo;
            }).collect(Collectors.toList());
            
            System.out.println("Returning " + userSessions.size() + " sessions for user " + userId);
            return ResponseEntity.ok(userSessions);
            
        } catch (Exception e) {
            System.out.println("Error in getUserSessions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/leave-request")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitLeaveRequest(@PathVariable Integer sessionId, @RequestBody Map<String, Object> leaveData) {
        try {
            System.out.println("=== submitLeaveRequest called for sessionId: " + sessionId + " ===");
            System.out.println("Leave data: " + leaveData);
            
            // Get the current user from JWT token
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            System.out.println("Authentication name: " + username);
            
            // Try to find user by username first, then by email
            User user = userRepository.findByUserAccount_Username(username).orElse(null);
            if (user == null) {
                user = userRepository.findByEmail(username).orElse(null);
            }
            
            if (user == null) {
                System.out.println("User not found for username/email: " + username);
                return ResponseEntity.badRequest().body(Map.of("error", "User not found"));
            }
            
            System.out.println("Found user: " + user.getId() + " - " + user.getName());
            
            // Find the class session
            ClassSession session = classSessionRepository.findById(sessionId)
                    .orElseThrow(() -> new IllegalArgumentException("Session not found"));
            
            if (session.getCoach() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Session has no coach assigned"));
            }
            
            System.out.println("Found session: " + session.getId() + " with coach: " + session.getCoach().getId());
            
            // Create leave request using the new system
            String reason = (String) leaveData.get("reason");
            
            if (reason != null && !reason.trim().isEmpty()) {
                // Create leave request in the leave_request table
                LeaveRequestDto leaveRequest = leaveRequestService.createLeaveRequest(
                    user.getId(),
                    session.getCoach().getId(),
                    sessionId,
                    session.getStartTime(), // Use session start time as preferred date
                    reason,
                    "PENDING" // Default request type
                );
                
                System.out.println("Leave request created successfully: " + leaveRequest.getId());
                return ResponseEntity.ok(Map.of("message", "Leave request submitted successfully", "leaveRequestId", leaveRequest.getId()));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Reason is required"));
            }
            
        } catch (Exception e) {
            System.out.println("Error in submitLeaveRequest: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{sessionId}/review")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> submitReview(@PathVariable Integer sessionId, @RequestBody Map<String, Object> reviewData) {
        try {
            System.out.println("=== submitReview called for sessionId: " + sessionId + " ===");
            System.out.println("Review data: " + reviewData);
            
            // Get the current user from JWT token
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            System.out.println("Current user from JWT: " + username);
            
            // Try to find user by username first, then by email
            User user = userRepository.findByUserAccount_Username(username).orElse(null);
            if (user == null) {
                user = userRepository.findByEmail(username).orElse(null);
            }
            
            if (user == null) {
                System.out.println("User not found for username/email: " + username);
                return ResponseEntity.badRequest().body(Map.of("error", "User not found for: " + username));
            }

            System.out.println("Found user: " + user.getId() + " - " + user.getName());

            // Find the class registration for this user and session
            ClassRegistration registration = classRegistrationRepository.findByMemberUserIdAndClassSessionId(user.getId(), sessionId);
            
            if (registration == null) {
                System.out.println("Registration not found for user " + user.getId() + " and session " + sessionId);
                return ResponseEntity.badRequest().body(Map.of("error", "Registration not found for this session. Please make sure you are registered for this class."));
            }
            
            System.out.println("Found registration: " + registration.getId());

            // Get the class session to find the coach
            ClassSession session = classSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Class session not found"));
            }

            // Get review type from request
            String reviewType = (String) reviewData.get("reviewType");
            Integer rating = (Integer) reviewData.get("rating");
            String comment = (String) reviewData.get("comment");
            
            // 根據評價類型進行不同的處理
            if ("USER_TO_COACH".equals(reviewType)) {
                // 用戶對教練的評價 - 保存到 feedback 表
                if (session.getCoach() != null) {
                    try {
                        // 創建 feedback 記錄
                        Feedback feedback = new Feedback();
                        feedback.setTargetType(Feedback.TargetType.COACH);
                        feedback.setTargetId(session.getCoach().getId());
                        feedback.setRating(rating);
                        feedback.setReview(comment);
                        feedback.setUser(user);
                        feedback.setClassSessionId(sessionId); // 設置關聯的課程ID
                        feedback.setCreatedAt(LocalDateTime.now());

                        // 保存 feedback 記錄
                        feedbackRepository.save(feedback);
                        System.out.println("User to Coach feedback record created for coach: " + session.getCoach().getId());
                    } catch (Exception feedbackError) {
                        System.out.println("Error creating feedback record: " + feedbackError.getMessage());
                        return ResponseEntity.badRequest().body(Map.of("error", "Failed to create feedback record: " + feedbackError.getMessage()));
                    }
                }
                
                // 同時更新 registration 中的用戶評價字段
                if (rating != null && rating >= 1 && rating <= 5) {
                    registration.setRating(rating);
                    System.out.println("Setting user rating: " + rating);
                }
                
                if (comment != null) {
                    // 注意：這裡我們暫時不保存用戶評價到 registration 表
                    // 因為 coachComment 字段是用來存儲教練對用戶的評價
                    // 用戶對教練的評價只保存在 feedback 表中
                    System.out.println("User comment will be saved to feedback table only: " + comment);
                }
                
                classRegistrationRepository.save(registration);
                
            } else {
                // 默認處理（向後兼容）
                if (rating != null && rating >= 1 && rating <= 5) {
                    registration.setRating(rating);
                }
                
                if (comment != null) {
                    // 注意：這裡我們暫時不保存用戶評價到 registration 表
                    // 因為 coachComment 字段是用來存儲教練對用戶的評價
                    // 用戶對教練的評價只保存在 feedback 表中
                    System.out.println("User comment will be saved to feedback table only: " + comment);
                }
                
                classRegistrationRepository.save(registration);
            }

            System.out.println("Review submitted successfully for session " + sessionId + " by user " + user.getId());
            return ResponseEntity.ok(Map.of("message", "Review submitted successfully"));
            
        } catch (Exception e) {
            System.out.println("Error in submitReview: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error submitting review: " + e.getMessage()));
        }
    }

    // 教練給用戶的評價
    @PostMapping("/{sessionId}/coach-feedback")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> submitCoachFeedback(@PathVariable Integer sessionId, @RequestBody Map<String, Object> feedbackData) {
        try {
            System.out.println("=== submitCoachFeedback called for sessionId: " + sessionId + " ===");
            System.out.println("Feedback data: " + feedbackData);
            
            // Get the current coach from JWT token
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String username = authentication.getName();
            System.out.println("Current coach from JWT: " + username);
            
            // Try to find coach by username first, then by email
            User coach = userRepository.findByUserAccount_Username(username).orElse(null);
            if (coach == null) {
                coach = userRepository.findByEmail(username).orElse(null);
            }
            
            if (coach == null) {
                System.out.println("Coach not found for username/email: " + username);
                return ResponseEntity.badRequest().body(Map.of("error", "Coach not found for: " + username));
            }

            System.out.println("Found coach: " + coach.getId() + " - " + coach.getName());

            // Get the class session
            ClassSession session = classSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Class session not found"));
            }

            // Verify that the current user is the coach of this session
            if (!session.getCoach().getId().equals(coach.getId())) {
                return ResponseEntity.badRequest().body(Map.of("error", "You are not the coach of this session"));
            }

            // Get student ID from feedback data
            Integer studentId = (Integer) feedbackData.get("studentId");
            String comment = (String) feedbackData.get("comment");
            
            if (studentId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Student ID is required"));
            }

            // Find the class registration for this student and session
            ClassRegistration registration = classRegistrationRepository.findByMemberUserIdAndClassSessionId(studentId, sessionId);
            
            if (registration == null) {
                System.out.println("Registration not found for student " + studentId + " and session " + sessionId);
                return ResponseEntity.badRequest().body(Map.of("error", "Registration not found for this student and session"));
            }
            
            System.out.println("Found registration: " + registration.getId());

            // Update the registration with coach feedback
            if (comment != null) {
                registration.setCoachComment(comment);
                System.out.println("Setting coach comment: " + comment);
            }
            
            classRegistrationRepository.save(registration);

            System.out.println("Coach feedback submitted successfully for session " + sessionId + " for student " + studentId);
            return ResponseEntity.ok(Map.of("message", "Coach feedback submitted successfully"));
            
        } catch (Exception e) {
            System.out.println("Error in submitCoachFeedback: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", "Error submitting coach feedback: " + e.getMessage()));
        }
    }

    // 獲取教練可用時間（供用戶查看補課時間）
    @GetMapping("/coach/{coachId}/available-times")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCoachAvailableTimes(
            @PathVariable Integer coachId,
            @RequestParam String start,
            @RequestParam String end) {
        try {
            System.out.println("=== getCoachAvailableTimes called for coachId: " + coachId + " ===");
            System.out.println("Start: " + start + ", End: " + end);
            
            // 解析日期時間
            LocalDateTime startDateTime = OffsetDateTime.parse(start).toLocalDateTime();
            LocalDateTime endDateTime = OffsetDateTime.parse(end).toLocalDateTime();
            
            // 獲取教練在指定時間範圍內的可用課程
            List<ClassSession> availableSessions = classSessionService.getCoachSchedule(coachId, startDateTime, endDateTime);
            
            // 過濾出狀態為 AVAILABLE 的課程
            List<ClassSession> availableTimes = availableSessions.stream()
                .filter(session -> "AVAILABLE".equals(session.getStatus()))
                .collect(Collectors.toList());
            
            System.out.println("Found " + availableTimes.size() + " available times for coach " + coachId);
            
            // 轉換為 DTO
            List<Map<String, Object>> result = availableTimes.stream().map(session -> {
                Map<String, Object> sessionMap = new HashMap<>();
                sessionMap.put("id", session.getId());
                sessionMap.put("startTime", session.getStartTime());
                sessionMap.put("endTime", session.getEndTime());
                sessionMap.put("title", session.getTitle());
                sessionMap.put("description", session.getDescription());
                sessionMap.put("price", session.getPrice());
                // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
                Venue venue = session.getVenue();
                if (venue == null && session.getCourt() != null) {
                    venue = session.getCourt().getVenue();
                }
                sessionMap.put("venue", venue != null ? venue.getName() : null);
                sessionMap.put("state", venue != null ? venue.getState() : null);
                sessionMap.put("court", session.getCourt() != null ? session.getCourt().getName() : null);
                return sessionMap;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Error in getCoachAvailableTimes: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{sessionId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> updateClassSession(
            @PathVariable Integer sessionId,
            @RequestBody ClassSessionDto sessionDto) {
        try {
            ClassSession updated = classSessionService.updateClassSession(sessionId, sessionDto);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 新增：部分更新課程（只更新特定字段）
    @PatchMapping("/{sessionId}")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> partialUpdateClassSession(
            @PathVariable Integer sessionId,
            @RequestBody Map<String, Object> updates) {
        try {
            // 调试信息
            System.out.println("=== PATCH Request Debug ===");
            System.out.println("Session ID: " + sessionId);
            System.out.println("Updates: " + updates);
            
            ClassSession updated = classSessionService.partialUpdateClassSession(sessionId, updates);
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            System.out.println("PATCH Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 教練取消課程
    @PutMapping("/{sessionId}/cancel")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<?> cancelClassSession(
        @PathVariable Integer sessionId,
        @RequestParam(value = "force", defaultValue = "false") boolean force,
        @RequestParam(value = "reason", required = false) String reason
    ) {
        try {
            classSessionService.cancelClassSession(sessionId, force, reason);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 用戶取消課程（取消自己的預訂）
    @PutMapping("/{sessionId}/cancel-registration")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelUserRegistration(
        @PathVariable Integer sessionId,
        @RequestParam(value = "force", defaultValue = "false") boolean force,
        @RequestParam(value = "reason", required = false) String reason,
        Principal principal
    ) {
        try {
            // 獲取當前用戶
            User user = userRepository.findByUserAccount_Username(principal.getName())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            // 檢查用戶是否已預訂此課程
            ClassRegistration registration = classRegistrationRepository
                    .findByMemberUserIdAndClassSessionId(user.getId(), sessionId);
            if (registration == null) {
                throw new ResourceNotFoundException("Registration not found");
            }
            
            // 檢查24小時限制
            ClassSession session = registration.getClassSession();
            LocalDateTime now = LocalDateTime.now();
            long hoursUntilSession = java.time.temporal.ChronoUnit.HOURS.between(now, session.getStartTime());
            
            if (hoursUntilSession <= 24 && !force) {
                throw new ConflictException("Cannot cancel class session within 24 hours of start time. Use force=true to override.");
            }
            
            // 使用託管帳戶退款
            Member member = registration.getMember();
            escrowAccountService.refundFromEscrow(user, session.getPrice(), session);
            
            // 發送email通知
            String email = user.getEmail();
            String subject = "Class Session Cancellation Confirmed";
            String content = String.format(
                "Dear %s,\n\n" +
                "Your class session cancellation has been confirmed.\n\n" +
                "Session Details:\n" +
                "- Title: %s\n" +
                "- Date: %s\n" +
                "- Time: %s - %s\n" +
                "- Coach: %s\n" +
                "- Venue: %s\n\n" +
                "Refund Amount: RM %.2f\n" +
                "The refund has been processed to your wallet.\n\n" +
                "Thank you,\n" +
                "The Pickleball Management Team",
                user.getName(),
                session.getTitle(),
                session.getStartTime().toLocalDate(),
                session.getStartTime().toLocalTime(),
                session.getEndTime().toLocalTime(),
                session.getCoach() != null ? session.getCoach().getName() : "N/A",
                session.getVenue() != null ? session.getVenue().getName() : 
                (session.getCourt() != null && session.getCourt().getVenue() != null ? 
                 session.getCourt().getVenue().getName() : "N/A"),
                session.getPrice()
            );
            
            if (reason != null && !reason.isEmpty()) {
                content += "\n\nCancellation Reason: " + reason;
            }
            
            // 获取用户对象以检查通知偏好
            User userForEmail = userRepository.findByEmail(email).orElse(null);
            if (userForEmail != null) {
                emailService.sendEmailIfEnabled(userForEmail, subject, content);
            } else {
                // 如果找不到用户，直接发送邮件（向后兼容）
                emailService.sendEmail(email, subject, content);
            }
            
            // 刪除預訂記錄
            classRegistrationRepository.delete(registration);
            
            // 更新課程人數
            session.setCurrentParticipants(session.getCurrentParticipants() - 1);
            if (session.getCurrentParticipants() < session.getMaxParticipants() && 
                "FULL".equals(session.getStatus())) {
                session.setStatus("AVAILABLE");
            }
            classSessionRepository.save(session);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Registration cancelled and refund processed"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 測試端點：檢查特定教練的所有課程
    @GetMapping("/test-coach-sessions/{coachId}")
    public ResponseEntity<?> testCoachSessions(@PathVariable Integer coachId, @RequestParam(required = false) Integer userId) {
        try {
            System.out.println("=== testCoachSessions called for coachId: " + coachId + " ===");
            System.out.println("userId: " + userId);
            
            // 檢查教練是否存在
            User coach = userRepository.findById(coachId).orElse(null);
            if (coach == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Coach not found"));
            }
            System.out.println("Coach found: " + coach.getName() + " (Type: " + coach.getUserType() + ")");
            
            // 獲取所有課程
            List<ClassSession> allSessions = classSessionRepository.findAll();
            System.out.println("Total sessions in database: " + allSessions.size());
            
            // 過濾該教練的課程，只顯示 AVAILABLE 狀態的，排除補課課程
            List<ClassSession> coachSessions = allSessions.stream()
                .filter(s -> s.getCoach() != null && 
                           s.getCoach().getId().equals(coachId) && 
                           "AVAILABLE".equals(s.getStatus()) &&
                           s.getReplacementForSessionId() == null) // 排除補課課程
                .collect(Collectors.toList());
            
            // 如果提供了 userId，進一步過濾掉用戶已經預訂的課程
            if (userId != null) {
                List<ClassSession> filteredSessions = new ArrayList<>();
                for (ClassSession session : coachSessions) {
                    boolean userBooked = false;
                    if (session.getRegistrations() != null) {
                        for (ClassRegistration reg : session.getRegistrations()) {
                            if (reg.getMember() != null && 
                                reg.getMember().getUser() != null && 
                                reg.getMember().getUser().getId().equals(userId)) {
                                userBooked = true;
                                break;
                            }
                        }
                    }
                    if (!userBooked) {
                        filteredSessions.add(session);
                    }
                }
                coachSessions = filteredSessions;
                System.out.println("After filtering user bookings, remaining sessions: " + coachSessions.size());
            }
            
            System.out.println("Coach sessions found: " + coachSessions.size());
            
            // 詳細輸出每個課程
            coachSessions.forEach(session -> {
                System.out.println("Session " + session.getId() + ":");
                System.out.println("  - Title: " + session.getTitle());
                System.out.println("  - Status: " + session.getStatus());
                System.out.println("  - Start Time: " + session.getStartTime());
                // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
                Venue venue = session.getVenue();
                if (venue == null && session.getCourt() != null) {
                    venue = session.getCourt().getVenue();
                }
                System.out.println("  - Venue: " + (venue != null ? venue.getName() : "null"));
                System.out.println("  - Court: " + (session.getCourt() != null ? session.getCourt().getName() : "null"));
            });
            
            // 按狀態分組
            Map<String, Long> statusCount = coachSessions.stream()
                .collect(Collectors.groupingBy(s -> s.getStatus(), Collectors.counting()));
            System.out.println("Sessions by status: " + statusCount);
            
            Map<String, Object> result = new HashMap<>();
            result.put("coachId", coachId);
            result.put("coachName", coach.getName());
            result.put("totalSessions", coachSessions.size());
            result.put("sessionsByStatus", statusCount);
            result.put("sessions", coachSessions.stream().map(s -> {
                Map<String, Object> sessionInfo = new HashMap<>();
                sessionInfo.put("id", s.getId());
                sessionInfo.put("title", s.getTitle());
                sessionInfo.put("status", s.getStatus());
                sessionInfo.put("startTime", s.getStartTime());
                sessionInfo.put("endTime", s.getEndTime());
                sessionInfo.put("price", s.getPrice());
                sessionInfo.put("recurringGroupId", s.getRecurringGroupId());
                // 優先使用直接關聯的 venue，如果沒有則使用 court 的 venue
                Venue venue = s.getVenue();
                if (venue == null && s.getCourt() != null) {
                    venue = s.getCourt().getVenue();
                }
                sessionInfo.put("venue", venue != null ? venue.getName() : null);
                sessionInfo.put("venueState", venue != null ? venue.getState() : null);
                sessionInfo.put("court", s.getCourt() != null ? s.getCourt().getName() : null);
                
                // 添加註冊信息
                if (s.getRegistrations() != null && !s.getRegistrations().isEmpty()) {
                    List<Map<String, Object>> registrations = s.getRegistrations().stream().map(reg -> {
                        Map<String, Object> regInfo = new HashMap<>();
                        regInfo.put("registrationId", reg.getId());
                        regInfo.put("userId", reg.getMember() != null && reg.getMember().getUser() != null ? 
                            reg.getMember().getUser().getId() : null);
                        regInfo.put("memberName", reg.getMember() != null && reg.getMember().getUser() != null ? 
                            reg.getMember().getUser().getName() : null);
                        regInfo.put("registrationDate", reg.getRegistrationDate());
                        return regInfo;
                    }).collect(Collectors.toList());
                    sessionInfo.put("registrations", registrations);
                } else {
                    sessionInfo.put("registrations", new ArrayList<>());
                }
                
                return sessionInfo;
            }).collect(Collectors.toList()));
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Error in testCoachSessions: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 新增：手動觸發課程結算（僅管理員可操作）
    @PostMapping("/{sessionId}/settle")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> manuallySettleSession(@PathVariable Integer sessionId) {
        try {
            classSessionService.settleClassSession(sessionId);
            return ResponseEntity.ok(Map.of(
                "message", "Session settled successfully",
                "sessionId", sessionId
            ));
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error settling session: " + e.getMessage());
        }
    }

    // 新增：獲取課程結算狀態
    @GetMapping("/{sessionId}/settlement-status")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<?> getSessionSettlementStatus(@PathVariable Integer sessionId) {
        try {
            ClassSession session = classSessionService.getSessionById(sessionId);
            if (session == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Session not found");
            }

            // 檢查是否有託管支付記錄
            List<Payment> escrowedPayments = paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                    .stream()
                    .filter(payment -> payment.getTransactionId() != null &&
                            payment.getTransactionId().startsWith("SESSION_" + sessionId + "_"))
                    .collect(java.util.stream.Collectors.toList());

            // 檢查是否有結算記錄
            List<Payment> settlementPayments = paymentRepository.findByPaymentTypeAndStatus("COACH_INCOME", "COMPLETED")
                    .stream()
                    .filter(payment -> payment.getTransactionId() != null &&
                            payment.getTransactionId().equals("SETTLEMENT_" + sessionId))
                    .collect(java.util.stream.Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("sessionId", sessionId);
            response.put("sessionStatus", session.getStatus());
            response.put("escrowedPaymentsCount", escrowedPayments.size());
            response.put("escrowedAmount", escrowedPayments.stream().mapToDouble(Payment::getAmount).sum());
            response.put("settlementPaymentsCount", settlementPayments.size());
            response.put("isSettled", !settlementPayments.isEmpty());
            response.put("note", session.getNote());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error getting settlement status: " + e.getMessage());
        }
    }
}