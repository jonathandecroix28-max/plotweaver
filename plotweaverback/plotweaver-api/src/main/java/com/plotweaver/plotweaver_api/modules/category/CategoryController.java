package com.plotweaver.plotweaver_api.modules.category;

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
@RequestMapping("/api/categories")
@Tag(name = "Categories", description = "API pour gérer les catégories globales par utilisateur")
public class CategoryController {
    
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Récupérer toutes les catégories", description = "Renvoie la liste complète des catégories de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = CategoryResponse.class)))),
        @ApiResponse(responseCode = "400", description = "Header X-Device-ID manquant"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<CategoryResponse>> getAllCategories(
        @RequestHeader("X-Device-ID") String ownerId) {
        List<Category> categories = categoryService.getAllCategories(ownerId);
        return ResponseEntity.ok(categoryService.toResponseList(categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une catégorie par ID", description = "Recherche une catégorie spécifique de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable"),
        @ApiResponse(responseCode = "400", description = "Header X-Device-ID manquant")
    })
    public ResponseEntity<CategoryResponse> getCategoryById(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long id,
        @RequestHeader("X-Device-ID") String ownerId) {
        return categoryService.getCategoryById(id, ownerId)
                .map(categoryService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Récupérer une catégorie par Nom", description = "Recherche une catégorie par son nom pour l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    public ResponseEntity<CategoryResponse> getCategoryByName(
        @Parameter(description = "Nom de la catégorie", example = "fantasy") @PathVariable String name,
        @RequestHeader("X-Device-ID") String ownerId) {
        return categoryService.getCategoryByName(name, ownerId)
                .map(categoryService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/color/{color}")
    @Operation(summary = "Récupérer les catégories par Couleur", description = "Recherche les catégories par code couleur pour l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = CategoryResponse.class))))
    })
    public ResponseEntity<List<CategoryResponse>> getCategoriesByColor(
        @Parameter(description = "Code couleur", example = "#FF5733") @PathVariable String color,
        @RequestHeader("X-Device-ID") String ownerId) {
        List<Category> categories = categoryService.getCategoriesByColor(color, ownerId);
        return ResponseEntity.ok(categoryService.toResponseList(categories));
    }

    @PostMapping
    @Operation(summary = "Créer une nouvelle catégorie", description = "Crée une nouvelle catégorie liée à l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Catégorie créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "409", description = "Conflit - Nom ou Couleur déjà existant(e)")
    })
    public ResponseEntity<CategoryResponse> createCategory(
        @RequestBody CategoryUpsertRequest request,
        @RequestHeader("X-Device-ID") String ownerId) {
        Category createdCategory = categoryService.createCategory(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.toResponse(createdCategory));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une catégorie", description = "Met à jour une catégorie de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Mise à jour réussie", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Nom ou Couleur déjà existant(e)")
    })
    public ResponseEntity<CategoryResponse> updateCategory(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long id,
        @RequestBody CategoryUpsertRequest request,
        @RequestHeader("X-Device-ID") String ownerId) {
        Category updatedCategory = categoryService.updateCategory(id, request, ownerId);
        return ResponseEntity.ok(categoryService.toResponse(updatedCategory));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une catégorie", description = "Supprime une catégorie de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Suppression réussie"),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    public ResponseEntity<Void> deleteCategory(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long id,
        @RequestHeader("X-Device-ID") String ownerId) {
        categoryService.deleteCategory(id, ownerId);
        return ResponseEntity.noContent().build();
    }
}