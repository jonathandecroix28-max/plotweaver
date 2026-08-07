package com.plotweaver.plotweaver_api.modules.book;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

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

    @Schema(description = "Image de couverture du livre", example = "https://example.com/cover.jpg")
    private final String coverImage;

    @Schema(description = "Date de creation", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Date de derniere mise a jour", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Nombre de chapitres", example = "2")
    final private Integer chapterCount;
}