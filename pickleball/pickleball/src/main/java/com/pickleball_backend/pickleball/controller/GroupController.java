package com.pickleball_backend.pickleball.controller;

import com.pickleball_backend.pickleball.entity.*;
import com.pickleball_backend.pickleball.service.GroupService;
import com.pickleball_backend.pickleball.service.EmailService;
import com.pickleball_backend.pickleball.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@Slf4j
public class GroupController {

    private final GroupService groupService;
    private final EmailService emailService;
    private final UserRepository userRepository;

    // Create a new group
    @PostMapping("/create")
    public ResponseEntity<?> createGroup(@RequestBody CreateGroupRequest request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Group group = groupService.createGroup(
                request.getGroupName(),
                request.getDescription(),
                currentUser,
                request.getMemberUsernames()
            );

            return ResponseEntity.ok(Map.of(
                "message", "Group created successfully",
                "group", group
            ));
        } catch (Exception e) {
            log.error("Error creating group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to create group",
                "message", e.getMessage()
            ));
        }
    }

    // Get user's groups
    @GetMapping("/my-groups")
    public ResponseEntity<?> getUserGroups(Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Group> groups = groupService.getUserGroups(currentUser.getId());
            return ResponseEntity.ok(groups);
        } catch (Exception e) {
            log.error("Error fetching user groups: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch groups",
                "message", e.getMessage()
            ));
        }
    }

    // Get group by ID
    @GetMapping("/{groupId}")
    public ResponseEntity<?> getGroupById(@PathVariable Long groupId, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!groupService.isUserMemberOfGroup(groupId, currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Access denied",
                    "message", "You are not a member of this group"
                ));
            }

            Group group = groupService.getGroupById(groupId);
            return ResponseEntity.ok(group);
        } catch (Exception e) {
            log.error("Error fetching group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch group",
                "message", e.getMessage()
            ));
        }
    }

    // Get group members
    @GetMapping("/{groupId}/members")
    public ResponseEntity<?> getGroupMembers(@PathVariable Long groupId, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!groupService.isUserMemberOfGroup(groupId, currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Access denied",
                    "message", "You are not a member of this group"
                ));
            }

            List<GroupMember> members = groupService.getGroupMembers(groupId);
            return ResponseEntity.ok(members);
        } catch (Exception e) {
            log.error("Error fetching group members: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch group members",
                "message", e.getMessage()
            ));
        }
    }

    // Add member to group
    @PostMapping("/{groupId}/members")
    public ResponseEntity<?> addMemberToGroup(@PathVariable Long groupId, @RequestBody AddMemberRequest request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            groupService.addMemberToGroup(groupId, request.getUsername(), currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Member added successfully"));
        } catch (Exception e) {
            log.error("Error adding member to group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to add member",
                "message", e.getMessage()
            ));
        }
    }

    // Remove member from group
    @DeleteMapping("/{groupId}/members/{username}")
    public ResponseEntity<?> removeMemberFromGroup(@PathVariable Long groupId, @PathVariable String username, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            groupService.removeMemberFromGroup(groupId, username, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Member removed successfully"));
        } catch (Exception e) {
            log.error("Error removing member from group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to remove member",
                "message", e.getMessage()
            ));
        }
    }

    // Get group messages
    @GetMapping("/{groupId}/messages")
    public ResponseEntity<?> getGroupMessages(@PathVariable Long groupId, 
                                            @RequestParam(defaultValue = "0") int page,
                                            @RequestParam(defaultValue = "50") int size,
                                            Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            if (!groupService.isUserMemberOfGroup(groupId, currentUser.getId())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Access denied",
                    "message", "You are not a member of this group"
                ));
            }

            List<GroupMessage> messages = groupService.getGroupMessages(groupId, page, size);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            log.error("Error fetching group messages: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to fetch messages",
                "message", e.getMessage()
            ));
        }
    }

    // Send message to group
    @PostMapping("/{groupId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long groupId, @RequestBody SendMessageRequest request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            GroupMessage message = groupService.sendMessage(groupId, request.getContent(), request.getImageUrl(), currentUser.getId());
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            log.error("Error sending message: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to send message",
                "message", e.getMessage()
            ));
        }
    }

    // Mark messages as read
    @PostMapping("/{groupId}/messages/read")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable Long groupId, @RequestBody MarkAsReadRequest request, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            groupService.markMessagesAsRead(groupId, currentUser.getId(), request.getLastReadMessageId());
            return ResponseEntity.ok(Map.of("message", "Messages marked as read"));
        } catch (Exception e) {
            log.error("Error marking messages as read: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to mark messages as read",
                "message", e.getMessage()
            ));
        }
    }

    // Delete group
    @DeleteMapping("/{groupId}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long groupId, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            groupService.deleteGroup(groupId, currentUser.getId());
            return ResponseEntity.ok(Map.of("message", "Group deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting group: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to delete group",
                "message", e.getMessage()
            ));
        }
    }

    // Search groups
    @GetMapping("/search")
    public ResponseEntity<?> searchGroups(@RequestParam String query, Authentication authentication) {
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            List<Group> userGroups = groupService.searchUserGroups(query, currentUser.getId());
            return ResponseEntity.ok(userGroups);
        } catch (Exception e) {
            log.error("Error searching groups: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of(
                "error", "Failed to search groups",
                "message", e.getMessage()
            ));
        }
    }

    // Legacy endpoint for backward compatibility
    @PostMapping("/send-invitations")
    public ResponseEntity<Map<String, Object>> sendGroupInvitations(
            @RequestBody GroupInvitationRequest request,
            Authentication authentication) {
        
        try {
            String currentUsername = authentication.getName();
            User currentUser = userRepository.findByUserAccount_Username(currentUsername)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            int emailsSent = 0;
            int emailsFailed = 0;
            List<String> failedEmails = new java.util.ArrayList<>();

            for (String memberUsername : request.getMemberUsernames()) {
                try {
                    User member = userRepository.findByUserAccount_Username(memberUsername)
                            .orElse(null);
                    
                    if (member != null && member.getEmail() != null && !member.getEmail().trim().isEmpty()) {
                        emailService.sendGroupInvitationEmail(
                                member.getEmail(),
                                request.getGroupName(),
                                currentUser.getName() != null ? currentUser.getName() : currentUser.getUserAccount().getUsername(),
                                currentUser.getUserAccount().getUsername()
                        );
                        emailsSent++;
                        log.info("Group invitation email sent to: {}", member.getEmail());
                    } else {
                        emailsFailed++;
                        failedEmails.add(memberUsername);
                        log.warn("Failed to send invitation to {}: User not found or no email", memberUsername);
                    }
                } catch (Exception e) {
                    emailsFailed++;
                    failedEmails.add(memberUsername);
                    log.error("Failed to send group invitation email to {}: {}", memberUsername, e.getMessage());
                }
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Group invitations processed",
                    "emailsSent", emailsSent,
                    "emailsFailed", emailsFailed,
                    "failedEmails", failedEmails
            ));

        } catch (Exception e) {
            log.error("Error sending group invitations: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                    "error", "Failed to send group invitations",
                    "message", e.getMessage()
            ));
        }
    }

    // Request/Response classes
    public static class CreateGroupRequest {
        private String groupName;
        private String description;
        private List<String> memberUsernames;

        public String getGroupName() { return groupName; }
        public void setGroupName(String groupName) { this.groupName = groupName; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public List<String> getMemberUsernames() { return memberUsernames; }
        public void setMemberUsernames(List<String> memberUsernames) { this.memberUsernames = memberUsernames; }
    }

    public static class AddMemberRequest {
        private String username;
        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
    }

    public static class SendMessageRequest {
        private String content;
        private String imageUrl;
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }

    public static class MarkAsReadRequest {
        private Long lastReadMessageId;
        public Long getLastReadMessageId() { return lastReadMessageId; }
        public void setLastReadMessageId(Long lastReadMessageId) { this.lastReadMessageId = lastReadMessageId; }
    }

    public static class GroupInvitationRequest {
        private String groupName;
        private List<String> memberUsernames;

        public String getGroupName() { return groupName; }
        public void setGroupName(String groupName) { this.groupName = groupName; }
        public List<String> getMemberUsernames() { return memberUsernames; }
        public void setMemberUsernames(List<String> memberUsernames) { this.memberUsernames = memberUsernames; }
    }
}
