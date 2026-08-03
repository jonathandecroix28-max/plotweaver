package com.plotweaver.plotweaver_api.modules.chapter;

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
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/chapters")
@Tag(name = "Chapters", description = "API pour gérer les chapitres")
public class ChapterController {
    
    private final ChapterService chapterService;

    public ChapterController(ChapterService chapterService) {
        this.chapterService = chapterService;
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les chapitres", description = "Récupère la liste de tous les chapitres enregistrés.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des chapitres récupérée", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ChapterResponse.class)), examples = @ExampleObject(value = "[{\"id\":1,\"title\":\"Chapitre 1\",\"content\":\"Il etait une fois...\",\"chapter_number\":1,\"book_id\":1,\"book_title\":\"Mon Premier Roman\",\"created_at\":\"2026-08-03T12:41:04\",\"updated_at\":\"2026-08-03T12:41:04\"}]"))),
            @ApiResponse(responseCode = "500", description = "Erreur serveur")
        })
    public ResponseEntity<List<ChapterResponse>> getAllChapters() {
        List<Chapter> chapters = chapterService.getAllChapters();
        return ResponseEntity.ok(chapterService.toResponseList(chapters));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un chapitre par ID", description = "Récupère un chapitre spécifique par son identifiant unique.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapitre trouvé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterResponse.class))),
            @ApiResponse(responseCode = "404", description = "Chapitre introuvable")
        })
        public ResponseEntity<ChapterResponse> getChapterById(
            @Parameter(description = "ID du chapitre", example = "1") @PathVariable Long id) {
        return chapterService.getChapterById(id)
                .map(chapterService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/title/{title}")
    @Operation(summary = "Récupérer un chapitre par titre", description = "Récupère un chapitre en cherchant par son titre exact.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapitre trouvé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterResponse.class))),
            @ApiResponse(responseCode = "404", description = "Chapitre introuvable")
        })
        public ResponseEntity<ChapterResponse> getChapterByTitle(
            @Parameter(description = "Titre exact du chapitre", example = "Chapitre 1") @PathVariable String title) {
        return chapterService.getChapterByTitle(title)
                .map(chapterService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/book/{bookId}")
    @Operation(summary = "Récupérer les chapitres d'un livre", description = "Récupère tous les chapitres rattachés à un livre spécifique via son ID.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapitres du livre récupérés", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = ChapterResponse.class)))),
            @ApiResponse(responseCode = "404", description = "Livre introuvable ou sans chapitre")
        })
        public ResponseEntity<List<ChapterResponse>> getChaptersByBookId(
            @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        List<Chapter> chapters = chapterService.getChaptersByBookId(bookId);
        return ResponseEntity.ok(chapterService.toResponseList(chapters));
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau chapitre", description = "Crée un nouveau chapitre et l'associe à un livre existant.")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Données du chapitre à créer", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterUpsertRequest.class), examples = @ExampleObject(name = "create-chapter", value = "{\"title\":\"Chapitre 1\",\"content\":\"Il etait une fois...\",\"chapter_number\":1,\"book_id\":1}")))
        @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Chapitre créé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterResponse.class))),
            @ApiResponse(responseCode = "400", description = "Payload invalide"),
            @ApiResponse(responseCode = "404", description = "Livre associé introuvable"),
            @ApiResponse(responseCode = "409", description = "Conflit - Chapitre avec le même numéro déjà existant pour ce livre"),
            @ApiResponse(responseCode = "500", description = "Erreur serveur")
        })
    public ResponseEntity<ChapterResponse> createChapter(@RequestBody ChapterUpsertRequest chapterRequest) {
        Chapter createdChapter = chapterService.createChapter(chapterRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(chapterService.toResponse(createdChapter));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un chapitre", description = "Met à jour le contenu, le titre ou le livre d'un chapitre existant.")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Nouvelles données du chapitre", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterUpsertRequest.class), examples = @ExampleObject(name = "update-chapter", value = "{\"title\":\"Chapitre 1 - Revision\",\"content\":\"Version corrigee du chapitre\",\"chapter_number\":1,\"book_id\":1}")))
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Chapitre mis à jour", content = @Content(mediaType = "application/json", schema = @Schema(implementation = ChapterResponse.class))),
            @ApiResponse(responseCode = "404", description = "Chapitre introuvable")
        })
        public ResponseEntity<ChapterResponse> updateChapter(
            @Parameter(description = "ID du chapitre", example = "1") @PathVariable Long id,
            @RequestBody ChapterUpsertRequest chapterDetails) {
        return chapterService.getChapterById(id)
                .map(existingChapter -> {
                    Chapter updatedChapter = chapterService.updateChapter(existingChapter, chapterDetails);
                    return ResponseEntity.ok(chapterService.toResponse(updatedChapter));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un chapitre", description = "Supprime définitivement un chapitre par son identifiant.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Chapitre supprimé"),
            @ApiResponse(responseCode = "404", description = "Chapitre introuvable")
        })
        public ResponseEntity<Void> deleteChapter(
            @Parameter(description = "ID du chapitre", example = "1") @PathVariable Long id) {
        if (chapterService.getChapterById(id).isPresent()) {
            chapterService.deleteChapter(id);
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}