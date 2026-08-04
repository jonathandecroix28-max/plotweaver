package com.plotweaver.plotweaver_api.modules.idea;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdeaRepository extends JpaRepository<Idea, Long> {

    Optional<Idea> findByName(String name);
    boolean existsByName(String name);

    List<Idea> findByBookId(Long bookId);
    List<Idea> findByCategoryId(Long categoryId);

    long countById(Long id);

    Optional<Idea> findByNameAndBookId(String name, Long bookId);
    boolean existsByBookIdAndName(Long bookId, String name);
    boolean existsByBookIdAndNameAndIdNot(Long bookId, String name, Long id);

    boolean existsByBookIdAndCategoryId(Long bookId, Long categoryId);
}