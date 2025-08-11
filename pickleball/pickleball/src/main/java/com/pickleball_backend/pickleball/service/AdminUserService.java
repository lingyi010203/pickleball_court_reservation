package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AdminUserService {
    Page<AdminUserDto> getAllUsers(Pageable pageable, String search, String status, String userType);
    AdminUserDto getUserById(Integer userId);
    AdminUserDto createUser(AdminCreateUserDto userDto);
    AdminUserDto updateUser(Integer userId, AdminUpdateUserDto userDto);
    void deleteUser(Integer userId);
    void updateUserStatusBatch(List<Integer> userIds, String status);
    void updateUserRole(Integer userId, String newRole);
    
    // 新增的用户管理方法
    com.pickleball_backend.pickleball.dto.WarningResponseDto warnUser(Integer userId, String message, String reason, String targetName, String targetType, String feedbackContent, Integer feedbackId, LocalDateTime feedbackCreatedAt);

    // 查询用户的警告记录
    java.util.List<com.pickleball_backend.pickleball.entity.UserWarning> getWarningsByUsername(String username);

    // 统计某用户被警告次数
    long countWarningsByUserId(Integer userId);
    void updateUserStatus(Integer userId, String status, String reason);
    java.util.List<java.util.Map<String, Object>> getUserHistory(String username);
    
    // 新增的用户统计和分析方法
    UserStatisticsDto getUserStatistics(Integer userId);
    java.util.List<UserStatisticsDto> getTopUsersByActivity(int limit);
    java.util.List<UserStatisticsDto> getUsersByTier(String tierName);
    java.util.Map<String, Object> getSystemUserStatistics();
    void resetUserPassword(Integer userId, String newPassword);
    void exportUserData(Integer userId);
}