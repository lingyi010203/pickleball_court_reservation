package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.FriendlyMatch;
import com.pickleball_backend.pickleball.entity.JoinRequest;
import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.FriendlyMatchRepository;
import com.pickleball_backend.pickleball.repository.JoinRequestRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchReminderService {

    private final FriendlyMatchRepository matchRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final JoinRequestRepository joinRequestRepository;  // Added repository

    @Scheduled(cron = "0 0 10 * * ?") // Run daily at 10 AM
    @Transactional  // Added for lazy loading
    public void sendMatchReminders() {
        LocalDateTime tomorrow = LocalDateTime.now().plusDays(1);
        LocalDateTime start = tomorrow.withHour(0).withMinute(0);
        LocalDateTime end = tomorrow.withHour(23).withMinute(59);

        List<FriendlyMatch> matches = matchRepository.findByStartTimeBetween(start, end);

        for (FriendlyMatch match : matches) {
            // Notify organizer
            Member organizer = match.getOrganizer();
            if (organizer != null && organizer.getUser() != null) {
                String organizerEmail = organizer.getUser().getEmail();
                if (organizerEmail != null && !organizerEmail.isEmpty()) {
                    emailService.sendReminderNotification(
                            organizerEmail,
                            match.getId(),
                            match.getStartTime()
                    );
                }
            }

            // Notify approved participants
            List<JoinRequest> approvedRequests = joinRequestRepository.findByFriendlyMatchIdAndStatus(
                    match.getId(),
                    JoinRequest.Status.APPROVED
            );

            for (JoinRequest request : approvedRequests) {
                Member member = request.getMember();
                if (member != null && member.getUser() != null) {
                    String playerEmail = member.getUser().getEmail();
                    if (playerEmail != null && !playerEmail.isEmpty()) {
                        emailService.sendReminderNotification(
                                playerEmail,
                                match.getId(),
                                match.getStartTime()
                        );
                    }
                }
            }
        }
    }
}