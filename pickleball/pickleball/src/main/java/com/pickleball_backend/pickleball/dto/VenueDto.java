package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class VenueDto {
    private Integer id;
    private String name;
    private String address;
    private String description;
}
