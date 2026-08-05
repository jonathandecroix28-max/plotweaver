package com.plotweaver.plotweaver_api.modules.idea.version;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface IdeaVersionRepository extends JpaRepository<IdeaVersion, Long> {

    List<IdeaVersion> findByIdeaId(Long ideaId);

    Optional<IdeaVersion> findByIdeaIdAndVersionNumber(Long ideaId, Integer versionNumber);

    boolean existsByIdeaIdAndVersionNumber(Long ideaId, Integer versionNumber);

    boolean existsByIdeaIdAndVersionNumberAndIdNot(Long ideaId, Integer versionNumber, Long id);
}