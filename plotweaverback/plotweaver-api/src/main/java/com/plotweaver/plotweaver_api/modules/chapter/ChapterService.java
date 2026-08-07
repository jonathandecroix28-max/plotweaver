package com.plotweaver.plotweaver_api.modules.chapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.book.Book;
import com.plotweaver.plotweaver_api.modules.book.BookRepository;
import com.plotweaver.plotweaver_api.security.HtmlSanitizerService; 

@Service
public class ChapterService {

    private static final int MAX_TITLE_LENGTH = 255;
    private static final int MAX_CONTENT_LENGTH = 10_000;

    private final ChapterRepository chapterRepository;
    private final BookRepository bookRepository;
    private final HtmlSanitizerService htmlSanitizerService; 

    public ChapterService(ChapterRepository chapterRepository, 
                          BookRepository bookRepository, 
                          HtmlSanitizerService htmlSanitizerService) {
        this.chapterRepository = chapterRepository;
        this.bookRepository = bookRepository;
        this.htmlSanitizerService = htmlSanitizerService;
    }

    public List<Chapter> getAllChapters() {
        return chapterRepository.findAll();
    }

    public Optional<Chapter> getChapterById(Long id) {
        requirePositiveId(id, "chapter_id");
        return chapterRepository.findById(id);
    }

    public Optional<Chapter> getChapterByTitle(String title) {
        String normalizedTitle = normalizeTitle(title);
        return chapterRepository.findByTitle(normalizedTitle);
    }

    public List<Chapter> getChaptersByBookId(Long bookId) {
        requirePositiveId(bookId, "book_id");
        if (!bookRepository.existsById(bookId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable");
        }
        return chapterRepository.findByBookId(bookId);
    }

    public Chapter createChapter(ChapterUpsertRequest request) {
        ChapterUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());

        if (chapterRepository.existsByBookIdAndChapterNumber(book.getId(), validRequest.getChapterNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un chapitre avec le même numéro existe déjà pour ce livre.");
        }

        if (chapterRepository.existsByBookIdAndTitle(book.getId(), validRequest.getTitle())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un chapitre avec le même titre existe déjà pour ce livre.");
        }

        Chapter chapter = Chapter.builder()
                .title(validRequest.getTitle())
                .content(validRequest.getContent())
                .chapterNumber(validRequest.getChapterNumber())
                .book(book)
                .build();

        return chapterRepository.save(chapter);
    }

    public Chapter updateChapter(Chapter chapter, ChapterUpsertRequest request) {
        if (chapter == null || chapter.getId() == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapitre introuvable");
        }

        ChapterUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());

        if (chapterRepository.existsByBookIdAndChapterNumberAndIdNot(book.getId(), validRequest.getChapterNumber(), chapter.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un autre chapitre avec le même numéro existe déjà pour ce livre.");
        }

        if (chapterRepository.existsByBookIdAndTitleAndIdNot(book.getId(), validRequest.getTitle(), chapter.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Un autre chapitre avec le même titre existe déjà pour ce livre.");
        }

        chapter.setTitle(validRequest.getTitle());
        chapter.setContent(validRequest.getContent());
        chapter.setChapterNumber(validRequest.getChapterNumber());
        chapter.setBook(book);

        return chapterRepository.save(chapter);
    }

    public void deleteChapter(Long id) {
        requirePositiveId(id, "chapter_id");
        Chapter chapter = chapterRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapitre introuvable"));
        chapterRepository.delete(chapter);
    }

    public ChapterResponse toResponse(Chapter chapter) {
        return ChapterResponse.builder()
                .id(chapter.getId())
                .title(chapter.getTitle())
                .content(chapter.getContent())
                .chapterNumber(chapter.getChapterNumber())
                .bookId(chapter.getBook() != null ? chapter.getBook().getId() : null)
                .bookTitle(chapter.getBook() != null ? chapter.getBook().getTitle() : null)
                .createdAt(chapter.getCreatedAt())
                .updatedAt(chapter.getUpdatedAt())
                .build();
    }

    public List<ChapterResponse> toResponseList(List<Chapter> chapters) {
        return chapters.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    private Book findBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre associe introuvable"));
    }

    private ChapterUpsertRequest validateAndNormalizeRequest(ChapterUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le payload est obligatoire");
        }
        if (request.getChapterNumber() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "chapter_number est obligatoire");
        }
        if (request.getBookId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "book_id est obligatoire");
        }
        if (request.getChapterNumber() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le numero du chapitre doit etre strictement positif");
        }
        if (request.getBookId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "book_id doit etre strictement positif");
        }

        String normalizedTitle = normalizeTitle(request.getTitle());
        String normalizedContent = normalizeContent(request.getContent());

        request.setTitle(normalizedTitle);
        request.setContent(normalizedContent);
        return request;
    }

    private String normalizeTitle(String title) {
        if (title == null || title.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le titre est obligatoire");
        }

        String normalizedTitle = title.trim();
        if (normalizedTitle.length() > MAX_TITLE_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le titre du chapitre ne peut pas depasser " + MAX_TITLE_LENGTH + " caracteres");
        }

        return normalizedTitle;
    }

    private String normalizeContent(String content) {
        if (content == null) {
            return null;
        }

        String sanitizedContent = htmlSanitizerService.sanitize(content);

        String normalizedContent = sanitizedContent.trim();
        if (normalizedContent.length() > MAX_CONTENT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Le contenu du chapitre ne peut pas depasser " + MAX_CONTENT_LENGTH + " caracteres");
        }

        return normalizedContent;
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " doit etre strictement positif");
        }
    }
}