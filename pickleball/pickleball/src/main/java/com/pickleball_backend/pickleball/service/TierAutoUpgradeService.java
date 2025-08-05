package com.pickleball_backend.pickleball.service;

import com.pickleball_backend.pickleball.entity.Member;
import com.pickleball_backend.pickleball.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class TierAutoUpgradeService {

    private final MemberRepository memberRepository;
    private final TierService tierService;

    /**
     * Scheduled task to check and upgrade member tiers automatically
     * Runs every hour at the start of the hour
     */
    @Scheduled(cron = "0 0 * * * *") // Every hour
    @Transactional
    public void autoUpgradeMemberTiers() {
        log.info("🔄 Starting automatic tier upgrade check...");
        
        try {
            List<Member> allMembers = memberRepository.findAll();
            int upgradedCount = 0;
            
            for (Member member : allMembers) {
                try {
                    String oldTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
                    
                    // Trigger tier recalculation
                    tierService.recalculateMemberTier(member);
                    
                    // Refresh member data
                    member = memberRepository.findByUserId(member.getUser().getId());
                    String newTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
                    
                    if (!oldTierName.equals(newTierName)) {
                        upgradedCount++;
                        log.info("🎉 Auto-upgraded member {}: {} -> {} (Points: {})", 
                                member.getUser().getEmail(), oldTierName, newTierName, member.getTierPointBalance());
                    }
                } catch (Exception e) {
                    log.error("Error upgrading tier for member {}: {}", 
                            member.getId(), e.getMessage());
                }
            }
            
            log.info("✅ Automatic tier upgrade completed. {} members upgraded.", upgradedCount);
            
        } catch (Exception e) {
            log.error("❌ Error during automatic tier upgrade: {}", e.getMessage());
        }
    }

    /**
     * Manual trigger for tier upgrade check
     */
    @Transactional
    public void manualUpgradeCheck() {
        log.info("🔄 Manual tier upgrade check triggered...");
        autoUpgradeMemberTiers();
    }

    /**
     * Check and upgrade a specific member's tier
     */
    @Transactional
    public boolean upgradeSpecificMember(Integer memberId) {
        try {
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new RuntimeException("Member not found"));
            
            String oldTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
            
            tierService.recalculateMemberTier(member);
            
            // Refresh member data
            member = memberRepository.findByUserId(member.getUser().getId());
            String newTierName = member.getTier() != null ? member.getTier().getTierName() : "NONE";
            
            if (!oldTierName.equals(newTierName)) {
                log.info("🎉 Manually upgraded member {}: {} -> {} (Points: {})", 
                        member.getUser().getEmail(), oldTierName, newTierName, member.getTierPointBalance());
                return true;
            } else {
                log.info("ℹ️ No upgrade needed for member {}: {} (Points: {})", 
                        member.getUser().getEmail(), newTierName, member.getTierPointBalance());
                return false;
            }
            
        } catch (Exception e) {
            log.error("❌ Error upgrading member {}: {}", memberId, e.getMessage());
            return false;
        }
    }
} 