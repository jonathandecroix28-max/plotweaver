package com.plotweaver.plotweaver_api.modules.book;

import java.time.LocalDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(name = "BookResponse", description = "Reponse API d'un livre")
public class BookResponse {

    @Schema(description = "Identifiant du livre", example = "1")
    final private Long id;

    @Schema(description = "Titre du livre", example = "Mon Premier Roman")
    final private String title;

    @Schema(description = "Description du livre", example = "Roman fantasy en cours d'ecriture")
    final private String description;

    @Schema(description = "Date de creation", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @Schema(description = "Date de derniere mise a jour", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;

    @Schema(description = "Nombre de chapitres", example = "2")
    final private Integer chapterCount;
}