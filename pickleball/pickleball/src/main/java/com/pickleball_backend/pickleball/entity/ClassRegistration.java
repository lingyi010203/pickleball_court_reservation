package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;


@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "class_registration")
public class ClassRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "session_id")
    @JsonIgnore
    private ClassSession classSession;

    @ManyToOne
    @JoinColumn(name = "member_id")
    @JsonIgnoreProperties({"registrations", "vouchers", "wallet", "organizedMatches", "joinRequests"})
    private Member member;

    @Column(name = "registration_date")
    private LocalDateTime registrationDate;

    @Column(name = "attendance_status")
    private String attendanceStatus; // "PRESENT", "ABSENT", "LATE", "MAKEUP"

    @Column(name = "group_booking_id")
    private String groupBookingId; // UUID字串

    @OneToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "payment_id")
    private Payment payment;

    @Column(name = "coach_comment", columnDefinition = "TEXT")
    private String coachComment;

    @Column(name = "rating")
    private Integer rating; // 1-5 rating from coach

    // Getters and Setters...
    public Integer getId() {
        return id;
    }
    public void setId(Integer id) {
        this.id = id;
    }
    public ClassSession getClassSession() {
        return classSession;
    }
    public void setClassSession(ClassSession classSession) {
        this.classSession = classSession;
    }
    public Member getMember() {
        return member;
    }
    public void setMember(Member member) {
        this.member = member;
    }
    public LocalDateTime getRegistrationDate() {
        return registrationDate;
    }
    public void setRegistrationDate(LocalDateTime registrationDate) {
        this.registrationDate = registrationDate;
    }
    public Payment getPayment() {
        return payment;
    }
    public void setPayment(Payment payment) {
        this.payment = payment;
    }
}