package com.plotweaver.plotweaver_api.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

    @Value("${upload.dir:uploads}")
    private String uploadDir;

    public String storeFile(MultipartFile file) throws IOException {
        Path rootLocation = Paths.get(uploadDir);
        if (!Files.exists(rootLocation)) {
            Files.createDirectories(rootLocation);
        }

        String fileName = UUID.randomUUID().toString() + "_" + 
                         System.currentTimeMillis() + "_" + 
                         file.getOriginalFilename().replaceAll("[^a-zA-Z0-9.-]", "_");
        
        Path destinationFile = rootLocation.resolve(Paths.get(fileName))
                .normalize().toAbsolutePath();
        
        Files.copy(file.getInputStream(), destinationFile, StandardCopyOption.REPLACE_EXISTING);

        return fileName;
    }
}