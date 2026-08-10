package com.plotweaver.plotweaver_api.modules.book;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BookRepository extends JpaRepository<Book, Long> {
    
    List<Book> findAllByOwnerId(String ownerId);
    
    Optional<Book> findByIdAndOwnerId(Long id, String ownerId);
    
    Optional<Book> findByTitleAndOwnerId(String title, String ownerId);
    
    boolean existsByTitleAndOwnerId(String title, String ownerId);
}