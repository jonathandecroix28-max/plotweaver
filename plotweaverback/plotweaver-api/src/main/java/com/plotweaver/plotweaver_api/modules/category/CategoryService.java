package com.plotweaver.plotweaver_api.modules.category;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.idea.IdeaRepository;

@Service
public class CategoryService {

    private static final int MAX_NAME_LENGTH = 255;
    private static final int MAX_COLOR_LENGTH = 14;

    private final CategoryRepository categoryRepository;
    private final IdeaRepository ideaRepository;

    public CategoryService(CategoryRepository categoryRepository, IdeaRepository ideaRepository) {
        this.categoryRepository = categoryRepository;
        this.ideaRepository = ideaRepository;
    }

    public List<Category> getAllCategories(String ownerId) {
        validateOwnerId(ownerId);
        return categoryRepository.findByOwnerId(ownerId);
    }

    public Category getCategoryByIdOrThrow(Long id, String ownerId) {
        requirePositiveId(id, "category_id");
        validateOwnerId(ownerId);
        return findCategoryOrThrow(id, ownerId);
    }

    public Optional<Category> getCategoryById(Long id, String ownerId) {
        requirePositiveId(id, "category_id");
        validateOwnerId(ownerId);
        return categoryRepository.findByIdAndOwnerId(id, ownerId);
    }

    public Optional<Category> getCategoryByName(String name, String ownerId) {
        String normalizedName = normalizeName(name);
        validateOwnerId(ownerId);
        return categoryRepository.findByOwnerIdAndName(ownerId, normalizedName);
    }

    public List<Category> getCategoriesByColor(String color, String ownerId) {
        if (color == null || color.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La couleur spécifiée est invalide.");
        }
        validateOwnerId(ownerId);
        return categoryRepository.findByOwnerIdAndColor(ownerId, color.trim());
    }

    public Category createCategory(CategoryUpsertRequest request, String ownerId) {
        validateOwnerId(ownerId);
        CategoryUpsertRequest validRequest = validateAndNormalizeRequest(request);

        if (categoryRepository.existsByOwnerIdAndName(ownerId, validRequest.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une catégorie avec le même nom existe déjà.");
        }

        if (validRequest.getColor() != null && categoryRepository.existsByOwnerIdAndColor(ownerId, validRequest.getColor())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une catégorie avec la même couleur existe déjà.");
        }

        Category category = new Category();
        category.setName(validRequest.getName());
        category.setColor(validRequest.getColor());
        category.setOwnerId(ownerId);

        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, CategoryUpsertRequest request, String ownerId) {
        requirePositiveId(id, "category_id");
        validateOwnerId(ownerId);
        Category category = findCategoryOrThrow(id, ownerId);

        CategoryUpsertRequest validRequest = validateAndNormalizeRequest(request);

        if (categoryRepository.existsByOwnerIdAndNameAndIdNot(ownerId, validRequest.getName(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre catégorie avec le même nom existe déjà.");
        }

        if (validRequest.getColor() != null && categoryRepository.existsByOwnerIdAndColorAndIdNot(ownerId, validRequest.getColor(), category.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre catégorie avec la même couleur existe déjà.");
        }

        category.setName(validRequest.getName());
        category.setColor(validRequest.getColor());

        return categoryRepository.save(category);
    }

    public void deleteCategory(Long id, String ownerId) {
        requirePositiveId(id, "category_id");
        validateOwnerId(ownerId);
        Category category = findCategoryOrThrow(id, ownerId);

        long linkedIdeasCount = ideaRepository.countByCategoryId(category.getId());
        if (linkedIdeasCount > 0) {
            throw new ResponseStatusException(
                HttpStatus.CONFLICT,
                "Impossible de supprimer cette catégorie : " + linkedIdeasCount + " idée(s) y sont encore liée(s)."
            );
        }

        categoryRepository.delete(category);
    }

    public CategoryResponse toResponse(Category category) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .color(category.getColor())
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

        request.setName(normalizeName(request.getName()));

        return request;
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

    String normalizeName(String name) {
        if (name == null) {
            return null;
        }
        return name.trim().toLowerCase();
    }
}