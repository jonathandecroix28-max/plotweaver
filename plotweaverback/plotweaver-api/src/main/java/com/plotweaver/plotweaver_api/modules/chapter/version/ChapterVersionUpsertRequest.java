package com.plotweaver.plotweaver_api.modules.chapter.version;

import com.fasterxml.jackson.annotation.JsonAlias;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "ChapterVersionUpsertRequest", description = "Payload de creation ou mise a jour d'une version de chapitre")
public class ChapterVersionUpsertRequest {
    
    @Schema(description = "Identifiant du chapitre associé", example = "1")
    @JsonAlias({"chapter_id", "chapterId"})
    private Long chapterId;

    @Schema(description = "Numero de version du chapitre", example = "1")
    @JsonAlias({"version_number", "versionNumber"})
    private Integer versionNumber;

    @Schema(description = "Nom de la version du chapitre", example = "Version 1")
    private String name;

    @Schema(description = "Contenu de la version du chapitre", example = "Ceci est une version de chapitre")
    private String content;
}