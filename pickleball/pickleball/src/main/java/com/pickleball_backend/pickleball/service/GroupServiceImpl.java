package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.repository.GroupRepository;
import com.pickleball_backend.pickleball.repository.GroupMemberRepository;
import com.pickleball_backend.pickleball.repository.GroupMessageRepository;
import com.pickleball_backend.pickleball.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GroupServiceImpl implements GroupService {
    
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMessageRepository groupMessageRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    
    @Override
    public Group createGroup(String name, String description, User creator, List<String> memberUsernames) {
        // Create the group
        Group group = new Group();
        group.setName(name);
        group.setDescription(description);
        group.setCreator(creator);
        group = groupRepository.save(group);
        
        // Add creator as admin member
        GroupMember creatorMember = new GroupMember();
        creatorMember.setGroup(group);
        creatorMember.setUser(creator);
        creatorMember.setIsAdmin(true);
        groupMemberRepository.save(creatorMember);
        
        // Add other members
        for (String username : memberUsernames) {
            Optional<User> userOpt = userRepository.findByUserAccount_Username(username);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                
                // Check if user is not already the creator
                if (!user.getId().equals(creator.getId())) {
                    GroupMember member = new GroupMember();
                    member.setGroup(group);
                    member.setUser(user);
                    member.setIsAdmin(false);
                    groupMemberRepository.save(member);
                    
                    // Send invitation email
                    try {
                        emailService.sendGroupInvitationEmail(
                            user.getEmail(),
                            group.getName(),
                            creator.getName() != null ? creator.getName() : creator.getUserAccount().getUsername(),
                            creator.getUserAccount().getUsername()
                        );
                    } catch (Exception e) {
                        log.error("Failed to send invitation email to {}: {}", username, e.getMessage());
                    }
                }
            }
        }
        
        return group;
    }
    
    @Override
    public Group getGroupById(Long groupId) {
        return groupRepository.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
    }
    
    @Override
    public List<Group> getUserGroups(Integer userId) {
        return groupRepository.findGroupsByUserId(userId);
    }
    
    @Override
    public Group updateGroup(Long groupId, String name, String description) {
        Group group = getGroupById(groupId);
        group.setName(name);
        group.setDescription(description);
        return groupRepository.save(group);
    }
    
    @Override
    public void deleteGroup(Long groupId, Integer userId) {
        Group group = getGroupById(groupId);
        if (!group.getCreator().getId().equals(userId)) {
            throw new RuntimeException("Only group creator can delete the group");
        }
        group.setIsActive(false);
        groupRepository.save(group);
    }
    
    @Override
    public void addMemberToGroup(Long groupId, String username, Integer userId) {
        Group group = getGroupById(groupId);
        if (!isUserCreatorOfGroup(groupId, userId) && !isUserAdminOfGroup(groupId, userId)) {
            throw new RuntimeException("Only group creator or admin can add members");
        }
        
        Optional<User> userOpt = userRepository.findByUserAccount_Username(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User user = userOpt.get();
        if (isUserMemberOfGroup(groupId, user.getId())) {
            throw new RuntimeException("User is already a member of this group");
        }
        
        GroupMember member = new GroupMember();
        member.setGroup(group);
        member.setUser(user);
        member.setIsAdmin(false);
        groupMemberRepository.save(member);
        
        // Send invitation email
        try {
            emailService.sendGroupInvitationEmail(
                user.getEmail(),
                group.getName(),
                group.getCreator().getName() != null ? group.getCreator().getName() : group.getCreator().getUserAccount().getUsername(),
                group.getCreator().getUserAccount().getUsername()
            );
        } catch (Exception e) {
            log.error("Failed to send invitation email to {}: {}", username, e.getMessage());
        }
    }
    
    @Override
    public void removeMemberFromGroup(Long groupId, String username, Integer userId) {
        Group group = getGroupById(groupId);
        if (!isUserCreatorOfGroup(groupId, userId) && !isUserAdminOfGroup(groupId, userId)) {
            throw new RuntimeException("Only group creator or admin can remove members");
        }
        
        Optional<User> userOpt = userRepository.findByUserAccount_Username(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        User userToRemove = userOpt.get();
        if (group.getCreator().getId().equals(userToRemove.getId())) {
            throw new RuntimeException("Cannot remove group creator");
        }
        
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, userToRemove.getId());
        if (memberOpt.isPresent()) {
            GroupMember member = memberOpt.get();
            member.setIsActive(false);
            groupMemberRepository.save(member);
        }
    }
    
    @Override
    public void makeMemberAdmin(Long groupId, String username, Integer userId) {
        if (!isUserCreatorOfGroup(groupId, userId)) {
            throw new RuntimeException("Only group creator can make members admin");
        }
        
        Optional<User> userOpt = userRepository.findByUserAccount_Username(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, userOpt.get().getId());
        if (memberOpt.isPresent()) {
            GroupMember member = memberOpt.get();
            member.setIsAdmin(true);
            groupMemberRepository.save(member);
        }
    }
    
    @Override
    public void removeMemberAdmin(Long groupId, String username, Integer userId) {
        if (!isUserCreatorOfGroup(groupId, userId)) {
            throw new RuntimeException("Only group creator can remove admin status");
        }
        
        Optional<User> userOpt = userRepository.findByUserAccount_Username(username);
        if (userOpt.isEmpty()) {
            throw new RuntimeException("User not found");
        }
        
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, userOpt.get().getId());
        if (memberOpt.isPresent()) {
            GroupMember member = memberOpt.get();
            member.setIsAdmin(false);
            groupMemberRepository.save(member);
        }
    }
    
    @Override
    public List<GroupMember> getGroupMembers(Long groupId) {
        return groupMemberRepository.findActiveMembersByGroupId(groupId);
    }
    
    @Override
    public boolean isUserMemberOfGroup(Long groupId, Integer userId) {
        return groupRepository.isUserMemberOfGroup(groupId, userId);
    }
    
    @Override
    public boolean isUserCreatorOfGroup(Long groupId, Integer userId) {
        return groupRepository.isUserCreatorOfGroup(groupId, userId);
    }
    
    @Override
    public boolean isUserAdminOfGroup(Long groupId, Integer userId) {
        List<GroupMember> admins = groupMemberRepository.findAdminsByGroupId(groupId);
        return admins.stream().anyMatch(admin -> admin.getUser().getId().equals(userId));
    }
    
    @Override
    public GroupMessage sendMessage(Long groupId, String content, String imageUrl, Integer senderId) {
        if (!isUserMemberOfGroup(groupId, senderId)) {
            throw new RuntimeException("User is not a member of this group");
        }
        
        Group group = getGroupById(groupId);
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new RuntimeException("User not found"));
        
        GroupMessage message = new GroupMessage();
        message.setGroup(group);
        message.setSender(sender);
        message.setContent(content);
        message.setImageUrl(imageUrl);
        message.setMessageType(imageUrl != null ? GroupMessage.MessageType.IMAGE : GroupMessage.MessageType.TEXT);
        
        return groupMessageRepository.save(message);
    }
    
    @Override
    public List<GroupMessage> getGroupMessages(Long groupId, int page, int size) {
        if (!groupRepository.existsById(groupId)) {
            throw new RuntimeException("Group not found");
        }
        
        Pageable pageable = PageRequest.of(page, size);
        return groupMessageRepository.findMessagesByGroupIdOrderByCreatedAtDesc(groupId, pageable).getContent();
    }
    
    @Override
    public void markMessagesAsRead(Long groupId, Integer userId, Long lastReadMessageId) {
        Optional<GroupMember> memberOpt = groupMemberRepository.findByGroupIdAndUserId(groupId, userId);
        if (memberOpt.isPresent()) {
            GroupMember member = memberOpt.get();
            member.setLastReadMessageId(lastReadMessageId);
            member.setUnreadCount(0);
            groupMemberRepository.save(member);
        }
    }
    
    @Override
    public void deleteMessage(Long messageId, Integer userId) {
        GroupMessage message = groupMessageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getSender().getId().equals(userId) && 
            !isUserCreatorOfGroup(message.getGroup().getId(), userId) &&
            !isUserAdminOfGroup(message.getGroup().getId(), userId)) {
            throw new RuntimeException("Only message sender, group creator, or admin can delete messages");
        }
        
        message.setIsDeleted(true);
        groupMessageRepository.save(message);
    }
    
    @Override
    public void editMessage(Long messageId, String newContent, Integer userId) {
        GroupMessage message = groupMessageRepository.findById(messageId)
            .orElseThrow(() -> new RuntimeException("Message not found"));
        
        if (!message.getSender().getId().equals(userId)) {
            throw new RuntimeException("Only message sender can edit messages");
        }
        
        message.setContent(newContent);
        message.setIsEdited(true);
        groupMessageRepository.save(message);
    }
    
    @Override
    public List<Group> searchGroups(String searchTerm) {
        return groupRepository.findGroupsByNameContaining(searchTerm);
    }
    
    @Override
    public List<Group> searchUserGroups(String searchTerm, Integer userId) {
        return groupRepository.findGroupsByNameContainingAndUserId(searchTerm, userId);
    }
}
