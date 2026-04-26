package com.example.demo.config;

import com.example.demo.security.JwtAuthenticationFilter;
import java.util.List;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://localhost:5174"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtAuthenticationFilter)
            throws Exception {
        http.csrf(csrf -> csrf.disable());
        http.cors(Customizer.withDefaults());
        http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        http.authorizeHttpRequests(
                auth ->
                        auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                .permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/auth/google")
                                .permitAll()
                                .requestMatchers(HttpMethod.POST, "/api/auth/login")
                                .permitAll()
                                .requestMatchers("/ws/**")
                                .permitAll()
                                .requestMatchers("/api/notifications/admin/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/facilities/**")
                                .authenticated()
                                .requestMatchers(HttpMethod.POST, "/api/facilities/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.PUT, "/api/facilities/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.DELETE, "/api/facilities/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.GET, "/api/bookings/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.PATCH, "/api/bookings/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/tickets/**")
                                .authenticated()
                                .requestMatchers(HttpMethod.GET, "/api/tickets/**")
                                .authenticated()
                                .requestMatchers(HttpMethod.PATCH, "/api/tickets/**")
                                .hasRole("ADMIN")
                                .requestMatchers(HttpMethod.POST, "/api/tickets/*/comments")
                                .authenticated()
                                .requestMatchers(HttpMethod.GET, "/api/tickets/*/comments")
                                .authenticated()
                                .requestMatchers(HttpMethod.DELETE, "/api/comments/**")
                                .authenticated()
                                .anyRequest()
                                .authenticated());

        http.exceptionHandling(
                ex ->
                        ex.authenticationEntryPoint(
                                (request, response, authException) -> {
                                    response.setStatus(HttpStatus.UNAUTHORIZED.value());
                                    response.setContentType("text/plain;charset=UTF-8");
                                    response.getWriter().write("Unauthorized");
                                }));

        return http.build();
    }
}
