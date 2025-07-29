package com.pickleball_backend.pickleball.repository;

import com.pickleball_backend.pickleball.entity.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Integer> {
    
    // 查詢教練的所有待處理請求
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.coach.id = :coachId AND lr.status IN ('PENDING', 'SELF_SELECTED', 'MESSAGE_SENT') ORDER BY lr.requestDate DESC")
    List<LeaveRequest> findPendingRequestsByCoachId(@Param("coachId") Integer coachId);
    
    // 查詢教練的所有請求（包括已處理的）
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.coach.id = :coachId ORDER BY lr.requestDate DESC")
    List<LeaveRequest> findAllRequestsByCoachId(@Param("coachId") Integer coachId);
    
    // 查詢學生的所有請求
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.student.id = :studentId ORDER BY lr.requestDate DESC")
    List<LeaveRequest> findAllRequestsByStudentId(@Param("studentId") Integer studentId);
    
    // 查詢特定課程的請求
    @Query("SELECT lr FROM LeaveRequest lr WHERE lr.originalSession.id = :sessionId")
    List<LeaveRequest> findByOriginalSessionId(@Param("sessionId") Integer sessionId);
    
    // 統計教練的待處理請求數量
    @Query("SELECT COUNT(lr) FROM LeaveRequest lr WHERE lr.coach.id = :coachId AND lr.status IN ('PENDING', 'SELF_SELECTED', 'MESSAGE_SENT')")
    long countPendingRequestsByCoachId(@Param("coachId") Integer coachId);
} 