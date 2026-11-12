package com.odyssey.controller;

import com.odyssey.service.StorageService;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/storage")
public class StorageController {

    private final StorageService storageService;

    public StorageController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<List<String>> uploadFiles(@RequestParam("images") List<MultipartFile> files) {
        List<String> fileUrls = storageService.storeFiles(files);
        return ResponseEntity.ok(fileUrls);
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        Path fileStorageLocation = storageService.getFileStorageLocation();
        try {
            if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
                return ResponseEntity.notFound().build();
            }
            Path filePath = fileStorageLocation.resolve(fileName).normalize();
            if (!filePath.startsWith(fileStorageLocation)) {
                return ResponseEntity.notFound().build();
            }
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = determineContentType(fileName);

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .cacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable())
                        // Uploaded files are served from the same origin as the API.
                        // nosniff stops a crafted file from being treated as HTML/JS.
                        .header("X-Content-Type-Options", "nosniff")
                        .header("Content-Security-Policy", "default-src 'none'; img-src 'self'")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            return ResponseEntity.badRequest().build();
        }
    }

    private String determineContentType(String fileName) {
        String lower = fileName.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
            return "image/jpeg";
        } else if (lower.endsWith(".png")) {
            return "image/png";
        } else if (lower.endsWith(".gif")) {
            return "image/gif";
        } else if (lower.endsWith(".webp")) {
            return "image/webp";
        } else {
            return "application/octet-stream";
        }
    }
}
