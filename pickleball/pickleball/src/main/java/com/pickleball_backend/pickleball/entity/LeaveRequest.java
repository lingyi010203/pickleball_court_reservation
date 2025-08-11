package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@Table(name = "leave_request")
public class LeaveRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", referencedColumnName = "id", nullable = false)
    @ToString.Exclude
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "coach_id", referencedColumnName = "id", nullable = false)
    @ToString.Exclude
    private User coach;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "original_session_id", referencedColumnName = "id", nullable = false)
    @ToString.Exclude
    private ClassSession originalSession;

    @Column(nullable = false)
    private LocalDateTime originalDate;

    @Column(nullable = true)
    private LocalDateTime preferredDate;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LeaveRequestStatus status = LeaveRequestStatus.PENDING;

    @Column(nullable = false)
    private LocalDateTime requestDate = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String coachNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "replacement_session_id", referencedColumnName = "id")
    @ToString.Exclude
    private ClassSession replacementSession;

    @Column
    private LocalDateTime resolvedDate;

    public enum LeaveRequestStatus {
        DRAFT,             // 草稿狀態（學生已提交但未發送給教練）
        PENDING,           // 等待處理
        SELF_SELECTED,     // 學生自己選擇了補課時間
        MESSAGE_SENT,      // 學生發送了訊息給教練
        APPROVED,          // 已批准並安排補課
        DECLINED,          // 已拒絕
        CANCELLED          // 學生取消請求
    }
} 