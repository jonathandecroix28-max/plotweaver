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
@Tag(name = "Ideas", description = "API pour gérer les idées")
public class IdeaController {

    private final IdeaService ideaService;

    public IdeaController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }



    @GetMapping
    @Operation(summary = "Récupérer toutes les idées", description = "Renvoie la liste complète de toutes les idées enregistrées.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des idées récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<IdeaResponse>> getAllIdeas() {
        List<Idea> ideas = ideaService.getAllIdeas();
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une idée par ID", description = "Recherche et renvoie une idée spécifique grâce à son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Idée trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "404", description = "Idée introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<IdeaResponse> getIdeaById(
        @Parameter(description = "ID de l'idée", example = "1") @PathVariable Long id) {
        return ideaService.getIdeaById(id)
                .map(ideaService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }


    @GetMapping("/book/{bookId}")
    @Operation(summary = "Récupérer les idées d'un livre", description = "Renvoie la liste de toutes les idées associées à un livre spécifique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des idées récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Livre introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<IdeaResponse>> getIdeasByBookId(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        List<Idea> ideas = ideaService.getIdeasByBookId(bookId);
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }

    @GetMapping("/book/{bookId}/count")
    @Operation(summary = "Compter les idées d'un livre", description = "Renvoie le nombre total d'idées enregistrées pour un livre donné.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Total calculé avec succès"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<Long> countIdeasForBook(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        return ResponseEntity.ok(ideaService.countIdeasForBook(bookId));
    }



    @PostMapping
    @Operation(summary = "Créer une nouvelle idée", description = "Crée une nouvelle idée et l'associe à un livre.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Idée créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une idée avec le même nom existe déjà pour ce livre"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<IdeaResponse> createIdea(@RequestBody IdeaUpsertRequest request) {
        Idea createdIdea = ideaService.createIdea(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ideaService.toResponse(createdIdea));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une idée", description = "Met à jour une idée existante à partir de son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Idée mise à jour avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = IdeaResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Idée ou livre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une autre idée avec le même nom existe déjà pour ce livre"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<IdeaResponse> updateIdea(
        @Parameter(description = "ID de l'idée à modifier", example = "1") @PathVariable Long id,
        @RequestBody IdeaUpsertRequest request) {
        Idea updatedIdea = ideaService.updateIdea(id, request);
        return ResponseEntity.ok(ideaService.toResponse(updatedIdea));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une idée", description = "Supprime définitivement une idée grâce à son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Idée supprimée avec succès"),
        @ApiResponse(responseCode = "404", description = "Idée introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<Void> deleteIdea(
        @Parameter(description = "ID de l'idée à supprimer", example = "1") @PathVariable Long id) {
        ideaService.deleteIdea(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/category/{categoryId}")
    @Operation(summary = "Récupérer les idées d'une catégorie", description = "Renvoie la liste de toutes les idées associées à une catégorie spécifique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des idées récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = IdeaResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<IdeaResponse>> getIdeasByCategoryId(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long categoryId) {
        List<Idea> ideas = ideaService.getIdeasByCategoryId(categoryId);
        return ResponseEntity.ok(ideaService.toResponseList(ideas));
    }
}