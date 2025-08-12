package com.pickleball_backend.pickleball.dto;

import com.pickleball_backend.pickleball.entity.JoinRequest;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class JoinRequestResponseDto {
    private Integer id;
    private String status;
    private LocalDateTime requestTime;
    private Integer memberId;
    private String memberName;
    private String username;
    private Integer matchId;
    
    public static JoinRequestResponseDto fromEntity(JoinRequest joinRequest) {
        JoinRequestResponseDto dto = new JoinRequestResponseDto();
        dto.setId(joinRequest.getId());
        dto.setStatus(joinRequest.getStatus() != null ? joinRequest.getStatus().name() : null);
        dto.setRequestTime(joinRequest.getRequestTime());
        
        // Safely extract member information
        if (joinRequest.getMember() != null) {
            dto.setMemberId(joinRequest.getMember().getId());
            
            if (joinRequest.getMember().getUser() != null) {
                dto.setMemberName(joinRequest.getMember().getUser().getName());
                
                if (joinRequest.getMember().getUser().getUserAccount() != null) {
                    dto.setUsername(joinRequest.getMember().getUser().getUserAccount().getUsername());
                }
            }
        }
        
        // Safely extract match information
        if (joinRequest.getFriendlyMatch() != null) {
            dto.setMatchId(joinRequest.getFriendlyMatch().getId());
        }
        
        return dto;
    }
}
