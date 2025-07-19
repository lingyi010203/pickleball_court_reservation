// FeedbackService.java
package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.*;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.EventRepository;
import com.pickleball_backend.pickleball.repository.FeedbackRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import com.pickleball_backend.pickleball.repository.BookingRepository;

@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final CourtRepository courtRepository;
    private final EventRepository eventRepository;
    @Autowired
    private BookingRepository bookingRepository; // 確保有注入

    public FeedbackResponseDto createFeedback(FeedbackDto dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        // 验证预订是否存在且属于当前用户
        final Booking booking;
        if (dto.getBookingId() != null) {
            booking = bookingRepository.findById(dto.getBookingId())
                    .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", dto.getBookingId()));
            
            // 验证预订是否属于当前用户
            if (!booking.getMember().getUser().getId().equals(user.getId())) {
                throw new ValidationException("You can only review your own bookings.");
            }
            
            // 验证预订是否已完成
            if (!"COMPLETED".equals(booking.getStatus())) {
                throw new ValidationException("You can only review completed bookings.");
            }
            
            // 检查用户是否已经对这个预订评价过
            boolean hasReviewed = feedbackRepository.findByUserId(user.getId()).stream()
                    .anyMatch(feedback -> feedback.getBooking() != null 
                            && feedback.getBooking().getId().equals(booking.getId()));
            
            if (hasReviewed) {
                throw new ValidationException("You have already reviewed this booking. You can only edit your existing review.");
            }
        } else {
            booking = null;
        }

        // 如果提供了bookingId，从booking中获取courtId作为targetId
        Integer finalTargetId = dto.getTargetId();
        if (booking != null && finalTargetId == null) {
            // 从booking的slots中获取courtId
            if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                Slot slot = booking.getBookingSlots().get(0).getSlot();
                if (slot != null) {
                    finalTargetId = slot.getCourtId();
                }
            }
            
            if (finalTargetId == null) {
                throw new ValidationException("Unable to determine court ID from booking.");
            }
        }

        // 只針對COURT做檢查 - 改為檢查是否有已完成的預訂
        if (dto.getTargetType() == Feedback.TargetType.COURT && finalTargetId != null) {
            boolean hasCompletedBooking = bookingRepository.existsByMember_User_IdAndCompletedBookingForCourt(user.getId(), finalTargetId);
            if (!hasCompletedBooking) {
                throw new ValidationException("You can only review courts for completed bookings.");
            }
        }

        Feedback feedback = new Feedback();
        feedback.setTargetType(dto.getTargetType());
        feedback.setTargetId(finalTargetId);
        feedback.setRating(dto.getRating());
        feedback.setReview(dto.getReview());
        feedback.setUser(user);
        feedback.setBooking(booking); // 设置预订关联
        feedback.setCreatedAt(LocalDateTime.now());
        feedback.setTags(dto.getTags());

        Feedback savedFeedback = feedbackRepository.save(feedback);
        return convertToDto(savedFeedback);
    }

    public FeedbackResponseDto updateFeedback(Integer id, FeedbackDto dto) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", id));

        // Verify user owns the feedback
        if (!feedback.getUser().getUserAccount().getUsername().equals(username)) {
            throw new ValidationException("You can only update your own feedback");
        }

        feedback.setRating(dto.getRating());
        feedback.setReview(dto.getReview());
        feedback.setTags(dto.getTags()); // 添加tags字段的更新

        Feedback updatedFeedback = feedbackRepository.save(feedback);
        return convertToDto(updatedFeedback);
    }

    public void deleteFeedback(Integer id) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        Feedback feedback = feedbackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Feedback", "id", id));

        // Verify user owns the feedback or is admin
        boolean isOwner = feedback.getUser().getUserAccount().getUsername().equals(username);
        boolean isAdmin = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isOwner && !isAdmin) {
            throw new ValidationException("You don't have permission to delete this feedback");
        }

        feedbackRepository.delete(feedback);
    }

    public List<FeedbackResponseDto> getFeedbackForTarget(
            Feedback.TargetType targetType,
            Integer targetId
    ) {
        List<Feedback> feedbackList = feedbackRepository
                .findByTargetTypeAndTargetIdOrderByCreatedAtDesc(targetType, targetId);

        return feedbackList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<FeedbackResponseDto> getFeedbackByBookingId(Integer bookingId) {
        List<Feedback> feedbackList = feedbackRepository
                .findByBookingIdOrderByCreatedAtDesc(bookingId);

        return feedbackList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public FeedbackStatsDto getFeedbackStats(
            Feedback.TargetType targetType,
            Integer targetId
    ) {
        Double average = feedbackRepository.findAverageRatingByTarget(targetType, targetId);
        Integer count = feedbackRepository.countByTarget(targetType, targetId);

        FeedbackStatsDto stats = new FeedbackStatsDto();
        stats.setAverageRating(average != null ? average : 0.0);
        stats.setTotalReviews(count != null ? count : 0);
        return stats;
    }

    private FeedbackResponseDto convertToDto(Feedback feedback) {
        FeedbackResponseDto dto = new FeedbackResponseDto();
        dto.setId(feedback.getId());
        dto.setTargetType(feedback.getTargetType().name());
        dto.setTargetId(feedback.getTargetId());
        dto.setRating(feedback.getRating());
        dto.setReview(feedback.getReview());
        dto.setUserName(feedback.getUser().getName());
        dto.setUserEmail(feedback.getUser().getUserAccount().getUsername());
        dto.setUserId(feedback.getUser().getId()); // 添加用户ID
        dto.setCreatedAt(feedback.getCreatedAt());
        dto.setTags(feedback.getTags());
        dto.setBookingId(feedback.getBooking() != null ? feedback.getBooking().getId() : null);
        
        // Set target name based on target type
        if (feedback.getTargetType() == Feedback.TargetType.COURT) {
            Court court = courtRepository.findById(feedback.getTargetId()).orElse(null);
            dto.setTargetName(court != null ? court.getName() : "Unknown Court");
        } else if (feedback.getTargetType() == Feedback.TargetType.EVENT) {
            Event event = eventRepository.findById(feedback.getTargetId()).orElse(null);
            dto.setTargetName(event != null ? event.getTitle() : "Unknown Event");
        } else {
            dto.setTargetName("Unknown Target");
        }
        
        // Calculate average rating for the target
        if (feedback.getTargetType() == Feedback.TargetType.COURT) {
            Double avgRating = feedbackRepository.findByTargetTypeAndTargetIdOrderByCreatedAtDesc(Feedback.TargetType.COURT, feedback.getTargetId())
                    .stream()
                    .mapToInt(Feedback::getRating)
                    .average()
                    .orElse(0.0);
            dto.setAverageRating(avgRating);
        }
        
        return dto;
    }

    public List<FeedbackResponseDto> getFeedbackByCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<Feedback> feedbackList = feedbackRepository.findByUserId(user.getId());

        return feedbackList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public List<ReviewableItemDto> getReviewableBookings() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = auth.getName();

        User user = userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        List<Booking> completedBookings = bookingRepository.findCompletedBookingsByUserId(user.getId());

        return completedBookings.stream()
                .map(booking -> {
                    ReviewableItemDto dto = new ReviewableItemDto();
                    dto.setBookingId(booking.getId());
                    dto.setBookingDate(booking.getBookingDate());
                    
                    // Get court info from first booking slot
                    if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                        Slot slot = booking.getBookingSlots().get(0).getSlot();
                        if (slot != null) {
                            Court court = courtRepository.findById(slot.getCourtId())
                                    .orElse(null);
                            if (court != null) {
                                dto.setCourtId(court.getId());
                                dto.setCourtName(court.getName());
                                dto.setCourtLocation(court.getLocation());
                                dto.setSlotDate(slot.getDate());
                                dto.setStartTime(slot.getStartTime());
                                dto.setEndTime(slot.getEndTime());
                            }
                        }
                    }
                    
                    // Check if user has already reviewed this booking
                    final Integer bookingId = booking.getId();
                    boolean hasReviewed = feedbackRepository.findByUserId(user.getId()).stream()
                            .anyMatch(feedback -> feedback.getBooking() != null 
                                    && feedback.getBooking().getId().equals(bookingId));
                    
                    dto.setHasReviewed(hasReviewed);
                    
                    return dto;
                })
                .filter(dto -> dto.getCourtId() != null) // Filter out bookings without valid court info
                .collect(Collectors.toList());
    }
}