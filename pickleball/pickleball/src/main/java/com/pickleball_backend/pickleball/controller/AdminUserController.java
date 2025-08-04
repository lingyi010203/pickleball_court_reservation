package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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
    public ResponseEntity<Void> warnUser(
            @PathVariable Integer userId,
            @RequestBody java.util.Map<String, String> request) {
        
        String message = request.get("message");
        String reason = request.get("reason");
        adminUserService.warnUser(userId, message, reason);
        return ResponseEntity.ok().build();
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

    // 更新用户角色
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateUserRole(
            @PathVariable Integer userId,
            @RequestParam String newRole) {

        adminUserService.updateUserRole(userId, newRole);
        return ResponseEntity.ok().build();
    }
}