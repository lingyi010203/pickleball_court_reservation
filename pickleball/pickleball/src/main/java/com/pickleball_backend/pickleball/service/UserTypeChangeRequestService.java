package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestFilterDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestStatisticsDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface UserTypeChangeRequestService {
    
    // Create a new request
    UserTypeChangeRequestDto createRequest(Integer userId, String requestedUserType, String requestReason);
    
    // Get requests with pagination and filters
    Page<UserTypeChangeRequestDto> getRequests(UserTypeChangeRequestFilterDto filterDto, Pageable pageable);
    
    // Get all pending requests
    List<UserTypeChangeRequestDto> getPendingRequests();
    
    // Get request by ID
    UserTypeChangeRequestDto getRequestById(Integer requestId);
    
    // Get requests by user ID
    List<UserTypeChangeRequestDto> getRequestsByUserId(Integer userId);
    
    // Process a request (approve/reject)
    UserTypeChangeRequestDto processRequest(Integer requestId, String action, String adminNotes, String processedBy);
    
    // Batch process requests
    List<UserTypeChangeRequestDto> batchProcessRequests(List<Integer> requestIds, String action, String adminNotes, String processedBy);
    
    // Cancel a request
    UserTypeChangeRequestDto cancelRequest(Integer requestId, String reason);
    
    // Get request statistics
    UserTypeChangeRequestStatisticsDto getRequestStatistics();
    
    // Check if user has pending request
    boolean hasPendingRequest(Integer userId);
    
    // Get latest pending request for user
    UserTypeChangeRequestDto getLatestPendingRequestByUserId(Integer userId);
    
    // Update request notes
    UserTypeChangeRequestDto updateRequestNotes(Integer requestId, String adminNotes);
    
    // Delete request (admin only)
    void deleteRequest(Integer requestId);
    
    // Export requests to CSV/Excel
    byte[] exportRequests(UserTypeChangeRequestFilterDto filterDto);
    
    // Migrate existing requests
    int migrateExistingRequests();
}
