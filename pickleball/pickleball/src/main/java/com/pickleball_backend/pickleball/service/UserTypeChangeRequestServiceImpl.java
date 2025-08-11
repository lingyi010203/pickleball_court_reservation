package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestFilterDto;
import com.pickleball_backend.pickleball.dto.UserTypeChangeRequestStatisticsDto;
import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.UserTypeChangeRequestRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserTypeChangeRequestServiceImpl implements UserTypeChangeRequestService {

    private static final Logger log = LoggerFactory.getLogger(UserTypeChangeRequestServiceImpl.class);
    
    private final UserTypeChangeRequestRepository requestRepository;
    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;

    @Override
    @Transactional
    public UserTypeChangeRequestDto createRequest(Integer userId, String requestedUserType, String requestReason) {
        try {
            log.info("Creating user type change request for user: {} to type: {}", userId, requestedUserType);
            
            // Validate user exists
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            // Check if user already has a pending request
            if (hasPendingRequest(userId)) {
                throw new ValidationException("User already has a pending request");
            }
            
            // Validate requested user type
            if (!isValidUserType(requestedUserType)) {
                throw new ValidationException("Invalid user type: " + requestedUserType);
            }
            
            // Create the request
            UserTypeChangeRequest request = UserTypeChangeRequest.builder()
                    .user(user)
                    .currentUserType(user.getUserType())
                    .requestedUserType(requestedUserType)
                    .requestReason(requestReason)
                    .status(UserTypeChangeRequest.RequestStatus.PENDING)
                    .build();
            
            request = requestRepository.save(request);
            
            // Update user's requestedUserType field for backward compatibility
            user.setRequestedUserType(requestedUserType);
            userRepository.save(user);
            
            // Send notification email
            sendRequestNotificationEmail(user, requestedUserType);
            
            log.info("Successfully created user type change request: {}", request.getId());
            return UserTypeChangeRequestDto.fromEntity(request);
            
        } catch (ResourceNotFoundException | ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating user type change request: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create request", e);
        }
    }

    @Override
    public Page<UserTypeChangeRequestDto> getRequests(UserTypeChangeRequestFilterDto filterDto, Pageable pageable) {
        try {
            log.info("Fetching user type change requests with filters");
            
            Page<UserTypeChangeRequest> requestsPage = requestRepository.findByFilters(
                    filterDto.getStatus(),
                    filterDto.getRequestedUserType(),
                    filterDto.getUserId(),
                    filterDto.getStartDate(),
                    filterDto.getEndDate(),
                    pageable
            );
            
            List<UserTypeChangeRequestDto> dtos = requestsPage.getContent().stream()
                    .map(this::enrichRequestDto)
                    .collect(Collectors.toList());
            
            return new PageImpl<>(dtos, pageable, requestsPage.getTotalElements());
            
        } catch (Exception e) {
            log.error("Error fetching user type change requests: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch requests", e);
        }
    }

    @Override
    public List<UserTypeChangeRequestDto> getPendingRequests() {
        try {
            log.info("Fetching all pending user type change requests");
            
            List<UserTypeChangeRequest> requests = requestRepository.findByStatusOrderByCreatedAtDesc(
                    UserTypeChangeRequest.RequestStatus.PENDING
            );
            
            return requests.stream()
                    .map(this::enrichRequestDto)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching pending requests: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch pending requests", e);
        }
    }

    @Override
    public UserTypeChangeRequestDto getRequestById(Integer requestId) {
        try {
            log.info("Fetching user type change request: {}", requestId);
            
            UserTypeChangeRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserTypeChangeRequest", "id", requestId));
            
            return enrichRequestDto(request);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching request {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch request", e);
        }
    }

    @Override
    public List<UserTypeChangeRequestDto> getRequestsByUserId(Integer userId) {
        try {
            log.info("Fetching user type change requests for user: {}", userId);
            
            List<UserTypeChangeRequest> requests = requestRepository.findByUser_IdOrderByCreatedAtDesc(userId);
            
            return requests.stream()
                    .map(this::enrichRequestDto)
                    .collect(Collectors.toList());
                    
        } catch (Exception e) {
            log.error("Error fetching requests for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user requests", e);
        }
    }

    @Override
    @Transactional
    public UserTypeChangeRequestDto processRequest(Integer requestId, String action, String adminNotes, String processedBy) {
        try {
            log.info("Processing user type change request: {} with action: {}", requestId, action);
            
            UserTypeChangeRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserTypeChangeRequest", "id", requestId));
            
            if (request.getStatus() != UserTypeChangeRequest.RequestStatus.PENDING) {
                throw new ValidationException("Request is not in pending status");
            }
            
            User user = request.getUser();
            
            if ("APPROVE".equalsIgnoreCase(action)) {
                // Approve the request
                request.setStatus(UserTypeChangeRequest.RequestStatus.APPROVED);
                request.setAdminNotes(adminNotes);
                request.setProcessedBy(processedBy);
                request.setProcessedAt(LocalDateTime.now());
                
                // Update user type
                user.setUserType(request.getRequestedUserType());
                user.setRequestedUserType(null);
                userRepository.save(user);
                
                // Update user account status
                UserAccount account = userAccountRepository.findByUser_Id(user.getId())
                        .orElse(null);
                if (account != null) {
                    account.setStatus("ACTIVE");
                    userAccountRepository.save(account);
                }
                
                // Send approval notification
                sendApprovalNotificationEmail(user, request.getRequestedUserType());
                
            } else if ("REJECT".equalsIgnoreCase(action)) {
                // Reject the request
                request.setStatus(UserTypeChangeRequest.RequestStatus.REJECTED);
                request.setAdminNotes(adminNotes);
                request.setProcessedBy(processedBy);
                request.setProcessedAt(LocalDateTime.now());
                
                // Clear user's requestedUserType
                user.setRequestedUserType(null);
                userRepository.save(user);
                
                // Send rejection notification
                sendRejectionNotificationEmail(user, adminNotes);
                
            } else {
                throw new ValidationException("Invalid action: " + action);
            }
            
            request = requestRepository.save(request);
            
            log.info("Successfully processed request: {} with action: {}", requestId, action);
            return enrichRequestDto(request);
            
        } catch (ResourceNotFoundException | ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error processing request {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Failed to process request", e);
        }
    }

    @Override
    @Transactional
    public List<UserTypeChangeRequestDto> batchProcessRequests(List<Integer> requestIds, String action, String adminNotes, String processedBy) {
        try {
            log.info("Batch processing {} requests with action: {}", requestIds.size(), action);
            
            List<UserTypeChangeRequestDto> processedRequests = requestIds.stream()
                    .map(requestId -> processRequest(requestId, action, adminNotes, processedBy))
                    .collect(Collectors.toList());
            
            log.info("Successfully batch processed {} requests", processedRequests.size());
            return processedRequests;
            
        } catch (Exception e) {
            log.error("Error batch processing requests: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to batch process requests", e);
        }
    }

    @Override
    @Transactional
    public UserTypeChangeRequestDto cancelRequest(Integer requestId, String reason) {
        try {
            log.info("Cancelling user type change request: {}", requestId);
            
            UserTypeChangeRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserTypeChangeRequest", "id", requestId));
            
            if (request.getStatus() != UserTypeChangeRequest.RequestStatus.PENDING) {
                throw new ValidationException("Only pending requests can be cancelled");
            }
            
            request.setStatus(UserTypeChangeRequest.RequestStatus.CANCELLED);
            request.setAdminNotes(reason);
            request.setProcessedAt(LocalDateTime.now());
            
            // Clear user's requestedUserType
            User user = request.getUser();
            user.setRequestedUserType(null);
            userRepository.save(user);
            
            request = requestRepository.save(request);
            
            // Send cancellation notification
            sendCancellationNotificationEmail(user, reason);
            
            log.info("Successfully cancelled request: {}", requestId);
            return enrichRequestDto(request);
            
        } catch (ResourceNotFoundException | ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error cancelling request {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Failed to cancel request", e);
        }
    }

    @Override
    public UserTypeChangeRequestStatisticsDto getRequestStatistics() {
        try {
            log.info("Fetching user type change request statistics");
            
            long totalRequests = requestRepository.count();
            long pendingRequests = requestRepository.countByStatus(UserTypeChangeRequest.RequestStatus.PENDING);
            long approvedRequests = requestRepository.countByStatus(UserTypeChangeRequest.RequestStatus.APPROVED);
            long rejectedRequests = requestRepository.countByStatus(UserTypeChangeRequest.RequestStatus.REJECTED);
            long cancelledRequests = requestRepository.countByStatus(UserTypeChangeRequest.RequestStatus.CANCELLED);
            
            long coachRequests = requestRepository.countByStatusAndRequestedUserType(
                    UserTypeChangeRequest.RequestStatus.PENDING, "Coach");
            long eventOrganizerRequests = requestRepository.countByStatusAndRequestedUserType(
                    UserTypeChangeRequest.RequestStatus.PENDING, "EventOrganizer");
            long userRequests = requestRepository.countByStatusAndRequestedUserType(
                    UserTypeChangeRequest.RequestStatus.PENDING, "User");
            
            // Calculate average processing time
            List<UserTypeChangeRequest> processedRequests = requestRepository.findByStatusOrderByCreatedAtDesc(
                    UserTypeChangeRequest.RequestStatus.APPROVED);
            processedRequests.addAll(requestRepository.findByStatusOrderByCreatedAtDesc(
                    UserTypeChangeRequest.RequestStatus.REJECTED));
            
            double averageProcessingTime = processedRequests.stream()
                    .filter(r -> r.getProcessedAt() != null)
                    .mapToLong(r -> ChronoUnit.HOURS.between(r.getCreatedAt(), r.getProcessedAt()))
                    .average()
                    .orElse(0.0);
            
            // Calculate weekly and monthly requests
            LocalDateTime weekAgo = LocalDateTime.now().minusWeeks(1);
            LocalDateTime monthAgo = LocalDateTime.now().minusMonths(1);
            
            long requestsThisWeek = requestRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                    weekAgo, LocalDateTime.now()).size();
            long requestsThisMonth = requestRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(
                    monthAgo, LocalDateTime.now()).size();
            
            return UserTypeChangeRequestStatisticsDto.builder()
                    .totalRequests(totalRequests)
                    .pendingRequests(pendingRequests)
                    .approvedRequests(approvedRequests)
                    .rejectedRequests(rejectedRequests)
                    .cancelledRequests(cancelledRequests)
                    .coachRequests(coachRequests)
                    .eventOrganizerRequests(eventOrganizerRequests)
                    .userRequests(userRequests)
                    .averageProcessingTime(averageProcessingTime)
                    .requestsThisWeek(requestsThisWeek)
                    .requestsThisMonth(requestsThisMonth)
                    .build();
                    
        } catch (Exception e) {
            log.error("Error fetching request statistics: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch statistics", e);
        }
    }

    @Override
    public boolean hasPendingRequest(Integer userId) {
        try {
            return requestRepository.existsByUser_IdAndStatus(userId, UserTypeChangeRequest.RequestStatus.PENDING);
        } catch (Exception e) {
            log.error("Error checking pending request for user {}: {}", userId, e.getMessage());
            return false;
        }
    }

    @Override
    public UserTypeChangeRequestDto getLatestPendingRequestByUserId(Integer userId) {
        try {
            List<UserTypeChangeRequest> requests = requestRepository.findLatestPendingRequestByUserId(userId);
            if (requests.isEmpty()) {
                return null;
            }
            return enrichRequestDto(requests.get(0));
        } catch (Exception e) {
            log.error("Error fetching latest pending request for user {}: {}", userId, e.getMessage());
            return null;
        }
    }

    @Override
    @Transactional
    public UserTypeChangeRequestDto updateRequestNotes(Integer requestId, String adminNotes) {
        try {
            log.info("Updating notes for request: {}", requestId);
            
            UserTypeChangeRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserTypeChangeRequest", "id", requestId));
            
            request.setAdminNotes(adminNotes);
            request = requestRepository.save(request);
            
            return enrichRequestDto(request);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating notes for request {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Failed to update request notes", e);
        }
    }

    @Override
    @Transactional
    public void deleteRequest(Integer requestId) {
        try {
            log.info("Deleting user type change request: {}", requestId);
            
            UserTypeChangeRequest request = requestRepository.findById(requestId)
                    .orElseThrow(() -> new ResourceNotFoundException("UserTypeChangeRequest", "id", requestId));
            
            requestRepository.delete(request);
            
            log.info("Successfully deleted request: {}", requestId);
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting request {}: {}", requestId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete request", e);
        }
    }

    @Override
    public byte[] exportRequests(UserTypeChangeRequestFilterDto filterDto) {
        // TODO: Implement CSV/Excel export functionality
        log.info("Export functionality not yet implemented");
        return new byte[0];
    }

    /**
     * Migrate existing user type change requests from user table
     * This method creates user_type_change_request records for users who have requestedUserType set
     */
    @Override
    @Transactional
    public int migrateExistingRequests() {
        try {
            log.info("Starting migration of existing user type change requests");
            
            // Find users with requestedUserType set
            List<User> usersWithRequests = userRepository.findByRequestedUserTypeIsNotNull();
            int migratedCount = 0;
            
            for (User user : usersWithRequests) {
                if (user.getRequestedUserType() != null && 
                    !user.getRequestedUserType().isEmpty() &&
                    !user.getRequestedUserType().equals(user.getUserType())) {
                    
                    // Check if request already exists
                    if (!hasPendingRequest(user.getId())) {
                        try {
                            // Create the request
                            UserTypeChangeRequest request = UserTypeChangeRequest.builder()
                                    .user(user)
                                    .currentUserType(user.getUserType())
                                    .requestedUserType(user.getRequestedUserType())
                                    .requestReason("Migrated from existing user type change request")
                                    .status(UserTypeChangeRequest.RequestStatus.PENDING)
                                    .build();
                            
                            requestRepository.save(request);
                            migratedCount++;
                            log.info("Migrated request for user: {} (ID: {})", user.getName(), user.getId());
                        } catch (Exception e) {
                            log.error("Failed to migrate request for user {}: {}", user.getId(), e.getMessage());
                        }
                    }
                }
            }
            
            log.info("Migration completed. {} requests migrated.", migratedCount);
            return migratedCount;
            
        } catch (Exception e) {
            log.error("Error during migration: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to migrate existing requests", e);
        }
    }

    // Helper methods
    private boolean isValidUserType(String userType) {
        return "User".equals(userType) || "Coach".equals(userType) || "EventOrganizer".equals(userType);
    }

    private UserTypeChangeRequestDto enrichRequestDto(UserTypeChangeRequest request) {
        UserTypeChangeRequestDto dto = UserTypeChangeRequestDto.fromEntity(request);
        
        // Add additional user statistics
        User user = request.getUser();
        if (user != null) {
            // Get booking count and total spent
            List<Booking> userBookings = bookingRepository.findByMember_User_Id(user.getId());
            long bookingCount = userBookings.size();
            double totalSpent = userBookings.stream()
                    .mapToDouble(booking -> {
                        Double amount = booking.getTotalAmount();
                        return amount != null ? amount : 0.0;
                    })
                    .sum();
            
            dto.setUserBookingCount((int) bookingCount);
            dto.setUserTotalSpent(totalSpent);
        }
        
        return dto;
    }

    // Email notification methods
    private void sendRequestNotificationEmail(User user, String requestedType) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "User Type Change Request Submitted";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your request to change your user type to %s has been submitted successfully.\n" +
                        "Our admin team will review your request and notify you of the decision.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        requestedType
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send request notification email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendApprovalNotificationEmail(User user, String newType) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "User Type Change Request Approved";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Congratulations! Your request to change your user type to %s has been approved.\n" +
                        "Your account has been updated and you now have access to the new features.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        newType
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send approval notification email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendRejectionNotificationEmail(User user, String reason) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "User Type Change Request Rejected";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your user type change request has been rejected.\n" +
                        (StringUtils.hasText(reason) ? "Reason: %s\n\n" : "\n") +
                        "If you have any questions, please contact support.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        reason != null ? reason : ""
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send rejection notification email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendCancellationNotificationEmail(User user, String reason) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "User Type Change Request Cancelled";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your user type change request has been cancelled.\n" +
                        (StringUtils.hasText(reason) ? "Reason: %s\n\n" : "\n") +
                        "If you have any questions, please contact support.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        reason != null ? reason : ""
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send cancellation notification email to user {}: {}", user.getId(), e.getMessage());
        }
    }
}
