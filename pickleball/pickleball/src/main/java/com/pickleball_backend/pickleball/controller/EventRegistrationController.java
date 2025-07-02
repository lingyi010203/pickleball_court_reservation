package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.EventRegistrationRequestDto;
import com.pickleball_backend.pickleball.service.EventRegistrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import com.pickleball_backend.pickleball.repository.EventRegistrationRepository;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.dto.ProfileDto;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/event-registration")
public class EventRegistrationController {

    @Autowired
    private EventRegistrationService eventRegistrationService;

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerForEvent(
            @RequestBody EventRegistrationRequestDto request,
            Principal principal) {
        eventRegistrationService.registerForEvent(request, principal.getName());
        return ResponseEntity.ok("Registered successfully!");
    }

    @PostMapping("/cancel/{eventId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Void> cancel(
            @PathVariable Integer eventId,
            Principal principal) {
        String username = principal.getName();
        eventRegistrationService.cancelRegistration(eventId, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/is-registered/{eventId}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<Boolean> isRegistered(
            @PathVariable Integer eventId,
            Principal principal) {
        String username = principal.getName();
        return ResponseEntity.ok(eventRegistrationService.isUserRegistered(eventId, username));
    }

    @GetMapping("/event/{eventId}/users")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<List<ProfileDto>> getRegisteredUsersForEvent(@PathVariable Integer eventId) {
        List<User> users = eventRegistrationRepository.findUsersRegisteredForEvent(eventId);
        // Map User to ProfileDto (adjust mapping as needed)
        List<ProfileDto> profiles = users.stream()
            .map(user -> new ProfileDto(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone()
                // add other fields as needed
            ))
            .collect(Collectors.toList());
        return ResponseEntity.ok(profiles);
    }
}
