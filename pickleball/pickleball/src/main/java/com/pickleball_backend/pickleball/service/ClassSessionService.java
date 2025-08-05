package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto;
import com.pickleball_backend.pickleball.entity.ClassSession;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.exception.*;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface ClassSessionService {
    ClassSession createClassSession(ClassSessionDto sessionDto, com.pickleball_backend.pickleball.entity.User coach) throws ConflictException, ResourceNotFoundException;
    ClassSession updateClassSession(Integer sessionId, ClassSessionDto sessionDto) throws ResourceNotFoundException, ConflictException;
    
    // 新增：部分更新課程（只更新特定字段）
    ClassSession partialUpdateClassSession(Integer sessionId, Map<String, Object> updates) throws ResourceNotFoundException, ConflictException;
    void cancelClassSession(Integer sessionId, boolean force, String reason) throws ResourceNotFoundException, ConflictException;
    List<ClassSession> getCoachSchedule(Integer coachId, LocalDateTime start, LocalDateTime end);
    boolean registerUserForSession(Integer sessionId, Integer userId) throws ConflictException, ResourceNotFoundException;
    List<ClassSession> getAvailableSessions(Integer courtId, LocalDateTime start, LocalDateTime end);

    // ClassSessionServiceImpl.java 添加
    @Transactional
    List<ClassSession> createRecurringSessions(RecurringSessionRequestDto request, User coach)
            throws ConflictException, ResourceNotFoundException;

    // 新增：court 衝突檢查
    boolean hasCourtConflict(Integer courtId, java.time.LocalDateTime start, java.time.LocalDateTime end);

    // Multi-session registration
    Map<String, Object> registerUserForMultipleSessions(Integer userId, List<Integer> sessionIds, String paymentMethod, Integer numPaddles, Boolean buyBallSet) throws ConflictException, ResourceNotFoundException;

    // 批量查詢課程詳情
    List<ClassSession> getSessionsByIds(List<Integer> sessionIds);

    // 新增：查詢單一課程
    ClassSession getSessionById(Integer sessionId);

    // 新增：根據 recurringGroupId 查詢所有 class session
    List<ClassSession> getSessionsByRecurringGroupId(String recurringGroupId);

    // 新增：手動結算課程
    void settleClassSession(Integer sessionId);
}