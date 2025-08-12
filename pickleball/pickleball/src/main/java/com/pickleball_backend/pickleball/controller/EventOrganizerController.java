package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.exception.ResourceNotFoundException;
import com.pickleball_backend.pickleball.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;
import org.springframework.data.domain.Pageable;
import java.util.ArrayList;
import java.util.Optional;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/event-organizer")
@RequiredArgsConstructor
public class EventOrganizerController {

    private final UserRepository userRepository;
    private final EventOrganizerRepository eventOrganizerRepository;
    private final EventRepository eventRepository;
    private final EventRegistrationRepository eventRegistrationRepository;
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final MemberRepository memberRepository;
    private final UserAccountRepository userAccountRepository;
    private final VenueRepository venueRepository;

    // 獲取活動組織者的基本信息
    @GetMapping("/profile")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getOrganizerProfile() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            EventOrganizer eventOrganizer = eventOrganizerRepository.findById(organizer.getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer profile not found"));

            Map<String, Object> profile = new HashMap<>();
            profile.put("id", organizer.getId());
            profile.put("name", organizer.getName());
            profile.put("email", organizer.getEmail());
            profile.put("phone", organizer.getPhone());
            profile.put("organizerRating", eventOrganizer.getOrganizerRating());

            return ResponseEntity.ok(profile);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving organizer profile");
        }
    }

    // 獲取活動組織者創建的所有活動
    @GetMapping("/events")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getOrganizerEvents() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            List<Event> events = eventRepository.findByOrganizerId(organizer.getId());
            
            List<Map<String, Object>> eventData = events.stream().map(event -> {
                Map<String, Object> eventInfo = new HashMap<>();
                eventInfo.put("id", event.getId());
                eventInfo.put("title", event.getTitle());
                eventInfo.put("startTime", event.getStartTime() != null ? event.getStartTime().toString() : null);
                eventInfo.put("endTime", event.getEndTime() != null ? event.getEndTime().toString() : null);
                eventInfo.put("eventType", event.getEventType());
                eventInfo.put("status", event.getStatus());
                eventInfo.put("capacity", event.getCapacity());
                eventInfo.put("registeredCount", event.getRegisteredCount());
                eventInfo.put("location", event.getLocation());
                eventInfo.put("feeAmount", event.getFeeAmount());
                eventInfo.put("organizerId", event.getOrganizerId());
                return eventInfo;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(eventData);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving events");
        }
    }

    // 獲取活動統計信息
    @GetMapping("/statistics")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getOrganizerStatistics() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            List<Event> allEvents = eventRepository.findByOrganizerId(organizer.getId());
            
            Map<String, Object> statistics = new HashMap<>();
            statistics.put("totalEvents", allEvents.size());
            statistics.put("activeEvents", allEvents.stream().filter(e -> "ACTIVE".equals(e.getStatus())).count());
            statistics.put("completedEvents", allEvents.stream().filter(e -> "COMPLETED".equals(e.getStatus())).count());
            statistics.put("totalParticipants", allEvents.stream().mapToInt(Event::getRegisteredCount).sum());
            
            // Calculate revenue from completed events (escrow has been distributed)
            double grossRevenue = allEvents.stream()
                    .filter(e -> e.getFeeAmount() != null && "COMPLETED".equals(e.getStatus()))
                    .mapToDouble(e -> e.getFeeAmount() * e.getRegisteredCount())
                    .sum();
            
            // Platform fee calculation: 10% of completed events only
            double totalPlatformFees = allEvents.stream()
                    .filter(e -> e.getFeeAmount() != null && e.getRegisteredCount() > 0 && "COMPLETED".equals(e.getStatus()))
                    .mapToDouble(e -> {
                        double eventRevenue = e.getFeeAmount() * e.getRegisteredCount();
                        return eventRevenue * 0.1; // 10% of event revenue only
                    })
                    .sum();
            
            double netRevenue = grossRevenue - totalPlatformFees;
            
            statistics.put("grossRevenue", grossRevenue);
            statistics.put("platformFees", totalPlatformFees);
            statistics.put("netRevenue", netRevenue);
            statistics.put("totalRevenue", grossRevenue); // Keep for backward compatibility

            return ResponseEntity.ok(statistics);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving statistics");
        }
    }

    // 獲取錢包信息
    @GetMapping("/wallet")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getOrganizerWallet() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            // 獲取組織者的 Member 記錄
            Member organizerMember = memberRepository.findByUserId(organizer.getId());
            if (organizerMember == null) {
                throw new ResourceNotFoundException("Member record not found");
            }

            // 獲取錢包
            Wallet organizerWallet = walletRepository.findByMemberId(organizerMember.getId())
                    .orElse(null);

            if (organizerWallet == null) {
                organizerWallet = new Wallet();
                organizerWallet.setMember(organizerMember);
                organizerWallet.setBalance(0.00);
                organizerWallet.setFrozenBalance(0.00);
                organizerWallet.setTotalDeposited(0.00);
                organizerWallet.setTotalSpent(0.00);
                organizerWallet.setStatus("ACTIVE");
                organizerWallet = walletRepository.save(organizerWallet);
            }

            // 獲取最近的交易記錄
            List<WalletTransaction> recentTransactions = walletTransactionRepository
                    .findByWalletIdOrderByCreatedAtDesc(organizerWallet.getId(), Pageable.unpaged())
                    .getContent()
                    .stream()
                    .limit(10)
                    .collect(Collectors.toList());

            // 計算基於交易記錄的餘額
            double transactionBasedBalance = recentTransactions.stream()
                    .mapToDouble(WalletTransaction::getAmount)
                    .sum();

            Map<String, Object> response = new HashMap<>();
            response.put("organizerId", organizer.getId());
            response.put("organizerName", organizer.getName());
            response.put("balance", transactionBasedBalance); // 使用交易記錄計算的餘額
            response.put("walletStatus", organizerWallet.getStatus());
            response.put("recentTransactions", recentTransactions.stream()
                    .map(transaction -> {
                        Map<String, Object> tx = new HashMap<>();
                        tx.put("id", transaction.getId());
                        tx.put("type", transaction.getTransactionType());
                        tx.put("amount", transaction.getAmount());
                        tx.put("balanceBefore", transaction.getBalanceBefore());
                        tx.put("balanceAfter", transaction.getBalanceAfter());
                        tx.put("description", transaction.getDescription());
                        tx.put("createdAt", transaction.getCreatedAt());
                        return tx;
                    })
                    .collect(Collectors.toList()));

            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving wallet information");
        }
    }

    // 獲取特定活動的註冊用戶
    @GetMapping("/events/{eventId}/participants")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getEventParticipants(@PathVariable Integer eventId) {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            // 驗證活動是否屬於該組織者
            Event event = eventRepository.findById(eventId)
                    .orElseThrow(() -> new ResourceNotFoundException("Event not found"));

            if (!event.getOrganizerId().equals(organizer.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("You are not authorized to view this event's participants");
            }

            List<EventRegistration> registrations = eventRegistrationRepository.findByEvent_Id(eventId);
            
            List<Map<String, Object>> participantData = registrations.stream().map(registration -> {
                User user = registration.getUser();
                Map<String, Object> participant = new HashMap<>();
                participant.put("id", user.getId());
                participant.put("name", user.getName());
                participant.put("email", user.getEmail());
                participant.put("phone", user.getPhone());
                participant.put("registrationDate", registration.getRegistrationDate() != null ? registration.getRegistrationDate().toString() : null);
                return participant;
            }).collect(Collectors.toList());

            return ResponseEntity.ok(participantData);
        } catch (ResourceNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error retrieving participants");
        }
    }

    // 調試端點
    @GetMapping("/debug/status")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> getOrganizerDebugStatus() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizerUser = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            
            EventOrganizer organizer = eventOrganizerRepository.findById(organizerUser.getId()).orElse(null);
            
            Map<String, Object> status = new HashMap<>();
            status.put("username", username);
            status.put("userId", organizerUser.getId());
            status.put("userType", organizerUser.getUserType());
            status.put("hasOrganizerEntity", organizer != null);
            status.put("organizerId", organizer != null ? organizer.getId() : null);
            status.put("organizerRating", organizer != null ? organizer.getOrganizerRating() : null);
            
            // 如果沒有 EventOrganizer 實體，創建一個
            if (organizer == null && "EventOrganizer".equalsIgnoreCase(organizerUser.getUserType())) {
                EventOrganizer newOrganizer = new EventOrganizer();
                newOrganizer.setUser(organizerUser);
                newOrganizer.setOrganizerRating(0.0);
                eventOrganizerRepository.save(newOrganizer);
                status.put("organizerCreated", true);
                status.put("newOrganizerId", newOrganizer.getId());
            }
            
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error checking organizer status: " + e.getMessage());
        }
    }

    // 測試端點：創建 EventOrganizer 帳戶（僅用於測試）
    @PostMapping("/test/create-organizer")
    public ResponseEntity<?> createTestOrganizer(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String email = request.get("email");
            String password = request.get("password");
            
            if (username == null || email == null || password == null) {
                return ResponseEntity.badRequest().body("Missing required fields");
            }
            
            // 檢查用戶是否已存在
            if (userRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.badRequest().body("Email already exists");
            }
            
            // 創建用戶
            User user = new User();
            user.setName("Test Event Organizer");
            user.setEmail(email);
            user.setPhone("1234567890");
            user.setUserType("EventOrganizer");
            user.setGender("Other");
            user.setDob(java.time.LocalDate.now().minusYears(25));
            user = userRepository.save(user);
            
            // 創建用戶帳戶
            UserAccount account = new UserAccount();
            account.setUsername(username);
            account.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder().encode(password));
            account.setUser(user);
            account.setStatus("ACTIVE");
            userAccountRepository.save(account);
            
            // 創建 EventOrganizer 實體
            EventOrganizer organizer = new EventOrganizer();
            organizer.setUser(user);
            organizer.setOrganizerRating(0.0);
            eventOrganizerRepository.save(organizer);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Test EventOrganizer created successfully");
            response.put("userId", user.getId());
            response.put("username", username);
            response.put("userType", user.getUserType());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating test organizer: " + e.getMessage());
        }
    }

    // 測試端點：創建示例活動（僅用於測試）
    @PostMapping("/test/create-sample-events")
    public ResponseEntity<?> createSampleEvents(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            if (username == null) {
                return ResponseEntity.badRequest().body("Username is required");
            }
            
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));
            
            // 創建示例活動
            List<Event> sampleEvents = new ArrayList<>();
            
            // 活動 1
            Event event1 = new Event();
            event1.setTitle("Pickleball Tournament 2024");
            event1.setStartTime(LocalDateTime.now().plusDays(7));
            event1.setEndTime(LocalDateTime.now().plusDays(7).plusHours(4));
            event1.setEventType("Tournament");
            event1.setCapacity(32);
            event1.setStatus("ACTIVE");
            event1.setLocation("Central Sports Complex");
            event1.setOrganizerId(organizer.getId());
            event1.setSchedule("9:00 AM - Registration\n10:00 AM - Round 1\n2:00 PM - Finals");
            event1.setFeeAmount(50.0);
            event1.setRegisteredCount(24);
            sampleEvents.add(event1);
            
            // 活動 2
            Event event2 = new Event();
            event2.setTitle("Beginner Pickleball Clinic");
            event2.setStartTime(LocalDateTime.now().plusDays(3));
            event2.setEndTime(LocalDateTime.now().plusDays(3).plusHours(2));
            event2.setEventType("Clinic");
            event2.setCapacity(12);
            event2.setStatus("ACTIVE");
            event2.setLocation("Community Center");
            event2.setOrganizerId(organizer.getId());
            event2.setSchedule("10:00 AM - Introduction\n11:00 AM - Basic Skills\n12:00 PM - Practice");
            event2.setFeeAmount(25.0);
            event2.setRegisteredCount(8);
            sampleEvents.add(event2);
            
            // 活動 3
            Event event3 = new Event();
            event3.setTitle("Social Pickleball Night");
            event3.setStartTime(LocalDateTime.now().plusDays(1));
            event3.setEndTime(LocalDateTime.now().plusDays(1).plusHours(3));
            event3.setEventType("Social Play");
            event3.setCapacity(20);
            event3.setStatus("ACTIVE");
            event3.setLocation("Local Park Courts");
            event3.setOrganizerId(organizer.getId());
            event3.setSchedule("6:00 PM - Warm up\n6:30 PM - Round Robin\n9:00 PM - Wrap up");
            event3.setFeeAmount(15.0);
            event3.setRegisteredCount(16);
            sampleEvents.add(event3);
            
            // 保存所有活動
            List<Event> savedEvents = eventRepository.saveAll(sampleEvents);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Sample events created successfully");
            response.put("eventsCreated", savedEvents.size());
            response.put("organizerId", organizer.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating sample events: " + e.getMessage());
        }
    }

    // 測試端點：創建示例活動註冊記錄（僅用於測試）
    @PostMapping("/test/create-sample-registrations")
    public ResponseEntity<?> createSampleRegistrations(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            if (username == null) {
                return ResponseEntity.badRequest().body("Username is required");
            }
            
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));
            
            // 獲取該組織者的所有活動
            List<Event> events = eventRepository.findByOrganizerId(organizer.getId());
            if (events.isEmpty()) {
                return ResponseEntity.badRequest().body("No events found for this organizer. Please create events first.");
            }
            
            // 獲取一些測試用戶（前5個用戶）
            List<User> testUsers = userRepository.findAll().stream()
                    .filter(user -> !"EventOrganizer".equals(user.getUserType()))
                    .limit(5)
                    .collect(Collectors.toList());
            
            if (testUsers.isEmpty()) {
                return ResponseEntity.badRequest().body("No test users found. Please create some users first.");
            }
            
            List<EventRegistration> registrations = new ArrayList<>();
            
            // 為每個活動創建一些註冊記錄
            for (Event event : events) {
                int numRegistrations = Math.min(3, testUsers.size()); // 每個活動最多3個註冊
                
                for (int i = 0; i < numRegistrations; i++) {
                    User user = testUsers.get(i);
                    
                    // 檢查是否已經註冊
                    Optional<EventRegistration> existingRegistration = 
                        eventRegistrationRepository.findByEvent_IdAndUser_Id(event.getId(), user.getId());
                    
                    if (existingRegistration.isPresent()) {
                        continue; // 跳過已存在的註冊
                    }
                    
                    // 創建新的註冊記錄
                    EventRegistration registration = new EventRegistration();
                    registration.setEvent(event);
                    registration.setUser(user);
                    registration.setRegistrationDate(LocalDateTime.now().minusDays(i + 1)); // 不同的註冊日期
                    registration.setPaymentStatus("PAID");
                    registration.setFeeAmount(event.getFeeAmount());
                    registration.setStatus("REGISTERED");
                    
                    // 生成一個唯一的 registrationId
                    registration.setRegistrationId((int) (Math.random() * 1000000) + 100000);
                    
                    registrations.add(registration);
                }
            }
            
            // 保存所有註冊記錄
            List<EventRegistration> savedRegistrations = eventRegistrationRepository.saveAll(registrations);
            
            // 更新活動的註冊計數
            for (Event event : events) {
                long registrationCount = eventRegistrationRepository.findByEvent_Id(event.getId()).size();
                event.setRegisteredCount((int) registrationCount);
                eventRepository.save(event);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Sample registrations created successfully");
            response.put("registrationsCreated", savedRegistrations.size());
            response.put("eventsUpdated", events.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating sample registrations: " + e.getMessage());
        }
    }

    // 測試端點：創建示例預訂來測試日期阻擋（僅用於測試）
    @PostMapping("/test/create-sample-bookings")
    public ResponseEntity<?> createSampleBookings(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String venueIdStr = request.get("venueId");
            String dateStr = request.get("date");
            
            if (username == null || venueIdStr == null || dateStr == null) {
                return ResponseEntity.badRequest().body("Username, venueId, and date are required");
            }
            
            Integer venueId = Integer.parseInt(venueIdStr);
            LocalDate date = LocalDate.parse(dateStr);
            
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));
            
            // 創建一個測試活動來佔用該日期
            Event testEvent = new Event();
            testEvent.setTitle("Test Event - Date Blocking");
            testEvent.setStartTime(date.atTime(10, 0)); // 10:00 AM
            testEvent.setEndTime(date.atTime(14, 0)); // 2:00 PM
            testEvent.setEventType("Test");
            testEvent.setCapacity(20);
            testEvent.setStatus("ACTIVE");
            testEvent.setLocation("Test Location");
            testEvent.setOrganizerId(organizer.getId());
            testEvent.setSchedule("Test schedule");
            testEvent.setFeeAmount(50.0);
            testEvent.setRegisteredCount(0);
            testEvent.setVenue(venueRepository.findById(venueId).orElse(null));
            
            Event savedEvent = eventRepository.save(testEvent);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Sample booking created successfully");
            response.put("eventId", savedEvent.getId());
            response.put("venueId", venueId);
            response.put("date", dateStr);
            response.put("note", "This date should now be blocked for new events");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error creating sample booking: " + e.getMessage());
        }
    }

    // 調試端點：檢查現有活動的 venue 關聯
    @GetMapping("/debug/events-venue-check")
    @PreAuthorize("hasRole('EVENTORGANIZER')")
    public ResponseEntity<?> debugEventsVenueCheck() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            User organizer = userRepository.findByUserAccount_Username(username)
                    .orElseThrow(() -> new ResourceNotFoundException("Event organizer not found"));

            List<Event> allEvents = eventRepository.findByOrganizerId(organizer.getId());
            
            List<Map<String, Object>> eventDetails = new ArrayList<>();
            for (Event event : allEvents) {
                Map<String, Object> details = new HashMap<>();
                details.put("id", event.getId());
                details.put("title", event.getTitle());
                details.put("startTime", event.getStartTime());
                details.put("endTime", event.getEndTime());
                details.put("venueId", event.getVenue() != null ? event.getVenue().getId() : null);
                details.put("venueName", event.getVenue() != null ? event.getVenue().getName() : null);
                details.put("courtCount", event.getCourts() != null ? event.getCourts().size() : 0);
                details.put("courts", event.getCourts() != null ? 
                    event.getCourts().stream().map(c -> {
                        Map<String, Object> courtInfo = new HashMap<>();
                        courtInfo.put("id", c.getId());
                        courtInfo.put("name", c.getName());
                        courtInfo.put("venueId", c.getVenue() != null ? c.getVenue().getId() : null);
                        courtInfo.put("venueName", c.getVenue() != null ? c.getVenue().getName() : null);
                        return courtInfo;
                    }).collect(Collectors.toList()) : new ArrayList<>());
                eventDetails.add(details);
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("organizerId", organizer.getId());
            response.put("organizerName", organizer.getName());
            response.put("totalEvents", allEvents.size());
            response.put("events", eventDetails);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error checking events: " + e.getMessage());
        }
    }
} 