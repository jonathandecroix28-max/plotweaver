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
@RequestMapping("/api/books")
@Tag(name = "Books", description = "API pour gérer les livres")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    @Operation(summary = "Récupérer tous les livres", description = "Renvoie la liste complète des livres de l'appareil.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Liste des livres récupérée avec succès", content = @Content(mediaType = "application/json", array = @ArraySchema(schema = @Schema(implementation = BookResponse.class)))),
        @ApiResponse(responseCode = "500", description = "Erreur serveur")
    })
    public ResponseEntity<List<BookResponse>> getAllBooks(
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        List<Book> books = bookService.getAllBooks(ownerId);
        return ResponseEntity.ok(bookService.toResponseList(books));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Récupérer un livre par ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Livre trouvé"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<BookResponse> getBookById(
            @Parameter(description = "ID du livre", example = "1") @PathVariable Long id,
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        return bookService.getBookById(id, ownerId)
                .map(bookService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/title/{title}")
    @Operation(summary = "Récupérer un livre par titre")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Livre trouvé"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<BookResponse> getBookByTitle(
            @Parameter(description = "Titre exact", example = "Mon Roman") @PathVariable String title,
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        return bookService.getBookByTitle(title, ownerId)
                .map(bookService::toResponse)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @PostMapping
    @Operation(summary = "Créer un nouveau livre")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Livre créé"),
        @ApiResponse(responseCode = "409", description = "Conflit - Titre existant")
    })
    public ResponseEntity<BookResponse> createBook(
            @RequestBody BookUpsertRequest bookRequest,
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        Book createdBook = bookService.createBook(bookRequest, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(bookService.toResponse(createdBook));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Mettre à jour un livre")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Livre mis à jour"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<BookResponse> updateBook(
            @PathVariable Long id,
            @RequestBody BookUpsertRequest bookDetails,
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        return bookService.getBookById(id, ownerId)
                .map(existingBook -> {
                    Book updatedBook = bookService.updateBook(existingBook, bookDetails, ownerId);
                    return ResponseEntity.ok(bookService.toResponse(updatedBook));
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Supprimer un livre")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Livre supprimé"),
        @ApiResponse(responseCode = "404", description = "Livre introuvable")
    })
    public ResponseEntity<Void> deleteBook(
            @PathVariable Long id,
            @Parameter(hidden = true) @RequestHeader("X-Device-ID") String ownerId) {
        if (bookService.getBookById(id, ownerId).isPresent()) {
            bookService.deleteBook(id, ownerId);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }
}