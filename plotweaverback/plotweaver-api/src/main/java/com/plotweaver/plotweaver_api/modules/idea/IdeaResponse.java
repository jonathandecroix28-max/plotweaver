package com.plotweaver.plotweaver_api.modules.idea;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(name = "IdeaResponse", description = "Reponse API d'une idée")
public class IdeaResponse {

    @Schema(description = "identifiant de l'idée", example = "1")
    final private Long id;

    @Schema(description = "Nom de l'idée", example = "Idée 1")
    final private String name;

    @Schema(description = "Description de l'idée", example = "Ceci est une idée")
    final private String description;

    @Schema(description = "Identifiant du livre associé", example = "1")
    final private Long bookId;

    @Schema(description = "Identifiant de la catégorie associée", example = "1")
    final private Long categoryId;

    @Schema(description = "Date de création", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @Schema(description = "Date de dernière modification", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;
}
