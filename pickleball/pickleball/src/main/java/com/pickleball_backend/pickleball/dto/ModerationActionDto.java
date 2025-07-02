package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class ModerationActionDto {
    private String action; // REMOVE, WARN, DISMISS, RESOLVE_NO_ACTION
    private String adminComment;
}