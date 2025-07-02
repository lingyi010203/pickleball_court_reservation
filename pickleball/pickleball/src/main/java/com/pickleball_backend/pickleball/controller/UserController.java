package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.UserDto;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

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
}