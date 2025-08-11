package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventRegistrationRequestDto;
import com.pickleball_backend.pickleball.dto.EventRegistrationResponseDto;

public interface EventRegistrationService {
    EventRegistrationResponseDto registerForEvent(EventRegistrationRequestDto request, String username);
    void cancelRegistration(Integer eventId, String username);
    boolean isUserRegistered(Integer eventId, String username);
    void distributeEventEscrow(Integer eventId);
}
