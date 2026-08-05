package com.plotweaver.plotweaver_api.modules.idea.version;

import com.fasterxml.jackson.annotation.JsonAlias;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Schema(name = "IdeaVersionUpsertRequest", description = "Payload de creation ou mise a jour d'une version d'idée")
public class IdeaVersionUpsertRequest {
    
    @Schema(description = "Identifiant de l'idée associée", example = "1")
    @JsonAlias({"idea_id", "ideaId"})
    private Long ideaId;

    @Schema(description = "Numero de version de l'idée", example = "1")
    @JsonAlias({"version_number", "versionNumber"})
    private Integer versionNumber;

    @Schema(description = "Nom de la version de l'idée", example = "Version 1")
    private String name;

    @Schema(description = "Description de la version de l'idée", example = "Ceci est une version d'idée")
    private String description;
}