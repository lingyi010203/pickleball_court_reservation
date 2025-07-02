package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.FriendDto;
import com.pickleball_backend.pickleball.dto.FriendRequestDto;
import com.pickleball_backend.pickleball.entity.FriendRequest;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.service.FriendshipService;
import com.pickleball_backend.pickleball.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/friends")
public class FriendController {

    private final FriendshipService friendshipService;
    private final UserRepository userRepository;

    @Autowired
    public FriendController(FriendshipService friendshipService,
                            UserRepository userRepository) {
        this.friendshipService = friendshipService;
        this.userRepository = userRepository;
    }

    @PostMapping("/request")
    public ResponseEntity<?> sendFriendRequest(
            Authentication authentication,
            @RequestParam String receiverUsername) {
        String senderUsername = authentication.getName();
        try {
            friendshipService.sendFriendRequest(senderUsername, receiverUsername);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/accept/{requestId}")
    public ResponseEntity<?> acceptFriendRequest(
            Authentication authentication,
            @PathVariable Long requestId) {
        String receiverUsername = authentication.getName();
        try {
            friendshipService.acceptFriendRequest(requestId, receiverUsername);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/decline/{requestId}")
    public ResponseEntity<?> declineFriendRequest(
            @PathVariable Long requestId) {
        try {
            return ResponseEntity.ok(friendshipService.declineFriendRequest(requestId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/requests/pending")
    public ResponseEntity<List<FriendRequestDto>> getPendingRequests(
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(friendshipService.getPendingRequests(user.getId()));
    }

    @GetMapping("/accepted")
    public ResponseEntity<List<FriendDto>> getAcceptedFriends(
            Authentication authentication) {
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<FriendRequest> acceptedRequests = friendshipService.getAcceptedFriends(user.getId());

        List<FriendDto> friends = acceptedRequests.stream()
                .map(request -> {
                    // 确定对方用户（当前用户可能是sender或receiver）
                    User friendUser = request.getSender().equals(user) ?
                            request.getReceiver() : request.getSender();

                    return new FriendDto(
                            friendUser.getUserAccount().getUsername(),
                            friendUser.getName(),
                            friendUser.getProfileImage()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(friends);
    }

    @GetMapping("/check")
    public ResponseEntity<Boolean> checkFriendship(
            Authentication authentication,
            @RequestParam String otherUsername) {
        String username = authentication.getName();
        User currentUser = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User otherUser = userRepository.findByUsername(otherUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(friendshipService.areFriends(currentUser.getId(), otherUser.getId()));
    }
}