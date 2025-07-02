package com.pickleball_backend.pickleball.dto;
import lombok.*;

import java.util.List;

@Data
public class UserStatusUpdateDto {
    private List<Integer> userIds;
    private String status;
    // getters & setters
}