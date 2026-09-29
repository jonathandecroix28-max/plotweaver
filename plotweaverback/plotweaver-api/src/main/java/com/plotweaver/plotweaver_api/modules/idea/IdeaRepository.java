package com.plotweaver.plotweaver_api.modules.idea;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdeaRepository extends JpaRepository<Idea, Long> {

    List<Idea> findByOwnerId(String ownerId);

    long countByCategoryId(Long categoryId);

    Optional<Idea> findByIdAndOwnerId(Long id, String ownerId);

    List<Idea> findByOwnerIdAndBookId(String ownerId, Long bookId);

    List<Idea> findByOwnerIdAndCategoryId(String ownerId, Long categoryId);

    boolean existsByOwnerIdAndBookIdAndName(String ownerId, Long bookId, String name);

    boolean existsByOwnerIdAndBookIdAndNameAndIdNot(String ownerId, Long bookId, String name, Long id);
    
    boolean existsByOwnerIdAndBookIsNullAndName(String ownerId, String name);
    boolean existsByOwnerIdAndBookIsNullAndNameAndIdNot(String ownerId, String name, Long id);
}