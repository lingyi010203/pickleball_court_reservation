package com.pickleball_backend.pickleball.dto;

import com.pickleball_backend.pickleball.entity.UserTypeChangeRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTypeChangeRequestFilterDto {
    private UserTypeChangeRequest.RequestStatus status;
    private String requestedUserType;
    private Integer userId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String searchTerm;
    private String sortBy;
    private String sortOrder;
}
