package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Group;
import com.pickleball_backend.pickleball.entity.GroupMember;
import com.pickleball_backend.pickleball.entity.GroupMessage;
import com.pickleball_backend.pickleball.entity.User;

import java.util.List;

public interface GroupService {
    
    // Group management
    Group createGroup(String name, String description, User creator, List<String> memberUsernames);
    Group getGroupById(Long groupId);
    List<Group> getUserGroups(Integer userId);
    Group updateGroup(Long groupId, String name, String description);
    void deleteGroup(Long groupId, Integer userId);
    
    // Member management
    void addMemberToGroup(Long groupId, String username, Integer userId);
    void removeMemberFromGroup(Long groupId, String username, Integer userId);
    void makeMemberAdmin(Long groupId, String username, Integer userId);
    void removeMemberAdmin(Long groupId, String username, Integer userId);
    List<GroupMember> getGroupMembers(Long groupId);
    boolean isUserMemberOfGroup(Long groupId, Integer userId);
    boolean isUserCreatorOfGroup(Long groupId, Integer userId);
    boolean isUserAdminOfGroup(Long groupId, Integer userId);
    
    // Message management
    GroupMessage sendMessage(Long groupId, String content, String imageUrl, Integer senderId);
    List<GroupMessage> getGroupMessages(Long groupId, int page, int size);
    void markMessagesAsRead(Long groupId, Integer userId, Long lastReadMessageId);
    void deleteMessage(Long messageId, Integer userId);
    void editMessage(Long messageId, String newContent, Integer userId);
    
    // Search
    List<Group> searchGroups(String searchTerm);
    List<Group> searchUserGroups(String searchTerm, Integer userId);
}
