package com.plotweaver.plotweaver_api.modules.book;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "BookUpsertRequest", description = "Payload de creation ou mise a jour d'un livre")
public class BookUpsertRequest {

    @Schema(description = "Titre du livre", example = "Mon Premier Roman")
    private String title;

    @Schema(description = "Description du livre", example = "Roman fantasy en cours d'ecriture")
    private String description;
}