package com.plotweaver.plotweaver_api.modules.idea.version;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/idea-versions")
@Tag(name = "Idea Versions", description = "API pour gérer l'historique des versions d'idées")
public class IdeaVersionController {

    private final IdeaVersionService ideaVersionService;

    public IdeaVersionController(IdeaVersionService ideaVersionService) {
        this.ideaVersionService = ideaVersionService;
    }

    @GetMapping
    @Operation(summary = "Récupérer toutes les versions d'idées")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaVersionResponse.class))))
    })
    public ResponseEntity<List<IdeaVersionResponse>> getAllIdeaVersions() {
        List<IdeaVersion> versions = ideaVersionService.getAllIdeaVersions();
        return ResponseEntity.ok(ideaVersionService.toResponseList(versions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une version d'idée par ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaVersionResponse.class))),
        @ApiResponse(responseCode = "404", description = "Version introuvable")
    })
    public ResponseEntity<IdeaVersionResponse> getIdeaVersionById(
        @Parameter(description = "ID de la version", example = "1") @PathVariable Long id) {
        return ideaVersionService.getIdeaVersionById(id)
                .map(ideaVersionService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/idea/{ideaId}")
    @Operation(summary = "Récupérer toutes les versions d'une idée spécifique")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaVersionResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Idée introuvable")
    })
    public ResponseEntity<List<IdeaVersionResponse>> getVersionsByIdeaId(
        @Parameter(description = "ID de l'idée", example = "1") @PathVariable Long ideaId) {
        List<IdeaVersion> versions = ideaVersionService.getVersionsByIdeaId(ideaId);
        return ResponseEntity.ok(ideaVersionService.toResponseList(versions));
    }

    @GetMapping("/idea/{ideaId}/version/{versionNumber}")
    @Operation(summary = "Récupérer une version précise d'une idée via son numéro")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaVersionResponse.class))),
        @ApiResponse(responseCode = "404", description = "Idée ou version introuvable")
    })
    public ResponseEntity<IdeaVersionResponse> getVersionByIdeaIdAndNumber(
        @Parameter(description = "ID de l'idée", example = "1") @PathVariable Long ideaId,
        @Parameter(description = "Numéro de version", example = "1") @PathVariable Integer versionNumber) {
        return ideaVersionService.getVersionByIdeaIdAndNumber(ideaId, versionNumber)
                .map(ideaVersionService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    @Operation(summary = "Créer une version d'idée")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Version créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaVersionResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Idée introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Numéro de version déjà existant pour cette idée")
    })
    public ResponseEntity<IdeaVersionResponse> createIdeaVersion(@RequestBody IdeaVersionUpsertRequest request) {
        IdeaVersion created = ideaVersionService.createIdeaVersion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ideaVersionService.toResponse(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une version d'idée")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version mise à jour avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaVersionResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Version ou idée introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Numéro de version déjà existant")
    })
    public ResponseEntity<IdeaVersionResponse> updateIdeaVersion(
        @Parameter(description = "ID de la version à modifier", example = "1") @PathVariable Long id,
        @RequestBody IdeaVersionUpsertRequest request) {
        IdeaVersion updated = ideaVersionService.updateIdeaVersion(id, request);
        return ResponseEntity.ok(ideaVersionService.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une version d'idée")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Version supprimée avec succès"),
        @ApiResponse(responseCode = "404", description = "Version introuvable")
    })
    public ResponseEntity<Void> deleteIdeaVersion(
        @Parameter(description = "ID de la version à supprimer", example = "1") @PathVariable Long id) {
        ideaVersionService.deleteIdeaVersion(id);
        return ResponseEntity.noContent().build();
    }
}