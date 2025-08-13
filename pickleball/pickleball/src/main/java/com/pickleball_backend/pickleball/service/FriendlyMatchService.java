package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import com.pickleball_backend.pickleball.dto.FriendlyMatchInvitationDto;
import com.pickleball_backend.pickleball.dto.JoinRequestDto;
import com.pickleball_backend.pickleball.dto.FriendlyMatchResponseDto;
import com.pickleball_backend.pickleball.dto.BookingResponseDto;
import com.pickleball_backend.pickleball.dto.FriendlyMatchPaymentDto;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.HashMap;
import java.util.Map;
import com.pickleball_backend.pickleball.repository.CourtRepository;
import com.pickleball_backend.pickleball.repository.VenueRepository;
import com.pickleball_backend.pickleball.repository.BookingRepository;
import com.pickleball_backend.pickleball.repository.PaymentRepository;
import com.pickleball_backend.pickleball.repository.WalletRepository;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class FriendlyMatchService {

    @Autowired private FriendlyMatchRepository matchRepository;
    @Autowired private JoinRequestRepository joinRequestRepository;
    @Autowired private MemberRepository memberRepository;
    @Autowired private EmailService emailService;
    @Autowired private CourtRepository courtRepository;
    @Autowired private VenueRepository venueRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private SlotRepository slotRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private WalletRepository walletRepository;
    @Autowired
    private CancellationRequestRepository cancellationRequestRepository;
    @Autowired
    private FeedbackRepository feedbackRepository;

    public List<FriendlyMatch> getOpenMatches() {
        // 获取所有状态为OPEN的比赛，包括邀请类型和独立类型
        return matchRepository.findByStatus("OPEN");
    }

    @Transactional
    public FriendlyMatch createMatch(FriendlyMatch match, Integer organizerId) {
        Member organizer = memberRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        match.setOrganizer(organizer);
        return matchRepository.save(match);
    }

    @Transactional
    public FriendlyMatchResponseDto createFriendlyMatch(FriendlyMatch match, Integer organizerId) {
        Member organizer = memberRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        match.setOrganizer(organizer);
        match.setIsInvitation(false);
        match.setInvitationType("FRIENDLY_MATCH");
        match.setStatus("OPEN");
        match.setPaymentStatus("PENDING");
        match.setCurrentPlayers(1); // Organizer is first player

        // 验证courtId是否存在並計算價格
        if (match.getCourtId() != null) {
            Court court = courtRepository.findById(match.getCourtId()).orElse(null);
            if (court == null) {
                throw new ResourceNotFoundException("Court not found with ID: " + match.getCourtId());
            }
            
            // 計算價格：根據時間判斷使用 peak 或 off-peak 價格
            if (match.getDurationHours() != null && match.getStartTime() != null) {
                double pricePerHour = 0.0;
                String priceType = "Unknown";
                
                // 判斷是否為 peak hour
                if (court.getPeakStartTime() != null && court.getPeakEndTime() != null) {
                    try {
                        int peakStartHour = Integer.parseInt(court.getPeakStartTime().split(":")[0]);
                        int peakEndHour = Integer.parseInt(court.getPeakEndTime().split(":")[0]);
                        int matchStartHour = match.getStartTime().getHour();
                        
                        boolean isPeakHour;
                        // 處理跨日的情況（例如 22:00 - 02:00）
                        if (peakStartHour > peakEndHour) {
                            isPeakHour = matchStartHour >= peakStartHour || matchStartHour <= peakEndHour;
                        } else {
                            isPeakHour = matchStartHour >= peakStartHour && matchStartHour < peakEndHour;
                        }
                        
                        if (isPeakHour) {
                            pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                            priceType = "Peak";
                        } else {
                            pricePerHour = court.getOffPeakHourlyPrice() != null ? court.getOffPeakHourlyPrice() : 0.0;
                            priceType = "Off-Peak";
                        }
                    } catch (Exception e) {
                        // 如果解析失敗，使用 peak price 作為默認值
                        pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                        priceType = "Default (Peak)";
                    }
                } else {
                    // 如果沒有設置 peak 時間，使用 peak price 作為默認值
                    pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                    priceType = "Default (Peak)";
                }
                
                double totalPrice = pricePerHour * match.getDurationHours();
                match.setPrice(totalPrice);
                
                System.out.println("=== Price calculation ===");
                System.out.println("Match start time: " + match.getStartTime());
                System.out.println("Peak start time: " + court.getPeakStartTime());
                System.out.println("Peak end time: " + court.getPeakEndTime());
                System.out.println("Price type: " + priceType);
                System.out.println("Court price per hour: " + pricePerHour);
                System.out.println("Duration hours: " + match.getDurationHours());
                System.out.println("Total price: " + totalPrice);
            }
        }

        // Lock the court slot by setting it to pending status
        if (match.getStartTime() != null && match.getCourtId() != null) {
            // 锁定对应的时间段，防止其他人预订
            LocalDateTime startTime = match.getStartTime();
            LocalDateTime endTime = match.getEndTime();
            
            System.out.println("=== Locking slots for friendly match ===");
            System.out.println("Court ID: " + match.getCourtId());
            System.out.println("Start Time: " + startTime);
            System.out.println("End Time: " + endTime);
            
            // 查找并更新对应时间段的slot状态为PENDING
            List<Slot> slotsToLock = slotRepository.findByCourtIdAndDateAndIsAvailableTrue(
                match.getCourtId(),
                startTime.toLocalDate()
            );
            
            System.out.println("Total slots found for date: " + slotsToLock.size());
            
            // 过滤出在时间范围内的slots
            List<Slot> slotsInTimeRange = slotsToLock.stream()
                .filter(slot -> !slot.getStartTime().isBefore(startTime.toLocalTime()) && 
                               !slot.getEndTime().isAfter(endTime.toLocalTime()))
                .toList();
            
            System.out.println("Slots in time range: " + slotsInTimeRange.size());
            
            for (Slot slot : slotsInTimeRange) {
                System.out.println("Locking slot: " + slot.getId() + 
                    ", Time: " + slot.getStartTime() + "-" + slot.getEndTime() + 
                    ", Status: " + slot.getStatus() + " -> PENDING");
                slot.setStatus("PENDING");
                slot.setAvailable(false);
                slotRepository.save(slot);
            }
            System.out.println("=== End locking slots ===");
        }

        FriendlyMatch savedMatch = matchRepository.save(match);
        
        // 為 organizer 創建一個 join request，確保他們被計算為參與者
        JoinRequest organizerJoinRequest = new JoinRequest();
        organizerJoinRequest.setFriendlyMatch(savedMatch);
        organizerJoinRequest.setMember(organizer);
        organizerJoinRequest.setStatus(JoinRequest.Status.APPROVED);
        organizerJoinRequest.setRequestTime(LocalDateTime.now());
        joinRequestRepository.save(organizerJoinRequest);
        
        // Convert to DTO to avoid serialization issues
        return convertToResponseDto(savedMatch, "Friendly match created successfully! The court is now temporarily locked.");
    }

    /**
     * 确定match的状态
     * 如果时间已过期，返回"END"
     * 如果match状态是CANCELLED，返回"CANCELLED"
     * 否则返回原始状态
     */
    private String determineMatchStatus(FriendlyMatch match) {
        System.out.println("=== Checking match status ===");
        System.out.println("Match ID: " + match.getId());
        System.out.println("Original status: " + match.getStatus());
        System.out.println("Start time: " + match.getStartTime());
        System.out.println("End time: " + match.getEndTime());
        System.out.println("Current players: " + match.getCurrentPlayers());
        System.out.println("Max players: " + match.getMaxPlayers());
        
        // 如果match已经被取消，直接返回CANCELLED
        if ("CANCELLED".equals(match.getStatus())) {
            System.out.println("Match is CANCELLED, returning CANCELLED");
            return "CANCELLED";
        }
        
        // 检查时间是否已过期
        LocalDateTime now = LocalDateTime.now();
        System.out.println("Current time: " + now);
        System.out.println("Current date: " + now.toLocalDate());
        LocalDateTime matchEndTime = null;
        
        if (match.getEndTime() != null) {
            matchEndTime = match.getEndTime();
            System.out.println("Using end time: " + matchEndTime);
            System.out.println("End date: " + matchEndTime.toLocalDate());
        } else if (match.getStartTime() != null) {
            // 如果没有endTime，使用startTime + 1小时作为结束时间
            matchEndTime = match.getStartTime().plusHours(1);
            System.out.println("Using start time + 1 hour: " + matchEndTime);
            System.out.println("Calculated end date: " + matchEndTime.toLocalDate());
        }
        
        if (matchEndTime != null) {
            boolean isExpired = now.isAfter(matchEndTime);
            System.out.println("Is expired: " + isExpired);
            System.out.println("Time difference: " + java.time.Duration.between(matchEndTime, now));
            if (isExpired) {
                System.out.println("Match is expired, returning END");
                return "END";
            }
        } else {
            System.out.println("No end time available, cannot determine if expired");
        }
        
        // 检查是否满员
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            System.out.println("Match is full, returning FULL");
            return "FULL";
        }
        
        System.out.println("Match is not expired and not full, returning original status: " + match.getStatus());
        return match.getStatus();
    }

    @Transactional
    public void deleteFriendlyMatch(Integer matchId, Integer organizerId) {
        FriendlyMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        // 只有发起人才能删除match
        if (!match.getOrganizer().getId().equals(organizerId)) {
            throw new UnauthorizedException("Only the organizer can delete this match");
        }

        // 解锁对应的时间段
        if (match.getStartTime() != null && match.getCourtId() != null) {
            LocalDateTime startTime = match.getStartTime();
            LocalDateTime endTime = match.getEndTime();
            
            System.out.println("=== Unlocking slots for deleted friendly match ===");
            System.out.println("Court ID: " + match.getCourtId());
            System.out.println("Start Time: " + startTime);
            System.out.println("End Time: " + endTime);
            
            // 查找并更新对应时间段的slot状态为AVAILABLE
            List<Slot> slotsToUnlock = slotRepository.findByCourtIdAndDateAndStatus(
                match.getCourtId(),
                startTime.toLocalDate(),
                "PENDING"
            );
            
            System.out.println("Total PENDING slots found for date: " + slotsToUnlock.size());
            
            // 过滤出在时间范围内的slots
            List<Slot> slotsInTimeRange = slotsToUnlock.stream()
                .filter(slot -> !slot.getStartTime().isBefore(startTime.toLocalTime()) && 
                               !slot.getEndTime().isAfter(endTime.toLocalTime()))
                .toList();
            
            System.out.println("Slots in time range to unlock: " + slotsInTimeRange.size());
            
            for (Slot slot : slotsInTimeRange) {
                System.out.println("Unlocking slot: " + slot.getId() + 
                    ", Time: " + slot.getStartTime() + "-" + slot.getEndTime() + 
                    ", Status: " + slot.getStatus() + " -> AVAILABLE");
                slot.setStatus("AVAILABLE");
                slot.setAvailable(true);
                slotRepository.save(slot);
            }
            System.out.println("=== End unlocking slots ===");
        }

        // 删除相关的join requests
        if (match.getJoinRequests() != null) {
            joinRequestRepository.deleteAll(match.getJoinRequests());
        }

        // 删除match
        matchRepository.delete(match);
    }

    @Transactional
    public JoinRequest sendJoinRequest(Integer matchId, Integer memberId) {
        FriendlyMatch match = matchRepository.findById(matchId)
                .orElseThrow(() -> new ResourceNotFoundException("Match not found"));

        // 检查match状态
        String currentStatus = determineMatchStatus(match);
        if (!"OPEN".equals(currentStatus)) {
            throw new ValidationException("Match is not open for joining. Current status: " + currentStatus);
        }
        
        // 检查是否已经满员
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            throw new ValidationException("Match is already full. Cannot join.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));

        // Check for existing request
        boolean alreadyJoined = match.getJoinRequests() != null && match.getJoinRequests().stream()
            .anyMatch(r -> r.getMember() != null && r.getMember().getId().equals(memberId));
        if (alreadyJoined) {
            throw new ValidationException("Join request already exists");
        }

        JoinRequest req = new JoinRequest();
        req.setMember(member);
        req.setFriendlyMatch(match);
        // 直接設為 APPROVED
        req.setStatus(JoinRequest.Status.APPROVED);
        joinRequestRepository.save(req);
        // 增加 currentPlayers
        match.setCurrentPlayers(match.getCurrentPlayers() + 1);
        matchRepository.save(match);

        // 检查是否满员
        if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
            // 满员时将状态设为FULL
            match.setStatus("FULL");
            matchRepository.save(match);
            
            // 满员时通知organizer
            emailService.sendEmailIfEnabled(
                    match.getOrganizer().getUser(),
                    "Match is Full - Payment Required",
                    "Your match on " + match.getStartTime() + " is now full with " + 
                    match.getCurrentPlayers() + "/" + match.getMaxPlayers() + " players.\n\n" +
                    "Please complete the payment within 24 hours to confirm the court booking and match arrangement.\n\n" +
                    "If payment is not completed within 24 hours, the match will be automatically cancelled and the court will be released."
            );
        } else {
            // 未满员时通知organizer有新玩家加入
            emailService.sendEmailIfEnabled(
                    match.getOrganizer().getUser(),
                    "New Player Joined Your Match",
                    member.getUser().getName() + " has joined your match on " +
                            match.getStartTime() + "\n\nPlease check the app for details."
            );
        }

        // Notify participant
        emailService.sendEmailIfEnabled(
                member.getUser(),
                "Successfully Joined Match",
                "You have successfully joined the match on " + match.getStartTime() +
                        "\n\nLocation: " + match.getLocation()
        );

        return req;
    }

    @Transactional
    public void cancelJoinRequest(Integer requestId, Integer memberId) {
        JoinRequest request = joinRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Request not found"));

        if (!request.getMember().getId().equals(memberId)) {
            throw new UnauthorizedException("Only requester can cancel request");
        }

        // 直接刪除 join request，不需要判斷狀態
        joinRequestRepository.delete(request);

        // Notify organizer
        emailService.sendEmailIfEnabled(
                request.getFriendlyMatch().getOrganizer().getUser(),
                "Join Request Cancelled",
                request.getMember().getUser().getName() + " has cancelled their request to join your match"
        );
    }

    // 建立由 booking 產生的 FriendlyMatch invitation
    @Transactional
    public FriendlyMatch createInvitation(FriendlyMatch match, Integer bookingId, Integer organizerId) {
        Member organizer = memberRepository.findById(organizerId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found"));
        match.setOrganizer(organizer);
        match.setIsInvitation(true);
        match.setInvitationType("FRIENDLY_MATCH_INVITE");
        match.setPaymentStatus("CONFIRMED"); // 邀请类型基于已确认付款的booking，所以设置为CONFIRMED
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        match.setBooking(booking);
        
        // 从booking中获取时间信息并设置到match中
        if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
            List<BookingSlot> slots = booking.getBookingSlots();
            Slot firstSlot = slots.get(0).getSlot();
            Slot lastSlot = slots.get(slots.size() - 1).getSlot();
            
            if (firstSlot != null && firstSlot.getDate() != null && firstSlot.getStartTime() != null) {
                LocalDateTime startTime = LocalDateTime.of(firstSlot.getDate(), firstSlot.getStartTime());
                match.setStartTime(startTime);
            }
            
            if (lastSlot != null && lastSlot.getDate() != null && lastSlot.getEndTime() != null) {
                LocalDateTime endTime = LocalDateTime.of(lastSlot.getDate(), lastSlot.getEndTime());
                match.setEndTime(endTime);
            }
        }
        
        if (Objects.equals(match.getMaxPlayers(), null)) {
            throw new ValidationException("maxPlayers is required");
        }
        // 檢查同一個 booking/court/time 是否已經有 OPEN/FULL match
        List<FriendlyMatch> existing = matchRepository.findByBookingIdAndStatusIn(bookingId, List.of("OPEN", "FULL"));
        if (!existing.isEmpty()) {
            throw new ValidationException("A match for this booking/time already exists.");
        }
        return matchRepository.save(match);
    }

    // 每天凌晨2點清理過期 reservation 和 match
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupExpiredReservationsAndMatches() {
        // 清理過期 booking
        LocalDateTime now = LocalDateTime.now();
        List<Booking> expiredBookings = bookingRepository.findAllExpired(now.toLocalDate(), now.toLocalTime());
        for (Booking b : expiredBookings) {
            // 删除相关的feedback记录
            List<Feedback> relatedFeedbacks = feedbackRepository.findByBookingIdOrderByCreatedAtDesc(b.getId());
            if (relatedFeedbacks != null && !relatedFeedbacks.isEmpty()) {
                feedbackRepository.deleteAll(relatedFeedbacks);
            }
            bookingRepository.delete(b);
        }
        // 清理過期 match
        List<FriendlyMatch> expiredMatches = matchRepository.findAllExpired(LocalDateTime.now());
        for (FriendlyMatch m : expiredMatches) {
            matchRepository.delete(m);
        }
    }

    // 每小时检查一次未付款的满员match（24小时自动清除）
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupUnpaidFullMatches() {
        System.out.println("=== Checking for unpaid full matches ===");
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        
        // 查找所有OPEN状态且PENDING付款的match
        List<FriendlyMatch> allMatches = matchRepository.findAll();
        List<FriendlyMatch> unpaidFullMatches = allMatches.stream()
            .filter(match -> "OPEN".equals(match.getStatus()) && "PENDING".equals(match.getPaymentStatus()))
            .toList();
        
        for (FriendlyMatch match : unpaidFullMatches) {
            // 检查是否满员
            if (match.getCurrentPlayers() >= match.getMaxPlayers()) {
                // 使用startTime作为创建时间的替代（简化逻辑）
                if (match.getStartTime() != null && match.getStartTime().isBefore(twentyFourHoursAgo)) {
                    System.out.println("Cancelling unpaid full match: " + match.getId());
                    
                    // 解锁对应的时间段
                    if (match.getStartTime() != null && match.getCourtId() != null) {
                        LocalDateTime startTime = match.getStartTime();
                        LocalDateTime endTime = match.getEndTime();
                        
                        List<Slot> slotsToUnlock = slotRepository.findByCourtIdAndDateAndStatus(
                            match.getCourtId(),
                            startTime.toLocalDate(),
                            "PENDING"
                        );
                        
                        List<Slot> slotsInTimeRange = slotsToUnlock.stream()
                            .filter(slot -> !slot.getStartTime().isBefore(startTime.toLocalTime()) && 
                                           !slot.getEndTime().isAfter(endTime.toLocalTime()))
                            .toList();
                        
                        for (Slot slot : slotsInTimeRange) {
                            slot.setStatus("AVAILABLE");
                            slot.setAvailable(true);
                            slotRepository.save(slot);
                        }
                    }
                    
                    // 删除相关的join requests
                    if (match.getJoinRequests() != null) {
                        joinRequestRepository.deleteAll(match.getJoinRequests());
                    }
                    
                    // 通知organizer
                    emailService.sendEmailIfEnabled(
                        match.getOrganizer().getUser(),
                        "Match Cancelled - Payment Timeout",
                        "Your match on " + match.getStartTime() + " has been automatically cancelled " +
                        "due to non-payment within 24 hours. The court has been released for other bookings."
                    );
                    
                    // 删除match
                    matchRepository.delete(match);
                }
            }
        }
    }

    // 每小時檢查一次所有過期的 PENDING matches（24小時自動清除）
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredPendingMatches() {
        System.out.println("=== Checking for expired pending matches ===");
        LocalDateTime twentyFourHoursAgo = LocalDateTime.now().minusHours(24);
        
        // 查找所有 PENDING 付款的 match
        List<FriendlyMatch> allMatches = matchRepository.findAll();
        List<FriendlyMatch> expiredPendingMatches = allMatches.stream()
            .filter(match -> "PENDING".equals(match.getPaymentStatus()) && 
                           match.getStartTime() != null && 
                           match.getStartTime().isBefore(twentyFourHoursAgo))
            .toList();
        
        for (FriendlyMatch match : expiredPendingMatches) {
            System.out.println("Cancelling expired pending match: " + match.getId());
            
            // 解锁对应的时间段
            if (match.getStartTime() != null && match.getCourtId() != null) {
                LocalDateTime startTime = match.getStartTime();
                LocalDateTime endTime = match.getEndTime();
                
                List<Slot> slotsToUnlock = slotRepository.findByCourtIdAndDateAndStatus(
                    match.getCourtId(),
                    startTime.toLocalDate(),
                    "PENDING"
                );
                
                List<Slot> slotsInTimeRange = slotsToUnlock.stream()
                    .filter(slot -> !slot.getStartTime().isBefore(startTime.toLocalTime()) && 
                                   !slot.getEndTime().isAfter(endTime.toLocalTime()))
                    .toList();
                
                for (Slot slot : slotsInTimeRange) {
                    slot.setStatus("AVAILABLE");
                    slot.setAvailable(true);
                    slotRepository.save(slot);
                }
            }
            
            // 删除相关的join requests
            if (match.getJoinRequests() != null) {
                joinRequestRepository.deleteAll(match.getJoinRequests());
            }
            
            // 通知organizer
            emailService.sendEmailIfEnabled(
                match.getOrganizer().getUser(),
                "Match Cancelled - Timeout",
                "Your match on " + match.getStartTime() + " has been automatically cancelled " +
                "due to timeout (24 hours). The court has been released for other bookings."
            );
            
            // 删除match
            matchRepository.delete(match);
        }
    }

    // 當建立者取消 reservation 時，對應 match 一併取消
    @Transactional
    public void cancelReservationAndMatch(Integer bookingId) {
        // 先解除 match 的 booking 关联
        List<FriendlyMatch> matches = matchRepository.findByBookingId(bookingId);
        for (FriendlyMatch m : matches) {
            m.setStatus("CANCELLED");
            m.setBooking(null);
            matchRepository.save(m);
        }
        // 删除所有关联的取消请求
        List<CancellationRequest> requests = cancellationRequestRepository.findByBookingId(bookingId);
        for (CancellationRequest req : requests) {
            cancellationRequestRepository.delete(req);
        }
        // 注意：不删除 booking，因为 booking 的取消由 BookingService 处理
    }

    // 查詢所有 invitation 型的 OPEN match
    public List<FriendlyMatch> getOpenInvitations() {
        return matchRepository.findByIsInvitationAndStatus(true, "OPEN");
    }

    public List<FriendlyMatchInvitationDto> getOpenInvitationsDto() {
        List<FriendlyMatch> invitations = getOpenInvitations();
        return invitations.stream().map(this::toInvitationDto).toList();
    }

    public List<FriendlyMatchInvitationDto> getAllMatchesDto() {
        // 查询所有match，不仅仅是OPEN状态的
        List<FriendlyMatch> allMatches = matchRepository.findAll();
        System.out.println("=== getAllMatchesDto ===");
        System.out.println("Total matches found: " + allMatches.size());
        
        // 修复现有邀请类型match的时间信息
        fixExistingInvitationMatches(allMatches);
        
        return allMatches.stream().map(this::toInvitationDto).toList();
    }
    
    /**
     * 修复现有邀请类型match的时间信息
     */
    private void fixExistingInvitationMatches(List<FriendlyMatch> matches) {
        for (FriendlyMatch match : matches) {
            // 只处理邀请类型且没有时间信息的match
            if (match.isInvitation() && match.getBooking() != null && 
                (match.getStartTime() == null || match.getEndTime() == null)) {
                
                Booking booking = match.getBooking();
                if (booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                    List<BookingSlot> slots = booking.getBookingSlots();
                    Slot firstSlot = slots.get(0).getSlot();
                    Slot lastSlot = slots.get(slots.size() - 1).getSlot();
                    
                    boolean needsUpdate = false;
                    
                    if (match.getStartTime() == null && firstSlot != null && 
                        firstSlot.getDate() != null && firstSlot.getStartTime() != null) {
                        LocalDateTime startTime = LocalDateTime.of(firstSlot.getDate(), firstSlot.getStartTime());
                        match.setStartTime(startTime);
                        needsUpdate = true;
                    }
                    
                    if (match.getEndTime() == null && lastSlot != null && 
                        lastSlot.getDate() != null && lastSlot.getEndTime() != null) {
                        LocalDateTime endTime = LocalDateTime.of(lastSlot.getDate(), lastSlot.getEndTime());
                        match.setEndTime(endTime);
                        needsUpdate = true;
                    }
                    
                    // 修复paymentStatus
                    if (match.getPaymentStatus() == null) {
                        match.setPaymentStatus("CONFIRMED");
                        needsUpdate = true;
                    }
                    
                    if (needsUpdate) {
                        System.out.println("Fixing match " + match.getId() + " with booking " + booking.getId());
                        matchRepository.save(match);
                    }
                }
            }
            
            // 修復：為所有 match 檢查是否有 organizer 的 join request
            if (match.getOrganizer() != null) {
                // 檢查是否已經有 organizer 的 join request
                boolean hasOrganizerJoinRequest = match.getJoinRequests() != null && 
                    match.getJoinRequests().stream()
                        .anyMatch(req -> req.getMember().getId().equals(match.getOrganizer().getId()) && 
                                       req.getStatus() == JoinRequest.Status.APPROVED);
                
                if (!hasOrganizerJoinRequest) {
                    System.out.println("Fixing match " + match.getId() + ": Adding organizer join request");
                    
                    // 為 organizer 創建 join request
                    JoinRequest organizerJoinRequest = new JoinRequest();
                    organizerJoinRequest.setFriendlyMatch(match);
                    organizerJoinRequest.setMember(match.getOrganizer());
                    organizerJoinRequest.setStatus(JoinRequest.Status.APPROVED);
                    organizerJoinRequest.setRequestTime(LocalDateTime.now());
                    joinRequestRepository.save(organizerJoinRequest);
                    
                    // 確保 currentPlayers 至少為 1
                    if (match.getCurrentPlayers() < 1) {
                        match.setCurrentPlayers(1);
                        matchRepository.save(match);
                    }
                }
            }
            
            // 修復：為現有的 matches 設置價格
            if (match.getPrice() == null || match.getPrice() == 0) {
                System.out.println("Fixing match " + match.getId() + ": Setting price");
                if (match.getCourtId() != null && match.getStartTime() != null && match.getDurationHours() != null) {
                    Court court = courtRepository.findById(match.getCourtId()).orElse(null);
                    if (court != null) {
                        double pricePerHour = 0.0;
                        String priceType = "Unknown";
                        
                        // 判斷是否為 peak hour
                        if (court.getPeakStartTime() != null && court.getPeakEndTime() != null) {
                            try {
                                int peakStartHour = Integer.parseInt(court.getPeakStartTime().split(":")[0]);
                                int peakEndHour = Integer.parseInt(court.getPeakEndTime().split(":")[0]);
                                int matchStartHour = match.getStartTime().getHour();
                                
                                boolean isPeakHour;
                                // 處理跨日的情況（例如 22:00 - 02:00）
                                if (peakStartHour > peakEndHour) {
                                    isPeakHour = matchStartHour >= peakStartHour || matchStartHour <= peakEndHour;
                                } else {
                                    isPeakHour = matchStartHour >= peakStartHour && matchStartHour < peakEndHour;
                                }
                                
                                if (isPeakHour) {
                                    pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                                    priceType = "Peak";
                                } else {
                                    pricePerHour = court.getOffPeakHourlyPrice() != null ? court.getOffPeakHourlyPrice() : 0.0;
                                    priceType = "Off-Peak";
                                }
                            } catch (Exception e) {
                                // 如果解析失敗，使用 peak price 作為默認值
                                pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                                priceType = "Default (Peak)";
                            }
                        } else {
                            // 如果沒有設置 peak 時間，使用 peak price 作為默認值
                            pricePerHour = court.getPeakHourlyPrice() != null ? court.getPeakHourlyPrice() : 0.0;
                            priceType = "Default (Peak)";
                        }
                        
                        double totalPrice = pricePerHour * match.getDurationHours();
                        match.setPrice(totalPrice);
                        matchRepository.save(match);
                        System.out.println("Set price for match " + match.getId() + ": " + totalPrice + " (" + priceType + ")");
                    }
                }
            }
        }
    }

    private FriendlyMatchInvitationDto toInvitationDto(FriendlyMatch match) {
        FriendlyMatchInvitationDto dto = new FriendlyMatchInvitationDto();
        dto.setId(match.getId());
        dto.setBookingId(match.getBooking() != null ? match.getBooking().getId() : null);
        dto.setOrganizerId(match.getOrganizer() != null ? match.getOrganizer().getId() : null);
        dto.setMaxPlayers(match.getMaxPlayers());
        dto.setCurrentPlayers(match.getCurrentPlayers());
        dto.setPrice(match.getPrice());
        
        // 添加價格調試信息
        System.out.println("=== Price Debug for Match " + match.getId() + " ===");
        System.out.println("Match Price: " + match.getPrice());
        System.out.println("DTO Price: " + dto.getPrice());
        System.out.println("=== End Price Debug ===");
        
        // 检查时间是否已过期，确定状态 - 在设置时间之前先确定状态
        String status = determineMatchStatus(match);
        dto.setStatus(status);
        
        dto.setInvitationType(match.getInvitationType());
        dto.setPaymentStatus(match.getPaymentStatus());
        dto.setIsInvitation(match.isInvitation());
        
        // 调试信息
        System.out.println("=== DTO Debug for Match " + match.getId() + " ===");
        System.out.println("IsInvitation: " + match.isInvitation());
        System.out.println("PaymentStatus: " + match.getPaymentStatus());
        System.out.println("Has Booking: " + (match.getBooking() != null));
        System.out.println("Final Status: " + status);
        System.out.println("Original Match Status: " + match.getStatus());
        System.out.println("Current Players: " + match.getCurrentPlayers());
        System.out.println("Max Players: " + match.getMaxPlayers());
        System.out.println("Join Requests Count: " + (match.getJoinRequests() != null ? match.getJoinRequests().size() : 0));
        if (match.getJoinRequests() != null) {
            System.out.println("Join Requests: " + match.getJoinRequests().stream()
                .map(req -> req.getMember().getUser().getUserAccount().getUsername() + "(" + req.getStatus() + ")")
                .collect(java.util.stream.Collectors.joining(", ")));
        }
        System.out.println("=== End DTO Debug ===");
        
        // 处理邀请类型的比赛（有booking）
        if (match.getBooking() != null) {
            Booking booking = bookingRepository.findById(match.getBooking().getId()).orElse(null);
            if (booking != null && booking.getBookingSlots() != null && !booking.getBookingSlots().isEmpty()) {
                // 取第一個 slot 的 startTime，最後一個 slot 的 endTime
                List<BookingSlot> slots = booking.getBookingSlots();
                Slot firstSlot = slots.get(0).getSlot();
                Slot lastSlot = slots.get(slots.size() - 1).getSlot();
                if (firstSlot != null) {
                    dto.setSlotDate(firstSlot.getDate());
                    // 设置时间，但不影响已确定的状态
                    dto.setStartTime(firstSlot.getStartTime() != null && firstSlot.getDate() != null
                        ? java.time.LocalDateTime.of(firstSlot.getDate(), firstSlot.getStartTime())
                        : null);
                }
                if (lastSlot != null) {
                    dto.setEndTime(lastSlot.getEndTime() != null && lastSlot.getDate() != null
                        ? java.time.LocalDateTime.of(lastSlot.getDate(), lastSlot.getEndTime())
                        : null);
                }
                if (firstSlot != null && firstSlot.getCourtId() != null) {
                    Court court = courtRepository.findById(firstSlot.getCourtId()).orElse(null);
                    if (court != null) {
                        dto.setCourtName(court.getName());
                        dto.setCourtLocation(court.getLocation());
                        if (court.getVenue() != null) {
                            dto.setVenueName(court.getVenue().getName());
                        }
                    }
                }
            }
            // 新增：設置 booking 狀態
            dto.setBookingStatus(booking.getStatus());
        }
        // 处理独立friendly match（没有booking，直接从match获取信息）
        else {
            // 设置时间信息
            if (match.getStartTime() != null) {
                dto.setSlotDate(match.getStartTime().toLocalDate());
                dto.setStartTime(match.getStartTime());
            }
            if (match.getEndTime() != null) {
                dto.setEndTime(match.getEndTime());
            }
            
            // 通过courtId获取真实的Court信息
            System.out.println("=== Debug: Processing independent friendly match ===");
            System.out.println("Match ID: " + match.getId());
            System.out.println("Court ID: " + match.getCourtId());
            System.out.println("Location: " + match.getLocation());
            
            if (match.getCourtId() != null) {
                Court court = courtRepository.findById(match.getCourtId()).orElse(null);
                System.out.println("Found Court: " + (court != null ? court.getName() + " at " + court.getLocation() : "null"));
                if (court != null) {
                    dto.setCourtName(court.getName());
                    dto.setCourtLocation(court.getLocation());
                    if (court.getVenue() != null) {
                        dto.setVenueName(court.getVenue().getName());
                    }
                } else {
                    // 如果找不到court，使用location字段作为fallback
                    System.out.println("Court not found, using location fallback");
                    dto.setCourt(match.getLocation());
                    if (match.getLocation() != null) {
                        String[] parts = match.getLocation().split(" at ");
                        if (parts.length >= 2) {
                            dto.setCourtName(parts[0].trim());
                            dto.setVenueName(parts[1].trim());
                        } else {
                            dto.setCourtName(match.getLocation());
                        }
                    }
                    dto.setCourtLocation(match.getLocation());
                }
            } else {
                // 如果没有courtId，尝试通过location字段查找对应的Court
                System.out.println("No courtId, trying to find court by location");
                if (match.getLocation() != null) {
                    String[] parts = match.getLocation().split(" at ");
                    if (parts.length >= 2) {
                        String courtName = parts[0].trim();
                        String venueName = parts[1].trim();
                        
                        // 尝试通过court name查找（只查找活跃场地）
                        List<Court> courts = courtRepository.findActiveCourts();
                        Court foundCourt = courts.stream()
                            .filter(c -> c.getName().equals(courtName))
                            .findFirst()
                            .orElse(null);
                        
                        if (foundCourt != null) {
                            System.out.println("Found court by name: " + foundCourt.getName() + " at " + foundCourt.getLocation());
                            dto.setCourtName(foundCourt.getName());
                            dto.setCourtLocation(foundCourt.getLocation());
                            if (foundCourt.getVenue() != null) {
                                dto.setVenueName(foundCourt.getVenue().getName());
                            }
                        } else {
                            System.out.println("Court not found by name, using location fallback");
                            dto.setCourtName(courtName);
                            dto.setVenueName(venueName);
                            dto.setCourtLocation(match.getLocation());
                        }
                    } else {
                        dto.setCourtName(match.getLocation());
                        dto.setCourtLocation(match.getLocation());
                    }
                } else {
                    dto.setCourt(match.getLocation());
                    dto.setCourtLocation(match.getLocation());
                }
            }
            
            System.out.println("Final DTO values:");
            System.out.println("  Court Name: " + dto.getCourtName());
            System.out.println("  Venue Name: " + dto.getVenueName());
            System.out.println("  Court Location: " + dto.getCourtLocation());
            System.out.println("=== End Debug ===");
            
            // 设置booking状态为null，因为这是独立比赛
            dto.setBookingStatus(null);
        }
        
        if (match.getOrganizer() != null && match.getOrganizer().getUser() != null && match.getOrganizer().getUser().getUserAccount() != null) {
            dto.setOrganizerUsername(match.getOrganizer().getUser().getUserAccount().getUsername());
        }
        if (match.getJoinRequests() != null) {
            dto.setJoinRequests(match.getJoinRequests().stream().map(this::toJoinRequestDto).toList());
        }
        return dto;
    }
    private JoinRequestDto toJoinRequestDto(JoinRequest req) {
        JoinRequestDto dto = new JoinRequestDto();
        dto.setId(req.getId());
        dto.setMemberId(req.getMember() != null ? req.getMember().getId() : null);
        dto.setMemberName(req.getMember() != null ? req.getMember().getUser().getName() : null);
        // 添加 username 欄位
        if (req.getMember() != null && req.getMember().getUser() != null && req.getMember().getUser().getUserAccount() != null) {
            dto.setUsername(req.getMember().getUser().getUserAccount().getUsername());
        }
        dto.setStatus(req.getStatus() != null ? req.getStatus().name() : null);
        dto.setRequestTime(req.getRequestTime());
        return dto;
    }

    // 加入 invitation
    @Transactional
    public JoinRequest joinInvitation(Integer matchId, Integer memberId) {
        return sendJoinRequest(matchId, memberId);
    }

    private void scheduleReminder(FriendlyMatch match, Member member) {
        // Implementation would use a task scheduler
        LocalDateTime reminderTime = match.getStartTime().minusHours(24);
        // Actual scheduling implementation would go here
    }
    
    public FriendlyMatchResponseDto convertToResponseDto(FriendlyMatch match, String message) {
        FriendlyMatchResponseDto dto = new FriendlyMatchResponseDto();
        dto.setId(match.getId());
        dto.setMaxPlayers(match.getMaxPlayers());
        dto.setCurrentPlayers(match.getCurrentPlayers());
        dto.setSkillLevel(match.getSkillLevel());
        dto.setMatchRules(match.getMatchRules());
        dto.setStatus(match.getStatus());
        dto.setPaymentStatus(match.getPaymentStatus());
        dto.setStartTime(match.getStartTime());
        dto.setEndTime(match.getEndTime());
        dto.setDurationHours(match.getDurationHours());
        dto.setLocation(match.getLocation());
        dto.setOrganizerId(match.getOrganizer() != null ? match.getOrganizer().getId() : null);
        dto.setOrganizerName(match.getOrganizer() != null && match.getOrganizer().getUser() != null ? 
            match.getOrganizer().getUser().getName() : null);
        dto.setInvitation(match.isInvitation());
        dto.setInvitationType(match.getInvitationType());
        dto.setMessage(message);
        return dto;
    }

    @Transactional
    public BookingResponseDto processFriendlyMatchPayment(FriendlyMatch match, Member member, FriendlyMatchPaymentDto paymentDto) {
        // 1. 獲取或創建 wallet
        Wallet wallet = getOrCreateWallet(member);
        
        // 2. 計算總金額
        double baseAmount = match.getPrice() != null ? match.getPrice() : 0.0;
        int numPaddles = paymentDto != null && paymentDto.getNumPaddles() != null ? paymentDto.getNumPaddles() : 0;
        boolean buyBallSet = paymentDto != null && paymentDto.getBuyBallSet() != null && paymentDto.getBuyBallSet();
        double paddleFee = numPaddles * 5.0;
        double ballSetFee = buyBallSet ? 12.0 : 0.0;
        double totalAmount = baseAmount + paddleFee + ballSetFee;
        
        // 3. 檢查 wallet balance
        if (wallet.getBalance() < totalAmount) {
            throw new InsufficientBalanceException("Insufficient wallet balance. Available: " + wallet.getBalance() + ", Required: " + totalAmount);
        }
        
        // 4. 扣除 wallet balance
        wallet.setBalance(wallet.getBalance() - totalAmount);
        wallet.setTotalSpent(wallet.getTotalSpent() + totalAmount); // 更新總支出
        walletRepository.save(wallet);
        
        // 5. 創建 payment 記錄
        Payment payment = new Payment();
        payment.setAmount(totalAmount);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setPaymentType("FRIENDLY_MATCH");
        payment.setPaymentMethod("WALLET");
        payment.setStatus("COMPLETED");
        payment = paymentRepository.save(payment);
        
        // 6. 創建 booking 記錄
        Booking booking = new Booking();
        booking.setBookingDate(LocalDateTime.now());
        booking.setTotalAmount(totalAmount);
        booking.setStatus("CONFIRMED");
        booking.setMember(member);
        booking.setPayment(payment);
        booking.setPurpose("Friendly Match");
        booking.setNumberOfPlayers(match.getMaxPlayers());
        booking.setNumPaddles(numPaddles);
        booking.setBuyBallSet(buyBallSet);
        // Booking entity 沒有 durationHours 字段，所以不設置
        booking = bookingRepository.save(booking);
        
        // 7. 更新 friendly match 付款狀態
        match.setPaymentStatus("PAID");
        matchRepository.save(match);
        
        // 8. 創建 BookingResponseDto
        BookingResponseDto response = new BookingResponseDto();
        response.setBookingId(booking.getId());
        response.setCourtName(match.getLocation()); // FriendlyMatch 使用 location 字段
        response.setCourtLocation(match.getLocation()); // FriendlyMatch 使用 location 字段
        response.setSlotDate(match.getStartTime().toLocalDate()); // 使用 slotDate 而不是 date
        response.setStartTime(match.getStartTime().toLocalTime());
        response.setEndTime(match.getEndTime().toLocalTime());
        response.setNumberOfPlayers(match.getMaxPlayers());
        response.setTotalAmount(totalAmount);
        response.setPaymentStatus("COMPLETED");
        response.setPaymentMethod("WALLET");
        response.setDurationHours(match.getDurationHours());
        response.setWalletBalance(wallet.getBalance());
        // BookingResponseDto 沒有 numPaddles, buyBallSet, bookingType 字段
        
        return response;
    }
    
    private Wallet getOrCreateWallet(Member member) {
        Wallet wallet = walletRepository.findByMemberId(member.getId()).orElse(null);
        if (wallet == null) {
            wallet = new Wallet();
            wallet.setMember(member);
            wallet.setBalance(0.0);
            wallet = walletRepository.save(wallet);
        }
        return wallet;
    }

    /**
     * 取消 match 付款並退款
     */
    @Transactional
    public String cancelMatchPayment(FriendlyMatch match, Member member) {
        // 檢查是否為 organizer
        if (!match.getOrganizer().getId().equals(member.getId())) {
            throw new UnauthorizedException("Only organizer can cancel payment for the match");
        }
        
        // 檢查是否已付款
        if (!"PAID".equals(match.getPaymentStatus())) {
            throw new ValidationException("Match is not paid yet");
        }
        
        // 查找相關的 booking 和 payment
        List<Booking> relatedBookings = bookingRepository.findByMember_IdAndPurpose(member.getId(), "Friendly Match");
        Booking matchBooking = null;
        Payment matchPayment = null;
        
        for (Booking booking : relatedBookings) {
            if (booking.getPayment() != null && 
                "FRIENDLY_MATCH".equals(booking.getPayment().getPaymentType()) &&
                booking.getBookingDate() != null &&
                Math.abs(java.time.Duration.between(booking.getBookingDate(), match.getStartTime()).toHours()) < 24) {
                matchBooking = booking;
                matchPayment = booking.getPayment();
                break;
            }
        }
        
        if (matchBooking == null || matchPayment == null) {
            throw new ResourceNotFoundException("No payment record found for this match");
        }
        
        // 退款到 wallet
        Wallet wallet = getOrCreateWallet(member);
        double refundAmount = matchPayment.getAmount();
        wallet.setBalance(wallet.getBalance() + refundAmount);
        walletRepository.save(wallet);
        
        // 更新 payment 狀態
        matchPayment.setStatus("REFUNDED");
        matchPayment.setRefundDate(LocalDateTime.now());
        paymentRepository.save(matchPayment);
        
        // 更新 booking 狀態
        matchBooking.setStatus("CANCELLED");
        bookingRepository.save(matchBooking);
        
        // 更新 match 狀態
        match.setPaymentStatus("CANCELLED");
        match.setStatus("CANCELLED");
        matchRepository.save(match);
        
        // 解鎖對應的時間段
        if (match.getStartTime() != null && match.getCourtId() != null) {
            LocalDateTime startTime = match.getStartTime();
            LocalDateTime endTime = match.getEndTime();
            
            List<Slot> slotsToUnlock = slotRepository.findByCourtIdAndDateAndStatus(
                match.getCourtId(),
                startTime.toLocalDate(),
                "PENDING"
            );
            
            List<Slot> slotsInTimeRange = slotsToUnlock.stream()
                .filter(slot -> !slot.getStartTime().isBefore(startTime.toLocalTime()) && 
                               !slot.getEndTime().isAfter(endTime.toLocalTime()))
                .toList();
            
            for (Slot slot : slotsInTimeRange) {
                slot.setStatus("AVAILABLE");
                slot.setAvailable(true);
                slotRepository.save(slot);
            }
        }
        
        // 通知參與者
        if (match.getJoinRequests() != null) {
            for (JoinRequest joinRequest : match.getJoinRequests()) {
                if (joinRequest.getMember() != null && joinRequest.getMember().getUser() != null) {
                    emailService.sendEmail(
                        joinRequest.getMember().getUser().getEmail(),
                        "Match Cancelled - Payment Refunded",
                        "The match on " + match.getStartTime() + " has been cancelled and payment has been refunded.\n\n" +
                        "Refund amount: RM " + refundAmount + "\n" +
                        "The court has been released for other bookings."
                    );
                }
            }
        }
        
        return "Payment cancelled successfully. Refund amount: RM " + refundAmount;
    }

    /**
     * 獲取可用用戶的玩家數量統計
     */
    public Map<String, Object> getAvailableUserPlayerStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        try {
            // 獲取所有用戶
            List<Member> allMembers = memberRepository.findAll();
            
            // 統計各種用戶類型
            long totalUsers = allMembers.size();
            long activeUsers = allMembers.stream()
                .filter(member -> member.getUser() != null && 
                                member.getUser().getUserAccount() != null && 
                                "ACTIVE".equals(member.getUser().getUserAccount().getStatus()))
                .count();
            
            // 統計參與過 friendly match 的用戶
            long usersWithMatches = allMembers.stream()
                .filter(member -> member.getJoinRequests() != null && !member.getJoinRequests().isEmpty())
                .count();
            
                         // 統計創建過 match 的用戶
             long organizers = allMembers.stream()
                 .filter(member -> member.getOrganizedMatches() != null && !member.getOrganizedMatches().isEmpty())
                 .count();
            
            // 獲取最近的 match 統計
            List<FriendlyMatch> recentMatches = matchRepository.findAll().stream()
                .filter(match -> match.getStartTime() != null && 
                               match.getStartTime().isAfter(LocalDateTime.now().minusDays(30)))
                .toList();
            
            long recentMatchesCount = recentMatches.size();
            long completedMatches = recentMatches.stream()
                .filter(match -> "END".equals(determineMatchStatus(match)) || "CANCELLED".equals(match.getStatus()))
                .count();
            
            statistics.put("totalUsers", totalUsers);
            statistics.put("activeUsers", activeUsers);
            statistics.put("usersWithMatches", usersWithMatches);
            statistics.put("organizers", organizers);
            statistics.put("recentMatchesCount", recentMatchesCount);
            statistics.put("completedMatches", completedMatches);
            statistics.put("success", true);
            
        } catch (Exception e) {
            statistics.put("success", false);
            statistics.put("error", e.getMessage());
        }
        
        return statistics;
    }
}