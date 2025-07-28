package com.pickleball_backend.pickleball.service;
import com.pickleball_backend.pickleball.dto.ProfileDto;

import com.pickleball_backend.pickleball.dto.AdminRegistrationDTO;
import com.pickleball_backend.pickleball.entity.Admin;

public interface AdminService {
    Admin login(String username, String password);
    Admin register(AdminRegistrationDTO registrationDTO);
    String loginAndGetToken(String username, String password);
    ProfileDto getProfileByUsername(String username);
    ProfileDto updateProfile(String username, ProfileDto dto);
    void changePassword(String username, String currentPassword, String newPassword);
}