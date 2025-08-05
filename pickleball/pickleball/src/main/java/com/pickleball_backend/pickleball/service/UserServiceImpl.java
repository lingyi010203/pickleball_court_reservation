package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.UnauthorizedException;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.security.JwtService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;
    private final MemberRepository memberRepository;
    private final MembershipTierRepository membershipTierRepository;
    private final WalletRepository walletRepository;
    private final FeedbackRepository feedbackRepository;
    private final EventOrganizerRepository eventOrganizerRepository;
    private final FriendRequestRepository friendRequestRepository;
    private final VoucherRepository voucherRepository;

    // 你要注入 CoachRepository
    @Autowired
    private CoachRepository coachRepository;

    @Override
    public void register(RegistrationDto dto) {
        if (userAccountRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        if (userRepository.findByEmail(dto.getEmail()).isPresent()) {
            throw new RuntimeException("Email already registered");
        }

        User user = new User();
        user.setName(dto.getName());
        user.setGender(dto.getGender());
        user.setDob(LocalDate.parse(dto.getDob()));
        user.setEmail(dto.getEmail());
        user.setPhone(dto.getPhone());
        user.setUserType(dto.getUserType());

        if ("EventOrganizer".equals(dto.getUserType())) {
            user.setRequestedUserType("EventOrganizer");
        }

        userRepository.save(user);

        UserAccount account = new UserAccount();
        account.setUsername(dto.getUsername());
        account.setPassword(passwordEncoder.encode(dto.getPassword()));
        account.setUser(user);
        account.setStatus("ACTIVE"); // 設置狀態為ACTIVE
        userAccountRepository.save(account);

        if ("ADMIN".equalsIgnoreCase(dto.getUserType())) {
            Admin admin = new Admin();
            admin.setUser(user);
            admin.setPosition(dto.getPosition());
            adminRepository.save(admin);
        }

        if ("EventOrganizer".equalsIgnoreCase(dto.getUserType())) {
            EventOrganizer eventOrganizer = new EventOrganizer();
            eventOrganizer.setUser(user);
            eventOrganizer.setOrganizerRating(0.0);
            eventOrganizerRepository.save(eventOrganizer);
        }

        if ("COACH".equalsIgnoreCase(dto.getUserType())) {
            Coach coach = new Coach();
            coach.setUser(user);
            coach.setExperienceYear(dto.getExperienceYear());
            coachRepository.save(coach);
        }

        // Create membership tier assignment
        assignDefaultMembershipTier(user);
        initializeUserWallet(user);
        
        // Create new user welcome voucher
        createNewUserVoucher(user);
        
        // 2. Create or get default tier
        log.info("User registered successfully with Bronze tier: {}", dto.getUsername());
        
        // Create default tiers if they don't exist
        createDefaultTiers();
        
        MembershipTier bronzeTier = membershipTierRepository.findByTierName("BRONZE");
        if (bronzeTier == null) {
            bronzeTier = new MembershipTier();
            bronzeTier.setTierName("BRONZE"); // 直接使用字符串值
            bronzeTier.setMinPoints(0);
            bronzeTier.setMaxPoints(999);
            bronzeTier.setBenefits("5% discount");
            bronzeTier.setActive(true);
            bronzeTier = membershipTierRepository.save(bronzeTier);
            log.info("Created default BRONZE tier");
        }

        // 3. Create member with default tier
        Member member = new Member();
        member.setUser(user);
        member.setTier(bronzeTier);
        member.setTierPointBalance(0);  // Initialize tier points
        member.setRewardPointBalance(0); // Initialize reward points
        memberRepository.save(member);
        log.info("Assigned default Bronze tier to user: {} with 0 tier points and 0 reward points", user.getEmail());
    }

    private void assignDefaultMembershipTier(User user) {
        // Use the correct repository: membershipTierRepository
        MembershipTier silverTier = membershipTierRepository.findByTierName("SILVER");

        // Create default tier if not exists
        if (silverTier == null) {
            silverTier = new MembershipTier();
            silverTier.setTierName("SILVER"); // 直接使用字符串值
            silverTier.setMinPoints(0);
            silverTier.setMaxPoints(2000);
            silverTier.setBenefits("10% discount");
            silverTier = membershipTierRepository.save(silverTier);
            log.info("Created default SILVER tier");
        }

        // Create member record
        Member member = new Member();
        member.setUser(user);
        member.setTier(silverTier);
        member.setTierPointBalance(0);  // Initialize tier points
        member.setRewardPointBalance(0); // Initialize reward points
        memberRepository.save(member);
        user.setMember(member);
        userRepository.save(user);
        log.info("Assigned default Silver tier to user: {} with 0 tier points and 0 reward points", user.getEmail());
    }

    private void createDefaultTiers() {
        // Create BRONZE tier
        if (membershipTierRepository.findByTierName("BRONZE") == null) {
            MembershipTier bronzeTier = new MembershipTier();
            bronzeTier.setTierName("BRONZE");
            bronzeTier.setMinPoints(0);
            bronzeTier.setMaxPoints(999);
            bronzeTier.setBenefits("5% discount");
            bronzeTier.setActive(true);
            membershipTierRepository.save(bronzeTier);
            log.info("Created default BRONZE tier");
        }

        // Create SILVER tier
        if (membershipTierRepository.findByTierName("SILVER") == null) {
            MembershipTier silverTier = new MembershipTier();
            silverTier.setTierName("SILVER");
            silverTier.setMinPoints(1000);
            silverTier.setMaxPoints(2999);
            silverTier.setBenefits("10% discount");
            silverTier.setActive(true);
            membershipTierRepository.save(silverTier);
            log.info("Created default SILVER tier");
        }

        // Create GOLD tier
        if (membershipTierRepository.findByTierName("GOLD") == null) {
            MembershipTier goldTier = new MembershipTier();
            goldTier.setTierName("GOLD");
            goldTier.setMinPoints(3000);
            goldTier.setMaxPoints(5999);
            goldTier.setBenefits("15% discount + Priority booking");
            goldTier.setActive(true);
            membershipTierRepository.save(goldTier);
            log.info("Created default GOLD tier");
        }

        // Create PLATINUM tier
        if (membershipTierRepository.findByTierName("PLATINUM") == null) {
            MembershipTier platinumTier = new MembershipTier();
            platinumTier.setTierName("PLATINUM");
            platinumTier.setMinPoints(6000);
            platinumTier.setMaxPoints(Integer.MAX_VALUE);
            platinumTier.setBenefits("20% discount + Priority booking + Free equipment");
            platinumTier.setActive(true);
            membershipTierRepository.save(platinumTier);
            log.info("Created default PLATINUM tier");
        }
    }

    @Override
    public Optional<String> login(LoginDto dto) {
        log.debug("Login attempt for: {}", dto.getUsernameOrEmail());

        Optional<UserAccount> accountOpt = userAccountRepository.findByUsername(dto.getUsernameOrEmail());

        if (accountOpt.isEmpty()) {
            accountOpt = userAccountRepository.findByUser_Email(dto.getUsernameOrEmail());
        }

        Optional<String> token = accountOpt
                .filter(account -> passwordEncoder.matches(dto.getPassword(), account.getPassword()))
                .map(account -> {
                    String userType = account.getUser().getUserType();
                    String role = "ROLE_" + userType.toUpperCase(); // 添加ROLE_前綴
                    return jwtService.generateTokenWithUserId(
                            account.getUsername(),
                            role, // 使用正確的角色格式
                            account.getUser().getId() // Include user ID
                    );
                });

        if (token.isPresent()) {
            log.info("Login successful for: {}", dto.getUsernameOrEmail());
        } else {
            log.warn("Login failed for: {}", dto.getUsernameOrEmail());
        }

        return token;
    }

    @Override
    public void requestPasswordReset(String email) {
        log.info("Password reset requested for: {}", email);

        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        String errorMsg = "User not found with email: " + email;
                        log.error(errorMsg);
                        return new RuntimeException(errorMsg);
                    });

            UserAccount account = userAccountRepository.findByUser_Email(email)
                    .orElseThrow(() -> {
                        String errorMsg = "User account not found for email: " + email;
                        log.error(errorMsg);
                        return new RuntimeException(errorMsg);
                    });

            // Generate token
            String token = UUID.randomUUID().toString();
            account.setResetPasswordToken(token);
            account.setResetPasswordTokenExpiry(LocalDateTime.now().plusHours(1));
            userAccountRepository.save(account);

            log.info("Generated reset token: {} for email: {}", token, email);

            // Send email
            String resetLink = "http://localhost:3000/reset-password/" + token;
            emailService.sendPasswordResetEmail(email, resetLink);
            log.info("Password reset email sent to: {}", email);

        } catch (Exception e) {
            log.error("Password reset failed for: {}", email, e);
            throw e;
        }
    }

    @Override
    public void resetPassword(String token, String newPassword) {
        log.info("Password reset attempt with token: {}", token);

        try {
            UserAccount account = userAccountRepository.findByResetPasswordToken(token)
                    .orElseThrow(() -> {
                        String errorMsg = "Invalid password reset token: " + token;
                        log.error(errorMsg);
                        return new RuntimeException(errorMsg);
                    });

            if (account.getResetPasswordTokenExpiry().isBefore(LocalDateTime.now())) {
                String errorMsg = "Token expired: " + token;
                log.error(errorMsg);
                throw new RuntimeException(errorMsg);
            }

            account.setPassword(passwordEncoder.encode(newPassword));
            account.setResetPasswordToken(null);
            account.setResetPasswordTokenExpiry(null);
            userAccountRepository.save(account);

            log.info("Password reset successful for user: {}", account.getUsername());

        } catch (Exception e) {
            log.error("Password reset failed for token: {}", token, e);
            throw e;
        }
    }

    private void initializeUserWallet(User user) {
        Member member = user.getMember();
        if (member != null && walletRepository.findByMemberId(member.getId()).isEmpty()) {
            Wallet wallet = new Wallet();
            wallet.setMember(member);
            wallet.setBalance(0.00);
            walletRepository.save(wallet);
            log.info("Created wallet for member: {}", member.getId());
        }
    }

    private void createNewUserVoucher(User user) {
        try {
            // Create a welcome voucher for new users
            Voucher welcomeVoucher = new Voucher();
            welcomeVoucher.setCode("WELCOME");
            welcomeVoucher.setDiscountType("percentage");
            welcomeVoucher.setDiscountValue(10.0); // 10% discount
            welcomeVoucher.setRequestPoints(0); // Free voucher
            welcomeVoucher.setExpiryDate(LocalDate.now().plusMonths(3)); // Valid for 3 months
            welcomeVoucher.setTierId(null); // Available to all tiers (general voucher)
            welcomeVoucher.setMember(user.getMember()); // Assign to the new user
            
            voucherRepository.save(welcomeVoucher);
            log.info("Created welcome voucher for new user: {}", user.getEmail());
            
        } catch (Exception e) {
            log.error("Failed to create welcome voucher for user: {}", user.getEmail(), e);
            // Don't throw exception to avoid breaking registration process
        }
    }

    @Override
    @Transactional
    public List<UserDto> searchUsers(String query) {
        List<User> users = userRepository.searchActiveUsers(query);
        return users.stream()
                .map(user -> new UserDto(
                        user.getUserAccount() != null ? user.getUserAccount().getUsername() : null,
                        user.getName(),
                        user.getProfileImage()
                ))
                .collect(Collectors.toList());
    }

    public Integer getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            throw new UnauthorizedException("No authentication found");
        }

        String username = authentication.getName();
        if (username == null) {
            throw new UsernameNotFoundException("Username not found in authentication");
        }
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return account.getUser().getId();
    }
}