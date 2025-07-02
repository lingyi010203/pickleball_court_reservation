package com.pickleball_backend.pickleball.config;

import com.pickleball_backend.pickleball.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.*;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.*;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Content-Disposition"));
        configuration.setExposedHeaders(Arrays.asList("Authorization", "Content-Type", "Content-Disposition"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/health").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/ws/**", "/ws-message/**", "/websocket/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()

                        // Tier Management Endpoints
                        .requestMatchers(HttpMethod.POST, "/api/admin/tiers").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/*/vouchers").hasAuthority("ROLE_ADMIN")

                        // Existing Admin Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/admin/dashboard/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/courts").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/courts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/courts/*/pricing").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/courts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/admin/courts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/courts").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/courts/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/courts/*/analytics").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/tiers").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/*/vouchers").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/tiers").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/slots").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/cancellation-requests/pending").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/cancellation-requests/*/process").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/cancellation-requests/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/dashboard/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/users").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/users").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/users/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/admin/users/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/admin/users/batch-status").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/admin/moderation/feedback/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/admin/moderation/feedback/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin/moderation/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/admin/register-from-invite").permitAll()                        
						.requestMatchers(HttpMethod.GET, "/api/member/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/member/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/member/bookings").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/bookings").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/bookings/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/member/bookings/*/cancel").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/dashboard").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/tiers").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/dashboard").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/tiers").hasAuthority("ROLE_USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/courts").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/courts/{id}").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available/grouped").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/redeem-history").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/member/wallet/topup").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/wallet/balance").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/wallet").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/member/wallet/init").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/member/courts/*/pricing").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/user/reviewable-items").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/profile/upload-documents").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/profile/user-type").authenticated()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feedback").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feedback/stats").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/feedback").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/feedback/**").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/feedback/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers("/api/auth/verify").permitAll()
                        // General Admin Access
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        // User Endpoints
                        .requestMatchers("/api/profile").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/profile/photo").authenticated()
                        .requestMatchers("/api/preferences").authenticated()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/users/friend-request").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/users/accept-friend").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/users/friend-requests").authenticated()
                        .requestMatchers("/api/friends/**").authenticated()
                        .requestMatchers("/api/users/search").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/friends/request").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/friends/accept/{requestId}").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/messages/**").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/messages/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/messages/history").authenticated()
                        .requestMatchers("/api/messages/upload").authenticated()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/helpdesk/ask").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/helpdesk/escalate/**").hasRole("USER")

                        // Event browsing endpoints - accessible to all authenticated users
                        .requestMatchers(HttpMethod.GET, "/api/events/browse").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/upcoming").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/friendly-matches").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/tournaments").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/leagues").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/type/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/skill/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/types").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/skill-levels").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/stats").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/*/details").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/events/published").authenticated()
                        
                        // Event management endpoints - restricted to EVENTORGANIZER
                        .requestMatchers(HttpMethod.POST, "/api/events").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.POST, "/api/events/*/publish").hasRole("EVENTORGANIZER")

                        .requestMatchers(HttpMethod.POST, "/api/event-registration/register").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/event-registration/cancel/**").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/event-registration/is-registered/**").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/friendly-matches").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/friendly-matches/*/join").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/friendly-matches/*/approve/*").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/friendly-matches/*/cancel").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/friendly-matches/open").permitAll()

                        .requestMatchers(HttpMethod.GET, "/api/coach/schedule").hasRole("COACH")
                        .requestMatchers(HttpMethod.POST, "/api/coach/schedule").hasRole("COACH")
                        .requestMatchers(HttpMethod.PUT, "/api/coach/schedule/**").hasRole("COACH")
                        .requestMatchers(HttpMethod.DELETE, "/api/coach/schedule/**").hasRole("COACH")

                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

}