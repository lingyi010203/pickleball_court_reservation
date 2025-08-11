package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestFilterDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestStatisticsDto;
import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import com.pickleball_backend.pickleball.service.UserTypeChangeRequestService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/user-type-requests")
@RequiredArgsConstructor
@CrossOrigin
public class UserTypeChangeRequestController {

    private static final Logger log = LoggerFactory.getLogger(UserTypeChangeRequestController.class);
    
    private final UserTypeChangeRequestService requestService;

    // Get all requests with pagination and filters
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<UserTypeChangeRequestDto>> getRequests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestedUserType,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortOrder) {
        
        try {
            log.info("Fetching user type change requests with filters");
            
            // Parse dates
            LocalDateTime startDateTime = null;
            LocalDateTime endDateTime = null;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            
            if (startDate != null && !startDate.isEmpty()) {
                startDateTime = LocalDateTime.parse(startDate, formatter);
            }
            if (endDate != null && !endDate.isEmpty()) {
                endDateTime = LocalDateTime.parse(endDate, formatter);
            }
            
            // Create filter DTO
            UserTypeChangeRequestFilterDto filterDto = UserTypeChangeRequestFilterDto.builder()
                    .status(status != null ? UserTypeChangeRequest.RequestStatus.valueOf(status.toUpperCase()) : null)
                    .requestedUserType(requestedUserType)
                    .userId(userId)
                    .startDate(startDateTime)
                    .endDate(endDateTime)
                    .searchTerm(searchTerm)
                    .sortBy(sortBy)
                    .sortOrder(sortOrder)
                    .build();
            
            // Create pageable
            Sort sort = Sort.by(Sort.Direction.fromString(sortOrder.toUpperCase()), sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);
            
            Page<UserTypeChangeRequestDto> requests = requestService.getRequests(filterDto, pageable);
            
            return ResponseEntity.ok(requests);
            
        } catch (Exception e) {
            log.error("Error fetching requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get pending requests (for backward compatibility)
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeChangeRequestDto>> getPendingRequests() {
        try {
            log.info("Fetching pending user type change requests");
            List<UserTypeChangeRequestDto> requests = requestService.getPendingRequests();
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Error fetching pending requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get request by ID
    @GetMapping("/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestDto> getRequestById(@PathVariable Integer requestId) {
        try {
            log.info("Fetching user type change request: {}", requestId);
            UserTypeChangeRequestDto request = requestService.getRequestById(requestId);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            log.error("Error fetching request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get requests by user ID
    @GetMapping("/user/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeChangeRequestDto>> getRequestsByUserId(@PathVariable Integer userId) {
        try {
            log.info("Fetching requests for user: {}", userId);
            List<UserTypeChangeRequestDto> requests = requestService.getRequestsByUserId(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            log.error("Error fetching requests for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Process a request (approve/reject)
    @PutMapping("/{requestId}/process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestDto> processRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            log.info("Processing request: {} with action: {}", requestId, requestBody.get("action"));
            
            String action = requestBody.get("action");
            String adminNotes = requestBody.get("adminNotes");
            String reason = requestBody.get("reason");
            
            // Get current admin username
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String processedBy = authentication.getName();
            
            UserTypeChangeRequestDto processedRequest = requestService.processRequest(
                    requestId, action, adminNotes, processedBy);
            
            return ResponseEntity.ok(processedRequest);
            
        } catch (Exception e) {
            log.error("Error processing request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Batch process requests
    @PutMapping("/batch-process")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeChangeRequestDto>> batchProcessRequests(
            @RequestBody Map<String, Object> requestBody) {
        
        try {
            @SuppressWarnings("unchecked")
            List<Integer> requestIds = (List<Integer>) requestBody.get("requestIds");
            String action = (String) requestBody.get("action");
            String adminNotes = (String) requestBody.get("adminNotes");
            
            // Get current admin username
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            String processedBy = authentication.getName();
            
            List<UserTypeChangeRequestDto> processedRequests = requestService.batchProcessRequests(
                    requestIds, action, adminNotes, processedBy);
            
            return ResponseEntity.ok(processedRequests);
            
        } catch (Exception e) {
            log.error("Error batch processing requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Cancel a request
    @PutMapping("/{requestId}/cancel")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestDto> cancelRequest(
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            log.info("Cancelling request: {}", requestId);
            
            String reason = requestBody.get("reason");
            UserTypeChangeRequestDto cancelledRequest = requestService.cancelRequest(requestId, reason);
            
            return ResponseEntity.ok(cancelledRequest);
            
        } catch (Exception e) {
            log.error("Error cancelling request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get request statistics
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestStatisticsDto> getRequestStatistics() {
        try {
            log.info("Fetching request statistics");
            UserTypeChangeRequestStatisticsDto statistics = requestService.getRequestStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            log.error("Error fetching statistics: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Check if user has pending request
    @GetMapping("/user/{userId}/has-pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Boolean>> hasPendingRequest(@PathVariable Integer userId) {
        try {
            log.info("Checking if user {} has pending request", userId);
            boolean hasPending = requestService.hasPendingRequest(userId);
            return ResponseEntity.ok(Map.of("hasPending", hasPending));
        } catch (Exception e) {
            log.error("Error checking pending request for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Get latest pending request for user
    @GetMapping("/user/{userId}/latest-pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestDto> getLatestPendingRequest(@PathVariable Integer userId) {
        try {
            log.info("Fetching latest pending request for user: {}", userId);
            UserTypeChangeRequestDto request = requestService.getLatestPendingRequestByUserId(userId);
            return ResponseEntity.ok(request);
        } catch (Exception e) {
            log.error("Error fetching latest pending request for user {}: {}", userId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Update request notes
    @PutMapping("/{requestId}/notes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserTypeChangeRequestDto> updateRequestNotes(
            @PathVariable Integer requestId,
            @RequestBody Map<String, String> requestBody) {
        
        try {
            log.info("Updating notes for request: {}", requestId);
            
            String adminNotes = requestBody.get("adminNotes");
            UserTypeChangeRequestDto updatedRequest = requestService.updateRequestNotes(requestId, adminNotes);
            
            return ResponseEntity.ok(updatedRequest);
            
        } catch (Exception e) {
            log.error("Error updating notes for request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Delete request
    @DeleteMapping("/{requestId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteRequest(@PathVariable Integer requestId) {
        try {
            log.info("Deleting request: {}", requestId);
            requestService.deleteRequest(requestId);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            log.error("Error deleting request {}: {}", requestId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Export requests
    @GetMapping("/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<byte[]> exportRequests(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String requestedUserType,
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        
        try {
            log.info("Exporting user type change requests");
            
            // Parse dates
            LocalDateTime startDateTime = null;
            LocalDateTime endDateTime = null;
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
            
            if (startDate != null && !startDate.isEmpty()) {
                startDateTime = LocalDateTime.parse(startDate, formatter);
            }
            if (endDate != null && !endDate.isEmpty()) {
                endDateTime = LocalDateTime.parse(endDate, formatter);
            }
            
            // Create filter DTO
            UserTypeChangeRequestFilterDto filterDto = UserTypeChangeRequestFilterDto.builder()
                    .status(status != null ? UserTypeChangeRequest.RequestStatus.valueOf(status.toUpperCase()) : null)
                    .requestedUserType(requestedUserType)
                    .userId(userId)
                    .startDate(startDateTime)
                    .endDate(endDateTime)
                    .build();
            
            byte[] exportData = requestService.exportRequests(filterDto);
            
            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=user-type-requests.csv")
                    .header("Content-Type", "text/csv")
                    .body(exportData);
            
        } catch (Exception e) {
            log.error("Error exporting requests: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create a new request (for users)
    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<UserTypeChangeRequestDto> createRequest(
            @RequestBody Map<String, String> requestBody,
            Authentication authentication) {
        
        try {
            log.info("Creating user type change request");
            
            String requestedUserType = requestBody.get("requestedUserType");
            String requestReason = requestBody.get("requestReason");
            
            // Get user ID from authentication
            String username = authentication.getName();
            // Note: You'll need to implement a method to get user ID from username
            // For now, this is a placeholder
            Integer userId = 1; // This should be retrieved from the user service
            
            UserTypeChangeRequestDto createdRequest = requestService.createRequest(
                    userId, requestedUserType, requestReason);
            
            return ResponseEntity.status(HttpStatus.CREATED).body(createdRequest);
            
        } catch (Exception e) {
            log.error("Error creating request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Migrate existing requests (admin only)
    @PostMapping("/migrate")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> migrateExistingRequests() {
        try {
            log.info("Starting migration of existing user type change requests");
            int migratedCount = requestService.migrateExistingRequests();
            
            Map<String, Object> response = Map.of(
                "message", "Migration completed successfully",
                "migratedCount", migratedCount
            );
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error during migration: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
