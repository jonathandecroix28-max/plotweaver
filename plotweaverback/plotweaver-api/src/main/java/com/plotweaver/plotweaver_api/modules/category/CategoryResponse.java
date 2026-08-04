package com.plotweaver.plotweaver_api.modules.category;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(name = "CategoryResponse", description = "Reponse API d'une catégorie")
public class CategoryResponse {

    @Schema(description = "Identifiant de la catégorie", example = "1")
    final private Long id;

    @Schema(description = "Nom de la catégorie", example = "Fantasy")
    final private String name;

    @Schema(description = "Couleur de la catégorie", example = "#FF5733")
    final private String color;

    @Schema(description = "Identifiant du livre associé", example = "1")
    final private Long bookId;

    @Schema(description = "Date de création", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @Schema(description = "Date de dernière modification", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;
}