package com.plotweaver.plotweaver_api.modules.chapter.version;

import java.time.LocalDateTime;

import com.fasterxml.jackson.annotation.JsonFormat;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;


@Getter
@Builder
@Schema(name = "ChapterVersionResponse", description = "Reponse API d'une version de chapitre")
public class ChapterVersionResponse {
    
    @Schema(description = "Identifiant de la version de chapitre", example = "1")
    final private Long id;

    @Schema(description = "Identifiant du chapitre associé", example = "1")
    final private Long chapterId;

    @Schema(description = "Numero de version du chapitre", example = "1")
    final private Integer versionNumber;

    @Schema(description = "Nom de la version du chapitre", example = "Version 1")
    final private String name;

    @Schema(description = "Contenu de la version du chapitre", example = "Ceci est une version de chapitre")
    final private String content;


    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Date de création", example = "2026-08-03T12:41:04")
    final private LocalDateTime createdAt;

    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    @Schema(description = "Date de dernière modification", example = "2026-08-03T12:41:04")
    final private LocalDateTime updatedAt;
}