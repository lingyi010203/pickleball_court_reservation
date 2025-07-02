package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;

import java.util.List;
import java.util.Optional;

public interface UserService {
    void register(RegistrationDto dto);
    Optional<String> login(LoginDto dto);
    void requestPasswordReset(String email);
    void resetPassword(String token, String newPassword);
    List<UserDto> searchUsers(String query);
    Integer getCurrentUserId();
}