package com.pickleball_backend.pickleball.config;

import com.pickleball_backend.pickleball.security.JwtAuthFilter;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtAuthFilter jwtAuthFilter;

    public JwtChannelInterceptor(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String token = accessor.getFirstNativeHeader("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
                if (jwtAuthFilter.isValid(token)) {
                    Authentication auth = jwtAuthFilter.getAuthentication(token);
                    SecurityContextHolder.getContext().setAuthentication(auth);
                    accessor.setUser(auth);
                }
            }
        }
        return message;
    }
}