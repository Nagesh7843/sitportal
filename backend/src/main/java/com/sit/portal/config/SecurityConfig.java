package com.sit.portal.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.http.HttpMethod;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers(
                    "/",
                    "/index.html",
                    "/assets/**",
                    "/favicon.ico",
                    "/sw.js",
                    "/manifest.json",
                    "/syllabus/**",
                    "/*.js",
                    "/*.css",
                    "/*.png",
                    "/*.jpg",
                    "/*.jpeg",
                    "/*.svg",
                    "/*.ico",
                    "/*.json"
                ).permitAll()
                // Public auth, notifications, public landing data
                .requestMatchers("/api/v1/auth/**", "/api/v1/push/**", "/api/v1/notifications/**").permitAll()
                .requestMatchers("/api/v1/notices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/settings/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/courses/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/laboratories/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/research-labs/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/faculty/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/students/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/organization/**", "/api/organization/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/documents/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/analytics/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/questions/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/questions/**").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/api/v1/questions/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/academic-calendars/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/scheduler/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/scraper/notices/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/news-events/**").permitAll()
                .requestMatchers("/api/v1/placements/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/v1/activities/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/activities/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/email/contact-faculty").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/v1/notices/*/read").permitAll()
                .requestMatchers("/api/v1/users/**").permitAll()
                .requestMatchers("/api/audit-logs/**", "/api/v1/audit/**").hasAnyRole("ADMIN", "HOD")
                .requestMatchers(HttpMethod.PUT, "/api/v1/students/change-requests/*/verify").hasAnyRole("ADMIN", "HOD")
                // Protected mutations
                .requestMatchers("/api/v1/**").authenticated()
                .anyRequest().permitAll()
            )
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> 
                    response.sendError(HttpServletResponse.SC_UNAUTHORIZED, authException.getMessage())
                )
            );

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @org.springframework.beans.factory.annotation.Value("${app.cors.allowed-origins:http://localhost:3000,http://127.0.0.1:3000,https://sitcoe.ac.in,*}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(Arrays.asList(
                "http://localhost:[*]",
                "http://127.0.0.1:[*]",
                "https://*.vercel.app",
                "https://*.onrender.com",
                "https://sitportal.vercel.app",
                "https://sitportal.onrender.com",
                "https://sitcoe.ac.in",
                "*"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "X-Requested-With", "Accept", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
