package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.LeaveRequestDto;
import com.pickleball_backend.pickleball.entity.LeaveRequest;
import com.pickleball_backend.pickleball.service.LeaveRequestService;
import com.pickleball_backend.pickleball.repository.LeaveRequestRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.stream.Collectors;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.repository.ClassSessionRepository;

@RestController
@RequestMapping("/api/leave-requests")
public class LeaveRequestController {
    
    @Autowired
    private LeaveRequestService leaveRequestService;
    
    @Autowired
    private LeaveRequestRepository leaveRequestRepository;
    
    @Autowired
    private ClassSessionRepository classSessionRepository;
    
    // 創建補課請求
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LeaveRequestDto> createLeaveRequest(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            Integer studentId = (Integer) request.get("studentId");
            Integer coachId = (Integer) request.get("coachId");
            Integer sessionId = (Integer) request.get("sessionId");
            String preferredDateStr = (String) request.get("preferredDate");
            String reason = (String) request.get("reason");
            String requestType = (String) request.get("requestType");
            
            LocalDateTime preferredDate = null;
            if (preferredDateStr != null && !preferredDateStr.trim().isEmpty()) {
                try {
                    System.out.println("=== LeaveRequestController.createLeaveRequest ===");
                    System.out.println("preferredDateStr: " + preferredDateStr);
                    // 嘗試解析 ISO 格式的日期時間字符串
                    preferredDate = LocalDateTime.parse(preferredDateStr);
                    System.out.println("Parsed preferredDate: " + preferredDate);
                } catch (Exception e) {
                    System.out.println("Failed to parse preferredDate: " + e.getMessage());
                    // 如果解析失敗，設置為特殊值表示需要教練安排
                    preferredDate = LocalDateTime.of(1900, 1, 1, 0, 0, 0);
                    System.out.println("Setting preferredDate to special value for coach arrangement");
                }
            } else {
                System.out.println("preferredDateStr is null or empty, setting preferredDate to special value for coach arrangement");
                // 設置為特殊值表示需要教練安排
                preferredDate = LocalDateTime.of(1900, 1, 1, 0, 0, 0);
            }
            
            LeaveRequestDto result = leaveRequestService.createLeaveRequest(studentId, coachId, sessionId, preferredDate, reason, requestType);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 獲取教練的待處理請求
    @GetMapping("/coach/pending")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<List<LeaveRequestDto>> getPendingRequestsByCoach(@RequestParam Integer coachId) {
        System.out.println("=== Controller: getPendingRequestsByCoach ===");
        System.out.println("coachId: " + coachId);
        List<LeaveRequestDto> requests = leaveRequestService.getPendingRequestsByCoach(coachId);
        System.out.println("Found " + requests.size() + " pending requests");
        for (LeaveRequestDto request : requests) {
            System.out.println("Request ID: " + request.getId() + ", Status: " + request.getStatus() + ", Student: " + request.getStudentName());
        }
        return ResponseEntity.ok(requests);
    }
    
    // 獲取教練的所有請求
    @GetMapping("/coach/all")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<List<LeaveRequestDto>> getAllRequestsByCoach(@RequestParam Integer coachId) {
        List<LeaveRequestDto> requests = leaveRequestService.getAllRequestsByCoach(coachId);
        return ResponseEntity.ok(requests);
    }
    
    // 獲取學生的所有請求
    @GetMapping("/student")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<LeaveRequestDto>> getAllRequestsByStudent(@RequestParam Integer studentId) {
        List<LeaveRequestDto> requests = leaveRequestService.getAllRequestsByStudent(studentId);
        return ResponseEntity.ok(requests);
    }
    
    // 更新請假請求狀態
    @PutMapping("/{requestId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<LeaveRequestDto> updateLeaveRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, Object> request) {
        try {
            String status = (String) request.get("status");
            String preferredDateStr = (String) request.get("preferredDate");
            
            LocalDateTime preferredDate = null;
            if (preferredDateStr != null && !preferredDateStr.trim().isEmpty()) {
                try {
                    preferredDate = LocalDateTime.parse(preferredDateStr);
                } catch (Exception e) {
                    preferredDate = LocalDateTime.of(1900, 1, 1, 0, 0, 0);
                }
            }
            
            LeaveRequestDto result = leaveRequestService.updateLeaveRequest(requestId, status, preferredDate);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 批准請求
    @PutMapping("/{requestId}/approve")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<LeaveRequestDto> approveRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, Object> request) {
        try {
            Integer replacementSessionId = (Integer) request.get("replacementSessionId");
            String coachNotes = (String) request.get("coachNotes");
            
            LeaveRequestDto result = leaveRequestService.approveRequest(requestId, replacementSessionId, coachNotes);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 拒絕請求
    @PutMapping("/{requestId}/decline")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<LeaveRequestDto> declineRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, Object> request) {
        try {
            String coachNotes = (String) request.get("coachNotes");
            
            LeaveRequestDto result = leaveRequestService.declineRequest(requestId, coachNotes);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 獲取教練的待處理請求數量
    @GetMapping("/coach/pending-count")
    @PreAuthorize("hasAuthority('ROLE_COACH')")
    public ResponseEntity<Map<String, Long>> getPendingRequestCount(@RequestParam Integer coachId) {
        long count = leaveRequestService.getPendingRequestCount(coachId);
        return ResponseEntity.ok(Map.of("count", count));
    }
    
    // 獲取可用的補課時間（排除已預約的課程）
    @GetMapping("/available-replacement-sessions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<Map<String, Object>>> getAvailableReplacementSessions(
            @RequestParam Integer coachId,
            @RequestParam Integer studentId) {
        try {
            System.out.println("=== Controller: getAvailableReplacementSessions ===");
            System.out.println("coachId: " + coachId + ", studentId: " + studentId);
            
            List<Map<String, Object>> availableSessions = leaveRequestService.getAvailableReplacementSessions(coachId, studentId);
            System.out.println("Controller returning " + availableSessions.size() + " sessions");
            
            return ResponseEntity.ok(availableSessions);
        } catch (Exception e) {
            System.out.println("Controller error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }
    
    // 調試端點：檢查所有請假請求
    @GetMapping("/debug/all-requests")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> debugAllRequests() {
        try {
            System.out.println("=== Debug: All Leave Requests ===");
            List<LeaveRequest> allRequests = leaveRequestRepository.findAll();
            System.out.println("Total leave requests in database: " + allRequests.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalRequests", allRequests.size());
            
            List<Map<String, Object>> requestsData = new ArrayList<>();
            for (LeaveRequest request : allRequests) {
                Map<String, Object> requestData = new HashMap<>();
                requestData.put("id", request.getId());
                requestData.put("coachId", request.getCoach() != null ? request.getCoach().getId() : "null");
                requestData.put("studentId", request.getStudent() != null ? request.getStudent().getId() : "null");
                requestData.put("studentName", request.getStudent() != null ? request.getStudent().getName() : "null");
                requestData.put("status", request.getStatus());
                requestData.put("reason", request.getReason());
                requestData.put("requestDate", request.getRequestDate());
                requestsData.add(requestData);
                
                System.out.println("Request " + request.getId() + ": Coach=" + requestData.get("coachId") + 
                                 ", Student=" + requestData.get("studentName") + ", Status=" + request.getStatus());
            }
            result.put("requests", requestsData);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Debug error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }
    }

    // 調試端點：檢查教練課程數據
    @GetMapping("/debug/coach-sessions")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> debugCoachSessions(@RequestParam Integer coachId) {
        try {
            System.out.println("=== Debug: Checking coach sessions for coachId: " + coachId + " ===");
            
            // 獲取所有課程
            List<ClassSession> allSessions = classSessionRepository.findAll();
            System.out.println("Total sessions in database: " + allSessions.size());
            
            // 過濾該教練的課程
            List<ClassSession> coachSessions = allSessions.stream()
                    .filter(session -> session.getCoach() != null && 
                                     session.getCoach().getId().equals(coachId))
                    .collect(Collectors.toList());
            System.out.println("Coach sessions found: " + coachSessions.size());
            
            // 按狀態分組
            Map<String, Long> statusCount = coachSessions.stream()
                    .collect(Collectors.groupingBy(s -> s.getStatus(), Collectors.counting()));
            System.out.println("Sessions by status: " + statusCount);
            
            // 詳細信息
            List<Map<String, Object>> sessionDetails = coachSessions.stream()
                    .map(session -> {
                        Map<String, Object> detail = new HashMap<>();
                        detail.put("id", session.getId());
                        detail.put("title", session.getTitle());
                        detail.put("status", session.getStatus());
                        detail.put("startTime", session.getStartTime());
                        detail.put("endTime", session.getEndTime());
                        detail.put("coachId", session.getCoach() != null ? session.getCoach().getId() : null);
                        detail.put("courtId", session.getCourt() != null ? session.getCourt().getId() : null);
                        return detail;
                    })
                    .collect(Collectors.toList());
            
            Map<String, Object> result = new HashMap<>();
            result.put("totalSessions", allSessions.size());
            result.put("coachSessions", coachSessions.size());
            result.put("statusCount", statusCount);
            result.put("sessionDetails", sessionDetails);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            System.out.println("Debug error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 