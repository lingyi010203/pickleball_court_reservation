package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.AdminProfileDto;
import com.pickleball_backend.pickleball.service.AdminService;
import com.pickleball_backend.pickleball.dto.ChangePasswordRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.annotation.PostConstruct;

@RestController
@RequestMapping("/api/admin")
public class AdminProfileController {

    @Autowired
    private AdminService adminService;

    @PostConstruct
    public void init() {
        System.out.println("AdminProfileController loaded!");
    }

    @GetMapping("/profile")
    public ResponseEntity<AdminProfileDto> getProfile(Authentication authentication) {
        String username = authentication.getName();
        AdminProfileDto profile = adminService.getProfileByUsername(username);
        return ResponseEntity.ok(profile);
    }

    @PostMapping("/profile")
    public ResponseEntity<AdminProfileDto> updateProfile(
            Authentication authentication,
            @RequestBody AdminProfileDto dto) {
        String username = authentication.getName();
        AdminProfileDto updated = adminService.updateProfile(username, dto);
        return ResponseEntity.ok(updated);
    }

    @PostMapping("/change-password")
public ResponseEntity<?> changePassword(
        Authentication authentication,
        @RequestBody ChangePasswordRequest request) {
    String username = authentication.getName();
    adminService.changePassword(username, request.getCurrentPassword(), request.getNewPassword());
    return ResponseEntity.ok().build();
}
}