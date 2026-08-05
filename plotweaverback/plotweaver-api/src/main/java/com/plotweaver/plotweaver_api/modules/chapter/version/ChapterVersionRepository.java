package com.plotweaver.plotweaver_api.modules.chapter.version;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChapterVersionRepository extends JpaRepository<ChapterVersion, Long> {
    
    List<ChapterVersion> findByChapterId(Long chapterId);

    Optional<ChapterVersion> findByChapterIdAndVersionNumber(Long chapterId, Integer versionNumber);

    boolean existsByChapterIdAndVersionNumber(Long chapterId, Integer versionNumber);

    boolean existsByChapterIdAndVersionNumberAndIdNot(Long chapterId, Integer versionNumber, Long id);
}