package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JoinRequestDto {
    private Integer id;
    private Integer memberId;
    private String memberName;
    private String username;
    private String status;
    private LocalDateTime requestTime;
}
