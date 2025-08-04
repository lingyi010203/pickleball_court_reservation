package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminDashboardServiceImpl dashboardService; // 复用转换逻辑

    @Override
    public Page<AdminUserDto> getAllUsers(Pageable pageable, String search, String status, String userType) {
        Page<User> usersPage = userRepository.findByFilters(
                StringUtils.hasText(search) ? "%" + search + "%" : null,
                StringUtils.hasText(status) ? status : null,
                StringUtils.hasText(userType) ? userType : null,
                pageable
        );

        List<AdminUserDto> dtos = usersPage.getContent().stream()
                .map(dashboardService::convertToAdminUserDto)
                .collect(Collectors.toList());

        return new PageImpl<>(dtos, pageable, usersPage.getTotalElements());
    }


    @Override
    public AdminUserDto getUserById(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return dashboardService.convertToAdminUserDto(user);
    }

    @Override
    @Transactional
    public AdminUserDto createUser(AdminCreateUserDto userDto) {
        // 创建用户实体
        User user = new User();
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        user.setDob(userDto.getDob());
        user.setGender(userDto.getGender());
        user.setUserType(userDto.getUserType());
        User savedUser = userRepository.save(user);

        // 创建用户账户
        UserAccount account = new UserAccount();
        account.setUsername(userDto.getUsername());
        account.setPassword(passwordEncoder.encode(userDto.getPassword()));
        account.setStatus("ACTIVE");
        account.setUser(savedUser);
        userAccountRepository.save(account);

        return dashboardService.convertToAdminUserDto(savedUser);
    }

    @Override
    @Transactional
    public AdminUserDto updateUser(Integer userId, AdminUpdateUserDto userDto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 更新基本信息
        user.setName(userDto.getName());
        user.setEmail(userDto.getEmail());
        user.setPhone(userDto.getPhone());
        user.setDob(userDto.getDob());
        user.setGender(userDto.getGender());

        // 更新账户状态
        Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
        if (accountOpt.isPresent()) {
            UserAccount account = accountOpt.get();
            account.setStatus(userDto.getStatus());
            userAccountRepository.save(account);
        }

        User updatedUser = userRepository.save(user);
        return dashboardService.convertToAdminUserDto(updatedUser);
    }

    @Override
    @Transactional
    public void deleteUser(Integer userId) {
        // 软删除：标记状态为 DELETED
        Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
        if (accountOpt.isPresent()) {
            UserAccount account = accountOpt.get();
            account.setStatus("DELETED");
            userAccountRepository.save(account);
        }
    }

    @Override
    @Transactional
    public void updateUserStatusBatch(List<Integer> userIds, String status) {
        List<UserAccount> accounts = userAccountRepository.findByUser_IdIn(userIds);
        accounts.forEach(account -> account.setStatus(status));
        userAccountRepository.saveAll(accounts);
    }

    @Override
    @Transactional
    public void updateUserRole(Integer userId, String newRole) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setUserType(newRole);
        userRepository.save(user);
    }

    @Override
    @Transactional
    public void warnUser(Integer userId, String message, String reason) {
        // 验证用户是否存在
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        // 这里可以实现发送警告的逻辑
        // 比如记录到日志、发送邮件通知等
        System.out.println("Warning sent to user " + user.getName() + " (ID: " + userId + "): " + message + " (Reason: " + reason + ")");
    }

    @Override
    @Transactional
    public void updateUserStatus(Integer userId, String status, String reason) {
        // 验证用户是否存在
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with ID: " + userId));
        
        Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
        if (accountOpt.isPresent()) {
            UserAccount account = accountOpt.get();
            account.setStatus(status);
            userAccountRepository.save(account);
            System.out.println("User " + user.getName() + " (ID: " + userId + ") status updated to " + status + " (Reason: " + reason + ")");
        } else {
            throw new RuntimeException("User account not found for user ID: " + userId);
        }
    }

    @Override
    public java.util.List<java.util.Map<String, Object>> getUserHistory(String username) {
        // 这里可以实现获取用户历史记录的逻辑
        // 比如预订历史、评价历史、登录历史等
        java.util.List<java.util.Map<String, Object>> history = new java.util.ArrayList<>();
        
        // 示例数据
        java.util.Map<String, Object> entry1 = new java.util.HashMap<>();
        entry1.put("action", "Login");
        entry1.put("timestamp", java.time.LocalDateTime.now().minusHours(2));
        entry1.put("details", "User logged in from IP: 192.168.1.100");
        history.add(entry1);
        
        java.util.Map<String, Object> entry2 = new java.util.HashMap<>();
        entry2.put("action", "Booking");
        entry2.put("timestamp", java.time.LocalDateTime.now().minusDays(1));
        entry2.put("details", "Booked court A for 2 hours");
        history.add(entry2);
        
        java.util.Map<String, Object> entry3 = new java.util.HashMap<>();
        entry3.put("action", "Feedback");
        entry3.put("timestamp", java.time.LocalDateTime.now().minusDays(2));
        entry3.put("details", "Left 4-star review for Court B");
        history.add(entry3);
        
        return history;
    }
}