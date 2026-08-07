package com.plotweaver.plotweaver_api.modules.chapter;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
@Schema(name = "ChapterUpsertRequest", description = "Payload de creation ou mise a jour d'un chapitre")
public class ChapterUpsertRequest {

    @Schema(description = "Titre du chapitre", example = "Chapitre 1")
    private String title;

    @Schema(description = "Contenu du chapitre", example = "Il etait une fois...")
    private String content;

    @Schema(description = "Numero d'ordre du chapitre dans le livre", example = "1")
    private Integer chapterNumber;

    @Schema(description = "Identifiant du livre associe", example = "1")
    private Long bookId;
}