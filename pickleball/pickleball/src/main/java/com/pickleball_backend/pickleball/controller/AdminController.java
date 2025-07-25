package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.service.AdminService;
import com.pickleball_backend.pickleball.service.BookingService;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.service.TierService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.AuthenticationException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.security.core.context.SecurityContextHolder;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.service.TierAutoUpgradeService;
import com.pickleball_backend.pickleball.repository.MemberRepository;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin
@Transactional
public class AdminController {

    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final AdminService adminService;
    private final BookingService bookingService;
    private final TierService tierService;
    private final EmailService emailService;
    private final MemberRepository memberRepository;
    private final TierAutoUpgradeService tierAutoUpgradeService;

    // User Type Change Management
    @GetMapping("/pending-type-changes")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserTypeChangeResponse>> getPendingTypeChanges() {
        List<User> users = userRepository.findByRequestedUserTypeIsNotNull();
        List<UserTypeChangeResponse> response = users.stream()
                .map(user -> new UserTypeChangeResponse(
                        user.getId(),
                        user.getName(),
                        user.getUserType(),
                        user.getRequestedUserType()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/approve-user-type/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> approveUserTypeChange(
            @PathVariable Integer userId,
            @RequestParam String newType
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!"User".equals(newType) && !"Coach".equals(newType) && !"EventOrganizer".equals(newType)) {
            return ResponseEntity.badRequest().body("Invalid user type. Only 'User', 'Coach' or 'EventOrganizer' allowed.");
        }

        if (!newType.equals(user.getRequestedUserType())) {
            return ResponseEntity.badRequest().body("User has not requested this type");
        }

        user.setUserType(newType);
        user.setRequestedUserType(null);
        userRepository.save(user);

        UserAccount account = userAccountRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("User account not found"));
        account.setStatus("ACTIVE");
        userAccountRepository.save(account);

        return ResponseEntity.ok("User type updated successfully to " + newType);
    }

    @PutMapping("/reject-user-type/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> rejectUserTypeChange(
            @PathVariable Integer userId,
            @RequestParam String reason
    ) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRequestedUserType() == null) {
            return ResponseEntity.badRequest().body("No pending type change request");
        }

        user.setRequestedUserType(null);
        userRepository.save(user);

