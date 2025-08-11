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
public class UserTypeChangeRequestDto {
    private Integer id;
    private Integer userId;
    private String userName;
    private String userEmail;
    private String currentUserType;
    private String requestedUserType;
    private String requestReason;
    private UserTypeChangeRequest.RequestStatus status;
    private String adminNotes;
    private String processedBy;
    private LocalDateTime processedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Additional fields for enhanced display
    private String userProfileImage;
    private String userPhone;
    private LocalDateTime userCreatedAt;
    private Integer userBookingCount;
    private Double userTotalSpent;
    
    public static UserTypeChangeRequestDto fromEntity(UserTypeChangeRequest entity) {
        return UserTypeChangeRequestDto.builder()
                .id(entity.getId())
                .userId(entity.getUser().getId())
                .userName(entity.getUser().getName())
                .userEmail(entity.getUser().getEmail())
                .currentUserType(entity.getCurrentUserType())
                .requestedUserType(entity.getRequestedUserType())
                .requestReason(entity.getRequestReason())
                .status(entity.getStatus())
                .adminNotes(entity.getAdminNotes())
                .processedBy(entity.getProcessedBy())
                .processedAt(entity.getProcessedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .userProfileImage(entity.getUser().getProfileImage())
                .userPhone(entity.getUser().getPhone())
                .userCreatedAt(entity.getUser().getCreatedAt())
                .build();
    }
}
