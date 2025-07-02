package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Booking;
import com.pickleball_backend.pickleball.entity.Court;
import com.pickleball_backend.pickleball.entity.Payment;
import com.pickleball_backend.pickleball.entity.Slot;
import com.pickleball_backend.pickleball.entity.Event;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import javax.annotation.PostConstruct;

@Service
@Slf4j
public class EmailService {
    @Autowired
    private final JavaMailSender javaMailSender;

    // Define formatters ONCE here
    private static final DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm");
    private static final DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public EmailService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    // Fixed to actually send emails for booking confirmations
    public void sendBookingConfirmation(String email, Booking booking, Court court, Slot slot) {
        if (email == null || booking == null || court == null || slot == null) {
            log.error("Missing parameters for booking confirmation email");
            return;
        }

        String subject = "Court Booking Confirmation";
        double duration = Duration.between(
                slot.getStartTime() != null ? slot.getStartTime() : LocalTime.MIN,
                slot.getEndTime() != null ? slot.getEndTime() : LocalTime.MIN
        ).toMinutes() / 60.0;

        String content = String.format(
                "Your booking is confirmed!\n\n" +
                        "Court: %s\n" +
                        "Location: %s\n" +
                        "Date: %s\n" +
                        "Time: %s - %s\n" +
                        "Duration: %.1f hours\n" +
                        "Amount: $%.2f\n" +
                        "Purpose: %s\n" +
                        "Players: %d\n" +
                        "Booking ID: %d",
                court.getName() != null ? court.getName() : "N/A",
                court.getLocation() != null ? court.getLocation() : "N/A",
                slot.getDate() != null ? slot.getDate() : "N/A",
                slot.getStartTime() != null ? slot.getStartTime() : "N/A",
                slot.getEndTime() != null ? slot.getEndTime() : "N/A",
                duration,
                booking.getTotalAmount(),
                booking.getPurpose() != null ? booking.getPurpose() : "N/A",
                booking.getNumberOfPlayers() != null ? booking.getNumberOfPlayers() : 0,
                booking.getId()
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Booking confirmation email sent to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send booking confirmation to {}: {}", email, e.getMessage());
        }
    }

    public void sendPasswordResetEmail(String toEmail, String resetLink) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Password Reset Request");
        message.setText("To reset your password, click the link below:\n" + resetLink);

