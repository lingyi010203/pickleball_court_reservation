package com.pickleball_backend.pickleball.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "bookingslot", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"booking_id", "slot_id"}, name = "uk_booking_slot")
})
public class BookingSlot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne
    @JoinColumn(name = "booking_id", nullable = false)
    @ToString.Exclude
    private Booking booking;

    @ManyToOne
    @JoinColumn(name = "slot_id", nullable = false)
    @ToString.Exclude
    private Slot slot;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    @Column(nullable = false, length = 50)
    private String status; // BOOKED, CANCELLED, COMPLETED

}