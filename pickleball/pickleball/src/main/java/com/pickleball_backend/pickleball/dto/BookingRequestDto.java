package com.pickleball_backend.pickleball.dto;

import lombok.Data;

import java.util.List;

@Data
public class BookingRequestDto {
    private Integer slotId;
    private List<Integer> slotIds; // 支持多 slot 合并预订
    private String purpose;
    private Integer numberOfPlayers;
    private Integer numPaddles; // 新增：租借球拍数量
    private Boolean buyBallSet; // 新增：购买球组
    private Integer durationHours;
    private boolean useWallet;
    private String paymentMethod;
    private String paymentStatus;
}