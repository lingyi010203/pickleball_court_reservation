package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.entity.Wallet;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import com.pickleball_backend.pickleball.service.BookingService;
import com.pickleball_backend.pickleball.service.CourtService;
import com.pickleball_backend.pickleball.service.MemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import com.pickleball_backend.pickleball.entity.MembershipTier;
import com.pickleball_backend.pickleball.repository.MembershipTierRepository;
import java.util.ArrayList;
import com.pickleball_backend.pickleball.service.TierService;

@RestController
@RequestMapping("/api/member")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final BookingService bookingService;
    private final CourtService courtService;
    private final WalletRepository walletRepository;
    private final UserAccountRepository userAccountRepository;
    private final MemberRepository memberRepository;
    private final MembershipTierRepository tierRepository;
    private final TierService tierService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<MemberDashboardDto> getDashboard() {
        return ResponseEntity.ok(memberService.getMemberDashboard());
    }

    @GetMapping("/tiers")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<TierDto>> getAvailableTiers() {
        return ResponseEntity.ok(memberService.getAllAvailableTiers());
    }

    @PostMapping("/vouchers/redeem/{voucherId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<VoucherRedemptionResponse> redeemVoucher(
            @PathVariable Integer voucherId) {
        return ResponseEntity.ok(memberService.redeemVoucher(voucherId));
    }

    @PostMapping("/add-points")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<String> addPoints(@RequestParam int points) {
        memberService.addPoints(points);
        return ResponseEntity.ok(points + " points added");
    }

    @GetMapping("/debug/tier-info")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Map<String, Object>> getTierDebugInfo() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        UserAccount account = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        Member member = memberRepository.findByUserId(account.getUser().getId());
        if (member == null) {
            throw new ResourceNotFoundException("Member not found");
        }

        // Get all tiers for comparison
        List<MembershipTier> allTiers = tierRepository.findAllByActiveTrueOrderByMinPointsAsc();

        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("memberId", member.getId());
        debugInfo.put("tierPointBalance", member.getTierPointBalance());
        debugInfo.put("rewardPointBalance", member.getRewardPointBalance());
        debugInfo.put("currentTierId", member.getTier() != null ? member.getTier().getId() : null);
        debugInfo.put("currentTierName", member.getTier() != null ? member.getTier().getTierName() : null);
        debugInfo.put("currentTierMinPoints", member.getTier() != null ? member.getTier().getMinPoints() : null);
        debugInfo.put("currentTierMaxPoints", member.getTier() != null ? member.getTier().getMaxPoints() : null);

        // Add all tiers information
        List<Map<String, Object>> tiersInfo = new ArrayList<>();
        for (MembershipTier tier : allTiers) {
            Map<String, Object> tierInfo = new HashMap<>();
            tierInfo.put("id", tier.getId());
            tierInfo.put("name", tier.getTierName());
            tierInfo.put("minPoints", tier.getMinPoints());
            tierInfo.put("maxPoints", tier.getMaxPoints());
            tierInfo.put("active", tier.isActive());
            tierInfo.put("benefits", tier.getBenefits());
            tiersInfo.add(tierInfo);
        }
        debugInfo.put("allTiers", tiersInfo);

        return ResponseEntity.ok(debugInfo);
    }

    @PostMapping("/debug/recalculate-tier")
    @PreAuthorize("hasRole('USER')")
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

    @GetMapping("/courts/availability")
    @PreAuthorize("hasRole('USER')") // Add security annotation
    public ResponseEntity<?> getAvailableSlots(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {

        // Handle null date
        if (date == null) {
            date = LocalDate.now();
        }

        // Validate date not in past
        if (date.isBefore(LocalDate.now())) {
            return ResponseEntity.badRequest()
                    .body("Date must be today or in future");
        }

        List<SlotResponseDto> slots = bookingService.getAvailableSlots(date);

        return slots.isEmpty()
                ? ResponseEntity.ok("No available slots found for " + date)
                : ResponseEntity.ok(slots);
    }

    @GetMapping("/redeem-history")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<VoucherDto>> getRedeemHistory() {
        return ResponseEntity.ok(memberService.getRedeemHistory());
    }

    @GetMapping("/courts")
    @PreAuthorize("hasAnyRole('USER', 'COACH')")
    public ResponseEntity<?> getAllCourtsForMember() {
        try {
            List<Court> courts = courtService.getAllCourts();
            return new ResponseEntity<>(courts, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving courts");
        }
    }

    @GetMapping("/courts/{id}")
    @PreAuthorize("hasAnyRole('USER', 'COACH')")
    public ResponseEntity<?> getCourtById(@PathVariable Integer id) {
        try {
            Court court = courtService.getCourtByIdForMember(id);
            if (court == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Court not found");
            }
            return new ResponseEntity<>(court, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error retrieving court");
        }
    }

    @GetMapping("/courts/available")
    @PreAuthorize("hasAnyRole('USER', 'COACH')")
    public ResponseEntity<?> getAvailableCourts(
            @RequestParam("date") @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam("startTime") String startTime,
            @RequestParam("endTime") String endTime) {
        if (date == null || startTime == null || endTime == null || startTime.isBlank() || endTime.isBlank()) {
            return ResponseEntity.badRequest().body("Missing required parameters");
        }
        try {
            return ResponseEntity.ok(courtService.findAvailableCourts(date, startTime, endTime));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error finding available courts: " + e.getMessage());
        }
    }

    @PostMapping("/wallet/init")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> initializeWallet() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            UserAccount account = userAccountRepository.findByUsername(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));

            Member member = memberRepository.findByUserId(account.getUser().getId());

            if (walletRepository.findByMemberId(member.getId()).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body("Wallet already exists");
            }

            Wallet wallet = new Wallet();
            wallet.setMember(member);
            wallet.setBalance(0.00); // Initial balance
            walletRepository.save(wallet);

            return ResponseEntity.ok("Wallet initialized successfully");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error initializing wallet: " + e.getMessage());
        }
    }

    @GetMapping("/courts/{id}/pricing")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getCourtPricing(@PathVariable Integer id) {
        try {
            Court court = courtService.getCourtByIdForMember(id);
            if (court == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Court not found");
            }

            return ResponseEntity.ok(Map.of(
                    "peakHourlyPrice", court.getPeakHourlyPrice(),
                    "offPeakHourlyPrice", court.getOffPeakHourlyPrice(),
                    "peakStartTime", court.getPeakStartTime(),
                    "peakEndTime", court.getPeakEndTime()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error retrieving court pricing");
        }
    }

    @PostMapping("/bookings/{id}/cancel")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelBooking(@PathVariable Integer id, @RequestBody(required = false) java.util.Map<String, Object> body) {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        String reason = body != null && body.get("reason") != null ? body.get("reason").toString() : null;
        CancellationResponse response = bookingService.cancelBooking(id, username, reason);
        return ResponseEntity.ok(response);
    }
}