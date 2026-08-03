package com.plotweaver.plotweaver_api.modules.book;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


@Service
public class BookService {

    private static final int MAX_TITLE_LENGTH = 255;
    private static final int MAX_DESCRIPTION_LENGTH = 1_000;

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public List<Book> getAllBooks() {
        return bookRepository.findAll();
    }

    public Optional<Book> getBookById(Long id) {
        requirePositiveId(id, "book_id");
        return bookRepository.findById(id);
    }

    public Optional<Book> getBookByTitle(String title) {
        String normalizedTitle = normalizeTitle(title);

        if (!bookRepository.existsByTitle(normalizedTitle)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable");
        }
        return bookRepository.findByTitle(normalizedTitle);
    }

    public Book createBook(BookUpsertRequest request) {
        BookUpsertRequest validRequest = validateAndNormalizeRequest(request);

        if (bookRepository.existsByTitle(validRequest.getTitle())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un livre avec ce titre existe deja");
        }

        Book book = Book.builder()
                .title(validRequest.getTitle())
                .description(validRequest.getDescription())
                .build();

        return bookRepository.save(book);
    }

    public Book updateBook(Book book, BookUpsertRequest request) {
        if (book == null || book.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable");
        }

        BookUpsertRequest validRequest = validateAndNormalizeRequest(request);
        boolean changingTitle = !book.getTitle().equals(validRequest.getTitle());
        if (changingTitle && bookRepository.existsByTitle(validRequest.getTitle())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un autre livre avec ce titre existe deja");
        }

        book.setTitle(validRequest.getTitle());
        book.setDescription(validRequest.getDescription());

        return bookRepository.save(book);
    }

    public void deleteBook(Long id) {
        requirePositiveId(id, "book_id");
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable"));
        bookRepository.delete(book);
    }

    public BookResponse toResponse(Book book) {
        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .description(book.getDescription())
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .chapterCount(book.getChapterCount())
                .build();
    }

    public List<BookResponse> toResponseList(List<Book> books) {
        return books.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private BookUpsertRequest validateAndNormalizeRequest(BookUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le payload est obligatoire");
        }

        String normalizedTitle = normalizeTitle(request.getTitle());
        String normalizedDescription = normalizeDescription(request.getDescription());

        request.setTitle(normalizedTitle);
        request.setDescription(normalizedDescription);
        return request;
    }

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le titre est obligatoire");
        }

        String normalizedTitle = title.trim();
        if (normalizedTitle.length() > MAX_TITLE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le titre du livre ne peut pas depasser " + MAX_TITLE_LENGTH + " caracteres");
        }

        return normalizedTitle;
    }

    private String normalizeDescription(String description) {
        if (description == null) {
            return null;
        }

        String normalizedDescription = description.trim();
        if (normalizedDescription.length() > MAX_DESCRIPTION_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "La description ne peut pas depasser " + MAX_DESCRIPTION_LENGTH + " caracteres");
        }

        return normalizedDescription;
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " doit etre strictement positif");
        }
    }
}