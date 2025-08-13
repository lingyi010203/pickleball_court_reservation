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
                        .requestMatchers(HttpMethod.POST, "/api/admin/register").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/admin/login").permitAll()
                        
                        // 允许公开访问球场图片
                        
                        // Public court access for unauthenticated users
                        .requestMatchers(HttpMethod.GET, "/api/courts").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courts/{id}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courts/booked").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courts/available").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courts/{id}/images").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/courts/public/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/admin/courts/public/**").permitAll()
                        
                        // Public event access for unauthenticated users
                        .requestMatchers(HttpMethod.GET, "/api/events/upcoming").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/browse").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/{id}/details").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/type/{eventType}").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/friendly-matches").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/tournaments").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/leagues").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/types").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/events/stats").permitAll()
                        
                        // Public friendly match access for unauthenticated users
                        .requestMatchers(HttpMethod.GET, "/api/friendly-matches/open").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/friendly-matches/all").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/friendly-matches/invitations").permitAll()

                        // Public venue access for unauthenticated users
                        .requestMatchers(HttpMethod.GET, "/api/venues").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/venues/bystate").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/venues/check-availability").permitAll()
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
                        .requestMatchers(HttpMethod.POST, "/api/admin/register-from-invite").permitAll()
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available").hasAnyRole("USER", "ADMIN")
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
                        .requestMatchers(HttpMethod.GET, "/api/member/courts").hasAnyRole("USER", "EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/courts/{id}").hasAnyRole("USER", "EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available").hasAnyRole("USER", "ADMIN","EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available/grouped").hasAnyRole("USER", "EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/available-range").hasAnyRole("USER", "EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/slots/all").hasAnyRole("USER", "EVENTORGANIZER")
                        .requestMatchers(HttpMethod.GET, "/api/member/redeem-history").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/user/reviewable-items").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/feedback").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feedback/stats").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/feedback/user").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/feedback/reviewable-items").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/feedback").hasRole("USER")
                        .requestMatchers(HttpMethod.PUT, "/api/feedback/**").hasRole("USER")
                        .requestMatchers(HttpMethod.DELETE, "/api/feedback/**").hasAnyRole("USER", "ADMIN")
                        .requestMatchers(HttpMethod.POST, "/api/helpdesk/ask").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/helpdesk/escalate/**").hasRole("USER")
                        .requestMatchers(HttpMethod.GET, "/api/helpdesk/queries").hasRole("USER")
                        .requestMatchers(HttpMethod.POST, "/api/contact/submit").permitAll()
                        .requestMatchers("/api/auth/verify").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/receipt/generate").authenticated()

                        // Admin public endpoints (must come before general admin rule)
                        .requestMatchers("/api/admin/courts/public/**").permitAll()
                        .requestMatchers("/api/admin/venues/public/**").permitAll()

                        // General Admin Access
                        .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")

                        .requestMatchers(HttpMethod.POST, "/api/coach/recurring-sessions").hasAuthority("ROLE_COACH")
                        .requestMatchers(HttpMethod.POST, "/api/coach/courses/**").hasAuthority("ROLE_COACH")
                        .requestMatchers("/api/coach/**").hasAuthority("ROLE_COACH")

                        // Event Organizer Endpoints
                        .requestMatchers("/api/event-organizer/**").hasRole("EVENTORGANIZER")
                        .requestMatchers("/api/events/organizer/**").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.POST, "/api/events").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.PUT, "/api/events/**").hasRole("EVENTORGANIZER")
                        .requestMatchers(HttpMethod.DELETE, "/api/events/**").hasRole("EVENTORGANIZER")
                        .requestMatchers("/api/event-registration/**").hasAnyRole("USER", "EVENTORGANIZER")

                        // User Endpoints
                        .requestMatchers("/api/profile").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/profile/photo").authenticated()
                        .requestMatchers("/api/preferences").authenticated()
                        .requestMatchers("/error").permitAll()
                        .requestMatchers("/ws/**").permitAll()
                        .anyRequest().authenticated()
                )
                .sessionManagement(sess -> sess.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}