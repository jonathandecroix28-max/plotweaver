package com.plotweaver.plotweaver_api.modules.book;

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
@RequestMapping("/api/books")
@Tag(name = "Books", description = "API pour gérer les livres")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les livres", description = "Renvoie la liste complète de tous les livres enregistrés.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Liste des livres récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = BookResponse.class)), examples = @ExampleObject(value = "[{\"id\":1,\"title\":\"Mon Premier Roman\",\"description\":\"Roman fantasy en cours d'ecriture\",\"created_at\":\"2026-08-03T12:41:04\",\"updated_at\":\"2026-08-03T12:41:04\",\"chapter_count\":2}]"))),
            @ApiResponse(responseCode = "500", description = "Erreur serveur")
        })
    public ResponseEntity<List<BookResponse>> getAllBooks() {
        List<Book> books = bookService.getAllBooks();
        return ResponseEntity.ok(bookService.toResponseList(books));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un livre par ID", description = "Recherche et renvoie un livre spécifique grâce à son identifiant unique.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livre trouvé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookResponse.class), examples = @ExampleObject(value = "{\"id\":1,\"title\":\"Mon Premier Roman\",\"description\":\"Roman fantasy en cours d'ecriture\",\"created_at\":\"2026-08-03T12:41:04\",\"updated_at\":\"2026-08-03T12:41:04\",\"chapter_count\":2}"))),
            @ApiResponse(responseCode = "404", description = "Livre introuvable")
        })
        public ResponseEntity<BookResponse> getBookById(
            @Parameter(description = "ID du livre", example = "1") @PathVariable Long id) {
        return bookService.getBookById(id)
                .map(bookService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/title/{title}")
    @Operation(summary = "Récupérer un livre par titre", description = "Recherche et renvoie un livre en fonction de son titre exact.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livre trouvé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookResponse.class))),
            @ApiResponse(responseCode = "400", description = "Requête invalide"),
            @ApiResponse(responseCode = "404", description = "Livre introuvable")
        })
        public ResponseEntity<BookResponse> getBookByTitle(
            @Parameter(description = "Titre exact du livre", example = "Mon Premier Roman") @PathVariable String title) {
        return bookService.getBookByTitle(title)
                .map(bookService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau livre", description = "Enregistre un nouveau livre avec un titre et une description.")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Données du livre à créer", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookUpsertRequest.class), examples = @ExampleObject(name = "create-book", value = "{\"title\":\"Mon Premier Roman\",\"description\":\"Roman fantasy en cours d'ecriture\"}")))
        @ApiResponses(value = {
            @ApiResponse(responseCode = "201", description = "Livre créé", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookResponse.class))),
            @ApiResponse(responseCode = "400", description = "Payload invalide"),
            @ApiResponse(responseCode = "409", description = "Conflit - Titre de livre déjà existant"),
            @ApiResponse(responseCode = "500", description = "Erreur serveur")
        })
    public ResponseEntity<BookResponse> createBook(@RequestBody BookUpsertRequest bookRequest) {
        Book createdBook = bookService.createBook(bookRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.toResponse(createdBook));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un livre", description = "Modifie le titre et/ou la description d'un livre existant.")
        @io.swagger.v3.oas.annotations.parameters.RequestBody(required = true, description = "Nouvelles données du livre", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookUpsertRequest.class), examples = @ExampleObject(name = "update-book", value = "{\"title\":\"Mon Premier Roman - Edition 2\",\"description\":\"Version enrichie avec de nouveaux chapitres\"}")))
        @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Livre mis à jour", content = @Content(mediaType = "application/json", schema = @Schema(implementation = BookResponse.class))),
            @ApiResponse(responseCode = "404", description = "Livre introuvable")
        })
        public ResponseEntity<BookResponse> updateBook(
            @Parameter(description = "ID du livre", example = "1") @PathVariable Long id,
            @RequestBody BookUpsertRequest bookDetails) {
        return bookService.getBookById(id)
                .map(existingBook -> {
                    Book updatedBook = bookService.updateBook(existingBook, bookDetails);
                    return ResponseEntity.ok(bookService.toResponse(updatedBook));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un livre", description = "Supprime définitivement un livre et ses éléments associés.")
        @ApiResponses(value = {
            @ApiResponse(responseCode = "204", description = "Livre supprimé"),
            @ApiResponse(responseCode = "404", description = "Livre introuvable")
        })
        public ResponseEntity<Void> deleteBook(
            @Parameter(description = "ID du livre", example = "1") @PathVariable Long id) {
        if (bookService.getBookById(id).isPresent()) {
            bookService.deleteBook(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}