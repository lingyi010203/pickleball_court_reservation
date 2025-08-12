package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.service.FriendlyMatchService;
import com.pickleball_backend.pickleball.dto.FriendlyMatchInvitationDto;
import com.pickleball_backend.pickleball.dto.FriendlyMatchPaymentDto;
import com.pickleball_backend.pickleball.dto.BookingResponseDto;
import com.pickleball_backend.pickleball.dto.JoinRequestDto;
import com.pickleball_backend.pickleball.dto.FriendlyMatchResponseDto;
import com.pickleball_backend.pickleball.dto.JoinRequestResponseDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import com.pickleball_backend.pickleball.repository.FriendlyMatchRepository;

@RestController
@RequestMapping("/api/friendly-matches")
public class FriendlyMatchController {

    @Autowired
    private FriendlyMatchService friendlyMatchService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private FriendlyMatchRepository friendlyMatchRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FriendlyMatchResponseDto> createMatch(
            @RequestBody FriendlyMatch match,
            Principal principal) {

        Member organizer = getCurrentMember(principal);
        FriendlyMatch createdMatch = friendlyMatchService.createMatch(match, organizer.getId());
        return ResponseEntity.ok(friendlyMatchService.convertToResponseDto(createdMatch, "Match created successfully"));
    }

    @PostMapping("/create")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FriendlyMatchResponseDto> createFriendlyMatch(
            @RequestBody FriendlyMatch match,
            Principal principal) {

        Member organizer = getCurrentMember(principal);
        return ResponseEntity.ok(friendlyMatchService.createFriendlyMatch(match, organizer.getId()));
    }

    @GetMapping("/open")
    public List<FriendlyMatchResponseDto> getOpenMatches() {
        List<FriendlyMatch> matches = friendlyMatchService.getOpenMatches();
        return matches.stream()
                .map(match -> friendlyMatchService.convertToResponseDto(match, null))
                .toList();
    }

    @GetMapping("/all")
    public List<FriendlyMatchInvitationDto> getAllMatches() {
        return friendlyMatchService.getAllMatchesDto();
    }

    @DeleteMapping("/{matchId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<String> deleteFriendlyMatch(@PathVariable Integer matchId, Principal principal) {
        try {
            System.out.println("=== Delete Friendly Match Request ===");
            System.out.println("Match ID: " + matchId);
            System.out.println("Principal: " + principal.getName());
            
            Member member = getCurrentMember(principal);
            System.out.println("Member ID: " + member.getId());
            System.out.println("Member Name: " + member.getUser().getName());
            
            friendlyMatchService.deleteFriendlyMatch(matchId, member.getId());
            System.out.println("=== Delete Successful ===");
            return ResponseEntity.ok("Friendly match deleted successfully");
        } catch (Exception e) {
            System.out.println("=== Delete Failed ===");
            System.out.println("Error: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Failed to delete friendly match: " + e.getMessage());
        }
    }

    @PostMapping("/{matchId}/join")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<JoinRequestResponseDto> sendJoinRequest(
            @PathVariable Integer matchId,
            Principal principal) {

        Member member = getCurrentMember(principal);
        JoinRequest joinRequest = friendlyMatchService.sendJoinRequest(matchId, member.getId());
        return ResponseEntity.ok(JoinRequestResponseDto.fromEntity(joinRequest));
    }

    @DeleteMapping("/requests/{requestId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelJoinRequest(
            @PathVariable Integer requestId,
            Principal principal) {

        Member member = getCurrentMember(principal);
        friendlyMatchService.cancelJoinRequest(requestId, member.getId());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/invitation")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FriendlyMatchResponseDto> createInvitation(@RequestBody FriendlyMatch match, @RequestParam Integer bookingId, Principal principal) {
        Member organizer = getCurrentMember(principal);
        FriendlyMatch createdMatch = friendlyMatchService.createInvitation(match, bookingId, organizer.getId());
        return ResponseEntity.ok(friendlyMatchService.convertToResponseDto(createdMatch, "Invitation created successfully"));
    }

    @GetMapping("/invitations")
    public List<FriendlyMatchInvitationDto> getOpenInvitations() {
        return friendlyMatchService.getOpenInvitationsDto();
    }

    @PostMapping("/invitation/{matchId}/join")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<JoinRequestResponseDto> joinInvitation(@PathVariable Integer matchId, Principal principal) {
        Member member = getCurrentMember(principal);
        JoinRequest joinRequest = friendlyMatchService.joinInvitation(matchId, member.getId());
        return ResponseEntity.ok(JoinRequestResponseDto.fromEntity(joinRequest));
    }

    // 新增：為 match 付款
    @PostMapping("/{id}/pay")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> payForMatch(@PathVariable Integer id, @RequestBody(required = false) FriendlyMatchPaymentDto paymentDto, Principal principal) {
        try {
            Member member = getCurrentMember(principal);
            if (member == null) {
                return ResponseEntity.badRequest().body("Member not found");
            }
            
            FriendlyMatch match = friendlyMatchRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Match not found"));
            
            // 檢查是否為 organizer
            if (!match.getOrganizer().getId().equals(member.getId())) {
                return ResponseEntity.badRequest().body("Only organizer can pay for the match");
            }
            
            // 檢查是否已滿員
            if (match.getCurrentPlayers() < match.getMaxPlayers()) {
                return ResponseEntity.badRequest().body("Match is not full yet");
            }
            
            // 檢查是否已付款
            if ("PAID".equals(match.getPaymentStatus())) {
                return ResponseEntity.badRequest().body("Payment already completed");
            }
            
            // 處理付款並創建 booking 記錄
            BookingResponseDto bookingResponse = friendlyMatchService.processFriendlyMatchPayment(match, member, paymentDto);
            
            return ResponseEntity.ok().body(bookingResponse);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Payment failed: " + e.getMessage());
        }
    }

    // 新增：取消 match 付款
    @PostMapping("/{id}/cancel-payment")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> cancelMatchPayment(@PathVariable Integer id, Principal principal) {
        try {
            Member member = getCurrentMember(principal);
            if (member == null) {
                return ResponseEntity.badRequest().body("Member not found");
            }
            
            FriendlyMatch match = friendlyMatchRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Match not found"));
            
            // 檢查是否為 organizer
            if (!match.getOrganizer().getId().equals(member.getId())) {
                return ResponseEntity.badRequest().body("Only organizer can cancel payment for the match");
            }
            
            // 檢查是否已付款
            if (!"PAID".equals(match.getPaymentStatus())) {
                return ResponseEntity.badRequest().body("Match is not paid yet");
            }
            
            // 處理取消付款和退款
            String result = friendlyMatchService.cancelMatchPayment(match, member);
            
            return ResponseEntity.ok().body(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Payment cancellation failed: " + e.getMessage());
        }
    }

    /**
     * 獲取可用用戶的玩家數量統計
     * @return 包含各種用戶統計信息的Map
     */
    @GetMapping("/statistics/available-users")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN', 'EVENTORGANIZER')")
    public ResponseEntity<Map<String, Object>> getAvailableUserPlayerStatistics() {
        try {
            Map<String, Object> statistics = friendlyMatchService.getAvailableUserPlayerStatistics();
            return ResponseEntity.ok(statistics);
        } catch (Exception e) {
            System.err.println("Error getting available user player statistics: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    private Member getCurrentMember(Principal principal) {
        String username = principal.getName();
        // Get UserAccount first
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        // Then get Member through the User
        return memberRepository.findByUserId(userAccount.getUser().getId());
    }
}