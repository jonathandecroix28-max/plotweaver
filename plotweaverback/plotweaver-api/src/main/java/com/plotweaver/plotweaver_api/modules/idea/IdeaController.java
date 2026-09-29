package com.plotweaver.plotweaver_api.modules.idea;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
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
@RequestMapping("/api/ideas")
@Tag(name = "Ideas", description = "API pour gérer les idées par utilisateur")
public class IdeaController {

    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @GetMapping
    @Operation(summary = "Récupérer toutes les idées", description = "Renvoie la liste complète des idées de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "400", description = "Header X-Device-ID manquant"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<IdeaResponse>> getAllIdeas(
        @RequestHeader("X-Device-ID") String ownerId) {
        List<Idea> ideas = ideaService.getAllIdeas(ownerId);
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une idée par ID", description = "Recherche une idée spécifique de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Idée trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "404", description = "Idée introuvable"),
        @ApiResponse(responseCode = "400", description = "Header X-Device-ID manquant")
    })
    public ResponseEntity<IdeaResponse> getIdeaById(
        @Parameter(description = "ID de l'idée", example = "1") @PathVariable Long id,
        @RequestHeader("X-Device-ID") String ownerId) {
        return ideaService.getIdeaById(id, ownerId)
                .map(ideaService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/book/{bookId}")
    @Operation(summary = "Récupérer les idées d'un livre", description = "Renvoie la liste des idées associées à un livre de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Livre introuvable"),
        @ApiResponse(responseCode = "400", description = "Header X-Device-ID manquant")
    })
    public ResponseEntity<List<IdeaResponse>> getIdeasByBookId(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId,
        @RequestHeader("X-Device-ID") String ownerId) {
        List<Idea> ideas = ideaService.getIdeasByBookId(bookId, ownerId);
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }

    @GetMapping("/book/{bookId}/count")
    @Operation(summary = "Compter les idées d'un livre", description = "Renvoie le nombre total d'idées d'un livre pour l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Total calculé avec succès"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<Long> countIdeasForBook(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId,
        @RequestHeader("X-Device-ID") String ownerId) {
        return ResponseEntity.ok(ideaService.countIdeasForBook(bookId, ownerId));
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle idée", description = "Crée une nouvelle idée liée à l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Idée créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Livre ou catégorie introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une idée avec le même nom existe déjà")
    })
    public ResponseEntity<IdeaResponse> createIdea(
        @RequestBody IdeaUpsertRequest request,
        @RequestHeader("X-Device-ID") String ownerId) {
        Idea createdIdea = ideaService.createIdea(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ideaService.toResponse(createdIdea));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une idée", description = "Met à jour une idée existante de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Idée mise à jour avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Idée, livre ou catégorie introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une autre idée avec le même nom existe déjà")
    })
    public ResponseEntity<IdeaResponse> updateIdea(
        @Parameter(description = "ID de l'idée à modifier", example = "1") @PathVariable Long id,
        @RequestBody IdeaUpsertRequest request,
        @RequestHeader("X-Device-ID") String ownerId) {
        Idea updatedIdea = ideaService.updateIdea(id, request, ownerId);
        return ResponseEntity.ok(ideaService.toResponse(updatedIdea));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une idée", description = "Supprime définitivement une idée de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Idée supprimée avec succès"),
        @ApiResponse(responseCode = "404", description = "Idée introuvable")
    })
    public ResponseEntity<Void> deleteIdea(
        @Parameter(description = "ID de l'idée à supprimer", example = "1") @PathVariable Long id,
        @RequestHeader("X-Device-ID") String ownerId) {
        ideaService.deleteIdea(id, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Récupérer les idées d'une catégorie", description = "Renvoie la liste des idées associées à une catégorie pour l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    public ResponseEntity<List<IdeaResponse>> getIdeasByCategoryId(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long categoryId,
        @RequestHeader("X-Device-ID") String ownerId) {
        List<Idea> ideas = ideaService.getIdeasByCategoryId(categoryId, ownerId);
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }
}