package com.pickleball_backend.pickleball.dto;

public class UserSearchDto {
    private Integer id;
    private String username;
    private String name;
    private String profileImage;

    public UserSearchDto() {}

    public UserSearchDto(Integer id, String username, String name, String profileImage) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.profileImage = profileImage;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProfileImage() {
        return profileImage;
    }

    public void setProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }
} 