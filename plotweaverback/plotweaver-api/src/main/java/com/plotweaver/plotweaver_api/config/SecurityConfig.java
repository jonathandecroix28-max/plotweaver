package com.plotweaver.plotweaver_api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Désactive le CSRF
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // Autorise ABSOLUMENT TOUTES les requêtes sans exception
            );

        return http.build();
    }
}