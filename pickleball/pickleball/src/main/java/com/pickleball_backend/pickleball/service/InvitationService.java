package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AuthResponse;
import com.pickleball_backend.pickleball.dto.InvitationRegistrationDto;
import com.pickleball_backend.pickleball.dto.InvitationRequestDto;
import com.pickleball_backend.pickleball.entity.Invitation;

import java.util.List;

public interface InvitationService {
    void createInvitation(InvitationRequestDto invitationDto);
    List<Invitation> getAllInvitations();
    AuthResponse registerFromInvite(InvitationRegistrationDto dto, String token);
}