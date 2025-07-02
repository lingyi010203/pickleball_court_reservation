package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.dto.FeedbackResponseDto;
import com.pickleball_backend.pickleball.service.AdminModerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/moderation")
@RequiredArgsConstructor
public class AdminModerationController {

    private final AdminModerationService moderationService;

    // 1. List all feedback for moderation
    @GetMapping("/feedback")
    public List<FeedbackResponseDto> getAllFeedback() {
        return moderationService.getAllFeedback();
    }

    // 2. Get details for a specific feedback
    @GetMapping("/feedback/{feedbackId}")
    public FeedbackResponseDto getFeedbackDetail(@PathVariable Integer feedbackId) {
        return moderationService.getFeedbackDetail(feedbackId);
    }

    // 3. Remove feedback
    @DeleteMapping("/feedback/{feedbackId}")
    public void removeFeedback(@PathVariable Integer feedbackId) {
        moderationService.removeFeedback(feedbackId);
    }
}