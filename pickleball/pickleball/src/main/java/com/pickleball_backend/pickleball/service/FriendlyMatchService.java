package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FriendlyMatchService {

    @Autowired private FriendlyMatchRepository matchRepository;
    @Autowired private JoinRequestRepository joinRequestRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private EmailService emailService;

    public List<FriendlyMatch> getOpenMatches() {
        return matchRepository.findByStatus("OPEN");
    }

    @Transactional
    public FriendlyMatch createMatch(FriendlyMatch match, Integer organizerId) {
        Member organizer = memberRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        match.setOrganizer(organizer);
        return matchRepository.save(match);
    }

    @Transactional
    public JoinRequest sendJoinRequest(Integer matchId, Integer memberId) {
        FriendlyMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        if (!"OPEN".equals(match.getStatus())) {
            throw new ValidationException("Match is not open for joining");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        // Check for existing request
        if (joinRequestRepository.findByMemberIdAndFriendlyMatchId(memberId, matchId).isPresent()) {
            throw new ValidationException("Join request already exists");
        }

        JoinRequest request = new JoinRequest();
        request.setMember(member);
        request.setFriendlyMatch(match);
        request.setStatus(JoinRequest.Status.PENDING);

        joinRequestRepository.save(request);

        // Notify organizer
        emailService.sendEmail(
                match.getOrganizer().getUser().getEmail(),
                "New Join Request for Your Match",
                member.getUser().getName() + " wants to join your match on " +
                        match.getStartTime() + "\n\nPlease approve or reject in the app."
        );

        return request;
    }

    @Transactional
    public void approveRequest(Integer requestId, Integer organizerId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getFriendlyMatch().getOrganizer().getId().equals(organizerId)) {
            throw new UnauthorizedException("Only organizer can approve requests");
        }

        FriendlyMatch match = request.getFriendlyMatch();

        // Added validation for full match
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new ValidationException("Match is already full");
        }

        request.setStatus(JoinRequest.Status.APPROVED);
        joinRequestRepository.save(request);

        match.setCurrentPlayers(match.getCurrentPlayers() + 1);
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            match.setStatus("FULL");
        }
        matchRepository.save(match);

        // Send confirmation to member
        emailService.sendEmail(
                request.getMember().getUser().getEmail(),
                "Join Request Approved",
                "Your request to join the match on " + match.getStartTime() +
                        " has been approved!\n\nLocation: " + match.getLocation()
        );
    }

    @Transactional
    public void cancelJoinRequest(Integer requestId, Integer memberId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getMember().getId().equals(memberId)) {
            throw new UnauthorizedException("Only requester can cancel request");
        }

        if (JoinRequest.Status.APPROVED.equals(request.getStatus())) {
            FriendlyMatch match = request.getFriendlyMatch();
            match.setCurrentPlayers(match.getCurrentPlayers() - 1);

            if ("FULL".equals(match.getStatus())) {
                match.setStatus("OPEN");
            }

            matchRepository.save(match);
        }

        joinRequestRepository.delete(request);

        // Notify organizer
        emailService.sendEmail(
                request.getFriendlyMatch().getOrganizer().getUser().getEmail(),
                "Join Request Cancelled",
                request.getMember().getUser().getName() + " has cancelled their request to join your match"
        );
    }

    private void scheduleReminder(FriendlyMatch match, Member member) {
        // Implementation would use a task scheduler
        LocalDateTime reminderTime = match.getStartTime().minusHours(24);
        // Actual scheduling implementation would go here
    }
}