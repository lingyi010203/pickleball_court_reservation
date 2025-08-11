package com.pickleball_backend.pickleball.security;

import com.pickleball_backend.pickleball.entity.UserAccount;
import com.pickleball_backend.pickleball.repository.UserAccountRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserAccountRepository userAccountRepository;

    @Override
    public UserDetails loadUserByUsername(String usernameOrEmail) throws UsernameNotFoundException {
        UserAccount account = userAccountRepository.findByUsername(usernameOrEmail)
                .or(() -> userAccountRepository.findByUser_Email(usernameOrEmail))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        // Get userType from associated User entity
        String userType = account.getUser().getUserType();

        List<GrantedAuthority> authorities = new ArrayList<>();
        if ("EventOrganizer".equalsIgnoreCase(account.getUser().getUserType())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_EVENTORGANIZER"));
            authorities.add(new SimpleGrantedAuthority("ROLE_USER")); // EventOrganizer 也應該有USER權限
        }
        if ("Admin".equalsIgnoreCase(account.getUser().getUserType())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
        }
        if ("Member".equalsIgnoreCase(account.getUser().getUserType()) || "USER".equalsIgnoreCase(account.getUser().getUserType())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }
        if ("Coach".equalsIgnoreCase(account.getUser().getUserType())) {
            authorities.add(new SimpleGrantedAuthority("ROLE_COACH"));
            authorities.add(new SimpleGrantedAuthority("ROLE_USER")); // 教練也應該有USER權限
        }

        return new org.springframework.security.core.userdetails.User(
                account.getUsername(),
                account.getPassword(),
                !account.getStatus().equals("DELETED"),  // enabled
                true,                                     // account non-expired
                true,                                     // credentials non-expired
                !account.isLocked(),                      // account non-locked
                authorities
        );
    }
}