package com.plotweaver.plotweaver_api.modules.chapter.version;

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
@RequestMapping("/api/chapter-versions")
@Tag(name = "Chapter Versions", description = "API pour gérer l'historique des versions de chapitres")
public class ChapterVersionController {

    private final ChapterVersionService chapterVersionService;

    public ChapterVersionController(ChapterVersionService chapterVersionService) {
        this.chapterVersionService = chapterVersionService;
    }

    @GetMapping
    @Operation(summary = "Récupérer toutes les versions de chapitres", description = "Renvoie la liste complète de toutes les versions enregistrées.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ChapterVersionResponse.class)))),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<ChapterVersionResponse>> getAllChapterVersions() {
        List<ChapterVersion> versions = chapterVersionService.getAllChapterVersions();
        return ResponseEntity.ok(chapterVersionService.toResponseList(versions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une version de chapitre par ID", description = "Recherche et renvoie une version spécifique grâce à son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterVersionResponse.class))),
        @ApiResponse(responseCode = "404", description = "Version introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<ChapterVersionResponse> getChapterVersionById(
        @Parameter(description = "ID de la version", example = "1") @PathVariable Long id) {
        return chapterVersionService.getChapterVersionById(id)
                .map(chapterVersionService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/chapter/{chapterId}")
    @Operation(summary = "Récupérer toutes les versions d'un chapitre", description = "Renvoie l'historique de toutes les versions associées à un chapitre spécifique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ChapterVersionResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Chapitre introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<ChapterVersionResponse>> getVersionsByChapterId(
        @Parameter(description = "ID du chapitre", example = "1") @PathVariable Long chapterId) {
        List<ChapterVersion> versions = chapterVersionService.getVersionsByChapterId(chapterId);
        return ResponseEntity.ok(chapterVersionService.toResponseList(versions));
    }

    @GetMapping("/chapter/{chapterId}/version/{versionNumber}")
    @Operation(summary = "Récupérer une version précise d'un chapitre", description = "Recherche une version spécifique d'un chapitre grâce à son numéro de version.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterVersionResponse.class))),
        @ApiResponse(responseCode = "404", description = "Chapitre ou version introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<ChapterVersionResponse> getVersionByChapterIdAndNumber(
        @Parameter(description = "ID du chapitre", example = "1") @PathVariable Long chapterId,
        @Parameter(description = "Numéro de version", example = "1") @PathVariable Integer versionNumber) {
        return chapterVersionService.getVersionByChapterIdAndNumber(chapterId, versionNumber)
                .map(chapterVersionService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    @Operation(summary = "Créer une version de chapitre", description = "Enregistre une nouvelle version pour un chapitre donné.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Version créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterVersionResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Chapitre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une version avec ce numéro existe déjà pour ce chapitre"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<ChapterVersionResponse> createChapterVersion(@RequestBody ChapterVersionUpsertRequest request) {
        ChapterVersion created = chapterVersionService.createChapterVersion(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(chapterVersionService.toResponse(created));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une version de chapitre", description = "Met à jour une version existante à partir de son identifiant.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Version mise à jour avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterVersionResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Version ou chapitre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Une autre version avec ce numéro existe déjà"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<ChapterVersionResponse> updateChapterVersion(
        @Parameter(description = "ID de la version à modifier", example = "1") @PathVariable Long id,
        @RequestBody ChapterVersionUpsertRequest request) {
        ChapterVersion updated = chapterVersionService.updateChapterVersion(id, request);
        return ResponseEntity.ok(chapterVersionService.toResponse(updated));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une version de chapitre", description = "Supprime définitivement une version de chapitre grâce à son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Version supprimée avec succès"),
        @ApiResponse(responseCode = "404", description = "Version introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<Void> deleteChapterVersion(
        @Parameter(description = "ID de la version à supprimer", example = "1") @PathVariable Long id) {
        chapterVersionService.deleteChapterVersion(id);
        return ResponseEntity.noContent().build();
    }
}