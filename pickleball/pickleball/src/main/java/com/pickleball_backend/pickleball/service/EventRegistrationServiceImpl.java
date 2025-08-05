package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventRegistrationRequestDto;
import com.pickleball_backend.pickleball.dto.EventRegistrationResponseDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class EventRegistrationServiceImpl implements EventRegistrationService {

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private EventRegistrationRepository eventRegistrationRepository;

    @Autowired
    private UserAccountRepository userAccountRepository;

    @Autowired
    private EventRepository eventRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private MembershipTierRepository membershipTierRepository;

    @Autowired
    private EmailService emailService;

    @Override
    @Transactional
    public EventRegistrationResponseDto registerForEvent(EventRegistrationRequestDto request, String username) {
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User user = userAccount.getUser();

        // FIX: Get member by USER ID instead of member ID
        Member member = memberRepository.findByUserId(user.getId());

        // Handle missing member record
        if (member == null) {
            // Create default tier if missing
            MembershipTier defaultTier = membershipTierRepository.findByTierName("SILVER");
            if (defaultTier == null) {
                defaultTier = new MembershipTier();
                defaultTier.setTierName("SILVER");
                defaultTier.setMinPoints(0);
                defaultTier.setMaxPoints(2000);
                defaultTier.setBenefits("10% discount");
                defaultTier.setActive(true);
                defaultTier = membershipTierRepository.save(defaultTier);
            }

            // Create new member record
            member = new Member();
            member.setUser(user);
            member.setTier(defaultTier);
            member.setTierPointBalance(0);  // Initialize tier points
            member.setRewardPointBalance(0); // Initialize reward points
            member = memberRepository.save(member);
        }

        // 1. Create Registration and link to member
        Registration registration = new Registration();
        registration.setMember(member);
        member.getRegistrations().add(registration);
        registrationRepository.save(registration);

        // 2. Fetch the event
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new RuntimeException("Event not found"));
        Double feeAmount = event.getFeeAmount();

        // 3. Create EventRegistration
        EventRegistration eventRegistration = new EventRegistration();
        eventRegistration.setRegistrationId(registration.getId());
        eventRegistration.setEvent(event); // set the Event object
        eventRegistration.setUser(user);   // set the User object
        eventRegistration.setRegistrationDate(LocalDateTime.now());
        eventRegistration.setPaymentStatus("PAID");
        eventRegistration.setFeeAmount(feeAmount);
        eventRegistration.setStatus("REGISTERED");
        eventRegistrationRepository.save(eventRegistration);

        // Update event's registered count
        event.setRegisteredCount(event.getRegisteredCount() + 1);
        eventRepository.save(event);

        // Send confirmation email to the user
        String userEmail = user.getEmail();
        if (userEmail != null && !userEmail.isEmpty()) {
            String subject = "Event Registration Confirmation: " + event.getTitle();
            String content = String.format(
                "Dear %s,\n\nYou have successfully registered for the event \"%s\".\n\nDate: %s\nLocation: %s\n\nThank you for registering!\n\nPickleball Team",
                user.getName(),
                event.getTitle(),
                event.getStartTime() != null ? event.getStartTime().toString() : "N/A",
                event.getVenue() != null ? event.getVenue().getName() : "N/A"
            );
            emailService.sendEmail(userEmail, subject, content);
        }

        // 4. Build and return response
        EventRegistrationResponseDto response = new EventRegistrationResponseDto();
        response.setRegistrationId(eventRegistration.getRegistrationId());
        response.setEventId(event.getId());
        response.setUserId(user.getId());
        response.setRegistrationDate(eventRegistration.getRegistrationDate());
        response.setPaymentStatus(eventRegistration.getPaymentStatus());
        response.setFeeAmount(eventRegistration.getFeeAmount());
        response.setStatus(eventRegistration.getStatus());
        return response;
    }

    @Override
    public void cancelRegistration(Integer eventId, String username) {
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        EventRegistration registration = eventRegistrationRepository.findByEvent_IdAndUser_Id(eventId, userAccount.getUser().getId())
                .orElseThrow(() -> new RuntimeException("Registration not found"));

        registration.setStatus("CANCELLED");
        eventRegistrationRepository.save(registration);

        // TODO: Send cancellation email here
    }

    @Override
    public boolean isUserRegistered(Integer eventId, String username) {
        System.out.println("Checking registration for user: " + username + ", event: " + eventId);
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return eventRegistrationRepository.findByEvent_IdAndUser_Id(eventId, userAccount.getUser().getId()).isPresent();
    }
}
