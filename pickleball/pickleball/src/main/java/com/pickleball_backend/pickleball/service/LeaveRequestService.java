package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.LeaveRequestDto;
import com.pickleball_backend.pickleball.entity.LeaveRequest;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.entity.ClassRegistration;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.repository.LeaveRequestRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.ClassSessionRepository;
import com.pickleball_backend.pickleball.repository.ClassRegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class LeaveRequestService {
    
    @Autowired
    private LeaveRequestRepository leaveRequestRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ClassSessionRepository classSessionRepository;
    
    @Autowired
    private ClassRegistrationRepository classRegistrationRepository;
    
    // 創建補課請求
    @Transactional
    public LeaveRequestDto createLeaveRequest(Integer studentId, Integer coachId, Integer sessionId, 
                                            LocalDateTime preferredDate, String reason, String requestType) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found"));
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new IllegalArgumentException("Coach not found"));
        ClassSession session = classSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        
        LeaveRequest leaveRequest = new LeaveRequest();
        leaveRequest.setStudent(student);
        leaveRequest.setCoach(coach);
        leaveRequest.setOriginalSession(session);
        leaveRequest.setOriginalDate(session.getStartTime());
        leaveRequest.setPreferredDate(preferredDate);
        leaveRequest.setReason(reason);
        
        // 根據請求類型設置狀態
        if ("SELF_SELECT".equals(requestType)) {
            leaveRequest.setStatus(LeaveRequest.LeaveRequestStatus.SELF_SELECTED);
        } else if ("MESSAGE_COACH".equals(requestType)) {
            leaveRequest.setStatus(LeaveRequest.LeaveRequestStatus.MESSAGE_SENT);
        } else if ("PENDING".equals(requestType)) {
            leaveRequest.setStatus(LeaveRequest.LeaveRequestStatus.PENDING);
        } else {
            // 默認創建草稿狀態
            leaveRequest.setStatus(LeaveRequest.LeaveRequestStatus.DRAFT);
        }
        
        LeaveRequest saved = leaveRequestRepository.save(leaveRequest);
        return convertToDto(saved);
    }
    
    // 獲取教練的待處理請求
    public List<LeaveRequestDto> getPendingRequestsByCoach(Integer coachId) {
        System.out.println("=== Service: getPendingRequestsByCoach ===");
        System.out.println("coachId: " + coachId);
        List<LeaveRequest> requests = leaveRequestRepository.findPendingRequestsByCoachId(coachId);
        System.out.println("Repository returned " + requests.size() + " requests");
        for (LeaveRequest request : requests) {
            System.out.println("Raw request - ID: " + request.getId() + ", Status: " + request.getStatus() + ", Student: " + (request.getStudent() != null ? request.getStudent().getName() : "null"));
        }
        List<LeaveRequestDto> dtos = requests.stream().map(this::convertToDto).collect(Collectors.toList());
        System.out.println("Converted to " + dtos.size() + " DTOs");
        return dtos;
    }
    
    // 獲取教練的所有請求
    public List<LeaveRequestDto> getAllRequestsByCoach(Integer coachId) {
        List<LeaveRequest> requests = leaveRequestRepository.findAllRequestsByCoachId(coachId);
        return requests.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    // 獲取學生的所有請求
    public List<LeaveRequestDto> getAllRequestsByStudent(Integer studentId) {
        List<LeaveRequest> requests = leaveRequestRepository.findAllRequestsByStudentId(studentId);
        return requests.stream().map(this::convertToDto).collect(Collectors.toList());
    }
    
    // 更新請假請求狀態
    @Transactional
    public LeaveRequestDto updateLeaveRequest(Integer requestId, String status, LocalDateTime preferredDate) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
        
        // 更新狀態
        if ("DRAFT".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.DRAFT);
        } else if ("PENDING".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.PENDING);
        } else if ("SELF_SELECTED".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.SELF_SELECTED);
        } else if ("MESSAGE_SENT".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.MESSAGE_SENT);
        } else if ("APPROVED".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.APPROVED);
        } else if ("DECLINED".equals(status)) {
            request.setStatus(LeaveRequest.LeaveRequestStatus.DECLINED);
        }
        
        // 更新偏好日期
        if (preferredDate != null) {
            request.setPreferredDate(preferredDate);
        }
        
        LeaveRequest saved = leaveRequestRepository.save(request);
        return convertToDto(saved);
    }
    
    // 批准請求並安排補課
    @Transactional
    public LeaveRequestDto approveRequest(Integer requestId, Integer replacementSessionId, String coachNotes) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
        
        ClassSession replacementSession = null;
        if (replacementSessionId != null) {
            replacementSession = classSessionRepository.findById(replacementSessionId)
                    .orElseThrow(() -> new IllegalArgumentException("Replacement session not found"));
            
            // 設置補課課程的 replacementForSessionId
            System.out.println("=== Setting replacementForSessionId ===");
            System.out.println("Original session ID: " + request.getOriginalSession().getId());
            System.out.println("Replacement session ID: " + replacementSessionId);
            System.out.println("Before setting - replacementForSessionId: " + replacementSession.getReplacementForSessionId());
            
            replacementSession.setReplacementForSessionId(request.getOriginalSession().getId());
            classSessionRepository.save(replacementSession);
            
            // 重新获取并验证
            ClassSession savedSession = classSessionRepository.findById(replacementSessionId).orElse(null);
            System.out.println("After saving - replacementForSessionId: " + (savedSession != null ? savedSession.getReplacementForSessionId() : "null"));
            System.out.println("Set replacementForSessionId: " + request.getOriginalSession().getId() + " for session: " + replacementSessionId);
            
            // 自動將學生註冊到補課課程
            User student = userRepository.findById(request.getStudent().getId())
                    .orElseThrow(() -> new IllegalArgumentException("Student not found"));
            
            // 獲取學生的 Member 對象
            Member studentMember = student.getMember();
            if (studentMember == null) {
                throw new IllegalArgumentException("Student member not found");
            }
            
            // 檢查學生是否已經註冊到這個課程
            boolean alreadyRegistered = classRegistrationRepository.existsByClassSessionAndMemberUserId(
                replacementSession, student.getId());
            
            if (!alreadyRegistered) {
                // 創建新的註冊記錄
                ClassRegistration registration = new ClassRegistration();
                registration.setClassSession(replacementSession);
                registration.setMember(studentMember);
                registration.setRegistrationDate(LocalDateTime.now());
                registration.setAttendanceStatus("MAKEUP"); // 補課課程標記為 MAKEUP
                
                classRegistrationRepository.save(registration);
                System.out.println("Student " + student.getId() + " automatically registered for replacement session " + replacementSessionId);
            } else {
                System.out.println("Student " + student.getId() + " already registered for replacement session " + replacementSessionId);
            }
        }
        
        request.setStatus(LeaveRequest.LeaveRequestStatus.APPROVED);
        request.setReplacementSession(replacementSession);
        request.setCoachNotes(coachNotes);
        request.setResolvedDate(LocalDateTime.now());
        
        LeaveRequest saved = leaveRequestRepository.save(request);
        return convertToDto(saved);
    }
    
    // 拒絕請求
    @Transactional
    public LeaveRequestDto declineRequest(Integer requestId, String coachNotes) {
        LeaveRequest request = leaveRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Leave request not found"));
        
        request.setStatus(LeaveRequest.LeaveRequestStatus.DECLINED);
        request.setCoachNotes(coachNotes);
        request.setResolvedDate(LocalDateTime.now());
        
        LeaveRequest saved = leaveRequestRepository.save(request);
        return convertToDto(saved);
    }
    
    // 統計教練的待處理請求數量
    public long getPendingRequestCount(Integer coachId) {
        return leaveRequestRepository.countPendingRequestsByCoachId(coachId);
    }
    
    // 獲取可用的補課時間（排除已預約的課程）
    public List<Map<String, Object>> getAvailableReplacementSessions(Integer coachId, Integer studentId) {
        System.out.println("=== getAvailableReplacementSessions called ===");
        System.out.println("coachId: " + coachId + ", studentId: " + studentId);
        
        // 獲取教練的所有課程（不限時間範圍）
        List<ClassSession> allCoachSessions = classSessionRepository.findAll();
        System.out.println("Total sessions in database: " + allCoachSessions.size());
        
        // 過濾該教練的課程
        List<ClassSession> coachSessions = allCoachSessions.stream()
                .filter(session -> session.getCoach() != null && 
                                 session.getCoach().getId().equals(coachId))
                .collect(Collectors.toList());
        System.out.println("Coach sessions found: " + coachSessions.size());
        
        // 過濾出 AVAILABLE 狀態且允許補課的課程
        List<ClassSession> availableSessions = coachSessions.stream()
                .filter(session -> "AVAILABLE".equals(session.getStatus()) && 
                                 Boolean.TRUE.equals(session.getAllowReplacement()))
                .collect(Collectors.toList());
        System.out.println("Available replacement sessions found: " + availableSessions.size());
        
        // 獲取學生已預約的課程
        List<ClassRegistration> studentRegistrations = classRegistrationRepository.findByMemberUserId(studentId);
        List<Integer> studentBookedSessionIds = studentRegistrations.stream()
                .map(reg -> reg.getClassSession().getId())
                .collect(Collectors.toList());
        System.out.println("Student booked session IDs: " + studentBookedSessionIds);
        
        // 過濾掉學生已預約的課程
        List<ClassSession> filteredSessions = availableSessions.stream()
                .filter(session -> !studentBookedSessionIds.contains(session.getId()))
                .collect(Collectors.toList());
        System.out.println("After filtering user bookings, remaining sessions: " + filteredSessions.size());
        
        // 轉換為 Map 格式
        return filteredSessions.stream().map(session -> {
            Map<String, Object> sessionMap = new HashMap<>();
            sessionMap.put("id", session.getId());
            sessionMap.put("title", session.getTitle());
            sessionMap.put("startTime", session.getStartTime());
            sessionMap.put("endTime", session.getEndTime());
            sessionMap.put("maxParticipants", session.getMaxParticipants());
            sessionMap.put("currentParticipants", session.getCurrentParticipants());
            sessionMap.put("allowReplacement", session.getAllowReplacement());
            
            if (session.getCourt() != null) {
                sessionMap.put("courtName", session.getCourt().getName());
                if (session.getCourt().getVenue() != null) {
                    sessionMap.put("venueName", session.getCourt().getVenue().getName());
                    sessionMap.put("state", session.getCourt().getVenue().getState());
                }
            }
            
            return sessionMap;
        }).collect(Collectors.toList());
    }
    
    // 轉換為 DTO
    private LeaveRequestDto convertToDto(LeaveRequest request) {
        LeaveRequestDto dto = new LeaveRequestDto();
        dto.setId(request.getId());
        dto.setStudentId(request.getStudent().getId());
        dto.setStudentName(request.getStudent().getName());
        dto.setStudentEmail(request.getStudent().getEmail());
        dto.setCoachId(request.getCoach().getId());
        dto.setCoachName(request.getCoach().getName());
        dto.setOriginalSessionId(request.getOriginalSession().getId());
        dto.setOriginalSessionTitle(request.getOriginalSession().getTitle());
        dto.setOriginalDate(request.getOriginalDate());
        dto.setPreferredDate(request.getPreferredDate());
        dto.setOriginalSessionStartTime(request.getOriginalSession().getStartTime());
        dto.setOriginalSessionEndTime(request.getOriginalSession().getEndTime());
        
        // 調試信息
        System.out.println("=== convertToDto Debug ===");
        System.out.println("Request ID: " + request.getId());
        System.out.println("Original Session ID: " + request.getOriginalSession().getId());
        System.out.println("Original Session Start: " + request.getOriginalSession().getStartTime());
        System.out.println("Original Session End: " + request.getOriginalSession().getEndTime());
        if (request.getOriginalSession().getStartTime() != null && request.getOriginalSession().getEndTime() != null) {
            long durationHours = java.time.Duration.between(
                request.getOriginalSession().getStartTime(), 
                request.getOriginalSession().getEndTime()
            ).toHours();
            long durationMinutes = java.time.Duration.between(
                request.getOriginalSession().getStartTime(), 
                request.getOriginalSession().getEndTime()
            ).toMinutes() % 60;
            System.out.println("Calculated duration: " + durationHours + " hours " + durationMinutes + " minutes");
        } else {
            System.out.println("WARNING: Start time or end time is null!");
        }
        dto.setReason(request.getReason());
        dto.setStatus(request.getStatus());
        dto.setRequestDate(request.getRequestDate());
        dto.setCoachNotes(request.getCoachNotes());
        
        if (request.getReplacementSession() != null) {
            dto.setReplacementSessionId(request.getReplacementSession().getId());
            dto.setReplacementSessionTitle(request.getReplacementSession().getTitle());
        }
        
        dto.setResolvedDate(request.getResolvedDate());
        
        // 設置場地信息
        if (request.getOriginalSession().getCourt() != null) {
            dto.setCourt(request.getOriginalSession().getCourt().getName());
            if (request.getOriginalSession().getCourt().getVenue() != null) {
                dto.setVenue(request.getOriginalSession().getCourt().getVenue().getName());
                dto.setState(request.getOriginalSession().getCourt().getVenue().getState());
            }
        }
        
        return dto;
    }
} 