package com.plotweaver.plotweaver_api.modules.category;

import com.fasterxml.jackson.annotation.JsonAlias;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "CategoryUpsertRequest", description = "Payload de creation ou mise a jour d'une catégorie")
public class CategoryUpsertRequest {
    
    @Schema(description = "Nom de la catégorie", example = "Fantasy")
    private String name;

    @Schema(description = "Couleur de la catégorie", example = "#FF5733")
    private String color;

    @Schema(description = "Identifiant du livre associé", example = "1")
    @JsonAlias({"book_id", "bookId"})
    private Long bookId;
}