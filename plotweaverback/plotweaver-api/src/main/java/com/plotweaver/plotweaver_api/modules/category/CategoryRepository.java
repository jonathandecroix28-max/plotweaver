package com.plotweaver.plotweaver_api.modules.category;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    List<Category> findByOwnerId(String ownerId);

    Optional<Category> findByIdAndOwnerId(Long id, String ownerId);

    Optional<Category> findByOwnerIdAndName(String ownerId, String name);

    boolean existsByOwnerIdAndName(String ownerId, String name);

    boolean existsByOwnerIdAndNameAndIdNot(String ownerId, String name, Long id);

    boolean existsByOwnerIdAndColor(String ownerId, String color);

    boolean existsByOwnerIdAndColorAndIdNot(String ownerId, String color, Long id);

    List<Category> findByOwnerIdAndColor(String ownerId, String color);
}