package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Data
@Table(name = "classsession")
public class ClassSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "start_time")
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status; // AVAILABLE, BOOKED, CANCELLED, COMPLETED, OPEN, BOOKED_BY_COACH, BOOKED_BY_USER
    private String note;
    @Column(name = "experience_year")
    private Integer experienceYear;

    @Column(name = "slot_type")
    private String slotType; // COACH_AVAILABILITY or REGULAR_BOOKING

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne
    @JoinColumn(name = "coach_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User coach;

    @ManyToOne
    @JoinColumn(name = "court_id")
    @JsonIgnoreProperties("sessions") // 只忽略 sessions，讓 venue 信息能傳遞
    private Court court;

    @ManyToOne
    @JoinColumn(name = "player_id")
    private User player;

    @OneToOne
    @JoinColumn(name = "payment_id") // 這個欄位名要和你的資料庫一致
    private Payment payment;

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private CancellationRequest cancellationRequest;

    // 新增欄位
    @Column(name = "max_participants")
    private Integer maxParticipants;

    @Column(name = "description")
    private String description;

    @Column(name = "price", nullable = false)
    private double price = 0.0; // 默認0，強制教練設置價格

    @Column(name = "title", nullable = false)
    private String title;

    // 新增：當前參與人數
    @Column(name = "current_participants")
    private int currentParticipants = 0;

    @Column(name = "is_recurring")
    private Boolean isRecurring; // 是否為固定課程

    @Column(name = "recurrence_pattern")
    private String recurrencePattern; // 週期模式：WEEKLY/MONTHLY

    @Column(name = "recurrence_days")
    private String recurrenceDays; // 週期日：MON,WED,FRI

    @Column(name = "recurrence_end_date")
    private LocalDate recurrenceEndDate; // 週期結束日

    @Column(name = "recurring_group_id")
    private String recurringGroupId; // recurring 課程分組用

    @ManyToOne
    @JoinColumn(name = "venue_id")
    private Venue venue;

    // 新增：報名關聯
    @OneToMany(mappedBy = "classSession")
    private List<ClassRegistration> registrations;

    // Replacement class: reference to the original cancelled session
    @Column(name = "replacement_for_session_id")
    private Integer replacementForSessionId;

    // 新增：是否允許補課
    @Column(name = "allow_replacement")
    private Boolean allowReplacement = false;

    @Column(name = "revenue_distributed")
    private Boolean revenueDistributed = false; // 收入是否已分配

    // 商務邏輯方法：檢查是否可報名
    public boolean canRegister() {
        return "AVAILABLE".equals(status) && currentParticipants < maxParticipants;
    }

    // 商務邏輯方法：增加參與者
    public void addParticipant() {
        if (currentParticipants < maxParticipants) {
            currentParticipants++;
            if (currentParticipants >= maxParticipants) {
                status = "FULL";
            }
        }
    }

    public Boolean getRecurring() {
        return isRecurring;
    }

    public void setRecurring(Boolean recurring) {
        isRecurring = recurring;
    }
}