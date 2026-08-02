package com.plotweaver.plotweaver_api.modules.book;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;



@Entity
@Table(name = "books")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Book {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Schema(description = "Identifiant unique du livre", example = "1", accessMode = Schema.AccessMode.READ_ONLY)
    private Long id;

    @Column(nullable = false, unique = true)
    @Schema(description = "Titre du livre", example = "Mon Premier Roman")
    private String title;

    @Column(length = 1000)
    @Schema(description = "Description du livre", example = "Ceci est une description de mon premier roman.")
    private String description;

    @Column(nullable = false, updatable = false)
    @Schema(description = "Date de création du livre", example = "2024-01-01T12:00:00", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @Column(nullable = false)
    @Schema(description = "Date de dernière mise à jour du livre", example = "2024-01-01T12:00:00", accessMode = Schema.AccessMode.READ_ONLY)
    private LocalDateTime updatedAt;

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}