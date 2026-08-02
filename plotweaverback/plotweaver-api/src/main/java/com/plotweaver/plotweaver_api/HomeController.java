package com.plotweaver.plotweaver_api;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
            "app", "PlotWeaver API",
            "status", "Running",
            "message", "Welcome to the PlotWeaver backend API!"
        );
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of(
            "status", "UP"
        );
    }

    @GetMapping("/info")
    public Map<String, String> info() {
        return Map.of(
            "app", "PlotWeaver API",
            "version", "1.0.0",
            "description", "Backend API for the PlotWeaver application"
        );
    }
}