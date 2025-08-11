package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.EventRegistrationRequestDto;
import com.pickleball_backend.pickleball.dto.EventRegistrationResponseDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

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

    @Autowired
    private WalletRepository walletRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private EscrowAccountService escrowAccountService;

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
            
            // Update the user's member reference
            user.setMember(member);
            userRepository.save(user);
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

        // 3. Use escrow account for payment (money held in escrow until event completion)
        escrowAccountService.depositToEscrowForEvent(user, feeAmount, event);

        // 4. Money is now held in escrow until event completion
        // Platform and organizer will receive their shares after event ends

        // 5. Create EventRegistration
        EventRegistration eventRegistration = new EventRegistration();
        eventRegistration.setRegistrationId(registration.getId());
        eventRegistration.setEvent(event); // set the Event object
        eventRegistration.setUser(user);   // set the User object
        eventRegistration.setRegistrationDate(LocalDateTime.now());
        eventRegistration.setPaymentStatus("ESCROWED"); // Changed to ESCROWED
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

        // 7. Build and return response
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

        // Get the event and user for refund
        Event event = registration.getEvent();
        User user = userAccount.getUser();

        // Refund from escrow
        escrowAccountService.refundEventEscrow(user, registration.getFeeAmount(), event);

        // Update registration status
        registration.setStatus("CANCELLED");
        registration.setPaymentStatus("REFUNDED");
        eventRegistrationRepository.save(registration);

        // Update event's registered count
        event.setRegisteredCount(Math.max(0, event.getRegisteredCount() - 1));
        eventRepository.save(event);

        // Send cancellation email
        String userEmail = user.getEmail();
        if (userEmail != null && !userEmail.isEmpty()) {
            String subject = "Event Registration Cancellation: " + event.getTitle();
            String content = String.format(
                "Dear %s,\n\nYour registration for the event \"%s\" has been cancelled.\n\nRefund Amount: RM%.2f\n\nThe refund has been processed to your wallet.\n\nThank you,\nPickleball Team",
                user.getName(),
                event.getTitle(),
                registration.getFeeAmount()
            );
            emailService.sendEmail(userEmail, subject, content);
        }
    }

    @Override
    public boolean isUserRegistered(Integer eventId, String username) {
        System.out.println("Checking registration for user: " + username + ", event: " + eventId);
        UserAccount userAccount = userAccountRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return eventRegistrationRepository.findByEvent_IdAndUser_Id(eventId, userAccount.getUser().getId()).isPresent();
    }

    /**
     * 活動結束時分配託管資金給平台和組織者
     */
    @Override
    @Transactional
    public void distributeEventEscrow(Integer eventId) {
        Event event = eventRepository.findById(eventId)
                .orElseThrow(() -> new RuntimeException("Event not found"));
        
        // 分配託管資金
        escrowAccountService.distributeEventEscrow(event);
        
        // 更新所有相關的 EventRegistration 狀態
        List<EventRegistration> registrations = eventRegistrationRepository.findByEvent_Id(eventId);
        for (EventRegistration registration : registrations) {
            if ("ESCROWED".equals(registration.getPaymentStatus())) {
                registration.setPaymentStatus("COMPLETED");
                eventRegistrationRepository.save(registration);
            }
        }
        
        // 更新活動狀態
        event.setStatus("COMPLETED");
        eventRepository.save(event);
        
        // 發送完成通知給組織者
        if (event.getOrganizerId() != null) {
            User organizerUser = userRepository.findById(event.getOrganizerId()).orElse(null);
            if (organizerUser != null && organizerUser.getEmail() != null) {
                String subject = "Event Completed: " + event.getTitle();
                String content = String.format(
                    "Dear %s,\n\nYour event \"%s\" has been completed.\n\nAll escrow funds have been distributed:\n- Platform fee: 10%%\n- Your revenue: 90%%\n\nThank you for organizing this event!\n\nPickleball Team",
                    organizerUser.getName(),
                    event.getTitle()
                );
                emailService.sendEmail(organizerUser.getEmail(), subject, content);
            }
        }
    }
}
