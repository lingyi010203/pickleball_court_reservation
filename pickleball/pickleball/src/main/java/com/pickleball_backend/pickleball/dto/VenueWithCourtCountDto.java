package com.pickleball_backend.pickleball.dto;

import lombok.Data;

@Data
public class VenueWithCourtCountDto {
    private Integer id;
    private String name;
    private String location;
    private String state;
    private String description;
    private Boolean isArchived;
    private Integer courtCount;
    
    public VenueWithCourtCountDto(Integer id, String name, String location, String state, 
                                 String description, Boolean isArchived, Integer courtCount) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.state = state;
        this.description = description;
        this.isArchived = isArchived;
        this.courtCount = courtCount;
    }
}


