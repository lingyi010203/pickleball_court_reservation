package com.pickleball_backend.pickleball.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FriendDto {
    private String username;
    private String name;
    private String profileImage;
}