        UserAccount account = userAccountRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("User account not found"));
        account.setStatus("ACTIVE");
        userAccountRepository.save(account);

        return ResponseEntity.ok("User type change request rejected");
    }

    // Admin Registration & Authentication
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> register(@RequestBody AdminRegistrationDTO registrationDTO) {
        try {
            Admin admin = adminService.register(registrationDTO);
            return ResponseEntity.ok(admin);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String username = payload.get("username");
        String password = payload.get("password");

        try {
            String token = adminService.loginAndGetToken(username, password);
            return ResponseEntity.ok(Map.of("token", token));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Invalid credentials"));
        }
    }

    @PutMapping("/tiers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MembershipTier> updateTier(
            @PathVariable Integer id,
            @RequestBody MembershipTier tier) {
        tier.setId(id); // Ensure ID matches path
        return ResponseEntity.ok(tierService.createOrUpdateTier(tier));
    }

    // Tier Management Endpoints
    @PostMapping("/tiers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MembershipTier> createTier(@RequestBody TierDto tierDto) {
        return ResponseEntity.ok(tierService.createTier(tierDto));
    }

    @DeleteMapping("/tiers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTier(@PathVariable Integer id) {
        tierService.deleteTier(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/tiers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<TierDto>> getAllTiers() {
        return ResponseEntity.ok(tierService.getAllTiers().stream()
                .map(tier -> new TierDto(
                        tier.getId(),
                        tier.getTierName(),
                        tier.getBenefits(),
                        tier.getMinPoints(),
                        tier.getMaxPoints(),
                        tier.isActive()
                ))
                .collect(Collectors.toList()));
    }

    @PostMapping("/{tierName}/vouchers")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MembershipTier> addVoucher(
            @PathVariable String tierName,
            @RequestBody VoucherDto voucherDto) {
        return ResponseEntity.ok(tierService.addVoucherToTier(tierName, voucherDto));
    }

    @PutMapping("/vouchers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Voucher> updateVoucher(
            @PathVariable Integer id,
            @RequestBody VoucherDto voucherDto) {
        return ResponseEntity.ok(tierService.updateVoucher(id, voucherDto));
    }

    @DeleteMapping("/vouchers/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteVoucher(@PathVariable Integer id) {
        tierService.deleteVoucher(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/tiers/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> toggleTierStatus(
            @PathVariable Integer id,
            @RequestParam boolean active) {
        tierService.toggleTierStatus(id, active);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/cancellation-requests/pending")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<List<PendingCancellationRequestDto>> getPendingCancellations() {
        return ResponseEntity.ok(bookingService.getPendingCancellationRequests());
    }

    @PutMapping("/cancellation-requests/{requestId}/approve")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<CancellationResponse> approveCancellation(
            @PathVariable Integer requestId,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        String adminRemark = body != null && body.get("adminRemark") != null ? body.get("adminRemark").toString() : null;
        return ResponseEntity.ok(bookingService.processCancellation(requestId, true, adminRemark));
    }

    @PutMapping("/cancellation-requests/{requestId}/reject")
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public ResponseEntity<CancellationResponse> rejectCancellation(
            @PathVariable Integer requestId,
            @RequestBody(required = false) java.util.Map<String, Object> body) {
        String adminRemark = body != null && body.get("adminRemark") != null ? body.get("adminRemark").toString() : null;
        return ResponseEntity.ok(bookingService.processCancellation(requestId, false, adminRemark));
    }

    @GetMapping("/user-profile/{username}")
    public ProfileDto getUserProfile(@PathVariable String username) {
        User user = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return convertToProfileDto(user);
    }

    private ProfileDto convertToProfileDto(User user) {
        ProfileDto dto = new ProfileDto();
        dto.setId(user.getId());
        dto.setName(user.getName());
        dto.setEmail(user.getEmail());
        dto.setGender(user.getGender());
        dto.setPhone(user.getPhone());
        dto.setDob(user.getDob());
        dto.setUserType(user.getUserType());
        // Add more fields as needed
        return dto;
    }

   /* @GetMapping("/pending-verifications")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<VerificationDto>> getPendingVerifications() {
        List<UserAccount> accounts = userAccountRepository.findByVerificationStatus("PENDING");

        List<VerificationDto> response = accounts.stream()
                .filter(account -> "EventOrganizer".equals(account.getUser().getRequestedUserType()))
                .map(account -> new VerificationDto(
                        account.getUser().getId(),
                        account.getUsername(),
                        account.getUser().getName(),
                        account.getVerificationDocuments(),
                        account.getUser().getRequestedUserType()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    // Approve/reject event organizer
    @PatchMapping("/verify-organizer/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> verifyEventOrganizer(
            @PathVariable Integer userId,
            @RequestParam String status) {

        UserAccount account = userAccountRepository.findByUser_Id(userId)
                .orElseThrow(() -> new RuntimeException("User account not found"));

        if (!"PENDING".equals(account.getVerificationStatus())) {
            return ResponseEntity.badRequest().body("No pending verification");
        }

        if ("APPROVED".equals(status)) {
            // Update user type and status
            User user = account.getUser();
            user.setUserType("EventOrganizer");
            user.setRequestedUserType(null);

            account.setVerificationStatus("APPROVED");
            account.setStatus("ACTIVE");

            userRepository.save(user);
        } else if ("REJECTED".equals(status)) {
            account.setVerificationStatus("REJECTED");
            // Keep status as PENDING for resubmission
        }

        userAccountRepository.save(account);
        return ResponseEntity.ok("Verification status updated");
    }*/

    @PostMapping("/debug/recalculate-tier")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> recalculateTier() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        Member member = memberRepository.findByUserId(account.getUser().getId());
        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        // Get current tier before recalculation
        String oldTierName = member.getTier() != null ? member.getTier().getTierName() : "NULL";
        
        // Trigger tier recalculation
        tierService.recalculateMemberTier(member);
        
        // Refresh member data
        member = memberRepository.findByUserId(account.getUser().getId());
        String newTierName = member.getTier() != null ? member.getTier().getTierName() : "NULL";
        
        return ResponseEntity.ok("Tier recalculated: " + oldTierName + " -> " + newTierName);
    }

    @PostMapping("/tier/upgrade-all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> upgradeAllMemberTiers() {
        tierAutoUpgradeService.manualUpgradeCheck();
        return ResponseEntity.ok("Manual tier upgrade check completed. Check logs for details.");
    }

    @PostMapping("/tier/upgrade-member/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> upgradeSpecificMember(@PathVariable Integer memberId) {
        boolean upgraded = tierAutoUpgradeService.upgradeSpecificMember(memberId);
        if (upgraded) {
            return ResponseEntity.ok("Member " + memberId + " tier upgraded successfully");
        } else {
            return ResponseEntity.ok("Member " + memberId + " tier upgrade not needed");
        }
    }
}