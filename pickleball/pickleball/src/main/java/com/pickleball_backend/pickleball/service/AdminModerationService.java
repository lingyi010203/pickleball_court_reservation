package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.FeedbackResponseDto;
import com.pickleball_backend.pickleball.entity.Feedback;
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminModerationService {

    private final FeedbackRepository feedbackRepository;
    private final EmailService emailService;
    private final CourtRepository courtRepository;
    private final EventRepository eventRepository;
    private final MemberRepository memberRepository;

    // 1. List all feedback (for admin moderation)
    public List<FeedbackResponseDto> getAllFeedback() {
        List<Feedback> feedbackList = feedbackRepository.findAll();
        return feedbackList.stream().map(this::convertToFeedbackResponseDto).collect(Collectors.toList());
    }

    // 2. Get details for a specific feedback
    public FeedbackResponseDto getFeedbackDetail(Integer feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        return convertToFeedbackResponseDto(feedback);
    }

    // 3. Remove feedback
    @Transactional
    public void removeFeedback(Integer feedbackId) {
        Feedback feedback = feedbackRepository.findById(feedbackId)
                .orElseThrow(() -> new RuntimeException("Feedback not found"));
        String userEmail = feedback.getUser().getEmail();
        String userName = feedback.getUser().getName();
        String review = feedback.getReview();
        // Send email notification
        emailService.sendFeedbackDeletionNotification(userEmail, userName, review);
        feedbackRepository.deleteById(feedbackId);
    }

    // Helper: Convert Feedback to FeedbackResponseDto
    private FeedbackResponseDto convertToFeedbackResponseDto(Feedback feedback) {
        FeedbackResponseDto dto = new FeedbackResponseDto();
        dto.setId(feedback.getId());
        dto.setTargetType(feedback.getTargetType().name());
        dto.setTargetId(feedback.getTargetId());
        // Lookup target name
        String targetName = "";
        switch (feedback.getTargetType()) {
            case COURT:
                targetName = courtRepository.findById(feedback.getTargetId())
                        .map(c -> c.getName())
                        .orElse("Court #" + feedback.getTargetId());
                break;
            case EVENT:
                targetName = eventRepository.findById(feedback.getTargetId())
                        .map(e -> e.getTitle())
                        .orElse("Event #" + feedback.getTargetId());
                break;
            case COACH:
                targetName = memberRepository.findById(feedback.getTargetId())
                        .map(m -> m.getUser().getName())
                        .orElse("Coach #" + feedback.getTargetId());
                break;
        }
        dto.setTargetName(targetName);
        dto.setRating(feedback.getRating());
        dto.setReview(feedback.getReview());
        dto.setUserName(feedback.getUser().getName());
        dto.setUserEmail(feedback.getUser().getEmail());
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setTags(feedback.getTags());
        // Set average rating for the target
        Double avg = feedbackRepository.findAverageRatingByTarget(feedback.getTargetType(), feedback.getTargetId());
        dto.setAverageRating(avg);
        return dto;
    }
}