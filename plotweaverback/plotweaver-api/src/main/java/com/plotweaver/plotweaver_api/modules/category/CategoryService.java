package com.plotweaver.plotweaver_api.modules.category;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.book.Book;
import com.plotweaver.plotweaver_api.modules.book.BookRepository;

@Service
public class CategoryService {

    private static final int MAX_NAME_LENGTH = 255;
    private static final int MAX_COLOR_LENGTH = 14;

    private final CategoryRepository categoryRepository;
    private final BookRepository bookRepository;

    public CategoryService(CategoryRepository categoryRepository, BookRepository bookRepository) {
        this.categoryRepository = categoryRepository;
        this.bookRepository = bookRepository;
    }

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategoryByIdOrThrow(Long id) {
        requirePositiveId(id, "category_id");
        return findCategoryOrThrow(id);
    }

    public Optional<Category> getCategoryById(Long id) {
        requirePositiveId(id, "category_id");
        return categoryRepository.findById(id);
    }

    public Optional<Category> getCategoryByName(String name) {
        String normalizedName = normalizeName(name);
        return categoryRepository.findByName(normalizedName);
    }

    public List<Category> getCategoriesByBookId(Long bookId) {
        requirePositiveId(bookId, "book_id");
        findBookOrThrow(bookId); 
        return categoryRepository.findByBookId(bookId);
    }

    public Long countCategoriesForBook(Long bookId) {
        requirePositiveId(bookId, "book_id");
        findBookOrThrow(bookId);
        return (long) categoryRepository.findByBookId(bookId).size();
    }

    public Category getCategoryDetails(Long id, Long bookId) {
        requirePositiveId(id, "category_id");
        requirePositiveId(bookId, "book_id");
        return categoryRepository.findByIdAndBookId(id, bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable pour ce livre."));
    }

    public Optional<Category> getCategoryByNameInBook(String name, Long bookId) {
        String normalizedName = normalizeName(name);
        requirePositiveId(bookId, "book_id");
        return categoryRepository.findByNameAndBookId(normalizedName, bookId);
    }

    public List<Category> getCategoriesByColor(String color) {
        if (color == null || color.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La couleur spécifiée est invalide.");
        }
        return categoryRepository.findByColor(color.trim());
    }

    public boolean checkIfCategoryExists(Long bookId, String name) {
        String normalizedName = normalizeName(name);
        requirePositiveId(bookId, "book_id");
        return categoryRepository.existsByBookIdAndName(bookId, normalizedName);
    }

    public Category createCategory(CategoryUpsertRequest request) {
        CategoryUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());

        if (categoryRepository.existsByBookIdAndName(book.getId(), validRequest.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une catégorie avec le même nom existe déjà pour ce livre.");
        }

        if (categoryRepository.existsByBookIdAndColor(book.getId(), validRequest.getColor())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une catégorie avec la même couleur existe déjà pour ce livre.");
        }

        Category category = new Category();
        category.setName(validRequest.getName());
        category.setColor(validRequest.getColor());
        category.setBook(book);

        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryUpsertRequest request) {
        requirePositiveId(id, "category_id");
        Category category = findCategoryOrThrow(id);

        CategoryUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Book book = findBookOrThrow(validRequest.getBookId());

        if (categoryRepository.existsByBookIdAndNameAndIdNot(book.getId(), validRequest.getName(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre catégorie avec le même nom existe déjà pour ce livre.");
        }

        if (categoryRepository.existsByBookIdAndColorAndIdNot(book.getId(), validRequest.getColor(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre catégorie avec la même couleur existe déjà pour ce livre.");
        }

        category.setName(validRequest.getName());
        category.setColor(validRequest.getColor());
        category.setBook(book);

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id) {
        requirePositiveId(id, "category_id");
        Category category = findCategoryOrThrow(id);
        categoryRepository.delete(category);
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
                .bookId(category.getBook().getId())
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }

    public List<CategoryResponse> toResponseList(List<Category> categories) {
        return categories.stream()
                .map(this::toResponse)
                .toList();
    }

    private CategoryUpsertRequest validateAndNormalizeRequest(CategoryUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le corps de la requête est vide.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom de la catégorie est requis.");
        }
        if (request.getName().length() > MAX_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom ne doit pas dépasser " + MAX_NAME_LENGTH + " caractères.");
        }
        
        if (request.getColor() != null && !request.getColor().trim().isEmpty()) {
            if (request.getColor().trim().length() > MAX_COLOR_LENGTH) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La couleur ne doit pas dépasser " + MAX_COLOR_LENGTH + " caractères.");
            }
            request.setColor(request.getColor().trim());
        } else {
            request.setColor(null); 
        }


        if (request.getBookId() == null || request.getBookId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant du livre associé doit être un entier positif.");
        }

        request.setName(normalizeName(request.getName()));

        return request;
    }

    private Category findCategoryOrThrow(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Catégorie introuvable"));
    }

    private Book findBookOrThrow(Long bookId) {
        return bookRepository.findById(bookId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Livre introuvable"));
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la " + fieldName + " doit être un entier positif.");
        }
    }

    String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        return name.trim().toLowerCase();
    }
}