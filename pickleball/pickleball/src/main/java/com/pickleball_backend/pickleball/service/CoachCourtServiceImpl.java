package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CoachSlotDto;
import com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.time.LocalDate;

@Service
@RequiredArgsConstructor
public class CoachCourtServiceImpl implements CoachCourtService {

    private static final Logger log = LoggerFactory.getLogger(CoachCourtServiceImpl.class);

    private final CourtRepository courtRepository;
    private final CoachRepository coachRepository;
    private final ClassSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final EmailService emailService;
    private final ClassRegistrationRepository classRegistrationRepository;

    @Override
    public List<Court> getAvailableCourtsForCoach(Integer coachId) {
        Coach coach = coachRepository.findById(coachId)
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found with ID: " + coachId));
        Set<Venue> venues = coach.getVenues();
        if (venues == null || venues.isEmpty()) return List.of();
        return courtRepository.findByVenueIn(venues);
    }
    @Override
    public List<ClassSession> findScheduleByCoachIdAndPeriod(Integer coachId, LocalDateTime from, LocalDateTime to) {
        return sessionRepository.findScheduleByCoachIdAndPeriodWithVenue(coachId, from, to);
    }

    @Override
    public List<ClassSession> findScheduleByCoachIdAndPeriodWithVenue(Integer coachId, LocalDateTime from, LocalDateTime to) {
        return sessionRepository.findScheduleByCoachIdAndPeriodWithVenue(coachId, from, to);
    }

