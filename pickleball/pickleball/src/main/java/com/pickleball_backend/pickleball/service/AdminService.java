package com.pickleball_backend.pickleball.service;
import com.pickleball_backend.pickleball.dto.AdminProfileDto;

import com.pickleball_backend.pickleball.dto.AdminRegistrationDTO;
import com.pickleball_backend.pickleball.entity.Admin;

public interface AdminService {
    Admin login(String username, String password);
    Admin register(AdminRegistrationDTO registrationDTO);
    String loginAndGetToken(String username, String password);
    AdminProfileDto getProfileByUsername(String username);
    AdminProfileDto updateProfile(String username, AdminProfileDto dto);
}