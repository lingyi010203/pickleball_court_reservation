package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.UserDto;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserAccountRepository userAccountRepository;

    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String query) {
        List<User> users = userRepository.searchActiveUsers(query);
        List<UserDto> result = users.stream()
                .map(user -> new UserDto(
                        // FIX: Get username from UserAccount
                        user.getUserAccount() != null ? user.getUserAccount().getUsername() : null,
                        user.getName(),
                        // FIX: Use existing getProfileImage() method
                        user.getProfileImage()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserById(@PathVariable Integer userId) {
        try {
            System.out.println("=== getUserById called for userId: " + userId + " ===");
            
            User user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                System.out.println("User not found for ID: " + userId);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Found user: " + user.getName() + " (Type: " + user.getUserType() + ")");
            System.out.println("User email: " + user.getEmail());
            System.out.println("UserAccount: " + (user.getUserAccount() != null ? "exists" : "null"));
            if (user.getUserAccount() != null) {
                System.out.println("UserAccount username: " + user.getUserAccount().getUsername());
            }
            
            // 返回用戶信息，包括 username
            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("name", user.getName());
            result.put("email", user.getEmail());
            result.put("userType", user.getUserType());
            
            if (user.getUserAccount() != null) {
                result.put("username", user.getUserAccount().getUsername());
                result.put("profileImage", user.getUserAccount().getProfileImage());
            } else {
                result.put("username", null);
                result.put("profileImage", null);
            }
            
            System.out.println("Returning user data: " + result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Error in getUserById: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile")
    public ResponseEntity<?> getCurrentUserProfile() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            System.out.println("=== getCurrentUserProfile called for username: " + username + " ===");
            
            // 先根據 username 找到 UserAccount
            UserAccount userAccount = userAccountRepository.findByUsername(username).orElse(null);
            if (userAccount == null) {
                System.out.println("UserAccount not found for username: " + username);
                return ResponseEntity.notFound().build();
            }
            
            // 再找到對應的 User
            User user = userAccount.getUser();
            if (user == null) {
                System.out.println("User not found for UserAccount: " + username);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Found user: " + user.getName() + " (Type: " + user.getUserType() + ")");
            
            // 返回當前用戶的完整資料（包含 userAccount 狀態）
            Map<String, Object> result = new HashMap<>();
            result.put("id", user.getId());
            result.put("username", username);
            result.put("name", user.getName());
            result.put("email", user.getEmail());
            result.put("phone", user.getPhone());
            result.put("userType", user.getUserType());
            result.put("profileImage", userAccount.getProfileImage());
            
            // 添加 userAccount 信息，包括狀態
            Map<String, Object> userAccountInfo = new HashMap<>();
            userAccountInfo.put("username", userAccount.getUsername());
            userAccountInfo.put("status", userAccount.getStatus());
            userAccountInfo.put("createdAt", userAccount.getCreatedAt());
            result.put("userAccount", userAccountInfo);
            
            System.out.println("Returning current user profile data: " + result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Error in getCurrentUserProfile: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/profile/{username}")
    public ResponseEntity<?> getUserProfileByUsername(@PathVariable String username) {
        try {
            System.out.println("=== getUserProfileByUsername called for username: " + username + " ===");
            
            // 先根據 username 找到 UserAccount
            UserAccount userAccount = userAccountRepository.findByUsername(username).orElse(null);
            if (userAccount == null) {
                System.out.println("UserAccount not found for username: " + username);
                return ResponseEntity.notFound().build();
            }
            
            // 再找到對應的 User
            User user = userAccount.getUser();
            if (user == null) {
                System.out.println("User not found for UserAccount: " + username);
                return ResponseEntity.notFound().build();
            }
            
            System.out.println("Found user: " + user.getName() + " (Type: " + user.getUserType() + ")");
            
            // 返回用戶基本資料（不包含敏感資訊）
            Map<String, Object> result = new HashMap<>();
            result.put("username", username);
            result.put("name", user.getName());
            result.put("email", user.getEmail());
            result.put("phone", user.getPhone());
            result.put("userType", user.getUserType());
            result.put("profileImage", userAccount.getProfileImage());
            
            System.out.println("Returning user profile data: " + result);
            return ResponseEntity.ok(result);
            
        } catch (Exception e) {
            System.out.println("Error in getUserProfileByUsername: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}