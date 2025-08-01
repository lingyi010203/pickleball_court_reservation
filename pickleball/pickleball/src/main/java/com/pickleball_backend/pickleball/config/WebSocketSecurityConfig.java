// WebSocketSecurityConfig.java
package com.pickleball_backend.pickleball.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.messaging.MessageSecurityMetadataSourceRegistry;
import org.springframework.security.config.annotation.web.socket.AbstractSecurityWebSocketMessageBrokerConfigurer;

@Configuration
public class WebSocketSecurityConfig extends AbstractSecurityWebSocketMessageBrokerConfigurer {
    @Override
    protected boolean sameOriginDisabled() {
        return true;
    }

    @Override
    protected void configureInbound(MessageSecurityMetadataSourceRegistry messages) {
        messages
                .simpDestMatchers("/app/chat.send").authenticated()
                .simpDestMatchers("/app/chat.delivered").authenticated()
                .simpDestMatchers("/app/chat.read").authenticated()
                .simpSubscribeDestMatchers("/user/queue/**").authenticated()
                .anyMessage().permitAll();
    }
}