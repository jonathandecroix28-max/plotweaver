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
@Tag(name = "Categories", description = "API pour gérer les catégories")
public class CategoryController {
    
    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }


    @GetMapping
    @Operation(summary = "Récupérer toutes les catégories", description = "Renvoie la liste complète de toutes les catégories enregistrées.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des catégories récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = CategoryResponse.class)))),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<CategoryResponse>> getAllCategories() {
        List<Category> categories = categoryService.getAllCategories();
        return ResponseEntity.ok(categoryService.toResponseList(categories));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer une catégorie par ID", description = "Recherche et renvoie une catégorie spécifique grâce à son identifiant unique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable"),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<CategoryResponse> getCategoryById(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long id) {
        return categoryService.getCategoryById(id)
                .map(categoryService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/name/{name}")
    @Operation(summary = "Récupérer une catégorie par Nom", description = "Recherche une catégorie globale selon son nom.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    public ResponseEntity<CategoryResponse> getCategoryByName(
        @Parameter(description = "Nom de la catégorie", example = "fantasy") @PathVariable String name) {
        return categoryService.getCategoryByName(name)
                .map(categoryService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/color/{color}")
    @Operation(summary = "Récupérer les catégories par Couleur", description = "Recherche toutes les catégories associées à un code couleur précis.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des catégories récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = CategoryResponse.class))))
    })
    public ResponseEntity<List<CategoryResponse>> getCategoriesByColor(
        @Parameter(description = "Code couleur de la catégorie", example = "#FF5733") @PathVariable String color) {
        List<Category> categories = categoryService.getCategoriesByColor(color);
        return ResponseEntity.ok(categoryService.toResponseList(categories));
    }

   

    @GetMapping("/book/{bookId}")
    @Operation(summary = "Récupérer les catégories d'un livre", description = "Renvoie la liste des catégories associées à un livre spécifique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des catégories récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = CategoryResponse.class)))),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<List<CategoryResponse>> getCategoriesByBookId(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        List<Category> categories = categoryService.getCategoriesByBookId(bookId);
        return ResponseEntity.ok(categoryService.toResponseList(categories));
    }

    @GetMapping("/book/{bookId}/count")
    @Operation(summary = "Compter les catégories d'un livre", description = "Renvoie le nombre total de catégories enregistrées pour un livre donné.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Total calculé avec succès"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<Long> countCategoriesForBook(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        return ResponseEntity.ok(categoryService.countCategoriesForBook(bookId));
    }

    @GetMapping("/book/{bookId}/category/{id}")
    @Operation(summary = "Récupérer le détail d'une catégorie d'un livre", description = "Recherche une catégorie précise via son ID liée à un livre spécifique.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable pour ce livre")
    })
    public ResponseEntity<CategoryResponse> getCategoryDetails(
        @Parameter(description = "ID de la catégorie", example = "1") @PathVariable Long id,
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        Category category = categoryService.getCategoryDetails(id, bookId);
        return ResponseEntity.ok(categoryService.toResponse(category));
    }

    @GetMapping("/book/{bookId}/name/{name}")
    @Operation(summary = "Récupérer une catégorie par nom pour un livre", description = "Recherche une catégorie par son nom dans le contexte d'un livre.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie trouvée", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable pour ce livre")
    })
    public ResponseEntity<CategoryResponse> getCategoryByNameInBook(
        @Parameter(description = "Nom de la catégorie", example = "fantasy") @PathVariable String name,
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId) {
        return categoryService.getCategoryByNameInBook(name, bookId)
                .map(categoryService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/book/{bookId}/exists/{name}")
    @Operation(summary = "Vérifier l'existence d'une catégorie dans un livre", description = "Indique par un booléen si une catégorie existe pour ce livre.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Vérification effectuée avec succès")
    })
    public ResponseEntity<Boolean> checkIfCategoryExists(
        @Parameter(description = "ID du livre", example = "1") @PathVariable Long bookId,
        @Parameter(description = "Nom de la catégorie", example = "fantasy") @PathVariable String name) {
        return ResponseEntity.ok(categoryService.checkIfCategoryExists(bookId, name));
    }


    @PostMapping
    @Operation(summary = "Créer une nouvelle catégorie", description = "Crée une nouvelle catégorie et l'associe à un livre.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Catégorie créée avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Nom ou Couleur déjà existant(e) pour ce livre")
    })
    public ResponseEntity<CategoryResponse> createCategory(@RequestBody CategoryUpsertRequest request) {
        Category createdCategory = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.toResponse(createdCategory));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour une catégorie", description = "Met à jour une catégorie existante.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Catégorie mise à jour avec succès", content = @Content(mediaType = "application/json", schema = @Schema(implementation = CategoryResponse.class))),
        @ApiResponse(responseCode = "400", description = "Requête invalide"),
        @ApiResponse(responseCode = "404", description = "Catégorie ou livre introuvable"),
        @ApiResponse(responseCode = "409", description = "Conflit - Nom ou Couleur déjà existant(e)")
    })
    public ResponseEntity<CategoryResponse> updateCategory(
        @Parameter(description = "ID de la catégorie à modifier", example = "1") @PathVariable Long id,
        @RequestBody CategoryUpsertRequest request) {
        Category updatedCategory = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(categoryService.toResponse(updatedCategory));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer une catégorie", description = "Supprime définitivement une catégorie grâce à son identifiant.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Catégorie supprimée avec succès"),
        @ApiResponse(responseCode = "404", description = "Catégorie introuvable")
    })
    public ResponseEntity<Void> deleteCategory(
        @Parameter(description = "ID de la catégorie à supprimer", example = "1") @PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}