        try {
            javaMailSender.send(message);
            log.info("Password reset email sent to: {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send password reset email. Please try again later.");
        }
    }

    public void sendVoucherEmail(String toEmail, String subject, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Voucher email sent to: {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send voucher email to {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Failed to send voucher email");
        }
    }

    //Cancel Booking
    public void sendCancellationConfirmation(String email, Booking booking, Slot slot, Court court) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Booking Cancellation Request Received");

        String content = String.format(
                "Your cancellation request for booking #%d has been received.\n\n" +
                        "Court: %s\n" +
                        "Date: %s\n" +
                        "Time: %s - %s\n\n" +
                        "We'll process your request shortly.",
                booking.getId(),
                court.getName(), // Use court.getName() here
                slot.getDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );

        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Cancellation confirmation sent to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }

    public void sendCancellationDecision(String email, Booking booking, Slot slot, String courtName, boolean approved) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Cancellation Request " + (approved ? "Approved" : "Rejected"));

        String content = String.format(
                "Your cancellation request for booking #%d has been %s.\n\n" +
                        "Court: %s\nDate: %s\nTime: %s - %s\n\n" +
                        (approved ? "The slot has been freed up." : "Your booking remains confirmed."),
                booking.getId(),
                approved ? "APPROVED" : "REJECTED",
                courtName,
                slot.getDate(),
                slot.getStartTime(),
                slot.getEndTime()
        );

        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Cancellation decision sent to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send cancellation email: {}", e.getMessage());
        }
    }

    public void sendCourtDeletionNotification(
            String email,
            String courtName,
            LocalDate bookingDate,
            LocalTime bookingTime,
            double refundAmount
    ) {
        log.info("Attempting to send court deletion notification to: {}", email);
        log.info("Court: {}, Date: {}, Time: {}, Refund: {}",
                courtName, bookingDate, bookingTime, refundAmount);

        if (email == null) {
            log.error("Missing email for court deletion notification");
            return;
        }

        String subject = "Important: Court Deletion Notification";
        String content = String.format(
                "Dear valued member,\n\n" +
                        "We regret to inform you that the court '%s' has been permanently removed from our system.\n\n" +
                        "This affects your booking on %s at %s.\n\n" +
                        "We have processed a full refund of $%.2f for this booking, which should appear in your account within 3-5 business days.\n\n" +
                        "We sincerely apologize for any inconvenience this may cause. As a gesture of goodwill, we've added 200 loyalty points to your account.\n\n" +
                        "You can use these points to book other courts in our facility.\n\n" +
                        "Thank you for your understanding,\n" +
                        "The Pickleball Management Team",
                courtName,
                bookingDate,
                bookingTime,
                refundAmount
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Email sent successfully to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send court deletion notification to {}: {}", email, e.getMessage());
            log.error("Full exception: ", e); // Add full stack trace
        }
    }

    public void sendPaymentReceipt(String email, Payment payment) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Payment Receipt #" + payment.getId());

        String content = String.format(
                "Payment Confirmation\n\n" +
                        "Amount: $%.2f\n" +
                        "Date: %s\n" +
                        "Method: %s\n" +
                        "Transaction ID: %d",
                payment.getAmount(),
                payment.getPaymentDate(),
                payment.getPaymentMethod(),
                payment.getId()
        );

        message.setText(content);
        javaMailSender.send(message);
    }

    public void sendTopUpConfirmation(
            String email,
            double amount,
            double newBalance,
            String paymentMethod,
            String transactionId
    ) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("Wallet Top-Up Confirmation");

        String content = String.format(
                "Your wallet has been topped up successfully!\n\n" +
                        "Amount: RM%.2f\n" +
                        "Payment Method: %s\n" +
                        "New Balance: RM%.2f\n" +
                        "Transaction ID: %s\n\n" +
                        "Thank you for using our service!",
                amount, paymentMethod, newBalance, transactionId
        );

        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Top-up confirmation sent to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send top-up email: {}", e.getMessage());
        }
    }
	
	// Invitation email implementation
    public void sendInvitationEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);

        try {
            javaMailSender.send(message);
            log.info("Invitation email sent to: {}", to);
        } catch (MailException e) {
            log.error("Failed to send invitation email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send invitation email");
        }
    }

    public void sendFeedbackDeletionNotification(String toEmail, String userName, String review) {
        if (toEmail == null) return;
        String subject = "Your Feedback Has Been Removed";
        String content = String.format("Dear %s,\n\nYour feedback has been removed by an administrator.\n\nFeedback: \"%s\"\n\nIf you have any questions, please contact support.\n\nThank you.\nPickleball Management Team", userName, review);
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject(subject);
        message.setText(content);
        try {
            javaMailSender.send(message);
            log.info("Feedback deletion notification sent to: {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send feedback deletion notification to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendUserTypeRejectionEmail(String to, String reason) {
        String subject = "Event Organizer Application Rejected";
        String body = "Your application to become an Event Organizer was rejected for the following reason:\n\n" +
                      reason + "\n\nPlease update your documents and try again.";
        sendEmail(to, subject, body);
    }

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        try {
            javaMailSender.send(message);
            log.info("Email sent to: {}", to);
        } catch (MailException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }

    public void sendEventNotification(String email, Event event) {
        if (email == null || event == null) return;
        log.info("Sending event notification to: {}", email);
        String subject = "New Event Published: " + event.getTitle();
        String content = String.format(
            "Dear user,\n\nA new event \"%s\" has been published!\n\nDate: %s\nLocation: %s\n\nCheck it out in the app!",
            event.getTitle(),
            event.getStartTime(),
            event.getLocation()
        );
        sendEmail(email, subject, content);
    }
    
    public void sendEventUpdateNotification(String email, Event event) {
        if (email == null || event == null) return;
        log.info("Sending event update notification to: {}", email);
        String subject = "Event Updated: " + event.getTitle();
        String content = String.format(
            "Dear user,\n\n" +
            "The event \"%s\" has been updated!\n\n" +
            "Updated Details:\n" +
            "Title: %s\n" +
            "Date: %s\n" +
            "Start Time: %s\n" +
            "End Time: %s\n" +
            "Location: %s\n" +
            "Event Type: %s\n" +
            "Skill Level: %s\n" +
            "Capacity: %d\n" +
            "Eligibility: %s\n" +
            "Fee: %s\n" +
            // No description field in Event entity
            // "Description: %s\n\n" +
            "Please check the app for the latest information!\n\n--",
            event.getTitle(),
            event.getTitle(),
            event.getStartTime() != null ? event.getStartTime().format(dateFormatter) : "",
            event.getStartTime() != null ? event.getStartTime().format(timeFormatter) : "",
            event.getEndTime() != null ? event.getEndTime().format(timeFormatter) : "",
            event.getLocation(),
            event.getEventType(),
            event.getSkillLevel(),
            event.getCapacity(),
            event.getEligibility(),
            event.getFeeAmount() != null ? event.getFeeAmount() : "Free"
            // No description
        );
        sendEmail(email, subject, content);
    }
    
    public void sendEventCancellationNotification(String email, Event event) {
        if (email == null || event == null) return;
        log.info("Sending event cancellation notification to: {}", email);
        String subject = "Event Cancelled: " + event.getTitle();
        String content = String.format(
            "Dear user,\n\nWe regret to inform you that the event \"%s\" has been cancelled.\n\nEvent Details:\nDate: %s\nLocation: %s\nEvent Type: %s\n\nWe apologize for any inconvenience this may cause. Please check the app for other available events!",
            event.getTitle(),
            event.getStartTime(),
            event.getLocation(),
            event.getEventType()
        );
        sendEmail(email, subject, content);
    }

    public void sendJoinRequestNotification(String organizerEmail, String playerName, Integer matchId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(organizerEmail);
        message.setSubject("New Join Request for Match #" + matchId);
        message.setText(playerName + " wants to join your friendly match. Please approve or reject in your organizer dashboard.");
        javaMailSender.send(message);
    }

    public void sendJoinConfirmation(String playerEmail, Integer matchId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(playerEmail);
        message.setSubject("Match Participation Approved");
        message.setText("Your request to join match #" + matchId + " has been approved!");
        javaMailSender.send(message);
    }

    public void sendCancellationNotification(String organizerEmail, String playerName, Integer matchId) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(organizerEmail);
        message.setSubject("Participation Cancelled for Match #" + matchId);
        message.setText(playerName + " has cancelled their participation in your match.");
        javaMailSender.send(message);
    }

    public void sendReminderNotification(String playerEmail, Integer matchId, LocalDateTime startTime) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(playerEmail);
        message.setSubject("Match Reminder: #" + matchId);
        message.setText("Your friendly match starts in 24 hours at " +
                startTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));

        try {
            javaMailSender.send(message);
            log.info("Match reminder sent to: {}", playerEmail);
        } catch (MailException e) {
            log.error("Failed to send match reminder to {}: {}", playerEmail, e.getMessage());
        }
    }

    public void sendMessageNotification(String toEmail, String fromUsername, String content) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("You have received a new message");
        message.setText("You have a new message from " + fromUsername + ":\n\n" + content);
        try {
            javaMailSender.send(message);
            log.info("Message notification email sent to: {}", toEmail);
        } catch (MailException e) {
            log.error("Failed to send message notification email to {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendSessionCancellation(String email, LocalDateTime sessionTime, String coachName) {
        if (email == null) {
            log.error("Missing email for session cancellation notification");
            return;
        }

        String subject = "Coach Session Cancellation";
        String formattedDate = sessionTime.format(dateFormatter);
        String formattedTime = sessionTime.format(timeFormatter);

        String content = String.format(
                "Dear user,\n\n" +
                        "Your coaching session with %s scheduled on %s at %s has been cancelled by the coach.\n\n" +
                        "We apologize for any inconvenience. Please check the app for other available coaching sessions.\n\n" +
                        "Thank you,\n" +
                        "The Pickleball Management Team",
                coachName, formattedDate, formattedTime
        );

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject(subject);
        message.setText(content);

        try {
            javaMailSender.send(message);
            log.info("Session cancellation email sent to: {}", email);
        } catch (MailException e) {
            log.error("Failed to send session cancellation email to {}: {}", email, e.getMessage());
        }
    }
}

