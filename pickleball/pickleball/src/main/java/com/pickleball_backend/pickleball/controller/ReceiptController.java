package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.service.ReceiptService;
import com.pickleball_backend.pickleball.dto.ReceiptRequestDto;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;

@RestController
@RequestMapping("/api/receipt")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;

    @PostMapping("/generate")
    public ResponseEntity<byte[]> generateReceipt(@RequestBody ReceiptRequestDto receiptRequest) {
        try {
            ByteArrayOutputStream pdfStream = receiptService.generateReceiptPdf(receiptRequest);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "receipt_" + receiptRequest.getBookingId() + "_" + 
                receiptRequest.getBookingDate().substring(0, 10) + ".pdf");
            
            return ResponseEntity.ok()
                .headers(headers)
                .body(pdfStream.toByteArray());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
