package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AboutUsStatisticsDto {
    private long activeCourts;
    private long totalMembers;
    private double averageRating;
    private long matchesPlayed;
}
