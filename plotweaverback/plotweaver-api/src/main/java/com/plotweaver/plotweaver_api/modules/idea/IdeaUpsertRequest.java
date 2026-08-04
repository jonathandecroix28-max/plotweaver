package com.plotweaver.plotweaver_api.modules.idea;

import com.fasterxml.jackson.annotation.JsonAlias;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "IdeaUpsertRequest", description = "Payload de creation ou mise a jour d'une idée")
public class IdeaUpsertRequest {
    
    @Schema(description = "Nom de l'idée", example = "Idée 1")
    private String name;

    @Schema(description = "Description de l'idée", example = "Ceci est une idée")
    private String description;

    @Schema(description = "Identifiant du livre associé", example = "1")
    @JsonAlias({"book_id", "bookId"})
    private Long bookId;

    @Schema(description = "Identifiant de la catégorie associée", example = "1")
    @JsonAlias({"category_id", "categoryId"})
    private Long categoryId;
}