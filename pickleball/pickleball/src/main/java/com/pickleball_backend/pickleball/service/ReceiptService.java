package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.dto.ReceiptRequestDto;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ReceiptService {

    public ByteArrayOutputStream generateReceiptPdf(ReceiptRequestDto receiptRequest) throws Exception {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4);
        PdfWriter.getInstance(document, baos);
        
        document.open();
        
        // Add header
        addHeader(document, receiptRequest);
        
        // Add booking details
        addBookingDetails(document, receiptRequest);
        
        // Add payment details
        addPaymentDetails(document, receiptRequest);
        
        // Add footer
        addFooter(document);
        
        document.close();
        return baos;
    }
    
    private void addHeader(Document document, ReceiptRequestDto receiptRequest) throws Exception {
        // Title
        Font titleFont = new Font(Font.HELVETICA, 24, Font.BOLD);
        Paragraph title = new Paragraph("PICKLEBALL COURT RECEIPT", titleFont);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(20);
        document.add(title);
        
        // Receipt info
        Font infoFont = new Font(Font.HELVETICA, 10, Font.NORMAL);
        Paragraph receiptInfo = new Paragraph();
        receiptInfo.add(new Chunk("Receipt #: " + receiptRequest.getBookingId(), infoFont));
        receiptInfo.add(new Chunk("    Date: " + LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), infoFont));
        receiptInfo.add(new Chunk("    Time: " + java.time.LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")), infoFont));
        receiptInfo.setAlignment(Element.ALIGN_CENTER);
        receiptInfo.setSpacingAfter(20);
        document.add(receiptInfo);
    }
    
    private void addBookingDetails(Document document, ReceiptRequestDto receiptRequest) throws Exception {
        Font sectionFont = new Font(Font.HELVETICA, 14, Font.BOLD);
        Paragraph sectionTitle = new Paragraph("BOOKING DETAILS", sectionFont);
        sectionTitle.setSpacingAfter(10);
        document.add(sectionTitle);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        addTableRow(table, "Booking Type", receiptRequest.getBookingType());
        addTableRow(table, "Court Name", receiptRequest.getCourtName());
        addTableRow(table, "Location", receiptRequest.getLocation());
        addTableRow(table, "Date", receiptRequest.getDate());
        addTableRow(table, "Time", receiptRequest.getStartTime() + " - " + receiptRequest.getEndTime());
        addTableRow(table, "Duration", receiptRequest.getDuration() + " hour(s)");
        addTableRow(table, "Number of Players", receiptRequest.getNumberOfPlayers().toString());
        
        if (receiptRequest.getNumPaddles() != null && receiptRequest.getNumPaddles() > 0) {
            addTableRow(table, "Paddles Rented", receiptRequest.getNumPaddles() + " (RM5 each)");
        }
        
        if (receiptRequest.getBuyBallSet() != null && receiptRequest.getBuyBallSet()) {
            addTableRow(table, "Ball Set", "Yes (RM12)");
        }
        
        document.add(table);
        document.add(new Paragraph(" ")); // Spacing
    }
    
    private void addPaymentDetails(Document document, ReceiptRequestDto receiptRequest) throws Exception {
        Font sectionFont = new Font(Font.HELVETICA, 14, Font.BOLD);
        Paragraph sectionTitle = new Paragraph("PAYMENT DETAILS", sectionFont);
        sectionTitle.setSpacingAfter(10);
        document.add(sectionTitle);
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        
        addTableRow(table, "Payment Method", receiptRequest.getPaymentMethod());
        addTableRow(table, "Payment Status", receiptRequest.getPaymentStatus());
        
        // Add cost breakdown for court bookings
        if ("COURT_BOOKING".equals(receiptRequest.getBookingType())) {
            double courtRental = receiptRequest.getOriginalAmount() != null ? receiptRequest.getOriginalAmount() : receiptRequest.getTotalAmount();
            double paddleCost = receiptRequest.getNumPaddles() != null ? receiptRequest.getNumPaddles() * 5.0 : 0.0;
            double ballSetCost = receiptRequest.getBuyBallSet() != null && receiptRequest.getBuyBallSet() ? 12.0 : 0.0;
            
            addTableRow(table, "Court Rental", "RM" + String.format("%.2f", courtRental));
            if (paddleCost > 0) {
                addTableRow(table, "Paddles (" + receiptRequest.getNumPaddles() + ")", "RM" + String.format("%.2f", paddleCost));
            }
            if (ballSetCost > 0) {
                addTableRow(table, "Ball Set", "RM" + String.format("%.2f", ballSetCost));
            }
        }
        
        if (receiptRequest.getVoucherCode() != null && !receiptRequest.getVoucherCode().isEmpty()) {
            addTableRow(table, "Voucher Applied", receiptRequest.getVoucherCode());
        }
        
        if (receiptRequest.getOriginalAmount() != null && receiptRequest.getOriginalAmount() > receiptRequest.getTotalAmount()) {
            addTableRow(table, "Original Amount", "RM" + String.format("%.2f", receiptRequest.getOriginalAmount()));
            addTableRow(table, "Discount Amount", "-RM" + String.format("%.2f", receiptRequest.getDiscountAmount()));
        }
        
        Font totalFont = new Font(Font.HELVETICA, 12, Font.BOLD);
        addTableRow(table, "Total Amount", "RM" + String.format("%.2f", receiptRequest.getTotalAmount()), totalFont);
        
        if (receiptRequest.getPointsEarned() != null && receiptRequest.getPointsEarned() > 0) {
            addTableRow(table, "Points Earned", "+" + receiptRequest.getPointsEarned());
        }
        
        document.add(table);
    }
    
    private void addFooter(Document document) throws Exception {
        document.add(new Paragraph(" ")); // Spacing
        
        Font footerFont = new Font(Font.HELVETICA, 10, Font.ITALIC);
        Paragraph footer = new Paragraph("Thank you for choosing our pickleball courts!", footerFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        footer.setSpacingAfter(10);
        document.add(footer);
        
        Paragraph contact = new Paragraph("For any questions, please contact our support team.", footerFont);
        contact.setAlignment(Element.ALIGN_CENTER);
        document.add(contact);
    }
    
    private void addTableRow(PdfPTable table, String label, String value) {
        addTableRow(table, label, value, new Font(Font.HELVETICA, 10, Font.NORMAL));
    }
    
    private void addTableRow(PdfPTable table, String label, String value, Font font) {
        PdfPCell labelCell = new PdfPCell(new Phrase(label, font));
        PdfPCell valueCell = new PdfPCell(new Phrase(value, font));
        
        labelCell.setBorder(Rectangle.NO_BORDER);
        valueCell.setBorder(Rectangle.NO_BORDER);
        
        table.addCell(labelCell);
        table.addCell(valueCell);
    }
}
