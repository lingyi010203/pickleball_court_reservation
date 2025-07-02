package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.service.FriendlyMatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/friendly-matches")
public class FriendlyMatchController {

    @Autowired
    private FriendlyMatchService friendlyMatchService;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @PostMapping
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<FriendlyMatch> createMatch(
            @RequestBody FriendlyMatch match,
            Principal principal) {

        Member organizer = getCurrentMember(principal);
        return ResponseEntity.ok(friendlyMatchService.createMatch(match, organizer.getId()));
    }

    @GetMapping("/open")
    public List<FriendlyMatch> getOpenMatches() {
        return friendlyMatchService.getOpenMatches();
    }

    @PostMapping("/{matchId}/join")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<JoinRequest> sendJoinRequest(
            @PathVariable Integer matchId,
            Principal principal) {

        Member member = getCurrentMember(principal);
        return ResponseEntity.ok(friendlyMatchService.sendJoinRequest(matchId, member.getId()));
    }

    @PostMapping("/requests/{requestId}/approve")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> approveRequest(
            @PathVariable Integer requestId,
            Principal principal) {

        Member organizer = getCurrentMember(principal);
        friendlyMatchService.approveRequest(requestId, organizer.getId());
        return ResponseEntity.ok().build();
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

    private Member getCurrentMember(Principal principal) {
        String username = principal.getName();
        // Get UserAccount first
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));

        // Then get Member through the User
        return memberRepository.findByUserId(userAccount.getUser().getId());
    }
}