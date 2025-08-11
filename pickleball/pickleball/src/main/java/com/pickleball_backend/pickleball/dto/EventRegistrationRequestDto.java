package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class EventRegistrationRequestDto {
    private Integer eventId;
    private Boolean useWallet;
}
