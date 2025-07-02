package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AuthResponse;
import com.pickleball_backend.pickleball.dto.InvitationRegistrationDto;
import com.pickleball_backend.pickleball.dto.InvitationRequestDto;
import com.pickleball_backend.pickleball.entity.Admin;
import com.pickleball_backend.pickleball.entity.Invitation;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.repository.AdminRepository;
import com.pickleball_backend.pickleball.repository.InvitationRepository;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import com.pickleball_backend.pickleball.security.JwtService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class InvitationServiceImpl implements InvitationService {
    private final InvitationRepository invitationRepository;
    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminRepository adminRepository;
    private final EmailService emailService;
    private final JwtService jwtService;

    @Override
    @Transactional
    public void createInvitation(InvitationRequestDto invitationDto) {
        // Get current admin from security context
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        // Check if invitation already exists
        Optional<Invitation> existing = invitationRepository.findByEmailAndUsedFalse(invitationDto.getEmail());
        if (existing.isPresent()) {
            throw new RuntimeException("Active invitation already exists for this email");
        }

        // Create new invitation
        Invitation invitation = new Invitation();
        invitation.setEmail(invitationDto.getEmail());
        invitation.setRole(invitationDto.getRole());
        invitation.setCreatedBy(admin);
        invitationRepository.save(invitation);

        // Send invitation email
        emailService.sendInvitationEmail(
                invitationDto.getEmail(),
                "Pickleball Account Invitation",
                "You've been invited to join as a " + invitationDto.getRole() +
                        ". Click here to register: http://localhost:3000/register?token=" + invitation.getToken()
        );
    }

    @Override
    public List<Invitation> getAllInvitations() {
        return invitationRepository.findAll();
    }

    @Override
    @Transactional
    public AuthResponse registerFromInvite(InvitationRegistrationDto dto, String token) {
        Invitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid invitation token"));

        if (invitation.isUsed()) {
            throw new RuntimeException("Invitation already used");
        }

        if (LocalDateTime.now().isAfter(invitation.getExpiresAt())) {
            throw new RuntimeException("Invitation has expired");
        }

        // Create user
        User user = new User();
        user.setName(dto.getName());
        user.setEmail(invitation.getEmail());
        user.setPhone(dto.getPhone());
        user.setDob(dto.getDob());
        user.setGender(dto.getGender());
        user.setUserType(invitation.getRole());
        User savedUser = userRepository.save(user);

        // Create user account
        UserAccount account = new UserAccount();
        account.setUsername(invitation.getEmail()); // Use email as username
        account.setPassword(passwordEncoder.encode(dto.getPassword()));
        account.setStatus("ACTIVE");
        account.setUser(savedUser);
        userAccountRepository.save(account);

        // Mark invitation as used
        invitation.setUsed(true);
        invitationRepository.save(invitation);

        // Generate JWT token
        String jwtToken = jwtService.generateToken(account.getUsername(), "ROLE_" + invitation.getRole());

        return new AuthResponse(jwtToken);
    }
}