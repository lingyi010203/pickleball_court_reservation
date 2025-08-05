package com.pickleball_backend.pickleball.dto;

import lombok.Data;
import java.util.List;

@Data
public class RegisterMultiSessionRequest {
    private List<Integer> sessionIds;
    private String paymentMethod; // "wallet" or "card"
    private Integer numPaddles;
    private Boolean buyBallSet;
} 