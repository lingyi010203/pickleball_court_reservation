package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.VenueDto;
import com.pickleball_backend.pickleball.entity.Venue;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.SlotRepository;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.HashSet;

@Service
public class VenueService {
    @Autowired
    private VenueRepository venueRepository;
    @Autowired
    private CourtRepository courtRepository;
    @Autowired
    private SlotRepository slotRepository;
    @Autowired
    private BookingRepository bookingRepository;

    public Venue createVenue(VenueDto venueDto) {
        // 若需要檢查重複場地，請根據現有欄位自行實作，否則直接建立
        // 例如：可用 name + location + state 作為唯一性檢查
        List<Venue> existing = venueRepository.findAll();
        boolean duplicate = existing.stream().anyMatch(v ->
            v.getName().equalsIgnoreCase(venueDto.getName()) &&
            v.getLocation().equalsIgnoreCase(venueDto.getAddress())
        );
        if (duplicate) {
            throw new IllegalArgumentException("Venue with the same name and location already exists");
        }
        Venue venue = new Venue();
        venue.setName(venueDto.getName());
        venue.setLocation(venueDto.getAddress());
        venue.setDescription(venueDto.getDescription());
        return venueRepository.save(venue);
    }

    /**
     * 查詢 venue 在指定日期、時間區間、所需人數下的可用 court
     */
    public List<Court> getAvailableCourts(Integer venueId, LocalDate date, LocalTime startTime, LocalTime endTime, int peopleCount) {
        List<Court> courts = courtRepository.findByVenueIn(new HashSet<>(List.of(venueRepository.findById(venueId).orElseThrow())));
        List<Court> availableCourts = new ArrayList<>();
        for (Court court : courts) {
            // 查詢該 court 在此時段是否有可用 slot
            var slots = slotRepository.findByCourtIdAndDateAndIsAvailableTrue(court.getId(), date);
            boolean hasAvailable = slots.stream().anyMatch(slot ->
                !slot.getStartTime().isAfter(endTime) && !slot.getEndTime().isBefore(startTime)
            );
            
            // 新增：檢查是否有與現有預訂的衝突
            boolean hasBookingConflict = bookingRepository.existsActiveBookingForCourtAndTime(
                court.getId(), date, startTime, endTime
            );
            
            // 只有沒有slot衝突且沒有預訂衝突的場地才可用
            if (hasAvailable && !hasBookingConflict) {
                availableCourts.add(court);
            }
        }
        // 直接返回所有可用場地，不再根據人數裁剪
        return availableCourts;
    }
}
