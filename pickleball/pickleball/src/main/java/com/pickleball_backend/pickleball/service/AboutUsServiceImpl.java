package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.AboutUsStatisticsDto;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AboutUsServiceImpl implements AboutUsService {

    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final FeedbackRepository feedbackRepository;
    private final BookingRepository bookingRepository;

    @Override
    public AboutUsStatisticsDto getAboutUsStatistics() {
        try {
            log.info("Fetching About Us statistics");

            // 1. Active Courts - 活躍的球場數量（未封存的球場）
            long activeCourts = courtRepository.findByIsArchivedFalseOrIsArchivedIsNull().size();

            // 2. Total Members - 總成員數量（所有用戶）
            long totalMembers = userRepository.count();

            // 3. Average Rating - 平均評分
            Double avgRating = feedbackRepository.findAverageRating();
            double averageRating = avgRating != null ? avgRating : 0.0;

            // 4. Matches Played - 已完成的比賽數量（已完成的預訂）
            long matchesPlayed = bookingRepository.findAll().stream()
                    .filter(booking -> "COMPLETED".equals(booking.getStatus()))
                    .count();

            log.info("About Us statistics calculated - Active Courts: {}, Total Members: {}, Average Rating: {}, Matches Played: {}", 
                    activeCourts, totalMembers, averageRating, matchesPlayed);

            return AboutUsStatisticsDto.builder()
                    .activeCourts(activeCourts)
                    .totalMembers(totalMembers)
                    .averageRating(averageRating)
                    .matchesPlayed(matchesPlayed)
                    .build();

        } catch (Exception e) {
            log.error("Error calculating About Us statistics", e);
            // 返回默認值以防錯誤
            return AboutUsStatisticsDto.builder()
                    .activeCourts(0)
                    .totalMembers(0)
                    .averageRating(0.0)
                    .matchesPlayed(0)
                    .build();
        }
    }
}
