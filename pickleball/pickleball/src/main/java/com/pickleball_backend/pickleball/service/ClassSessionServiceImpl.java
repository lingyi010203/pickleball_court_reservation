package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.ClassSessionDto;
import com.pickleball_backend.pickleball.dto.RecurringSessionRequestDto;
import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.*;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.UUID;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class ClassSessionServiceImpl implements ClassSessionService {

    @Autowired
    private ClassSessionRepository sessionRepository;
    private final CourtRepository courtRepository;
    private final UserRepository userRepository;
    private final UserAccountRepository userAccountRepository;
    private final ClassRegistrationRepository registrationRepository;
    private final BookingRepository bookingRepository;
    private final EmailService emailService;
    private final MemberRepository memberRepository;
    private final PaymentRepository paymentRepository;
    private final WalletRepository walletRepository;
    private final EscrowAccountService escrowAccountService;
    private final WalletTransactionRepository walletTransactionRepository;
    private final MembershipTierRepository membershipTierRepository;
    private final MemberService memberService;
    private static final Logger logger = LoggerFactory.getLogger(ClassSessionServiceImpl.class);


    @Override
    @Transactional
    public ClassSession createClassSession(ClassSessionDto sessionDto, User coach) throws ConflictException, ResourceNotFoundException {
        // 驗證教練
        if (!"COACH".equalsIgnoreCase(coach.getUserType())) {
            throw new ValidationException("User is not a coach");
        }
        // 驗證場地
        Court court = courtRepository.findById(sessionDto.getCourtId())
                .orElseThrow(() -> new ResourceNotFoundException("Court not found"));
        // 檢查時間衝突 (教練)
        if (sessionRepository.existsByCoachIdAndStartTimeBetweenAndStatusNot(
                coach.getId(), sessionDto.getStartTime(), sessionDto.getEndTime(), "CANCELLED")) {
            throw new ConflictException("Coach has scheduling conflict");
        }
        // 檢查時間衝突 (場地)
        if (sessionRepository.existsByCourtIdAndStartTimeBetweenAndStatusNot(
                sessionDto.getCourtId(), sessionDto.getStartTime(), sessionDto.getEndTime(), "CANCELLED")) {
            throw new ConflictException("Court is already booked");
        }
        // 檢查普通預約衝突
        if (bookingRepository.existsActiveBookingForCourtAndTime(
                sessionDto.getCourtId(),
                sessionDto.getStartTime().toLocalDate(),
                sessionDto.getStartTime().toLocalTime(),
                sessionDto.getEndTime().toLocalTime())) {
            throw new ConflictException("Court has regular booking at this time");
        }
        // 創建課程
        ClassSession session = new ClassSession();
        session.setCoach(coach);
        session.setCourt(court);
        session.setStartTime(sessionDto.getStartTime());
        session.setEndTime(sessionDto.getEndTime());
        session.setMaxParticipants(sessionDto.getMaxParticipants());
        session.setDescription(sessionDto.getDescription());
        session.setPrice(sessionDto.getPrice());
        session.setStatus("AVAILABLE");
        session.setSlotType("COACH_SESSION");
        session.setCurrentParticipants(0);
        session.setTitle(sessionDto.getTitle());
        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public ClassSession updateClassSession(Integer sessionId, ClassSessionDto sessionDto)
            throws ResourceNotFoundException, ConflictException {

        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // 只允许修改未开始的课程
        if (!"AVAILABLE".equals(session.getStatus()) && !"FULL".equals(session.getStatus())) {
            throw new ValidationException("Only available or full sessions can be modified");
        }

        // 冲突检查
        if (sessionRepository.existsConflictForUpdate(
                sessionId,
                sessionDto.getCourtId(),
                sessionDto.getStartTime(),
                sessionDto.getEndTime())) {
            throw new ConflictException("Time slot conflict detected");
        }

        // 更新字段
        session.setStartTime(sessionDto.getStartTime());
        session.setEndTime(sessionDto.getEndTime());
        session.setMaxParticipants(sessionDto.getMaxParticipants());
        session.setDescription(sessionDto.getDescription());
        session.setPrice(sessionDto.getPrice());
        session.setTitle(sessionDto.getTitle());
        session.setAllowReplacement(sessionDto.getAllowReplacement());

        // 如果修改后人数少于最大人数，恢复为可用状态
        if (session.getCurrentParticipants() < sessionDto.getMaxParticipants() &&
                "FULL".equals(session.getStatus())) {
            session.setStatus("AVAILABLE");
        }

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public ClassSession partialUpdateClassSession(Integer sessionId, Map<String, Object> updates)
            throws ResourceNotFoundException, ConflictException {

        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // 只允许修改未开始的课程
        if (!"AVAILABLE".equals(session.getStatus()) && !"FULL".equals(session.getStatus())) {
            throw new ValidationException("Only available or full sessions can be modified");
        }

        // 调试信息
        System.out.println("=== Partial Update Debug ===");
        System.out.println("Session ID: " + sessionId);
        System.out.println("Updates map: " + updates);
        for (Map.Entry<String, Object> entry : updates.entrySet()) {
            System.out.println("Key: " + entry.getKey() + ", Value: " + entry.getValue() + ", Type: " + entry.getValue().getClass().getSimpleName());
        }

        // 只更新提供的字段
        if (updates.containsKey("maxParticipants")) {
            Object maxParticipantsObj = updates.get("maxParticipants");
            Integer maxParticipants;
            if (maxParticipantsObj instanceof Integer) {
                maxParticipants = (Integer) maxParticipantsObj;
            } else if (maxParticipantsObj instanceof Double) {
                maxParticipants = ((Double) maxParticipantsObj).intValue();
            } else {
                maxParticipants = Integer.valueOf(maxParticipantsObj.toString());
            }
            System.out.println("Setting maxParticipants: " + maxParticipants);
            session.setMaxParticipants(maxParticipants);
            
            // 如果修改后人数少于最大人数，恢复为可用状态
            if (session.getCurrentParticipants() < maxParticipants &&
                    "FULL".equals(session.getStatus())) {
                session.setStatus("AVAILABLE");
            }
        }
        
        if (updates.containsKey("price")) {
            Object priceObj = updates.get("price");
            Double price;
            if (priceObj instanceof Integer) {
                price = ((Integer) priceObj).doubleValue();
            } else if (priceObj instanceof Double) {
                price = (Double) priceObj;
            } else {
                price = Double.valueOf(priceObj.toString());
            }
            System.out.println("Setting price: " + price);
            session.setPrice(price);
        }

        return sessionRepository.save(session);
    }

    @Override
    @Transactional
    public void cancelClassSession(Integer sessionId, boolean force, String reason)
            throws ResourceNotFoundException, ConflictException {

        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // 檢查24小時限制
        LocalDateTime now = LocalDateTime.now();
        long hoursUntilSession = java.time.temporal.ChronoUnit.HOURS.between(now, session.getStartTime());
        
        // 如果課程開始前24小時內，不允許取消（除非是教練強制取消）
        if (hoursUntilSession <= 24 && !force) {
            throw new ConflictException("Cannot cancel class session within 24 hours of start time. Use force=true to override.");
        }

        // 如果有报名且不强制取消
        if (session.getCurrentParticipants() > 0 && !force) {
            throw new ConflictException("Session has participants. Use force=true to cancel");
        }

        // 通知已报名用户并退款
        if (session.getCurrentParticipants() > 0) {
            List<ClassRegistration> registrations = registrationRepository.findByClassSessionId(sessionId);
            for (ClassRegistration registration : registrations) {
                Member member = registration.getMember();
                if (member != null) {
                    // 使用託管帳戶退款
                    escrowAccountService.refundFromEscrow(member.getUser(), session.getPrice(), session);
                    // 通知
                    String email = member.getUser().getEmail();
                    String msg = "Your class on " + session.getStartTime() + " has been cancelled.";
                    if (reason != null && !reason.isEmpty()) {
                        msg += "\nReason: " + reason;
                    }
                    emailService.sendEmailIfEnabled(email, member.getUser(), "Class Cancelled", msg);
                }
            }
        }

        session.setStatus("CANCELLED");
        sessionRepository.save(session);
    }

    @Override
    public List<ClassSession> getCoachSchedule(Integer coachId, LocalDateTime start, LocalDateTime end) {
        return sessionRepository.findScheduleByCoachIdAndPeriodWithVenue(coachId, start, end);
    }

    @Override
    @Transactional
    public boolean registerUserForSession(Integer sessionId, Integer userId)
            throws ConflictException, ResourceNotFoundException {

        ClassSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found"));

        // 新增：教練保留時段只能在前一天或當天預約
        if ("COACH_AVAILABILITY".equals(session.getSlotType())) {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime slotDate = session.getStartTime().toLocalDate().atStartOfDay();
            LocalDateTime today = now.toLocalDate().atStartOfDay();
            LocalDateTime yesterday = today.minusDays(1);
            if (!(slotDate.equals(today) || slotDate.equals(yesterday))) {
                throw new ConflictException("This coach slot can only be booked on the day before or the same day.");
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate user status - prevent suspended/inactive users from booking
        UserAccount userAccount = userAccountRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        if ("SUSPENDED".equals(userAccount.getStatus()) || "INACTIVE".equals(userAccount.getStatus())) {
            throw new UnauthorizedException("Your account is " + userAccount.getStatus().toLowerCase() + 
                ". You cannot make bookings. Please contact support for assistance.");
        }

        Member member = memberRepository.findByUserId(userId);
        if (member == null) {
            throw new ValidationException("User is not a member");
        }

        // Replacement class: only allow original students
        if (session.getReplacementForSessionId() != null) {
            Integer originSessionId = session.getReplacementForSessionId();
            ClassSession origin = sessionRepository.findById(originSessionId).orElse(null);
            boolean isOriginalStudent = false;
            if (origin != null && origin.getRegistrations() != null) {
                for (ClassRegistration reg : origin.getRegistrations()) {
                    if (reg.getMember() != null && reg.getMember().getId().equals(member.getId())) {
                        isOriginalStudent = true;
                        break;
                    }
                }
            }
            if (!isOriginalStudent) {
                throw new ConflictException("Only students from the original cancelled class can register for this replacement class.");
            }
        }

        // 檢查名額
        if (session.getCurrentParticipants() >= session.getMaxParticipants()) {
            throw new ConflictException("Session is full");
        }

        // 檢查是否已報名
        if (registrationRepository.existsByClassSessionIdAndMemberId(sessionId, member.getId())) {
            throw new ConflictException("User already registered for this session");
        }

        // Handle payment: replacement class is always free
        double price = session.getReplacementForSessionId() != null ? 0.0 : session.getPrice();
        processPayment(member, price, session);

        // 創建報名記錄
        ClassRegistration registration = new ClassRegistration();
        registration.setClassSession(session);
        registration.setMember(member);
        registration.setRegistrationDate(LocalDateTime.now());
        registrationRepository.save(registration);

        // 更新課程人數
        session.setCurrentParticipants(session.getCurrentParticipants() + 1);
        if (session.getCurrentParticipants() >= session.getMaxParticipants()) {
            session.setStatus("FULL");
        }
        // 新增：如果達到開班人數（如 3 人），自動 setStatus("CONFIRMED")
        if (session.getCurrentParticipants() >= 4) {
            session.setStatus("CONFIRMED");
        }
        // 新增：報名成功後寄送 email 通知
        emailService.sendClassRegistrationConfirmation(
            user.getEmail(),
            session,
            member
        );
        // 新增：可加 app 通知（如有推播模組）
        sessionRepository.save(session);

        return true;
    }

    @Override
    @Transactional
    public Map<String, Object> registerUserForMultipleSessions(Integer userId, List<Integer> sessionIds, String paymentMethod, Integer numPaddles, Boolean buyBallSet) throws ConflictException, ResourceNotFoundException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate user status - prevent suspended/inactive users from booking
        UserAccount userAccount = userAccountRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User account not found"));
        if ("SUSPENDED".equals(userAccount.getStatus()) || "INACTIVE".equals(userAccount.getStatus())) {
            throw new UnauthorizedException("Your account is " + userAccount.getStatus().toLowerCase() + 
                ". You cannot make bookings. Please contact support for assistance.");
        }

        Member member = memberRepository.findByUserId(userId);
        if (member == null) {
            throw new ValidationException("User is not a member");
        }
        List<ClassSession> sessions = sessionRepository.findAllByIdWithCourt(sessionIds);
        if (sessions.size() != sessionIds.size()) {
            throw new ResourceNotFoundException("Some sessions not found");
        }
        // 檢查所有 session 是否都可報名
        for (ClassSession session : sessions) {
            if (session.getCurrentParticipants() >= session.getMaxParticipants()) {
                throw new ConflictException("Session is full: " + session.getId());
            }
            if (registrationRepository.existsByClassSessionIdAndMemberId(session.getId(), member.getId())) {
                throw new ConflictException("Already registered for session: " + session.getId());
            }
        }
        // 計算總金額（課程費用 + 設備費用）
        double sessionTotal = sessions.stream().mapToDouble(ClassSession::getPrice).sum();
        double equipmentTotal = 0.0;
        
        // 計算設備費用
        if (numPaddles != null && numPaddles > 0) {
            equipmentTotal += numPaddles * 5.0; // 每個球拍 RM5
        }
        if (buyBallSet != null && buyBallSet) {
            equipmentTotal += 12.0; // 球組 RM12
        }
        
        double total = sessionTotal + equipmentTotal;
        
        logger.info("Class session registration - User: {}, Sessions: {}, Session Total: RM{}, Equipment Total: RM{}, Total: RM{}", 
                userId, sessionIds.size(), sessionTotal, equipmentTotal, total);
        
        // 使用託管帳戶系統處理支付
        if ("wallet".equalsIgnoreCase(paymentMethod)) {
            // 為每個課程創建託管支付記錄
            for (ClassSession session : sessions) {
                escrowAccountService.depositToEscrow(user, session.getPrice(), session);
            }
            // 如果有設備費用，創建設備費用的託管記錄
            if (equipmentTotal > 0) {
                escrowAccountService.depositToEscrow(user, equipmentTotal, null);
            }
        } else {
            // 其他付款方式可擴充
            logger.info("Payment method {} not yet implemented for class sessions", paymentMethod);
        }
        // 為每個 session 建立報名記錄
        for (ClassSession session : sessions) {
            ClassRegistration registration = new ClassRegistration();
            registration.setClassSession(session);
            registration.setMember(member);
            registration.setRegistrationDate(LocalDateTime.now());
            // 託管支付記錄會在 EscrowAccountService 中創建
            registrationRepository.save(registration);
            session.setCurrentParticipants(session.getCurrentParticipants() + 1);
            if (session.getCurrentParticipants() >= session.getMaxParticipants()) {
                session.setStatus("FULL");
            }
            if (session.getCurrentParticipants() >= 4) {
                session.setStatus("CONFIRMED");
            }
            emailService.sendClassRegistrationConfirmation(
                user.getEmail(),
                session,
                member
            );
            sessionRepository.save(session);
        }
        
        // 返回詳細的響應數據
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("totalAmount", total);
        response.put("sessionTotal", sessionTotal);
        response.put("equipmentTotal", equipmentTotal);
        response.put("numPaddles", numPaddles != null ? numPaddles : 0);
        response.put("buyBallSet", buyBallSet != null ? buyBallSet : false);
        response.put("paymentMethod", paymentMethod);
        
        // 計算積分獎勵
        int pointsEarned = (int) Math.floor(total);
        response.put("pointsEarned", pointsEarned);
        
        // 獲取用戶當前的積分餘額
        if (member != null) {
            response.put("currentTierPointBalance", member.getTierPointBalance());
            response.put("currentRewardPointBalance", member.getRewardPointBalance());
        }
        
        return response;
    }

    @Override
    public List<ClassSession> getAvailableSessions(Integer courtId, LocalDateTime start, LocalDateTime end) {
        return sessionRepository.findAvailableSessionsWithRegistrations(courtId, start, end);
    }

    @Override
    public boolean hasCourtConflict(Integer courtId, java.time.LocalDateTime start, java.time.LocalDateTime end) {
        // 檢查課程衝突
        boolean sessionConflict = sessionRepository.existsByCourtIdAndStartTimeBetweenAndStatusNot(
                courtId, start, end, "CANCELLED");
        // 檢查booking衝突
        boolean bookingConflict = bookingRepository.existsActiveBookingForCourtAndTime(
                courtId,
                start.toLocalDate(),
                start.toLocalTime(),
                end.toLocalTime()
        );
        return sessionConflict || bookingConflict;
    }

    private void processPayment(Member member, double amount, ClassSession session) {
        // 使用託管帳戶系統處理支付
        escrowAccountService.depositToEscrow(member.getUser(), amount, session);
    }

    private void refundPayment(Member member, double amount) {
        // 1. 退款到钱包
        Wallet wallet = walletRepository.findByMemberId(member.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Wallet not found"));
        wallet.setBalance(wallet.getBalance() + amount);
        walletRepository.save(wallet);

        // 2. 扣除積分（全額扣除，因為課程取消通常是全額退款）
        MemberService.PointDeductionResult deductionResult = memberService.deductPointsForRefund(member, amount, 1.0);
        
        logger.info("Deducted {} tier points and {} reward points from member {} for class session refund",
                deductionResult.getTierPointsDeducted(), deductionResult.getRewardPointsDeducted(), member.getId());

        // 3. 创建退款记录
        Payment refund = new Payment();
        refund.setAmount(amount);
        refund.setRefundDate(LocalDateTime.now());
        refund.setPaymentMethod("WALLET");
        refund.setStatus("REFUNDED");
        refund.setPaymentType("CLASS_SESSION_REFUND");
        paymentRepository.save(refund);
    }

    @Transactional
    @Override
    public List<ClassSession> createRecurringSessions(RecurringSessionRequestDto request, User coach)
            throws ConflictException, ResourceNotFoundException {

        List<ClassSession> sessions = new ArrayList<>();
        LocalDate currentDate = request.getStartDate();
        String recurringGroupId = UUID.randomUUID().toString();

        // 星期幾對應的數字 (1=Monday, 2=Tuesday, ..., 7=Sunday)
        Map<String, Integer> dayMap = Map.of(
            "MON", 1, "TUES", 2, "WED", 3, "THURS", 4, "FRI", 5, "SAT", 6, "SUN", 7
        );

        while (!currentDate.isAfter(request.getEndDate())) {
            // 檢查當前日期是否符合選擇的星期幾
            int currentDayOfWeek = currentDate.getDayOfWeek().getValue(); // 1=Monday, 2=Tuesday, ..., 7=Sunday
            Integer targetDay = dayMap.get(request.getDayOfWeek());
            
            if (targetDay != null && currentDayOfWeek == targetDay) {
                LocalDateTime startDateTime = LocalDateTime.of(currentDate, request.getStartTime());
                LocalDateTime endDateTime = LocalDateTime.of(currentDate, request.getEndTime());

                ClassSessionDto sessionDto = new ClassSessionDto();
                sessionDto.setCourtId(request.getCourtId());
                sessionDto.setStartTime(startDateTime);
                sessionDto.setEndTime(endDateTime);
                sessionDto.setMaxParticipants(request.getMaxParticipants());
                sessionDto.setDescription(request.getDescription());
                sessionDto.setPrice(request.getPrice());
                sessionDto.setTitle(request.getTitle());
                sessionDto.setSlotType("RECURRING_SESSION");

                try {
                    ClassSession session = createClassSession(sessionDto, coach);
                    session.setRecurring(true);
                    session.setRecurrencePattern("WEEKLY");
                    session.setRecurrenceDays(request.getDayOfWeek());
                    session.setRecurringGroupId(recurringGroupId);
                    sessions.add(session);
                } catch (ConflictException e) {
                    // 处理时间冲突 - 跳过冲突日期
                    logger.warn("时间冲突跳过日期 {}: {}", currentDate, e.getMessage());
                }
            }
            
            currentDate = currentDate.plusDays(1);
        }

        if (sessions.isEmpty()) {
            throw new ConflictException("所有选定日期都存在时间冲突或没有符合选择的星期几的日期");
        }

        return sessions;
    }

    @Transactional
    public void settleClassSession(Integer sessionId) {
        ClassSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session not found"));
        if (!"COMPLETED".equals(session.getStatus())) {
            throw new IllegalStateException("Session not completed yet");
        }
        
        // 使用託管帳戶系統進行分帳
        escrowAccountService.settleClassSession(session);
        
        // 記錄結算明細
        session.setNote("Settled via escrow system: 80% to coach, 20% to platform");
        sessionRepository.save(session);
    }

    private double getDurationHours(ClassSession session) {
        return java.time.Duration.between(session.getStartTime(), session.getEndTime()).toMinutes() / 60.0;
    }

    @Scheduled(cron = "0 */5 * * * ?") // 每5分鐘檢查一次
    public void autoSettleStartedSessions() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fiveMinutesAgo = now.minusMinutes(5);
        
        // 查找剛剛開始的課程（狀態為 CONFIRMED 且開始時間在5分鐘內）
        List<ClassSession> startedSessions = sessionRepository.findByStatusAndStartTimeBetween("CONFIRMED", fiveMinutesAgo, now);
        
        for (ClassSession session : startedSessions) {
            try {
                // 只更新課程狀態為進行中，不進行收入分配
                session.setStatus("IN_PROGRESS");
                sessionRepository.save(session);
                
                logger.info("Updated session {} status to IN_PROGRESS", session.getId());
            } catch (Exception e) {
                logger.error("Failed to update session " + session.getId(), e);
            }
        }
    }
    
    // 檢查所有已開始但未結算的課程
    private void autoSettleAllStartedSessions() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // 只查找 COMPLETED 狀態的課程
            List<ClassSession> completedSessions = sessionRepository.findAll().stream()
                .filter(session -> session.getStartTime() != null && 
                                 session.getStartTime().isBefore(now) &&
                                 "COMPLETED".equals(session.getStatus()))
                .collect(Collectors.toList());
            
            for (ClassSession session : completedSessions) {
                try {
                    // 檢查是否已經有收入分配記錄
                    List<Payment> existingSettlements = paymentRepository.findByPaymentTypeAndStatus("COACH_INCOME", "COMPLETED")
                        .stream()
                        .filter(payment -> payment.getTransactionId() != null && 
                                         payment.getTransactionId().equals("SETTLEMENT_" + session.getId()))
                        .collect(Collectors.toList());
                    
                    // 檢查是否有託管支付
                    List<Payment> escrowedPayments = paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                        .stream()
                        .filter(payment -> payment.getTransactionId() != null && 
                                         payment.getTransactionId().startsWith("SESSION_" + session.getId() + "_"))
                        .collect(Collectors.toList());
                    
                    // 如果有託管支付但沒有結算記錄，則進行結算
                    if (!escrowedPayments.isEmpty() && existingSettlements.isEmpty()) {
                        escrowAccountService.settleClassSession(session);
                        logger.info("Auto-settled completed session {} via escrow system", session.getId());
                    }
                } catch (Exception e) {
                    logger.error("Failed to auto-settle completed session " + session.getId(), e);
                }
            }
        } catch (Exception e) {
            logger.error("Error in autoSettleAllStartedSessions: ", e);
        }
    }

    @Scheduled(cron = "0 */5 * * * ?") // 每5分鐘檢查一次
    public void autoUpdateSessionStatus() {
        LocalDateTime now = LocalDateTime.now();
        
        // 更新已結束的課程狀態為 COMPLETED
        List<ClassSession> inProgressSessions = sessionRepository.findByStatus("IN_PROGRESS");
        for (ClassSession session : inProgressSessions) {
            try {
                if (session.getEndTime() != null && session.getEndTime().isBefore(now)) {
                    session.setStatus("COMPLETED");
                    sessionRepository.save(session);
                    logger.info("Updated session {} status to COMPLETED", session.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to update session " + session.getId() + " status", e);
            }
        }
        
        // 更新已開始但未更新的課程狀態為 IN_PROGRESS
        List<ClassSession> confirmedSessions = sessionRepository.findByStatus("CONFIRMED");
        for (ClassSession session : confirmedSessions) {
            try {
                if (session.getStartTime() != null && session.getStartTime().isBefore(now) && 
                    (session.getEndTime() == null || session.getEndTime().isAfter(now))) {
                    session.setStatus("IN_PROGRESS");
                    sessionRepository.save(session);
                    logger.info("Updated session {} status to IN_PROGRESS", session.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to update session " + session.getId() + " status", e);
            }
        }
    }

    @Scheduled(cron = "0 */5 * * * ?") // 每5分鐘檢查一次
    public void autoSettleCompletedSessions() {
        List<ClassSession> completed = sessionRepository.findByStatus("COMPLETED");
        logger.info("Found {} completed sessions to check for settlement", completed.size());
        
        for (ClassSession session : completed) {
            try {
                // 檢查是否已經有收入分配記錄
                List<Payment> existingSettlements = paymentRepository.findByPaymentTypeAndStatus("COACH_INCOME", "COMPLETED")
                    .stream()
                    .filter(payment -> payment.getTransactionId() != null && 
                                     payment.getTransactionId().equals("SETTLEMENT_" + session.getId()))
                    .collect(Collectors.toList());
                
                // 檢查是否有託管支付
                List<Payment> escrowedPayments = paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                    .stream()
                    .filter(payment -> payment.getTransactionId() != null && 
                                     payment.getTransactionId().startsWith("SESSION_" + session.getId() + "_"))
                    .collect(Collectors.toList());
                
                logger.info("Session {}: {} existing settlements, {} escrowed payments", 
                           session.getId(), existingSettlements.size(), escrowedPayments.size());
                
                // 如果有託管支付但沒有結算記錄，則進行結算
                if (!escrowedPayments.isEmpty() && existingSettlements.isEmpty()) {
                    escrowAccountService.settleClassSession(session);
                    logger.info("Auto-settled completed session {} via escrow system", session.getId());
                } else if (escrowedPayments.isEmpty()) {
                    logger.warn("No escrowed payments found for completed session {}", session.getId());
                } else if (!existingSettlements.isEmpty()) {
                    logger.info("Session {} already has settlement records", session.getId());
                }
            } catch (Exception e) {
                logger.error("Failed to auto-settle completed session " + session.getId(), e);
            }
        }
    }

    @Scheduled(cron = "0 0 1 * * ?") // 每天凌晨1點跑
    public void autoCancelEmptySessions() {
        List<ClassSession> upcoming = sessionRepository.findUpcomingSessionsWithoutParticipants();
        for (ClassSession session : upcoming) {
            session.setStatus("CANCELLED");
            sessionRepository.save(session);
            // 可選：通知教練
        }
    }

    @Override
    public List<ClassSession> getSessionsByIds(List<Integer> sessionIds) {
        return sessionRepository.findAllByIdWithCourt(sessionIds);
    }

    @Override
    public ClassSession getSessionById(Integer sessionId) {
        return sessionRepository.findById(sessionId).orElse(null);
    }

    @Override
    public List<ClassSession> getSessionsByRecurringGroupId(String recurringGroupId) {
        return sessionRepository.findByRecurringGroupId(recurringGroupId);
    }

    @Scheduled(cron = "0 0 * * * *") // 每小時執行一次
    @Transactional
    public void autoDistributeClassRevenue() {
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime twentyFourHoursFromNow = now.plusHours(24);
            
            // 查找24小時內開始且狀態為CONFIRMED的課程
            List<ClassSession> upcomingSessions = sessionRepository.findByStartTimeBetweenAndStatus(
                now, twentyFourHoursFromNow, "CONFIRMED"
            );
            
            for (ClassSession session : upcomingSessions) {
                // 檢查是否已經分配過收入
                if (session.getRevenueDistributed() != null && session.getRevenueDistributed()) {
                    continue;
                }
                
                // 檢查是否有託管支付
                List<Payment> escrowedPayments = paymentRepository.findByPaymentTypeAndStatus("CLASS_SESSION_ESCROW", "ESCROWED")
                    .stream()
                    .filter(payment -> payment.getTransactionId() != null && 
                            payment.getTransactionId().startsWith("SESSION_" + session.getId() + "_"))
                    .collect(java.util.stream.Collectors.toList());
                
                if (!escrowedPayments.isEmpty()) {
                    // 使用託管系統進行分帳
                    escrowAccountService.settleClassSession(session);
                    
                    // 標記為已分配
                    session.setRevenueDistributed(true);
                    sessionRepository.save(session);
                    
                    // 發送通知給教練
                    double totalRevenue = escrowedPayments.stream().mapToDouble(Payment::getAmount).sum();
                    sendRevenueDistributionNotification(session, totalRevenue);
                    
                    logger.info("Auto-distributed revenue for session {} via escrow system", session.getId());
                }
            }
        } catch (Exception e) {
            logger.error("Error in autoDistributeClassRevenue: ", e);
        }
    }
    
    private void sendRevenueDistributionNotification(ClassSession session, double totalRevenue) {
        try {
            User coach = session.getCoach();
            double coachShare = totalRevenue * 0.80;
            
            String subject = "Revenue Distributed - Class Session";
            String message = String.format(
                "Your class session '%s' scheduled for %s has been automatically settled.\n\n" +
                "Total Revenue: RM %.2f\n" +
                "Your Share (80%%): RM %.2f\n" +
                "Platform Fee (20%%): RM %.2f\n\n" +
                "The amount has been credited to your wallet via escrow system.",
                session.getTitle(),
                session.getStartTime().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")),
                totalRevenue,
                coachShare,
                totalRevenue * 0.20
            );
            
            emailService.sendEmailIfEnabled(coach, subject, message);
            logger.info("Revenue distribution notification sent to coach {} for session {}", 
                       coach.getId(), session.getId());
        } catch (Exception e) {
            logger.error("Failed to send revenue distribution notification for session {}", 
                        session.getId(), e);
        }
    }
}