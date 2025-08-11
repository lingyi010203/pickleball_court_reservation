package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CourtDto;
import com.pickleball_backend.pickleball.dto.CourtPricingDto;
import com.pickleball_backend.pickleball.dto.CourtDeletePreviewDto;
import com.pickleball_backend.pickleball.entity.Court;

import java.util.List;

public interface CourtService {
    Court createCourt(CourtDto courtDto);
    Court updateCourt(Integer id, CourtDto courtDto);
    void deleteCourt(Integer id);
    CourtDeletePreviewDto getDeletePreview(Integer id);
    void updateCourtPricing(Integer id, CourtPricingDto pricingDto);
    List<Court> getAllCourts();
    List<Court> getAllCourtsForMember();
    Court getCourtByIdForMember(Integer id);
    List<Court> findAvailableCourts(java.time.LocalDate date, String startTime, String endTime);
}