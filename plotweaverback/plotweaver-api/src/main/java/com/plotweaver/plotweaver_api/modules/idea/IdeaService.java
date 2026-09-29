package com.plotweaver.plotweaver_api.modules.idea;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.book.Book;
import com.plotweaver.plotweaver_api.modules.book.BookRepository;
import com.plotweaver.plotweaver_api.modules.category.Category;
import com.plotweaver.plotweaver_api.modules.category.CategoryRepository;

@Service
public class IdeaService {

    private static final int MAX_NAME_LENGTH = 255;
    private static final int MAX_DESCRIPTION_LENGTH = 5000;

    private final IdeaRepository ideaRepository;
    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;

    public IdeaService(IdeaRepository ideaRepository, BookRepository bookRepository, CategoryRepository categoryRepository) {
        this.ideaRepository = ideaRepository;
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Idea> getAllIdeas(String ownerId) {
        validateOwnerId(ownerId);
        return ideaRepository.findByOwnerId(ownerId);
    }

    public Idea getIdeaByIdOrThrow(Long id, String ownerId) {
        requirePositiveId(id, "idea_id");
        validateOwnerId(ownerId);
        return findIdeaOrThrow(id, ownerId);
    }

    public Optional<Idea> getIdeaById(Long id, String ownerId) {
        requirePositiveId(id, "idea_id");
        validateOwnerId(ownerId);
        return ideaRepository.findByIdAndOwnerId(id, ownerId);
    }

    public List<Idea> getIdeasByBookId(Long bookId, String ownerId) {
        requirePositiveId(bookId, "book_id");
        validateOwnerId(ownerId);
        findBookOrThrow(bookId, ownerId);
        return ideaRepository.findByOwnerIdAndBookId(ownerId, bookId);
    }

    public List<Idea> getIdeasByCategoryId(Long categoryId, String ownerId) {
        requirePositiveId(categoryId, "category_id");
        validateOwnerId(ownerId);
        findCategoryOrThrow(categoryId, ownerId);
        return ideaRepository.findByOwnerIdAndCategoryId(ownerId, categoryId);
    }

    public Long countIdeasForBook(Long bookId, String ownerId) {
        requirePositiveId(bookId, "book_id");
        validateOwnerId(ownerId);
        findBookOrThrow(bookId, ownerId);
        return (long) ideaRepository.findByOwnerIdAndBookId(ownerId, bookId).size();
    }

    public Idea createIdea(IdeaUpsertRequest request, String ownerId) {
        validateOwnerId(ownerId);
        IdeaUpsertRequest validRequest = validateAndNormalizeRequest(request);
        
        Book book = null;
        if (validRequest.getBookId() != null && validRequest.getBookId() > 0) {
            book = findBookOrThrow(validRequest.getBookId(), ownerId);
        }
        
        Category category = findCategoryOrThrow(validRequest.getCategoryId(), ownerId);

        boolean nameExists = book != null 
            ? ideaRepository.existsByOwnerIdAndBookIdAndName(ownerId, book.getId(), validRequest.getName())
            : ideaRepository.existsByOwnerIdAndBookIsNullAndName(ownerId, validRequest.getName());

        if (nameExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une idée avec le même nom existe déjà.");
        }

        Idea idea = new Idea();
        idea.setName(validRequest.getName());
        idea.setDescription(validRequest.getDescription());
        idea.setStatus(validRequest.getStatus() != null ? validRequest.getStatus() : "draft");
        idea.setBook(book);
        idea.setCategory(category);
        idea.setOwnerId(ownerId);

        return ideaRepository.save(idea);
    }

    public Idea updateIdea(Long id, IdeaUpsertRequest request, String ownerId) {
        requirePositiveId(id, "idea_id");
        validateOwnerId(ownerId);
        Idea idea = findIdeaOrThrow(id, ownerId);

        IdeaUpsertRequest validRequest = validateAndNormalizeRequest(request);
        
        Book book = null;
        if (validRequest.getBookId() != null && validRequest.getBookId() > 0) {
            book = findBookOrThrow(validRequest.getBookId(), ownerId);
        }

        Category category = findCategoryOrThrow(validRequest.getCategoryId(), ownerId);

        boolean nameExists = book != null 
            ? ideaRepository.existsByOwnerIdAndBookIdAndNameAndIdNot(ownerId, book.getId(), validRequest.getName(), idea.getId())
            : ideaRepository.existsByOwnerIdAndBookIsNullAndNameAndIdNot(ownerId, validRequest.getName(), idea.getId());

        if (nameExists) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre idée avec le même nom existe déjà.");
        }

        idea.setName(validRequest.getName());
        idea.setDescription(validRequest.getDescription());
        if (validRequest.getStatus() != null) {
            idea.setStatus(validRequest.getStatus()); 
        }
        idea.setBook(book);
        idea.setCategory(category);

        return ideaRepository.save(idea);
    }

    public void deleteIdea(Long id, String ownerId) {
        requirePositiveId(id, "idea_id");
        validateOwnerId(ownerId);
        Idea idea = findIdeaOrThrow(id, ownerId);
        ideaRepository.delete(idea);
    }

    public IdeaResponse toResponse(Idea idea) {
        return IdeaResponse.builder()
                .id(idea.getId())
                .name(idea.getName())
                .description(idea.getDescription())
                .status(idea.getStatus() != null ? idea.getStatus() : "draft") 
                .bookId(idea.getBook() != null ? idea.getBook().getId() : null)
                .categoryId(idea.getCategory() != null ? idea.getCategory().getId() : null)
                .createdAt(idea.getCreatedAt())
                .updatedAt(idea.getUpdatedAt())
                .build();
    }

    public List<IdeaResponse> toResponseList(List<Idea> ideas) {
        return ideas.stream()
                .map(this::toResponse)
                .toList();
    }

    private IdeaUpsertRequest validateAndNormalizeRequest(IdeaUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le corps de la requête est vide.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom de l'idée est requis.");
        }
        if (request.getName().length() > MAX_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom ne doit pas dépasser " + MAX_NAME_LENGTH + " caractères.");
        }
        if (request.getDescription() != null && request.getDescription().length() > MAX_DESCRIPTION_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le contenu ne doit pas dépasser " + MAX_DESCRIPTION_LENGTH + " caractères.");
        }
        if (request.getCategoryId() == null || request.getCategoryId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la catégorie associée doit être un entier positif.");
        }

        request.setName(request.getName().trim());
        if (request.getDescription() != null) {
            request.setDescription(request.getDescription().trim());
        }
        if (request.getStatus() != null) {
            request.setStatus(request.getStatus().trim());
        }

        return request;
    }

    private Idea findIdeaOrThrow(Long id, String ownerId) {
        return ideaRepository.findByIdAndOwnerId(id, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Idée introuvable"));
    }

    private Book findBookOrThrow(Long bookId, String ownerId) {
        return bookRepository.findByIdAndOwnerId(bookId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable"));
    }

    private Category findCategoryOrThrow(Long categoryId, String ownerId) {
        return categoryRepository.findByIdAndOwnerId(categoryId, ownerId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la " + fieldName + " doit être un entier positif.");
        }
    }

    private void validateOwnerId(String ownerId) {
        if (ownerId == null || ownerId.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de l'appareil (ownerId) est requis.");
        }
    }
}