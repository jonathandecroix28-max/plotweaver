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
    private final CategoryRepository categoryRepository; // <--- Ajouté

    public IdeaService(IdeaRepository ideaRepository, BookRepository bookRepository, CategoryRepository categoryRepository) {
        this.ideaRepository = ideaRepository;
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
    }

    public List<Idea> getAllIdeas() {
        return ideaRepository.findAll();
    }

    public Idea getIdeaByIdOrThrow(Long id) {
        requirePositiveId(id, "idea_id");
        return findIdeaOrThrow(id);
    }

    public Optional<Idea> getIdeaById(Long id) {
        requirePositiveId(id, "idea_id");
        return ideaRepository.findById(id);
    }

    public List<Idea> getIdeasByBookId(Long bookId) {
        requirePositiveId(bookId, "book_id");
        findBookOrThrow(bookId);
        return ideaRepository.findByBookId(bookId);
    }

    public List<Idea> getIdeasByCategoryId(Long categoryId) {
        requirePositiveId(categoryId, "category_id");
        findCategoryOrThrow(categoryId);
        return ideaRepository.findByCategoryId(categoryId);
    }

    public Long countIdeasForBook(Long bookId) {
        requirePositiveId(bookId, "book_id");
        findBookOrThrow(bookId);
        return (long) ideaRepository.findByBookId(bookId).size();
    }

    public Idea createIdea(IdeaUpsertRequest request) {
        IdeaUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());
        
        // Vérifie et récupère la catégorie, et s'assure qu'elle appartient bien au livre
        Category category = findCategoryOrThrow(validRequest.getCategoryId());
        if (!category.getBook().getId().equals(book.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La catégorie spécifiée n'appartient pas à ce livre.");
        }

        if (ideaRepository.existsByBookIdAndName(book.getId(), validRequest.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une idée avec le même nom existe déjà pour ce livre.");
        }

        Idea idea = new Idea();
        idea.setName(validRequest.getName());
        idea.setDescription(validRequest.getDescription());
        idea.setBook(book);
        idea.setCategory(category); // <--- Association

        return ideaRepository.save(idea);
    }

    public Idea updateIdea(Long id, IdeaUpsertRequest request) {
        requirePositiveId(id, "idea_id");
        Idea idea = findIdeaOrThrow(id);

        IdeaUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());

        Category category = findCategoryOrThrow(validRequest.getCategoryId());
        if (!category.getBook().getId().equals(book.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La catégorie spécifiée n'appartient pas à ce livre.");
        }

        if (ideaRepository.existsByBookIdAndNameAndIdNot(book.getId(), validRequest.getName(), idea.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre idée avec le même nom existe déjà pour ce livre.");
        }

        idea.setName(validRequest.getName());
        idea.setDescription(validRequest.getDescription());
        idea.setBook(book);
        idea.setCategory(category); // <--- Mise à jour de la catégorie

        return ideaRepository.save(idea);
    }

    public void deleteIdea(Long id) {
        requirePositiveId(id, "idea_id");
        Idea idea = findIdeaOrThrow(id);
        ideaRepository.delete(idea);
    }

    public IdeaResponse toResponse(Idea idea) {
        return IdeaResponse.builder()
                .id(idea.getId())
                .name(idea.getName())
                .description(idea.getDescription())
                .bookId(idea.getBook().getId())
                .categoryId(idea.getCategory() != null ? idea.getCategory().getId() : null) // <--- Ajouté au Response
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
        if (request.getBookId() == null || request.getBookId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant du livre associé doit être un entier positif.");
        }
        if (request.getCategoryId() == null || request.getCategoryId() <= 0) { // <--- Validation de l'ID catégorie
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la catégorie associée doit être un entier positif.");
        }

        request.setName(request.getName().trim());
        if (request.getDescription() != null) {
            request.setDescription(request.getDescription().trim());
        }

        return request;
    }

    private Idea findIdeaOrThrow(Long id) {
        return ideaRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Idée introuvable"));
    }

    private Book findBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable"));
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la " + fieldName + " doit être un entier positif.");
    }
}
}