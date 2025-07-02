package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JoinRequestDto {
    private Integer id;
    private LocalDateTime requestDate;
    private String status;
    private String rejectionReason;
    private Integer memberId;
    private Integer matchId;
}