    @Transactional
    @Override
    public ClassSession createCoachSlot(Integer coachId, CoachSlotDto slotDto) {
        User coach = userRepository.findById(coachId)
                .orElseThrow(() -> new ResourceNotFoundException("Coach not found with ID: " + coachId));

        Court court = courtRepository.findById(slotDto.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found with ID: " + slotDto.getCourtId()));

        if (sessionRepository.existsByCoachIdAndStartTimeBetweenAndStatusNot(
                coachId, slotDto.getStartTime(), slotDto.getEndTime(), "CANCELLED")) {
            throw new ConflictException("Coach has scheduling conflict at this time");
        }

        if (sessionRepository.existsByCourtIdAndStartTimeBetweenAndStatusNot(
                slotDto.getCourtId(), slotDto.getStartTime(), slotDto.getEndTime(), "CANCELLED")) {
            throw new ConflictException("Court is already booked at this time");
        }

        // 防呆：title 不可為 null
        String title = (slotDto.getTitle() == null || slotDto.getTitle().trim().isEmpty()) ? "Coaching Session" : slotDto.getTitle();

        ClassSession session = new ClassSession();
        session.setCoach(coach);
        session.setCourt(court);
        session.setStartTime(slotDto.getStartTime());
        session.setEndTime(slotDto.getEndTime());
        session.setStatus("AVAILABLE");
        session.setSlotType("COACH_AVAILABILITY");
        session.setCreatedAt(LocalDateTime.now());
        session.setExperienceYear(slotDto.getExperienceYear());
        session.setTitle(title); // <--- 這裡一定要設
        session.setDescription(slotDto.getDescription());
        session.setMaxParticipants(slotDto.getMaxParticipants());
        session.setPrice(slotDto.getPrice());

        log.info("Coach {} created new availability slot on court {} from {} to {}",
                coachId, court.getId(), slotDto.getStartTime(), slotDto.getEndTime());

        return sessionRepository.save(session);
    }

    @Transactional
    @Override
    public void updateCoachSlot(Integer coachId, Integer sessionId, CoachSlotDto slotDto) {
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with ID: " + sessionId));

        if (!session.getCoach().getId().equals(coachId)) {
            throw new UnauthorizedException("You don't have permission to modify this slot");
        }

        if ("BOOKED".equals(session.getStatus())) {
            throw new ValidationException("Cannot modify a booked slot. Please cancel booking first.");
        }

        if (sessionRepository.existsConflictForUpdate(
                sessionId,
                slotDto.getCourtId(),
                slotDto.getStartTime(),
                slotDto.getEndTime())) {
            throw new ConflictException("New time slot conflicts with existing sessions");
        }

        session.setStartTime(slotDto.getStartTime());
        session.setEndTime(slotDto.getEndTime());
        session.setUpdatedAt(LocalDateTime.now());
        session.setExperienceYear(slotDto.getExperienceYear());
        sessionRepository.save(session);

        log.info("Coach {} updated slot {}: new time {} to {}",
                coachId, sessionId, slotDto.getStartTime(), slotDto.getEndTime());
    }

    @Transactional
    @Override
    public void removeCoachSlot(Integer coachId, Integer sessionId, boolean forceRemove) {
        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Slot not found with ID: " + sessionId));

        if (!session.getCoach().getId().equals(coachId)) {
            throw new UnauthorizedException("You don't have permission to delete this slot");
        }

        if ("BOOKED".equals(session.getStatus())) {
            if (forceRemove) {
                handleBookedSlotRemoval(session);
            } else {
                throw new ConflictException("Slot is booked. Use forceRemove=true to cancel booking");
            }
        }

        sessionRepository.delete(session);
        log.info("Coach {} deleted slot {}", coachId, sessionId);
    }

    private void handleBookedSlotRemoval(ClassSession session) {
        User player = session.getPlayer();
        if (player == null) {
            log.error("Booked session {} has no associated player", session.getId());
            throw new IllegalStateException("No player associated with this booking");
        }

        // 1. Send cancellation notification
        emailService.sendSessionCancellation(
                player.getEmail(),
                session.getStartTime(),
                session.getCoach().getName(),
                session.getCourt().getName()
        );

        // 2. Process refund
        refundBooking(session);

        // 3. Create cancellation request
        createCancellationRequest(session, "Coach initiated cancellation");

        log.warn("Coach {} force-cancelled booked session {}. Player {} notified and refunded.",
                session.getCoach().getId(), session.getId(), player.getId());
    }

    private void refundBooking(ClassSession session) {
        Payment payment = session.getPayment();
        if (payment == null) {
            log.error("No payment found for session {}", session.getId());
            throw new ResourceNotFoundException("Payment record not found");
        }

        // 1. Update payment status
        payment.setStatus("REFUNDED");
        payment.setRefundDate(LocalDateTime.now());
        paymentRepository.save(payment);

        // 2. Refund to player's wallet
        Wallet playerWallet = walletRepository.findByMemberId(session.getPlayer().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Player wallet not found"));

        playerWallet.setBalance(playerWallet.getBalance() + payment.getAmount());
        walletRepository.save(playerWallet);

        log.info("Refund processed for session {}: ${} refunded to player {}",
                session.getId(), payment.getAmount(), session.getPlayer().getId());
    }

    private void createCancellationRequest(ClassSession session, String reason) {
        CancellationRequest request = new CancellationRequest();
        request.setSession(session);
        request.setReason(reason);
        request.setRequestDate(LocalDateTime.now());
        request.setStatus("APPROVED");
        request.setInitiatedByCoach(true);
        cancellationRequestRepository.save(request);
    }

    @Override
public List<ClassSession> findAvailableSlotsByCoachAndCourt(Integer coachId, Integer courtId) {
    return sessionRepository.findAvailableSlotsByCoachAndCourt(coachId, courtId);
}

    @Override
    public List<Object[]> getAllStudentsForCoach(Integer coachId) {
        return classRegistrationRepository.findStudentsByCoachId(coachId);
    }

    @Transactional
    public void createRecurringClass(Integer coachId, RecurringSessionRequestDto dto) {
        // Defensive: ensure title is not null or blank
        String title = (dto.getTitle() == null || dto.getTitle().trim().isEmpty()) ? "Recurring Class" : dto.getTitle();
        LocalDate current = dto.getStartDate();
        while (!current.isAfter(dto.getEndDate())) {
            if (dto.getDaysOfWeek().contains(current.getDayOfWeek())) {
                LocalDateTime start = LocalDateTime.of(current, dto.getStartTime());
                LocalDateTime end = LocalDateTime.of(current, dto.getEndTime());
                if (!sessionRepository.existsByCourtIdAndStartTimeBetweenAndStatusNot(
                        dto.getCourtId(), start, end, "CANCELLED")) {
                    ClassSession session = new ClassSession();
                    session.setCoach(coachRepository.findById(coachId).orElseThrow().getUser());
                    session.setCourt(courtRepository.findById(dto.getCourtId()).orElseThrow());
                    session.setStartTime(start);
                    session.setEndTime(end);
                    session.setStatus("AVAILABLE");
                    session.setSlotType("COACH_SESSION");
                    session.setTitle(title);
                    session.setDescription(dto.getDescription());
                    session.setMaxParticipants(dto.getMaxParticipants());
                    session.setPrice(dto.getPrice());
                    sessionRepository.save(session);
                }
            }
            current = current.plusDays(1);
        }
    }
}