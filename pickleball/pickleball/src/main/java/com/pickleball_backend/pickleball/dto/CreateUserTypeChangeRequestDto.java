package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateUserTypeChangeRequestDto {
    private String requestedUserType;
    private String requestReason;
}
