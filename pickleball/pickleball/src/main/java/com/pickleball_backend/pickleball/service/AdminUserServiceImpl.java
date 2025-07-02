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
}