package com.plotweaver.plotweaver_api.modules.category;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    Optional<Category> findByName(String name);

    boolean existsByName(String name);

    List<Category> findByBookId(Long bookId);

    long countById(Long id);

    Optional<Category> findByIdAndBookId(Long id, Long bookId);

    Optional<Category> findByNameAndBookId(String name, Long bookId);

    boolean existsByBookIdAndName(Long bookId, String name);

    boolean existsByBookIdAndNameAndIdNot(Long bookId, String name, Long id);

    boolean existsByBookIdAndColor(Long bookId, String color);

    boolean existsByBookIdAndColorAndIdNot(Long bookId, String color, Long id);

    List<Category> findByColor(String color);

}