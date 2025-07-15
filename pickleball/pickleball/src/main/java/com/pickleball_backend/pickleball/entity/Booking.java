package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "booking")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "total_amount", nullable = false, columnDefinition = "double(5,2)")
    private double totalAmount;

    @Column( length = 50)
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "user_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_id", nullable = false)
    private Payment payment;

    @Column(name = "purpose")
    private String purpose;

    @Column(name = "number_of_players")
    private Integer numberOfPlayers;

    @Column(name = "num_paddles")
    private Integer numPaddles; // 新增：租借球拍数量

    @Column(name = "buy_ball_set")
    private Boolean buyBallSet; // 新增：购买球组

    @OneToMany(mappedBy = "booking", cascade = CascadeType.ALL)
    private java.util.List<BookingSlot> bookingSlots;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private CancellationRequest cancellationRequest;

    public enum status {
        CONFIRMED, CANCELLED, PENDING
    }

}