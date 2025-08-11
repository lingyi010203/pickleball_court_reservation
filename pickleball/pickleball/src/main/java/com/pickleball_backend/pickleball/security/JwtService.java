package com.pickleball_backend.pickleball.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {
    private final String SECRET = "picSecKey123picSecKey123picSecKey123";
    private final SecretKey key = Keys.hmacShaKeyFor(Decoders.BASE64.decode(java.util.Base64.getEncoder().encodeToString(SECRET.getBytes())));

    public String generateToken(String subject, String role) {
        String cleanedRole = role.toUpperCase().replace("ROLE_", "");
        return Jwts.builder()
                .subject(subject)
                .claim("role", cleanedRole)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public String generateTokenWithUserId(String subject, String role, Integer userId) {
        String cleanedRole = role.toUpperCase().replace("ROLE_", "");
        // 從 role 中提取原始的 userType（移除 ROLE_ 前綴，但保持原始大小寫）
        String originalUserType = role.replace("ROLE_", "");
        
        // 將 userType 轉換為正確的格式
        String userType;
        if ("EVENTORGANIZER".equalsIgnoreCase(originalUserType)) {
            userType = "EventOrganizer";
        } else if ("COACH".equalsIgnoreCase(originalUserType)) {
            userType = "Coach";
        } else if ("ADMIN".equalsIgnoreCase(originalUserType)) {
            userType = "Admin";
        } else {
            userType = originalUserType;
        }
        
        return Jwts.builder()
                .subject(subject)
                .claim("role", cleanedRole)
                .claim("userType", userType) // 使用正確格式的 userType
                .claim("userId", userId)
                .claim("username", subject) // 添加 username 聲明
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 24))
                .signWith(key, Jwts.SIG.HS256)
                .compact();
    }

    public String extractUsername(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload().getSubject();
    }

    public boolean isValid(String token) {
        try {
            extractUsername(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public String extractRole(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String role = claims.get("role", String.class);
        return role != null ? role.toUpperCase() : null;
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

}