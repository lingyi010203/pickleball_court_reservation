package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.CoachSlotDto;
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

@Service
@RequiredArgsConstructor
public class CoachCourtServiceImpl implements CoachCourtService {

    private static final Logger log = LoggerFactory.getLogger(CoachCourtServiceImpl.class);

    private final CourtRepository courtRepository;
    private final ClassSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final CancellationRequestRepository cancellationRequestRepository;
    private final EmailService emailService;

    @Override
    public List<Court> getAvailableCourtsForCoach(Integer coachId) {
        return courtRepository.findCourtsByCoachId(coachId);
    }

    @Override
    public List<ClassSession> findScheduleByCoachIdAndPeriod(Integer coachId, LocalDateTime from, LocalDateTime to) {
        return sessionRepository.findScheduleByCoachIdAndPeriod(coachId, from, to);
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

        ClassSession session = new ClassSession();
        session.setCoach(coach);
        session.setCourt(court);
        session.setStartTime(slotDto.getStartTime());
        session.setEndTime(slotDto.getEndTime());
        session.setStatus("AVAILABLE");
        session.setSlotType("COACH_AVAILABILITY");
        session.setCreatedAt(LocalDateTime.now());

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

        log.warn("Coach {} force-removed booked session {}. Player {} notified and refunded.",
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
}