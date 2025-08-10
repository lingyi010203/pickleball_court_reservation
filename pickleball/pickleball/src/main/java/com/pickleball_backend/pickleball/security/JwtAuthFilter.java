package com.pickleball_backend.pickleball.security;

import com.pickleball_backend.pickleball.entity.User;
import com.pickleball_backend.pickleball.repository.UserRepository;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        System.out.println("=== JwtAuthFilter processing request ===");
        System.out.println("Request URI: " + request.getRequestURI());
        System.out.println("Authorization header: " + (authHeader != null ? authHeader.substring(0, Math.min(50, authHeader.length())) + "..." : "null"));
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("No valid Authorization header found");
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        System.out.println("JWT token extracted: " + jwt.substring(0, Math.min(50, jwt.length())) + "...");

        if (!jwtService.isValid(jwt)) {
            System.out.println("JWT token is not valid");
            filterChain.doFilter(request, response);
            return;
        }

        String username = jwtService.extractUsername(jwt);
        String role = jwtService.extractRole(jwt);
        System.out.println("Extracted username: " + username);
        System.out.println("Extracted role: " + role);

        if (username != null && role != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // 防止重复前缀
            String authority = role.startsWith("ROLE_") ? role : "ROLE_" + role;
            System.out.println("Final authority: " + authority);

            List<GrantedAuthority> authorities = Collections.singletonList(
                    new SimpleGrantedAuthority(authority)
            );

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(username, null, authorities);

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);
            System.out.println("Authentication set in SecurityContext for user: " + username);
        } else {
            System.out.println("Authentication not set. Username: " + username + ", Role: " + role + ", Existing auth: " + (SecurityContextHolder.getContext().getAuthentication() != null));
        }

        filterChain.doFilter(request, response);
    }

    public Authentication getAuthentication(String token) {
        String username = jwtService.extractUsername(token);
        String role = jwtService.extractRole(token);

        List<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority(role)
        );

        return new UsernamePasswordAuthenticationToken(username, null, authorities);
    }

    public boolean isValid(String token) {
        try {
            jwtService.extractUsername(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public User getCurrentUser(String username) {
        return userRepository.findByUserAccount_Username(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}