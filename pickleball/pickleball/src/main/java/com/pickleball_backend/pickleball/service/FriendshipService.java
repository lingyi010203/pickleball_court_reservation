package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.FriendRequestDto;
import com.pickleball_backend.pickleball.entity.FriendRequest;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.FriendRequestRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class FriendshipService {

    private final FriendRequestRepository friendRequestRepository;
    private final UserRepository userRepository;

    @Autowired
    public FriendshipService(FriendRequestRepository friendRequestRepository,
                             UserRepository userRepository) {
        this.friendRequestRepository = friendRequestRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void sendFriendRequest(String senderUsername, String receiverUsername) {
        User sender = userRepository.findByUsernameCaseInsensitive(senderUsername)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findByUsernameCaseInsensitive(receiverUsername)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        Optional<FriendRequest> existingRequest = friendRequestRepository.findExistingRequest(sender, receiver);
        if (existingRequest.isPresent()) {
            throw new IllegalStateException("Friend request already exists between these users");
        }

        FriendRequest request = new FriendRequest();
        request.setSender(sender);
        request.setReceiver(receiver);
        request.setStatus(FriendRequest.Status.PENDING);
        friendRequestRepository.save(request);
    }

    @Transactional
    public void acceptFriendRequest(Long requestId, String receiverUsername) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        // FIX: Access username through UserAccount
        String receiverUsernameFromAccount = request.getReceiver().getUserAccount().getUsername();
        if (!receiverUsernameFromAccount.equals(receiverUsername)) {
            throw new SecurityException("Not authorized to accept this request");
        }

        if (request.getStatus() != FriendRequest.Status.PENDING) {
            throw new IllegalStateException("Only pending requests can be accepted");
        }

        request.setStatus(FriendRequest.Status.ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());
        friendRequestRepository.save(request);
    }

    @Transactional
    public FriendRequest declineFriendRequest(Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));

        if (request.getStatus() != FriendRequest.Status.PENDING) {
            throw new IllegalStateException("Only pending requests can be declined");
        }

        request.setStatus(FriendRequest.Status.DECLINED);
        request.setUpdatedAt(LocalDateTime.now());
        return friendRequestRepository.save(request);
    }

    public List<FriendRequestDto> getPendingRequests(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return friendRequestRepository.findByReceiverAndStatus(user, FriendRequest.Status.PENDING)
                .stream()
                .map(req -> new FriendRequestDto(
                        req.getId(),
                        req.getSender().getUserAccount().getUsername(), // FIX: Access username through UserAccount
                        req.getSender().getName(),
                        req.getSender().getProfileImage(),
                        req.getStatus().name(),
                        req.getCreatedAt().toString()
                ))
                .toList();
    }

    public List<FriendRequest> getAcceptedFriends(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // 获取所有已接受的好友请求
        List<FriendRequest> acceptedRequests = friendRequestRepository.findAcceptedRequests(user);

        // 确保返回结果不为null
        return acceptedRequests != null ? acceptedRequests : Collections.emptyList();
    }

    public boolean areFriends(Integer userId1, Integer userId2) {
        User user1 = userRepository.findById(userId1)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User user2 = userRepository.findById(userId2)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return friendRequestRepository.existsAcceptedFriendRequestBetween(user1, user2);
    }
}