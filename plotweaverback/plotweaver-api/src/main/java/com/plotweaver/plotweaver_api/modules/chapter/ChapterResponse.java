package com.plotweaver.plotweaver_api.modules.chapter;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@Schema(name = "ChapterResponse", description = "Reponse API d'un chapitre")
public class ChapterResponse {

    @Schema(description = "Identifiant du chapitre", example = "1")
    final private Long id;

    @Schema(description = "Titre du chapitre", example = "Chapitre 1")
    final private String title;

    @Schema(description = "Contenu du chapitre", example = "Il etait une fois...")
    final private String content;

    @Schema(description = "Numero d'ordre du chapitre dans le livre", example = "1")
    final private Integer chapterNumber;

    @Schema(description = "Identifiant du livre associe", example = "1")
    final private Long bookId;

    @Schema(description = "Titre du livre associe", example = "Mon Premier Roman")
    final private String bookTitle;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Date de creation", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;


    @Schema(description = "Date de derniere modification", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;
}