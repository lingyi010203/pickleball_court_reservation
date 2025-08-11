package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CourtDto;
import com.pickleball_backend.pickleball.dto.CourtPricingDto;
import com.pickleball_backend.pickleball.dto.CourtDeletePreviewDto;
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
    private final FriendlyMatchService friendlyMatchService;
    private final EventRepository eventRepository;
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

            // 检查在同一场馆内是否有相同名称的场地
            if (courtRepository.existsByNameAndVenueId(courtDto.getName(), courtDto.getVenueId())) {
                throw new IllegalArgumentException("Court with the same name already exists in this venue");
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
            System.out.println("==> generateSlotsForNewCourt called for court " + court.getId());
            
            if (court.getOpeningTime() == null || court.getClosingTime() == null) {
                throw new ValidationException("Court operating hours not defined");
            }
            LocalTime opening = LocalTime.parse(court.getOpeningTime());
            LocalTime closing = LocalTime.parse(court.getClosingTime());
            if (opening.isAfter(closing)) {
                throw new ValidationException("Opening time must be before closing time");
            }
            
            Set<DayOfWeek> operatingDaySet = parseOperatingDays(court.getOperatingDays());
            System.out.println("==> Operating days set: " + operatingDaySet);
            
            LocalDate start = LocalDate.now();
            LocalDate end = start.plusMonths(3);
            List<SlotDto> slots = new ArrayList<>();
            
            for (LocalDate date = start; date.isBefore(end); date = date.plusDays(1)) {
                if (!operatingDaySet.isEmpty() && !operatingDaySet.contains(date.getDayOfWeek())) {
                    System.out.println("==> Skipping date " + date + " (not in operating days)");
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
            
            System.out.println("==> Generated " + slots.size() + " slots");
            if (!slots.isEmpty()) {
                System.out.println("==> First slot: " + slots.get(0).getDate() + " " + slots.get(0).getStartTime() + "-" + slots.get(0).getEndTime());
                System.out.println("==> Last slot: " + slots.get(slots.size()-1).getDate() + " " + slots.get(slots.size()-1).getStartTime() + "-" + slots.get(slots.size()-1).getEndTime());
            }
            
            slotService.createSlots(slots);
            System.out.println("==> Slots created successfully");
        } catch (DateTimeParseException e) {
            throw new ValidationException("Invalid time format: " + e.getMessage());
        }
    }

    private void regenerateSlotsForCourt(Court court) {
        try {
            System.out.println("==> regenerateSlotsForCourt called for court " + court.getId());
            System.out.println("==> Court operating days: " + court.getOperatingDays());
            System.out.println("==> Court opening time: " + court.getOpeningTime());
            System.out.println("==> Court closing time: " + court.getClosingTime());
            
            LocalDate today = LocalDate.now();
            
            // 获取该court的所有未来slots
            List<Slot> existingSlots = slotRepository.findByCourtIdAndDateGreaterThanEqual(court.getId(), today);
            System.out.println("==> Found " + existingSlots.size() + " existing future slots");
            
            // 解析新的operating days
            Set<DayOfWeek> newOperatingDays = parseOperatingDays(court.getOperatingDays());
            System.out.println("==> New operating days: " + newOperatingDays);
            
            // 处理已预订的slots
            List<Slot> bookedSlots = existingSlots.stream()
                .filter(slot -> {
                    boolean hasBooking = bookingSlotRepository.existsBySlotIdAndStatusIn(slot.getId(), Arrays.asList("BOOKED", "CONFIRMED"));
                    if (hasBooking) {
                        System.out.println("==> Found booked slot: " + slot.getId() + " for date " + slot.getDate() + " (day: " + slot.getDate().getDayOfWeek() + ")");
                        
                        // 检查这个slot的日期是否仍然在新的operating days中
                        boolean isStillOperatingDay = newOperatingDays.contains(slot.getDate().getDayOfWeek());
                        if (!isStillOperatingDay) {
                            System.out.println("==> Marking booked slot as SPECIAL_CIRCUMSTANCE: " + slot.getId());
                            slot.setStatus("SPECIAL_CIRCUMSTANCE");
                            slotRepository.save(slot);
                        }
                    }
                    return hasBooking;
                })
                .collect(Collectors.toList());
            
            System.out.println("==> Processed " + bookedSlots.size() + " booked slots");
            
            // 过滤出未被预订的slots
            List<Slot> unbookedSlots = existingSlots.stream()
                .filter(slot -> {
                    boolean hasBooking = bookingSlotRepository.existsBySlotIdAndStatusIn(slot.getId(), Arrays.asList("BOOKED", "CONFIRMED"));
                    return !hasBooking;
                })
                .collect(Collectors.toList());
            
            // 删除未被预订的slots
            for (Slot slot : unbookedSlots) {
                System.out.println("==> Deleting unbooked slot: " + slot.getId() + " for date " + slot.getDate());
                slotRepository.delete(slot);
            }
            
            System.out.println("==> Deleted " + unbookedSlots.size() + " unbooked slots");
            
            // 重新生成slots
            generateSlotsForNewCourt(court);
            
            // 验证新生成的slots
            List<Slot> newSlots = slotRepository.findByCourtIdAndDateGreaterThanEqual(court.getId(), today);
            System.out.println("==> After regeneration, found " + newSlots.size() + " slots");
            
            // 显示前几个slots的详细信息
            newSlots.stream().limit(5).forEach(slot -> {
                System.out.println("==> New slot: ID=" + slot.getId() + 
                    ", Date=" + slot.getDate() + 
                    ", Time=" + slot.getStartTime() + "-" + slot.getEndTime() + 
                    ", Available=" + slot.isAvailable() + 
                    ", Status=" + slot.getStatus());
            });
            
            System.out.println("==> Regenerated slots for court " + court.getId());
        } catch (Exception e) {
            System.err.println("==> Error regenerating slots for court " + court.getId() + ": " + e.getMessage());
            e.printStackTrace();
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
        System.out.println("==> updateCourt called, id=" + id + ", dto=" + courtDto);
        Court existingCourt = courtRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Court not found with id: " + id));

        // Check for duplicate name in the same venue only if name is being changed
        if (!existingCourt.getName().equals(courtDto.getName())) {
            if (courtRepository.existsByNameAndVenueId(courtDto.getName(), courtDto.getVenueId())) {
                throw new IllegalArgumentException("Another court with the same name already exists in this venue");
            }
        }

        // 检查是否是恢复DELETED状态的球场
        boolean isRestoringDeletedCourt = "DELETED".equalsIgnoreCase(existingCourt.getStatus()) && 
                                        !"DELETED".equalsIgnoreCase(courtDto.getStatus());
        
        System.out.println("==> Existing court status: " + existingCourt.getStatus());
        System.out.println("==> New court status: " + courtDto.getStatus());
        System.out.println("==> Is restoring deleted court: " + isRestoringDeletedCourt);

        // 检查operating days是否有变化
        boolean operatingDaysChanged = false;
        if (existingCourt.getOperatingDays() == null && courtDto.getOperatingDays() != null) {
            operatingDaysChanged = true;
        } else if (existingCourt.getOperatingDays() != null && courtDto.getOperatingDays() == null) {
            operatingDaysChanged = true;
        } else if (existingCourt.getOperatingDays() != null && courtDto.getOperatingDays() != null) {
            String existingNormalized = Arrays.stream(existingCourt.getOperatingDays().split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
            String newNormalized = Arrays.stream(courtDto.getOperatingDays().split(","))
                .map(String::trim)
                .map(String::toUpperCase)
                .distinct()
                .collect(Collectors.joining(","));
            operatingDaysChanged = !existingNormalized.equals(newNormalized);
        }

        Court updatedCourt = saveOrUpdateCourt(existingCourt, courtDto);

        // 如果是恢复DELETED状态的球场，重新生成slots
        if (isRestoringDeletedCourt) {
            System.out.println("==> Restoring deleted court, regenerating slots for court " + id);
            regenerateSlotsForCourt(updatedCourt);
        }
        // 如果operating days有变化，重新生成slots
        else if (operatingDaysChanged) {
            System.out.println("==> Operating days changed, regenerating slots for court " + id);
            regenerateSlotsForCourt(updatedCourt);
        }

        return updatedCourt;
    }

    private Court saveOrUpdateCourt(Court court, CourtDto courtDto) {
        try {
            System.out.println("==> saveOrUpdateCourt called, dto=" + courtDto);
            court.setName(courtDto.getName());
            court.setLocation(courtDto.getLocation());
            
            // 更新场馆（如果venueId有变化）
            if (courtDto.getVenueId() != null) {
                System.out.println("==> Updating venue to ID: " + courtDto.getVenueId());
                Venue venue = venueRepository.findById(courtDto.getVenueId())
                    .orElseThrow(() -> new EntityNotFoundException("Venue not found with id: " + courtDto.getVenueId()));
                court.setVenue(venue);
            }
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
                System.out.println("==> Updating operating days to: " + normalizedDays);
                court.setOperatingDays(normalizedDays);
            } else {
                System.out.println("==> Setting operating days to null");
                court.setOperatingDays(null);
            }
            court.setPeakHourlyPrice(courtDto.getPeakHourlyPrice());
            court.setOffPeakHourlyPrice(courtDto.getOffPeakHourlyPrice());
            court.setDailyPrice(courtDto.getDailyPrice());
            court.setPeakStartTime(courtDto.getPeakStartTime());
            court.setPeakEndTime(courtDto.getPeakEndTime());
            
            // 更新场地类型
            if (courtDto.getCourtType() != null) {
                System.out.println("==> Updating court type to: " + courtDto.getCourtType());
                court.setCourtType(courtDto.getCourtType());
            }

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

        if ("DELETED".equalsIgnoreCase(court.getStatus())) {
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
                    // 新增：同步取消 FriendlyMatch
                    friendlyMatchService.cancelReservationAndMatch(booking.getId());
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

        // 软删除球场：将状态设为DELETED而不是归档
        court.setStatus("DELETED");
        courtRepository.save(court);
        log.info("Court {} has been soft deleted (status set to DELETED)", id);
    }

    @Override
    public CourtDeletePreviewDto getDeletePreview(Integer id) {
        try {
            Court court = courtRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Court not found with id: " + id));

            // 检查球场是否已经被删除
            if ("DELETED".equalsIgnoreCase(court.getStatus())) {
                throw new IllegalStateException("Court already deleted");
            }

            CourtDeletePreviewDto preview = new CourtDeletePreviewDto();

            // 获取active bookings
            List<BookingSlot> activeBookingSlots = bookingSlotRepository.findActiveByCourtId(id);
            List<Booking> activeBookings = activeBookingSlots.stream()
                .map(BookingSlot::getBooking)
                .filter(Objects::nonNull)
                .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()) && 
                            !"COMPLETED".equalsIgnoreCase(b.getStatus()) && 
                            !"CANCELLED_DUE_TO_COURT_DELETION".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

            List<CourtDeletePreviewDto.AffectedBookingDto> affectedBookings = activeBookings.stream()
                .map(booking -> {
                    CourtDeletePreviewDto.AffectedBookingDto dto = new CourtDeletePreviewDto.AffectedBookingDto();
                    
                    // 安全获取用户名称
                    String memberName = "Unknown User";
                    try {
                        if (booking.getMember() != null && booking.getMember().getUser() != null) {
                            memberName = booking.getMember().getUser().getName();
                            if (memberName == null || memberName.trim().isEmpty()) {
                                memberName = "Unknown User";
                            }
                        }
                    } catch (Exception e) {
                        log.warn("Error getting member name for booking {}: {}", booking.getId(), e.getMessage());
                    }
                    dto.setMemberName(memberName);
                    
                    // 获取slot信息
                    try {
                        Slot slot = booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty() 
                            ? booking.getBookingSlots().get(0).getSlot() : null;
                        if (slot != null) {
                            dto.setSlotDate(slot.getDate().toString());
                            dto.setSlotTime(slot.getStartTime() + " - " + slot.getEndTime());
                        } else {
                            dto.setSlotDate("N/A");
                            dto.setSlotTime("N/A");
                        }
                    } catch (Exception e) {
                        log.warn("Error getting slot info for booking {}: {}", booking.getId(), e.getMessage());
                        dto.setSlotDate("N/A");
                        dto.setSlotTime("N/A");
                    }
                    
                    dto.setTotalAmount(booking.getTotalAmount());
                    dto.setBookingStatus(booking.getStatus() != null ? booking.getStatus() : "UNKNOWN");
                    return dto;
                })
                .collect(Collectors.toList());

            preview.setActiveBookings(affectedBookings);

            // 获取friendly matches (这里需要根据你的FriendlyMatch实体结构来调整)
            // 暂时设置为空列表，你需要根据实际的FriendlyMatch实体来实现
            List<CourtDeletePreviewDto.AffectedFriendlyMatchDto> affectedMatches = new ArrayList<>();
            preview.setFriendlyMatches(affectedMatches);

            log.info("Delete preview generated for court {}: {} active bookings, {} friendly matches", 
                    id, affectedBookings.size(), affectedMatches.size());
            
            return preview;
        } catch (Exception e) {
            log.error("Error generating delete preview for court {}: {}", id, e.getMessage(), e);
            throw new RuntimeException("Failed to generate delete preview: " + e.getMessage(), e);
        }
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
        int currentPoints = member.getTierPointBalance();
        member.setTierPointBalance(currentPoints + 100); // 添加100積分作為補償
        memberRepository.save(member);
        log.info("Added 100 compensation points to member ID: {}", member.getId());
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
        // 返回所有球场，包括DELETED状态的，用于Admin管理
        return courtRepository.findAll();
    }

    @Override
    public List<Court> getAllCourtsForMember() {
        // 返回所有非DELETED状态的球场，用于用户查看
        return courtRepository.findAll().stream()
                .filter(court -> !"DELETED".equalsIgnoreCase(court.getStatus()))
                .collect(Collectors.toList());
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
        
        // 4. 新增：查询该日期、时间段有冲突的Event
        Set<Integer> eventBookedCourtIds = new HashSet<>();
        List<Event> events = eventRepository.findAll();
        for (Event event : events) {
            if ("CANCELLED".equalsIgnoreCase(event.getStatus())) continue;
            if (event.getCourts() == null) continue;
            
            // 检查Event是否在指定日期和时间段
            if (date.equals(event.getStartTime().toLocalDate())) {
                java.time.LocalTime eventStart = event.getStartTime().toLocalTime();
                java.time.LocalTime eventEnd = event.getEndTime().toLocalTime();
                
                // 判断时间段是否有重叠
                if (!(end.isBefore(eventStart) || start.isAfter(eventEnd))) {
                    for (Court eventCourt : event.getCourts()) {
                        eventBookedCourtIds.add(eventCourt.getId());
                    }
                }
            }
        }
        
        // 5. 合并所有冲突的场地球场ID
        bookedCourtIds.addAll(eventBookedCourtIds);
        
        // 6. 过滤出未被预订的球场
        return allCourts.stream()
                .filter(court -> !bookedCourtIds.contains(court.getId()))
                .collect(Collectors.toList());
    }

    @Override
    public Court getCourtByIdForMember(Integer id) {
        return courtRepository.findById(id)
                .filter(court ->
                        !"DELETED".equalsIgnoreCase(court.getStatus())
                )
                .orElse(null);
    }
}