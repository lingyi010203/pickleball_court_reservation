package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface UserTypeChangeRequestRepository extends JpaRepository<UserTypeChangeRequest, Integer> {

    // Find all pending requests
    List<UserTypeChangeRequest> findByStatusOrderByCreatedAtDesc(UserTypeChangeRequest.RequestStatus status);

    // Find requests by user ID
    List<UserTypeChangeRequest> findByUser_IdOrderByCreatedAtDesc(Integer userId);

    // Find requests by user ID and status
    List<UserTypeChangeRequest> findByUser_IdAndStatusOrderByCreatedAtDesc(Integer userId, UserTypeChangeRequest.RequestStatus status);

    // Find requests by requested user type
    List<UserTypeChangeRequest> findByRequestedUserTypeOrderByCreatedAtDesc(String requestedUserType);

    // Find requests by status and requested user type
    List<UserTypeChangeRequest> findByStatusAndRequestedUserTypeOrderByCreatedAtDesc(
            UserTypeChangeRequest.RequestStatus status, String requestedUserType);

    // Find requests created within a date range
    List<UserTypeChangeRequest> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime startDate, LocalDateTime endDate);

    // Find requests by status within a date range
    List<UserTypeChangeRequest> findByStatusAndCreatedAtBetweenOrderByCreatedAtDesc(
            UserTypeChangeRequest.RequestStatus status, LocalDateTime startDate, LocalDateTime endDate);

    // Count requests by status
    long countByStatus(UserTypeChangeRequest.RequestStatus status);

    // Count requests by status and requested user type
    long countByStatusAndRequestedUserType(UserTypeChangeRequest.RequestStatus status, String requestedUserType);

    // Find requests with pagination and filters
    @Query("SELECT r FROM UserTypeChangeRequest r " +
           "WHERE (:status IS NULL OR r.status = :status) " +
           "AND (:requestedUserType IS NULL OR r.requestedUserType = :requestedUserType) " +
           "AND (:userId IS NULL OR r.user.id = :userId) " +
           "AND (:startDate IS NULL OR r.createdAt >= :startDate) " +
           "AND (:endDate IS NULL OR r.createdAt <= :endDate) " +
           "ORDER BY r.createdAt DESC")
    Page<UserTypeChangeRequest> findByFilters(
            @Param("status") UserTypeChangeRequest.RequestStatus status,
            @Param("requestedUserType") String requestedUserType,
            @Param("userId") Integer userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable);

    // Find the latest pending request for a user
    @Query("SELECT r FROM UserTypeChangeRequest r " +
           "WHERE r.user.id = :userId AND r.status = 'PENDING' " +
           "ORDER BY r.createdAt DESC")
    List<UserTypeChangeRequest> findLatestPendingRequestByUserId(@Param("userId") Integer userId);

    // Check if user has a pending request
    boolean existsByUser_IdAndStatus(Integer userId, UserTypeChangeRequest.RequestStatus status);
}
