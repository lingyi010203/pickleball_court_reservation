package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.entity.MembershipTier;
import com.pickleball_backend.pickleball.entity.WalletTransaction;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Feedback;
import com.pickleball_backend.pickleball.entity.UserWarning;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.dto.WarningResponseDto;
import com.pickleball_backend.pickleball.dto.AdminCreateUserDto;
import com.pickleball_backend.pickleball.dto.AdminUpdateUserDto;
import com.pickleball_backend.pickleball.dto.AdminUserDto;
import com.pickleball_backend.pickleball.dto.UserStatisticsDto;
import com.pickleball_backend.pickleball.service.TierService;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.service.AdminDashboardServiceImpl;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserServiceImpl.class);
    
    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminDashboardServiceImpl dashboardService;
    private final UserWarningRepository userWarningRepository;
    private final EmailService emailService;
    private final BookingRepository bookingRepository;
    private final FeedbackRepository feedbackRepository;
    private final MemberRepository memberRepository;
    private final TierService tierService;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    @Value("${app.moderation.warning-threshold:3}")
    private int warningThreshold;

    @Value("${app.user.default-password:Pickleball123!}")
    private String defaultPassword;

    @Override
    public Page<AdminUserDto> getAllUsers(Pageable pageable, String search, String status, String userType) {
        try {
            log.info("Fetching users with filters - search: {}, status: {}, userType: {}", search, status, userType);
            
            Page<User> usersPage = userRepository.findByFilters(
                    StringUtils.hasText(search) ? "%" + search + "%" : null,
                    StringUtils.hasText(status) ? status : null,
                    StringUtils.hasText(userType) ? userType : null,
                    pageable
            );

            List<AdminUserDto> dtos = usersPage.getContent().stream()
                    .map(dashboardService::convertToAdminUserDto)
                    .collect(Collectors.toList());

            log.info("Retrieved {} users out of {} total", dtos.size(), usersPage.getTotalElements());
            return new PageImpl<>(dtos, pageable, usersPage.getTotalElements());
        } catch (Exception e) {
            log.error("Error fetching users: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch users", e);
        }
    }

    @Override
    public AdminUserDto getUserById(Integer userId) {
        try {
            log.info("Fetching user details for ID: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            AdminUserDto dto = dashboardService.convertToAdminUserDto(user);
            log.info("Successfully retrieved user: {}", user.getName());
            return dto;
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user details", e);
        }
    }

    @Override
    @Transactional
    public AdminUserDto createUser(AdminCreateUserDto userDto) {
        try {
            log.info("Creating new user: {}", userDto.getEmail());
            
            // 验证邮箱唯一性
            if (userRepository.existsByEmail(userDto.getEmail())) {
                throw new ValidationException("Email already exists: " + userDto.getEmail());
            }
            
            // 验证用户名唯一性
            if (userAccountRepository.existsByUsername(userDto.getUsername())) {
                throw new ValidationException("Username already exists: " + userDto.getUsername());
            }

            // 创建用户实体
            User user = new User();
            user.setName(userDto.getName());
            user.setEmail(userDto.getEmail());
            user.setPhone(userDto.getPhone());
            user.setDob(userDto.getDob());
            user.setGender(userDto.getGender());
            user.setUserType(userDto.getUserType());
            user.setCreatedAt(LocalDateTime.now());
            User savedUser = userRepository.save(user);

            // 处理密码
            String password;
            if (userDto.getGeneratePassword() != null && userDto.getGeneratePassword()) {
                // 生成随机密码
                password = generateRandomPassword();
                log.info("Generated random password for user: {}", userDto.getUsername());
            } else if (StringUtils.hasText(userDto.getPassword())) {
                // 使用提供的密码
                password = userDto.getPassword();
            } else {
                // 使用默认密码
                password = defaultPassword;
                log.info("Using default password for user: {}", userDto.getUsername());
            }

            // 创建用户账户
            UserAccount account = new UserAccount();
            account.setUsername(userDto.getUsername());
            account.setPassword(passwordEncoder.encode(password));
            account.setStatus("ACTIVE");
            account.setUser(savedUser);
            account.setEmailNotifications(true);
            account.setPushNotifications(true);
            account.setTheme("light");
            userAccountRepository.save(account);

            // 如果是会员类型，创建会员记录
            if ("MEMBER".equalsIgnoreCase(userDto.getUserType())) {
                createMemberRecord(savedUser);
            }

            // 如果是管理员类型，创建Admin实体
            if ("ADMIN".equalsIgnoreCase(userDto.getUserType())) {
                Admin admin = new Admin();
                admin.setUser(savedUser);
                admin.setPosition(StringUtils.hasText(userDto.getPosition()) ? userDto.getPosition() : "Administrator");
                adminRepository.save(admin);
                log.info("Created Admin entity for user: {} with position: {}", savedUser.getId(), admin.getPosition());
            }

            // 发送欢迎邮件
            sendWelcomeEmail(savedUser, password);

            log.info("Successfully created user: {} with ID: {}", savedUser.getName(), savedUser.getId());
            return dashboardService.convertToAdminUserDto(savedUser);
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error creating user: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create user", e);
        }
    }

    @Override
    @Transactional
    public AdminUserDto updateUser(Integer userId, AdminUpdateUserDto userDto) {
        try {
            log.info("Updating user: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            // 检查邮箱唯一性（如果更改了邮箱）
            if (StringUtils.hasText(userDto.getEmail()) && 
                !userDto.getEmail().equals(user.getEmail()) &&
                userRepository.existsByEmail(userDto.getEmail())) {
                throw new ValidationException("Email already exists: " + userDto.getEmail());
            }

            // 更新基本信息
            if (StringUtils.hasText(userDto.getName())) {
                user.setName(userDto.getName());
            }
            if (StringUtils.hasText(userDto.getEmail())) {
                user.setEmail(userDto.getEmail());
            }
            if (StringUtils.hasText(userDto.getPhone())) {
                user.setPhone(userDto.getPhone());
            }
            if (userDto.getDob() != null) {
                user.setDob(userDto.getDob());
            }
            if (StringUtils.hasText(userDto.getGender())) {
                user.setGender(userDto.getGender());
            }

            // 更新账户状态
            Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
            if (accountOpt.isPresent()) {
                UserAccount account = accountOpt.get();
                if (StringUtils.hasText(userDto.getStatus())) {
                    String oldStatus = account.getStatus();
                    account.setStatus(userDto.getStatus());
                    
                    // 如果状态从非活跃变为活跃，发送通知
                    if (!"ACTIVE".equals(oldStatus) && "ACTIVE".equals(userDto.getStatus())) {
                        sendAccountActivationEmail(user);
                    }
                }
                userAccountRepository.save(account);
            }

            User updatedUser = userRepository.save(user);
            log.info("Successfully updated user: {}", updatedUser.getName());
            return dashboardService.convertToAdminUserDto(updatedUser);
        } catch (ResourceNotFoundException | ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to update user", e);
        }
    }

    @Override
    @Transactional
    public void deleteUser(Integer userId) {
        try {
            log.info("Soft deleting user: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            // 软删除：标记状态为 DELETED
            Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
            if (accountOpt.isPresent()) {
                UserAccount account = accountOpt.get();
                account.setStatus("DELETED");
                userAccountRepository.save(account);
                
                // 发送账户删除通知
                sendAccountDeletionEmail(user);
                
                log.info("Successfully soft deleted user: {}", user.getName());
            } else {
                throw new ResourceNotFoundException("UserAccount", "userId", userId);
            }
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error deleting user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to delete user", e);
        }
    }

    @Override
    @Transactional
    public void updateUserStatusBatch(List<Integer> userIds, String status) {
        try {
            log.info("Batch updating status for {} users to: {}", userIds.size(), status);
            
            List<UserAccount> accounts = userAccountRepository.findByUser_IdIn(userIds);
            if (accounts.size() != userIds.size()) {
                throw new ValidationException("Some users not found");
            }
            
            accounts.forEach(account -> account.setStatus(status));
            userAccountRepository.saveAll(accounts);
            
            // 发送批量状态更新通知
            for (UserAccount account : accounts) {
                sendStatusUpdateEmail(account.getUser(), status);
            }
            
            log.info("Successfully updated status for {} users", accounts.size());
        } catch (ValidationException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error in batch status update: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to update user statuses", e);
        }
    }

    @Override
    @Transactional
    public void updateUserRole(Integer userId, String newRole) {
        try {
            log.info("Updating role for user {} to: {}", userId, newRole);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            String oldRole = user.getUserType();
            user.setUserType(newRole);
            userRepository.save(user);
            
            // 如果从非会员变为会员，创建会员记录
            if (!"MEMBER".equalsIgnoreCase(oldRole) && "MEMBER".equalsIgnoreCase(newRole)) {
                createMemberRecord(user);
            }
            
            // 发送角色变更通知
            sendRoleUpdateEmail(user, oldRole, newRole);
            
            log.info("Successfully updated role for user: {} from {} to {}", 
                    user.getName(), oldRole, newRole);
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating role for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to update user role", e);
        }
    }

    @Override
    @Transactional
    public WarningResponseDto warnUser(Integer userId, String message, String reason, 
                                     String targetName, String targetType, String feedbackContent, 
                                     Integer feedbackId, LocalDateTime feedbackCreatedAt) {
        try {
            log.info("Sending warning to user: {} for reason: {}", userId, reason);
            
            // 验证用户是否存在
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));

            // 保存警告记录
            UserWarning warning = UserWarning.builder()
                    .user(user)
                    .message(message)
                    .reason(reason)
                    .recipientEmail(user.getEmail())
                    .targetName(targetName)
                    .targetType(targetType)
                    .feedbackContent(feedbackContent)
                    .feedbackId(feedbackId)
                    .feedbackCreatedAt(feedbackCreatedAt)
                    .deliveryStatus("PENDING")
                    .createdAt(LocalDateTime.now())
                    .build();

            warning = userWarningRepository.save(warning);

            // 发送邮件
            try {
                String toEmail = user.getEmail();
                if (toEmail != null && !toEmail.isEmpty()) {
                    String subject = "Important: Account Warning";
                    String content = String.format(
                            "Dear %s,\n\n" +
                            "You have received a warning from the Pickleball moderation team.\n\n" +
                            "Reason: %s\n" +
                            "Message: %s\n" +
                            (targetName != null ? "Target: %s (%s)\n" : "") +
                            (feedbackContent != null ? "Related Feedback: %s\n" : "") +
                            (feedbackCreatedAt != null ? "Feedback Date: %s\n" : "") +
                            "\n" +
                            "If you have questions, please contact support.\n\n" +
                            "Regards,\nPickleball Team",
                            user.getName() != null ? user.getName() : user.getUserAccount().getUsername(),
                            reason != null ? reason : "-",
                            message != null ? message : "-",
                            targetName != null ? targetName : "",
                            targetType != null ? targetType : "",
                            feedbackContent != null ? feedbackContent : "",
                            feedbackCreatedAt != null ? feedbackCreatedAt.format(java.time.format.DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")) : ""
                    );
                    emailService.sendEmail(toEmail, subject, content);
                    warning.setDeliveryStatus("SENT");
                } else {
                    warning.setDeliveryStatus("FAILED");
                }
            } catch (Exception e) {
                log.error("Failed to send warning email to user {}: {}", userId, e.getMessage());
                warning.setDeliveryStatus("FAILED");
            }

            warning = userWarningRepository.save(warning);

            // 检查警告阈值并自动暂停账户
            long warningCount = 0;
            try {
                warningCount = userWarningRepository.countByUser_Id(userId);
                if (warningCount >= warningThreshold) {
                    Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
                    accountOpt.ifPresent(acc -> {
                        acc.setStatus("SUSPENDED");
                        userAccountRepository.save(acc);
                        
                        // 发送自动暂停通知
                        try {
                            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                                String subject = "Your Account Has Been Suspended";
                                String body = String.format(
                                        "Dear %s,\n\n" +
                                        "Your account has been suspended due to multiple warnings (threshold: %d).\n" +
                                        "If you believe this is a mistake, please contact support.\n\n" +
                                        "Regards,\nPickleball Team",
                                        user.getName() != null ? user.getName() : user.getUserAccount().getUsername(),
                                        warningThreshold
                                );
                                emailService.sendEmail(user.getEmail(), subject, body);
                            }
                        } catch (Exception ignored) {}
                    });
                }
            } catch (Exception e) {
                log.error("Error checking warning threshold for user {}: {}", userId, e.getMessage());
            }

            log.info("Warning sent successfully to user: {} (count: {})", user.getName(), warningCount);
            return WarningResponseDto.builder()
                    .id(warning.getId())
                    .deliveryStatus(warning.getDeliveryStatus())
                    .warningCount(warningCount)
                    .build();
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error warning user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to warn user", e);
        }
    }

    @Override
    public List<UserWarning> getWarningsByUsername(String username) {
        try {
            log.info("Fetching warnings for username: {}", username);
            List<UserWarning> warnings = userWarningRepository.findByUsernameOrderByCreatedAtDesc(username);
            log.info("Found {} warnings for user: {}", warnings.size(), username);
            return warnings;
        } catch (Exception e) {
            log.error("Error fetching warnings for user {}: {}", username, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user warnings", e);
        }
    }

    @Override
    public long countWarningsByUserId(Integer userId) {
        try {
            return userWarningRepository.countByUser_Id(userId);
        } catch (Exception e) {
            log.error("Error counting warnings for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to count user warnings", e);
        }
    }

    @Override
    @Transactional
    public void updateUserStatus(Integer userId, String status, String reason) {
        try {
            log.info("Updating status for user {} to: {} (reason: {})", userId, status, reason);
            
            // 验证用户是否存在
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
            if (accountOpt.isPresent()) {
                UserAccount account = accountOpt.get();
                String oldStatus = account.getStatus();
                account.setStatus(status);
                userAccountRepository.save(account);
                
                // 发送状态变更通知邮件
                sendStatusUpdateEmail(user, status, reason);
                
                log.info("User {} status updated from {} to {} (Reason: {})", 
                        user.getName(), oldStatus, status, reason);
            } else {
                throw new ResourceNotFoundException("UserAccount", "userId", userId);
            }
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error updating status for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to update user status", e);
        }
    }

    @Override
    public List<Map<String, Object>> getUserHistory(String username) {
        try {
            log.info("Fetching user history for: {}", username);
            List<Map<String, Object>> history = new ArrayList<>();

            // 用户警告记录
            List<UserWarning> warnings = userWarningRepository.findByUsernameOrderByCreatedAtDesc(username);
            for (UserWarning w : warnings) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("action", "Warning");
                entry.put("timestamp", w.getCreatedAt());
                entry.put("reason", w.getReason());
                entry.put("message", w.getMessage());
                entry.put("deliveryStatus", w.getDeliveryStatus());
                entry.put("targetName", w.getTargetName());
                entry.put("targetType", w.getTargetType());
                entry.put("feedbackContent", w.getFeedbackContent());
                entry.put("feedbackId", w.getFeedbackId());
                entry.put("feedbackCreatedAt", w.getFeedbackCreatedAt());
                entry.put("description", String.format("Reason: %s | Message: %s | Email: %s | Status: %s",
                        w.getReason(), w.getMessage(), w.getRecipientEmail(), w.getDeliveryStatus()));
                history.add(entry);
            }

            // 预订历史
            User user = userRepository.findByUserAccount_Username(username)
                    .orElse(null);
            if (user != null) {
                List<Booking> bookings = bookingRepository.findByMember_User_IdOrderByBookingDateDesc(user.getId());
                for (Booking booking : bookings) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("action", "Booking");
                    entry.put("timestamp", booking.getBookingDate());
                    entry.put("bookingId", booking.getId());
                    entry.put("status", booking.getStatus());
                    entry.put("amount", booking.getTotalAmount());
                    entry.put("description", String.format("Booking #%d - %s - $%.2f", 
                            booking.getId(), booking.getStatus(), booking.getTotalAmount()));
                    history.add(entry);
                }
            }

            // 反馈历史
            if (user != null) {
                List<Feedback> feedbacks = feedbackRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
                for (Feedback feedback : feedbacks) {
                    Map<String, Object> entry = new HashMap<>();
                    entry.put("action", "Feedback");
                    entry.put("timestamp", feedback.getCreatedAt());
                    entry.put("rating", feedback.getRating());
                    entry.put("targetType", feedback.getTargetType());
                    entry.put("targetId", feedback.getTargetId());
                    entry.put("description", String.format("Rating: %d/5 - %s #%d", 
                            feedback.getRating(), feedback.getTargetType(), feedback.getTargetId()));
                    history.add(entry);
                }
            }

            // 钱包交易历史
            if (user != null) {
                Member member = memberRepository.findByUserId(user.getId());
                if (member != null) {
                    List<WalletTransaction> transactions = walletTransactionRepository
                            .findByWallet_Member_IdOrderByCreatedAtDesc(member.getId());
                    for (WalletTransaction transaction : transactions) {
                        Map<String, Object> entry = new HashMap<>();
                        entry.put("action", "Wallet Transaction");
                        entry.put("timestamp", transaction.getCreatedAt());
                        entry.put("type", transaction.getTransactionType());
                        entry.put("amount", transaction.getAmount());
                        entry.put("description", String.format("%s - $%.2f - %s", 
                                transaction.getTransactionType(), transaction.getAmount(), transaction.getDescription()));
                        history.add(entry);
                    }
                }
            }

            // 按时间排序
            history.sort((a, b) -> ((LocalDateTime) b.get("timestamp")).compareTo((LocalDateTime) a.get("timestamp")));
            
            log.info("Retrieved {} history entries for user: {}", history.size(), username);
            return history;
        } catch (Exception e) {
            log.error("Error fetching user history for {}: {}", username, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user history", e);
        }
    }

    // 新增的辅助方法

    private void createMemberRecord(User user) {
        try {
            if (memberRepository.findByUserId(user.getId()) == null) {
                Member member = new Member();
                member.setUser(user);
                member.setTierPointBalance(0);
                
                // 设置默认会员等级
                MembershipTier defaultTier = tierService.getAllTiers().stream()
                        .filter(tier -> "SILVER".equalsIgnoreCase(tier.getTierName()))
                        .findFirst()
                        .orElse(null);
                member.setTier(defaultTier);
                
                memberRepository.save(member);
                
                // 创建钱包
                Wallet wallet = new Wallet();
                wallet.setMember(member);
                wallet.setBalance(0.0);
                walletRepository.save(wallet);
                
                log.info("Created member record and wallet for user: {}", user.getName());
            }
        } catch (Exception e) {
            log.error("Error creating member record for user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendWelcomeEmail(User user, String password) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Welcome to Pickleball!";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Welcome to Pickleball! Your account has been created successfully.\n\n" +
                        "Username: %s\n" +
                        "Password: %s\n\n" +
                        "Please change your password after your first login.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        user.getUserAccount().getUsername(),
                        password
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send welcome email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendAccountActivationEmail(User user) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Your Account Has Been Activated";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your account has been activated and you can now access all features.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName()
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send activation email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendAccountDeletionEmail(User user) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Your Account Has Been Deleted";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your account has been deleted from our system.\n\n" +
                        "If you believe this is a mistake, please contact support.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName()
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send deletion email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendStatusUpdateEmail(User user, String status) {
        sendStatusUpdateEmail(user, status, null);
    }

    private void sendStatusUpdateEmail(User user, String status, String reason) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Account Status Updated: " + status;
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your account status has been updated to: %s.\n" +
                        (reason != null && !reason.isBlank() ? "Reason: %s\n\n" : "\n") +
                        "If you have any questions, please contact support.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName() != null ? user.getName() : user.getUserAccount().getUsername(),
                        status,
                        reason != null ? reason : ""
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send status update email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private void sendRoleUpdateEmail(User user, String oldRole, String newRole) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Your Role Has Been Updated";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your role has been updated from %s to %s.\n\n" +
                        "If you have any questions, please contact support.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        oldRole,
                        newRole
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send role update email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    // 新增的用户统计和分析方法实现

    @Override
    public UserStatisticsDto getUserStatistics(Integer userId) {
        try {
            log.info("Fetching statistics for user: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            UserAccount account = user.getUserAccount();
            Member member = user.getMember();
            
            // 获取预订统计
            List<Booking> bookings = bookingRepository.findByMember_User_Id(userId);
            long totalBookings = bookings.size();
            long completedBookings = bookings.stream().filter(b -> "COMPLETED".equals(b.getStatus())).count();
            long cancelledBookings = bookings.stream().filter(b -> "CANCELLED".equals(b.getStatus())).count();
            double totalSpent = bookings.stream().mapToDouble(Booking::getTotalAmount).sum();
            
            // 获取反馈统计
            List<Feedback> feedbacks = feedbackRepository.findByUser_Id(userId);
            long totalFeedbacks = feedbacks.size();
            double averageRating = feedbacks.stream().mapToDouble(Feedback::getRating).average().orElse(0.0);
            
            // 获取警告统计
            long totalWarnings = userWarningRepository.countByUser_Id(userId);
            
            // 获取钱包统计
            double currentWalletBalance = 0.0;
            double totalWalletDeposits = 0.0;
            double totalWalletWithdrawals = 0.0;
            long totalWalletTransactions = 0;
            
            if (member != null) {
                Wallet wallet = walletRepository.findByMember_Id(member.getId()).orElse(null);
                if (wallet != null) {
                    currentWalletBalance = wallet.getBalance();
                    List<WalletTransaction> transactions = walletTransactionRepository.findByWallet_Id(wallet.getId());
                    totalWalletTransactions = transactions.size();
                    totalWalletDeposits = transactions.stream()
                            .filter(t -> "DEPOSIT".equals(t.getTransactionType()))
                            .mapToDouble(WalletTransaction::getAmount)
                            .sum();
                    totalWalletWithdrawals = transactions.stream()
                            .filter(t -> "WITHDRAWAL".equals(t.getTransactionType()))
                            .mapToDouble(WalletTransaction::getAmount)
                            .sum();
                }
            }
            
            // 计算时间统计
            long daysSinceRegistration = user.getCreatedAt() != null ? 
                    java.time.temporal.ChronoUnit.DAYS.between(user.getCreatedAt(), LocalDateTime.now()) : 0;
            
            LocalDateTime lastBookingDate = bookings.stream()
                    .map(Booking::getBookingDate)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            
            LocalDateTime lastFeedbackDate = feedbacks.stream()
                    .map(Feedback::getCreatedAt)
                    .max(LocalDateTime::compareTo)
                    .orElse(null);
            
            long daysSinceLastActivity = 0;
            if (lastBookingDate != null || lastFeedbackDate != null) {
                LocalDateTime lastActivity = lastBookingDate != null && lastFeedbackDate != null ?
                        lastBookingDate.isAfter(lastFeedbackDate) ? lastBookingDate : lastFeedbackDate :
                        lastBookingDate != null ? lastBookingDate : lastFeedbackDate;
                daysSinceLastActivity = java.time.temporal.ChronoUnit.DAYS.between(lastActivity, LocalDateTime.now());
            }
            
            // 计算月平均预订
            long averageBookingsPerMonth = daysSinceRegistration > 0 ? 
                    (totalBookings * 30) / daysSinceRegistration : 0;
            
            return UserStatisticsDto.builder()
                    .userId(user.getId())
                    .username(account != null ? account.getUsername() : null)
                    .name(user.getName())
                    .email(user.getEmail())
                    .userType(user.getUserType())
                    .status(account != null ? account.getStatus() : null)
                    .tier(member != null && member.getTier() != null ? member.getTier().getTierName() : null)
                    .pointBalance(member != null ? member.getTierPointBalance() : 0)
                    .createdAt(user.getCreatedAt())
                    .totalBookings(totalBookings)
                    .completedBookings(completedBookings)
                    .cancelledBookings(cancelledBookings)
                    .totalSpent((long) totalSpent)
                    .totalFeedbacks(totalFeedbacks)
                    .totalWarnings(totalWarnings)
                    .totalWalletTransactions(totalWalletTransactions)
                    .daysSinceRegistration(daysSinceRegistration)
                    .daysSinceLastActivity(daysSinceLastActivity)
                    .averageBookingsPerMonth(averageBookingsPerMonth)
                    .averageRating(averageRating)
                    .totalRatings(totalFeedbacks)
                    .currentWalletBalance(currentWalletBalance)
                    .totalWalletDeposits(totalWalletDeposits)
                    .totalWalletWithdrawals(totalWalletWithdrawals)
                    .currentTier(member != null && member.getTier() != null ? member.getTier().getTierName() : null)
                    .tierPoints(member != null ? member.getTierPointBalance() : 0)
                    .lastBookingDate(lastBookingDate)
                    .lastFeedbackDate(lastFeedbackDate)
                    .warningCount(totalWarnings)
                    .build();
                    
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error fetching user statistics for {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch user statistics", e);
        }
    }

    @Override
    public List<UserStatisticsDto> getTopUsersByActivity(int limit) {
        try {
            log.info("Fetching top {} users by activity", limit);
            
            // 获取所有会员用户
            List<Member> members = memberRepository.findAll();
            List<UserStatisticsDto> userStats = new ArrayList<>();
            
            for (Member member : members) {
                if (member.getUser() != null) {
                    try {
                        UserStatisticsDto stats = getUserStatistics(member.getUser().getId());
                        userStats.add(stats);
                    } catch (Exception e) {
                        log.warn("Failed to get statistics for user {}: {}", member.getUser().getId(), e.getMessage());
                    }
                }
            }
            
            // 按总预订数排序
            userStats.sort((a, b) -> Long.compare(b.getTotalBookings(), a.getTotalBookings()));
            
            return userStats.stream().limit(limit).collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error fetching top users by activity: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch top users", e);
        }
    }

    @Override
    public List<UserStatisticsDto> getUsersByTier(String tierName) {
        try {
            log.info("Fetching users by tier: {}", tierName);
            
            List<Member> members = memberRepository.findByTier_TierName(tierName);
            List<UserStatisticsDto> userStats = new ArrayList<>();
            
            for (Member member : members) {
                if (member.getUser() != null) {
                    try {
                        UserStatisticsDto stats = getUserStatistics(member.getUser().getId());
                        userStats.add(stats);
                    } catch (Exception e) {
                        log.warn("Failed to get statistics for user {}: {}", member.getUser().getId(), e.getMessage());
                    }
                }
            }
            
            return userStats;
        } catch (Exception e) {
            log.error("Error fetching users by tier {}: {}", tierName, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch users by tier", e);
        }
    }

    @Override
    public Map<String, Object> getSystemUserStatistics() {
        try {
            log.info("Fetching system user statistics");
            
            Map<String, Object> stats = new HashMap<>();
            
            // 总用户数
            long totalUsers = userRepository.count();
            stats.put("totalUsers", totalUsers);
            
            // 按状态统计
            long activeUsers = userAccountRepository.countByStatus("ACTIVE");
            long suspendedUsers = userAccountRepository.countByStatus("SUSPENDED");
            long deletedUsers = userAccountRepository.countByStatus("DELETED");
            stats.put("activeUsers", activeUsers);
            stats.put("suspendedUsers", suspendedUsers);
            stats.put("deletedUsers", deletedUsers);
            
            // 按类型统计
            long memberUsers = userRepository.countByUserType("MEMBER");
            long coachUsers = userRepository.countByUserType("COACH");
            long adminUsers = userRepository.countByUserType("ADMIN");
            stats.put("memberUsers", memberUsers);
            stats.put("coachUsers", coachUsers);
            stats.put("adminUsers", adminUsers);
            
            // 按会员等级统计
            List<MembershipTier> tiers = tierService.getAllTiers();
            for (MembershipTier tier : tiers) {
                long tierUserCount = memberRepository.countByTier_Id(tier.getId());
                stats.put(tier.getTierName() + "Users", tierUserCount);
            }
            
            // 活动统计
            long totalBookings = bookingRepository.count();
            long totalFeedbacks = feedbackRepository.count();
            long totalWarnings = userWarningRepository.count();
            stats.put("totalBookings", totalBookings);
            stats.put("totalFeedbacks", totalFeedbacks);
            stats.put("totalWarnings", totalWarnings);
            
            // 最近注册用户
            List<User> recentUsers = userRepository.findTop10ByOrderByCreatedAtDesc();
            stats.put("recentUsers", recentUsers.stream()
                    .map(user -> Map.of(
                            "id", user.getId(),
                            "name", user.getName(),
                            "email", user.getEmail(),
                            "createdAt", user.getCreatedAt()
                    ))
                    .collect(Collectors.toList()));
            
            log.info("System statistics retrieved successfully");
            return stats;
        } catch (Exception e) {
            log.error("Error fetching system user statistics: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to fetch system statistics", e);
        }
    }

    @Override
    @Transactional
    public void resetUserPassword(Integer userId, String newPassword) {
        try {
            log.info("Resetting password for user: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            Optional<UserAccount> accountOpt = userAccountRepository.findByUser_Id(userId);
            if (accountOpt.isPresent()) {
                UserAccount account = accountOpt.get();
                account.setPassword(passwordEncoder.encode(newPassword));
                userAccountRepository.save(account);
                
                // 发送密码重置通知
                sendPasswordResetEmail(user, newPassword);
                
                log.info("Password reset successfully for user: {}", user.getName());
            } else {
                throw new ResourceNotFoundException("UserAccount", "userId", userId);
            }
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error resetting password for user {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to reset user password", e);
        }
    }

    @Override
    public void exportUserData(Integer userId) {
        try {
            log.info("Exporting user data for: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
            
            // 这里可以实现数据导出逻辑
            // 例如：生成CSV文件、PDF报告等
            // 目前只是记录日志
            log.info("User data export requested for: {} ({})", user.getName(), user.getEmail());
            
        } catch (ResourceNotFoundException e) {
            throw e;
        } catch (Exception e) {
            log.error("Error exporting user data for {}: {}", userId, e.getMessage(), e);
            throw new RuntimeException("Failed to export user data", e);
        }
    }

    private void sendPasswordResetEmail(User user, String newPassword) {
        try {
            if (user.getEmail() != null && !user.getEmail().isEmpty()) {
                String subject = "Your Password Has Been Reset";
                String content = String.format(
                        "Dear %s,\n\n" +
                        "Your password has been reset by an administrator.\n\n" +
                        "New Password: %s\n\n" +
                        "Please change your password after your next login for security.\n\n" +
                        "Regards,\nPickleball Team",
                        user.getName(),
                        newPassword
                );
                emailService.sendEmail(user.getEmail(), subject, content);
            }
        } catch (Exception e) {
            log.error("Failed to send password reset email to user {}: {}", user.getId(), e.getMessage());
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        StringBuilder password = new StringBuilder();
        java.util.Random random = new java.util.Random();
        
        // 确保至少有一个大写字母
        password.append(chars.charAt(random.nextInt(26)));
        // 确保至少有一个小写字母
        password.append(chars.charAt(26 + random.nextInt(26)));
        // 确保至少有一个数字
        password.append(chars.charAt(52 + random.nextInt(10)));
        // 确保至少有一个特殊字符
        password.append(chars.charAt(62 + random.nextInt(8)));
        
        // 添加剩余的随机字符，总长度为8
        for (int i = 4; i < 8; i++) {
            password.append(chars.charAt(random.nextInt(chars.length())));
        }
        
        // 打乱密码字符顺序
        char[] passwordArray = password.toString().toCharArray();
        for (int i = passwordArray.length - 1; i > 0; i--) {
            int j = random.nextInt(i + 1);
            char temp = passwordArray[i];
            passwordArray[i] = passwordArray[j];
            passwordArray[j] = temp;
        }
        
        return new String(passwordArray);
    }
}