package com.plotweaver.plotweaver_api.modules.chapter;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterRepository extends JpaRepository<Chapter, Long> {

    Optional<Chapter> findByTitle(String title);

    boolean existsByTitle(String title);

    List<Chapter> findByBookId(Long bookId);

    long countByTitle(String title);

    long countById(Long id);

    boolean existsByBookIdAndChapterNumber(Long bookId, Integer chapterNumber);

    boolean existsByBookIdAndTitle(Long bookId, String title);

    boolean existsByBookIdAndChapterNumberAndIdNot(Long bookId, Integer chapterNumber, Long id);

    boolean existsByBookIdAndTitleAndIdNot(Long bookId, String title, Long id);

    

}