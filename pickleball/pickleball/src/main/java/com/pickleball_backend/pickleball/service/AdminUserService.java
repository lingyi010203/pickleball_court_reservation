package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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
    void warnUser(Integer userId, String message, String reason);
    void updateUserStatus(Integer userId, String status, String reason);
    java.util.List<java.util.Map<String, Object>> getUserHistory(String username);
}