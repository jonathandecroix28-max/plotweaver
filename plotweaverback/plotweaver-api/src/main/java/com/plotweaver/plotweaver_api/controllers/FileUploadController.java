package com.plotweaver.plotweaver_api.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.plotweaver.plotweaver_api.services.FileStorageService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/files")
@Tag(name = "Fichiers", description = "Gestion des uploads médias")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    @Value("${server.base.url:http://localhost:8085}")
    private String baseUrl;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    @Operation(summary = "Uploader une image", description = "Envoie un fichier image et retourne son URL publique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Upload réussi"),
        @ApiResponse(responseCode = "400", description = "Fichier invalide"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<?> uploadFile(
            @Parameter(description = "Image à uploader") @RequestParam("file") MultipartFile file) {
        
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Veuillez sélectionner un fichier.");
        }
        
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            return ResponseEntity.badRequest().body("Seules les images sont autorisées.");
        }

        try {
            String fileName = fileStorageService.storeFile(file);
            String fileUrl = baseUrl + "/uploads/" + fileName;
            return ResponseEntity.ok(fileUrl);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Erreur lors de la sauvegarde : " + e.getMessage());
        }
    }
}