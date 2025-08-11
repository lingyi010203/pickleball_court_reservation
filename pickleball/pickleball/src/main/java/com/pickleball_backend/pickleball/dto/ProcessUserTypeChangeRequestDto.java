package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProcessUserTypeChangeRequestDto {
    private String action; // "APPROVE" or "REJECT"
    private String adminNotes;
    private String reason;
}
