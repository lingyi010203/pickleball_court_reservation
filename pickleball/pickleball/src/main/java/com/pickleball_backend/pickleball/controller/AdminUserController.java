package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.service.AdminUserService;
import com.pickleball_backend.pickleball.dto.UserStatisticsDto;
import com.pickleball_backend.pickleball.dto.UserStatusUpdateDto;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;

    // 获取所有用户（分页+搜索+过滤）
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserDto>> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "name") String sort,
            @RequestParam(defaultValue = "asc") String direction,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String userType) {

        // 清理排序参数格式
        String cleanSort = sort.split(":")[0].trim();

        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction)
                ? Sort.Direction.DESC : Sort.Direction.ASC;

        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, cleanSort));

        Page<AdminUserDto> users = adminUserService.getAllUsers(
                pageable,
                search,
                status,
                userType
        );
        return ResponseEntity.ok(users);
    }

    // 获取单个用户详情
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> getUserById(@PathVariable Integer userId) {
        AdminUserDto user = adminUserService.getUserById(userId);
        return ResponseEntity.ok(user);
    }

    // 创建新用户
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> createUser(@RequestBody AdminCreateUserDto userDto) {
        AdminUserDto createdUser = adminUserService.createUser(userDto);
        return new ResponseEntity<>(createdUser, HttpStatus.CREATED);
    }

    // 更新用户信息
    @PutMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserDto> updateUser(
            @PathVariable Integer userId,
            @RequestBody AdminUpdateUserDto userDto) {

        AdminUserDto updatedUser = adminUserService.updateUser(userId, userDto);
        return ResponseEntity.ok(updatedUser);
    }

    // 删除用户（软删除）
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteUser(@PathVariable Integer userId) {
        adminUserService.deleteUser(userId);
        return ResponseEntity.noContent().build();
    }

    // 批量更新用户状态
    @PutMapping("/batch-status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserStatusBatch(
            @RequestBody UserStatusUpdateDto statusUpdateDto) {

        adminUserService.updateUserStatusBatch(
                statusUpdateDto.getUserIds(),
                statusUpdateDto.getStatus()
        );
        return ResponseEntity.ok().build();
    }

    // 发送警告给用户
    @PostMapping("/{userId}/warn")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<com.pickleball_backend.pickleball.dto.WarningResponseDto> warnUser(
            @PathVariable Integer userId,
            @RequestBody java.util.Map<String, Object> request) {
        String message = (String) request.get("message");
        String reason = (String) request.get("reason");
        String targetName = (String) request.get("targetName");
        String targetType = (String) request.get("targetType");
        String feedbackContent = (String) request.get("feedbackContent");
        Integer feedbackId = request.get("feedbackId") != null ? Integer.valueOf(request.get("feedbackId").toString()) : null;
        LocalDateTime feedbackCreatedAt = null;
        if (request.get("feedbackCreatedAt") != null) {
            try {
                feedbackCreatedAt = LocalDateTime.parse(request.get("feedbackCreatedAt").toString());
            } catch (Exception e) {
                System.out.println("Failed to parse feedbackCreatedAt: " + e.getMessage());
            }
        }
        
        com.pickleball_backend.pickleball.dto.WarningResponseDto resp;
        try {
            resp = adminUserService.warnUser(userId, message, reason, targetName, targetType, feedbackContent, feedbackId, feedbackCreatedAt);
        } catch (Exception e) {
            // 防止非关键错误导致500（例如后续统计或状态更新失败）
            System.out.println("warnUser encountered non-fatal error: " + e.getMessage());
            resp = com.pickleball_backend.pickleball.dto.WarningResponseDto.builder()
                    .id(null)
                    .deliveryStatus("UNKNOWN")
                    .warningCount(0)
                    .build();
        }
        return ResponseEntity.ok(resp);
    }

    // 更新用户状态（启用/禁用）
    @PutMapping("/{userId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserStatus(
            @PathVariable Integer userId,
            @RequestBody java.util.Map<String, String> request) {
        
        String status = request.get("status");
        String reason = request.get("reason");
        adminUserService.updateUserStatus(userId, status, reason);
        return ResponseEntity.ok().build();
    }

    // 获取用户历史记录
    @GetMapping("/{username}/history")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<java.util.Map<String, Object>>> getUserHistory(
            @PathVariable String username) {
        
        java.util.List<java.util.Map<String, Object>> history = adminUserService.getUserHistory(username);
        return ResponseEntity.ok(history);
    }

    // 获取用户警告记录（可选：前端目前不直接调用）
    @GetMapping("/{username}/warnings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<com.pickleball_backend.pickleball.entity.UserWarning>> getWarnings(
            @PathVariable String username) {
        return ResponseEntity.ok(adminUserService.getWarningsByUsername(username));
    }

    // 更新用户角色
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Integer userId,
            @RequestParam String newRole) {

        adminUserService.updateUserRole(userId, newRole);
        return ResponseEntity.ok().build();
    }

    // 获取用户统计信息
    @GetMapping("/{userId}/statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserStatisticsDto> getUserStatistics(@PathVariable Integer userId) {
        UserStatisticsDto statistics = adminUserService.getUserStatistics(userId);
        return ResponseEntity.ok(statistics);
    }

    // 获取活跃用户排行榜
    @GetMapping("/top-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserStatisticsDto>> getTopUsersByActivity(
            @RequestParam(defaultValue = "10") int limit) {
        List<UserStatisticsDto> topUsers = adminUserService.getTopUsersByActivity(limit);
        return ResponseEntity.ok(topUsers);
    }

    // 按会员等级获取用户
    @GetMapping("/by-tier/{tierName}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserStatisticsDto>> getUsersByTier(@PathVariable String tierName) {
        List<UserStatisticsDto> users = adminUserService.getUsersByTier(tierName);
        return ResponseEntity.ok(users);
    }

    // 获取系统用户统计
    @GetMapping("/system-statistics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getSystemUserStatistics() {
        Map<String, Object> statistics = adminUserService.getSystemUserStatistics();
        return ResponseEntity.ok(statistics);
    }

    // 重置用户密码
    @PutMapping("/{userId}/reset-password")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> resetUserPassword(
            @PathVariable Integer userId,
            @RequestBody Map<String, String> request) {
        
        String newPassword = request.get("newPassword");
        if (newPassword == null || newPassword.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        
        adminUserService.resetUserPassword(userId, newPassword);
        return ResponseEntity.ok().build();
    }

    // 导出用户数据
    @PostMapping("/{userId}/export")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> exportUserData(@PathVariable Integer userId) {
        adminUserService.exportUserData(userId);
        return ResponseEntity.ok().build();
    }
}