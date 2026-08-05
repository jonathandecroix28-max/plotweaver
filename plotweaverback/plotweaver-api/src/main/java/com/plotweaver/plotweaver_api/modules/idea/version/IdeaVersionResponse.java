package com.plotweaver.plotweaver_api.modules.idea.version;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(name = "IdeaVersionResponse", description = "Reponse API d'une version d'idée")
public class IdeaVersionResponse {

    @Schema(description = "Identifiant de la version d'idée", example = "1")
    final private Long id;

    @Schema(description = "Identifiant de l'idée associée", example = "1")
    final private Long ideaId;

    @Schema(description = "Numero de version de l'idée", example = "1")
    final private Integer versionNumber;

    @Schema(description = "Nom de la version de l'idée", example = "Version 1")
    final private String name;

    @Schema(description = "Description de la version de l'idée", example = "Ceci est une version d'idée")
    final private String description;

    @Schema(description = "Date de création", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @Schema(description = "Date de dernière modification", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;
}