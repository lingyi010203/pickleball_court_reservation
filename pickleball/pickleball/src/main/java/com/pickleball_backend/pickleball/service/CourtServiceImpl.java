package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CourtDto;
import com.pickleball_backend.pickleball.dto.CourtPricingDto;
import com.pickleball_backend.pickleball.dto.SlotDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ValidationException;
import com.pickleball_backend.pickleball.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.*;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CourtServiceImpl implements CourtService {
    private static final Logger log = LoggerFactory.getLogger(CourtServiceImpl.class);
    private final CourtRepository courtRepository;
    private final SlotService slotService;
    private final BookingRepository bookingRepository;
    private final MemberRepository memberRepository;
    private final SlotRepository slotRepository;
    private final EmailService emailService;
    private final PaymentRepository paymentRepository;
    private final BookingSlotRepository bookingSlotRepository;
    @Autowired
    private VenueRepository venueRepository;
    private static final Map<String, DayOfWeek> DAY_OF_WEEK_MAP = Map.of(
        "MON", DayOfWeek.MONDAY,
        "TUE", DayOfWeek.TUESDAY,
        "WED", DayOfWeek.WEDNESDAY,
        "THU", DayOfWeek.THURSDAY,
        "FRI", DayOfWeek.FRIDAY,
        "SAT", DayOfWeek.SATURDAY,
        "SUN", DayOfWeek.SUNDAY
    );

    @Override
    public Court createCourt(CourtDto courtDto) {
        try {
            System.out.println("==> createCourt called, dto=" + courtDto);
            Venue venue = venueRepository.findById(courtDto.getVenueId())
                    .orElseThrow(() -> new EntityNotFoundException("Venue not found with id: " + courtDto.getVenueId()));

            if (courtRepository.existsByNameAndLocation(courtDto.getName(), courtDto.getLocation())) {
                throw new IllegalArgumentException("Court with the same name and location already exists");
            }

            Court court = new Court();
            court.setVenue(venue);
            saveOrUpdateCourt(court, courtDto);

            generateSlotsForNewCourt(court);

            System.out.println("==> createCourt success, id=" + court.getId());
            return court;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }


    private void generateSlotsForNewCourt(Court court) {
        try {
            if (court.getOpeningTime() == null || court.getClosingTime() == null) {
                throw new ValidationException("Court operating hours not defined");
            }
            LocalTime opening = LocalTime.parse(court.getOpeningTime());
            LocalTime closing = LocalTime.parse(court.getClosingTime());
            if (opening.isAfter(closing)) {
                throw new ValidationException("Opening time must be before closing time");
            }
            Set<DayOfWeek> operatingDaySet = parseOperatingDays(court.getOperatingDays());
            LocalDate start = LocalDate.now();
            LocalDate end = start.plusMonths(3);
            List<SlotDto> slots = new ArrayList<>();
            for (LocalDate date = start; date.isBefore(end); date = date.plusDays(1)) {
                if (!operatingDaySet.isEmpty() && !operatingDaySet.contains(date.getDayOfWeek())) {
                    continue;
                }
                LocalTime slotStart = opening;
                while (slotStart.isBefore(closing)) {
                    LocalTime slotEnd = slotStart.plusHours(1);
                    if (slotEnd.isAfter(closing)) {
                        break;
                    }
                    SlotDto slot = new SlotDto();
                    slot.setCourtId(court.getId());
                    slot.setDate(date);
                    slot.setStartTime(slotStart);
                    slot.setEndTime(slotEnd);
                    slot.setAvailable(true);
                    slot.setDurationHours(1);
                    slots.add(slot);
                    slotStart = slotStart.plusHours(1);
                }
            }
            slotService.createSlots(slots);
        } catch (DateTimeParseException e) {
            throw new ValidationException("Invalid time format: " + e.getMessage());
        }
    }

    private Set<DayOfWeek> parseOperatingDays(String operatingDaysStr) {
        if (operatingDaysStr == null || operatingDaysStr.trim().isEmpty()) {
            return EnumSet.allOf(DayOfWeek.class);
        }
        return Arrays.stream(operatingDaysStr.split(","))
                .map(String::trim)
                .map(this::parseDayOfWeek)
                .collect(Collectors.toSet());
    }

    private DayOfWeek parseDayOfWeek(String dayStr) {
        String upper = dayStr.trim().toUpperCase();
        if (DAY_OF_WEEK_MAP.containsKey(upper)) {
            return DAY_OF_WEEK_MAP.get(upper);
        }
        try {
            return DayOfWeek.valueOf(upper);
        } catch (IllegalArgumentException e) {
            throw new ValidationException("Invalid day in operating days: " + dayStr);
        }
    }

    @Override
    @Transactional
    public Court updateCourt(Integer id, CourtDto courtDto) {
        Court existingCourt = courtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Court not found with id: " + id));

        // Check for duplicate name/location only if they're being changed
        if (!existingCourt.getName().equals(courtDto.getName()) ||
                !existingCourt.getLocation().equals(courtDto.getLocation())) {

            if (courtRepository.existsByNameAndLocation(courtDto.getName(), courtDto.getLocation())) {
                throw new IllegalArgumentException("Another court with the same name and location already exists");
            }
        }

        return saveOrUpdateCourt(existingCourt, courtDto);
    }

    private Court saveOrUpdateCourt(Court court, CourtDto courtDto) {
        try {
            System.out.println("==> saveOrUpdateCourt called, dto=" + courtDto);
            court.setName(courtDto.getName());
            court.setLocation(courtDto.getLocation());
            court.setStatus(courtDto.getStatus().toUpperCase());
            court.setOpeningTime(courtDto.getOpeningTime());
            court.setClosingTime(courtDto.getClosingTime());
            // operatingDays 统一大写并去重
            if (courtDto.getOperatingDays() != null && !courtDto.getOperatingDays().isEmpty()) {
                String normalizedDays = Arrays.stream(courtDto.getOperatingDays().split(","))
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .distinct()
                    .collect(Collectors.joining(","));
                court.setOperatingDays(normalizedDays);
            } else {
                court.setOperatingDays(null);
            }
            court.setPeakHourlyPrice(courtDto.getPeakHourlyPrice());
            court.setOffPeakHourlyPrice(courtDto.getOffPeakHourlyPrice());
            court.setDailyPrice(courtDto.getDailyPrice());
            court.setPeakStartTime(courtDto.getPeakStartTime());
            court.setPeakEndTime(courtDto.getPeakEndTime());

            validatePeakTimes(courtDto);
            Court saved = courtRepository.save(court);
            System.out.println("==> saveOrUpdateCourt success, id=" + saved.getId());
            return saved;
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    private void validatePeakTimes(CourtDto courtDto) {
        if (courtDto.getPeakStartTime() != null && courtDto.getPeakEndTime() != null) {
            LocalTime start = LocalTime.parse(courtDto.getPeakStartTime());
            LocalTime end = LocalTime.parse(courtDto.getPeakEndTime());

            if (!start.isBefore(end)) {
                throw new IllegalArgumentException("Peak start time must be before end time");
            }

            // Check against operating hours
            if (courtDto.getOpeningTime() != null && courtDto.getClosingTime() != null) {
                LocalTime opening = LocalTime.parse(courtDto.getOpeningTime());
                LocalTime closing = LocalTime.parse(courtDto.getClosingTime());

                if (start.isBefore(opening) || end.isAfter(closing)) {
                    throw new IllegalArgumentException(
                            "Peak hours must be within operating hours"
                    );
                }
            }
        }
    }

    @Override
    @Transactional
    public void deleteCourt(Integer id) {
        Court court = courtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Court not found with id: " + id));

        if (court.getIsArchived() != null && court.getIsArchived()) {
            throw new IllegalStateException("Court already deleted");
        }

        // List<Booking> activeBookings = bookingRepository.findActiveBookingsByCourtId(id);
        // 替换为通过 BookingSlotRepository 查询所有该 courtId 下的 bookingSlot，且 booking 状态为有效
        List<BookingSlot> activeBookingSlots = bookingSlotRepository.findActiveByCourtId(id);
        List<Booking> activeBookings = activeBookingSlots.stream()
            .map(BookingSlot::getBooking)
            .filter(Objects::nonNull)
            .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()) && !"COMPLETED".equalsIgnoreCase(b.getStatus()) && !"CANCELLED_DUE_TO_COURT_DELETION".equalsIgnoreCase(b.getStatus()))
            .collect(Collectors.toList());

        if (!activeBookings.isEmpty()) {
            for (Booking booking : activeBookings) {
                try {
                    refundBooking(booking);
                    // Slot slot = booking.getSlot();
                    Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
                    emailService.sendCourtDeletionNotification(
                            booking.getMember().getUser().getEmail(),
                            court.getName(),
                            slot != null ? slot.getDate() : null,
                            slot != null ? slot.getStartTime() : null,
                            booking.getTotalAmount()
                    );
                    updateBookingStatus(booking);

                    addCompensationPoints(booking.getMember());
                } catch (Exception e) {
                    log.error("Error processing booking {} during court deletion: {}", booking.getId(), e.getMessage());
                }
            }
        }

        // 軟刪除球場
        courtRepository.softDeleteCourt(id, LocalDateTime.now());
        log.info("Court {} has been soft deleted", id);
    }

    private void refundBooking(Booking booking) {
        log.info("Processing refund for booking ID: {}, Amount: ${}",
                booking.getId(), booking.getTotalAmount());

        Payment payment = booking.getPayment();
        payment.setStatus("REFUNDED");
        paymentRepository.save(payment);

        // Slot slot = booking.getSlot();
        Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0).getSlot() : null;
        if (slot != null) {
            slot.setAvailable(true);
            slotRepository.save(slot);
        }

        // BookingSlot bookingSlot = booking.getBookingSlot();
        BookingSlot bookingSlot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() ? booking.getBookingSlots().get(0) : null;
        if (bookingSlot != null) {
            bookingSlot.setStatus("CANCELLED");
            bookingSlotRepository.save(bookingSlot);
        }
    }

    private void updateBookingStatus(Booking booking) {
        booking.setStatus("CANCELLED_DUE_TO_COURT_DELETION");
        bookingRepository.save(booking);
    }

    private void addCompensationPoints(Member member) {
        int currentPoints = member.getPointBalance();
        member.setPointBalance(currentPoints + 200); // 添加200積分作為補償
        memberRepository.save(member);
        log.info("Added 200 compensation points to member ID: {}", member.getId());
    }

    @Override
    @Transactional
    public void updateCourtPricing(Integer id, CourtPricingDto pricingDto) {
        Court court = courtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Court not found with id: " + id));

        // Validate peak times
        if (pricingDto.getPeakStartTime() != null && pricingDto.getPeakEndTime() != null) {
            LocalTime start = LocalTime.parse(pricingDto.getPeakStartTime());
            LocalTime end = LocalTime.parse(pricingDto.getPeakEndTime());

            if (!start.isBefore(end)) {
                throw new IllegalArgumentException("Peak start time must be before end time");
            }

            // Check against operating hours only if they exist
            if (court.getOpeningTime() != null && court.getClosingTime() != null) {
                try {
                    LocalTime opening = LocalTime.parse(court.getOpeningTime());
                    LocalTime closing = LocalTime.parse(court.getClosingTime());

                    if (start.isBefore(opening) || end.isAfter(closing)) {
                        throw new IllegalArgumentException(
                                "Peak hours must be within operating hours"
                        );
                    }
                } catch (DateTimeParseException e) {
                    throw new IllegalArgumentException("Invalid operating hours format");
                }
            }
        }

        // Update pricing fields
        court.setPeakHourlyPrice(pricingDto.getPeakHourlyPrice());
        court.setOffPeakHourlyPrice(pricingDto.getOffPeakHourlyPrice());
        court.setDailyPrice(pricingDto.getDailyPrice());
        court.setPeakStartTime(pricingDto.getPeakStartTime());
        court.setPeakEndTime(pricingDto.getPeakEndTime());

        courtRepository.save(court);
    }

    //slot
    @Override
    public List<Court> getAllCourts() {
        return courtRepository.findActiveCourts(); // Use the new query
    }

    @Override
    public List<Court> findAvailableCourts(LocalDate date, String startTime, String endTime) {
        // 1. 获取所有未归档球场
        List<Court> allCourts = courtRepository.findActiveCourts();

        // 2. 解析时间
        java.time.LocalTime start = java.time.LocalTime.parse(startTime);
        java.time.LocalTime end = java.time.LocalTime.parse(endTime);

        // 3. 查询该日期、时间段有冲突的预订（只查有效状态）
        List<Booking> bookings = bookingRepository.findAll();
        Set<Integer> bookedCourtIds = new HashSet<>();
        for (Booking booking : bookings) {
            if (booking.getStatus() != null && booking.getStatus().equalsIgnoreCase("CANCELLED")) continue;
            if (booking.getBookingSlots() == null) continue;
            for (BookingSlot bs : booking.getBookingSlots()) {
                Slot slot = bs.getSlot();
                if (slot == null) continue;
                if (!date.equals(slot.getDate())) continue;
                // 判断时间段是否有重叠
                if (!(end.isBefore(slot.getStartTime()) || start.isAfter(slot.getEndTime()))) {
                    bookedCourtIds.add(slot.getCourtId());
                }
            }
        }
        // 4. 过滤出未被预订的球场
        return allCourts.stream()
                .filter(court -> !bookedCourtIds.contains(court.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public Court getCourtByIdForMember(Integer id) {
        return courtRepository.findById(id)
                .filter(court ->
                        court.getIsArchived() == null ||
                                !court.getIsArchived()
                )
                .orElse(null);
    }
}