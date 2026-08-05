package com.plotweaver.plotweaver_api.modules.idea.version;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.idea.Idea;
import com.plotweaver.plotweaver_api.modules.idea.IdeaRepository;

@Service
public class IdeaVersionService {

    private static final int MAX_NAME_LENGTH = 255;
    private static final int MAX_DESCRIPTION_LENGTH = 5000;

    private final IdeaVersionRepository ideaVersionRepository;
    private final IdeaRepository ideaRepository;

    public IdeaVersionService(IdeaVersionRepository ideaVersionRepository, IdeaRepository ideaRepository) {
        this.ideaVersionRepository = ideaVersionRepository;
        this.ideaRepository = ideaRepository;
    }

    public List<IdeaVersion> getAllIdeaVersions() {
        return ideaVersionRepository.findAll();
    }

    public IdeaVersion getIdeaVersionByIdOrThrow(Long id) {
        requirePositiveId(id, "version_id");
        return findIdeaVersionOrThrow(id);
    }

    public Optional<IdeaVersion> getIdeaVersionById(Long id) {
        requirePositiveId(id, "version_id");
        return ideaVersionRepository.findById(id);
    }

    public List<IdeaVersion> getVersionsByIdeaId(Long ideaId) {
        requirePositiveId(ideaId, "idea_id");
        findIdeaOrThrow(ideaId);
        return ideaVersionRepository.findByIdeaId(ideaId);
    }

    public Optional<IdeaVersion> getVersionByIdeaIdAndNumber(Long ideaId, Integer versionNumber) {
        requirePositiveId(ideaId, "idea_id");
        findIdeaOrThrow(ideaId);
        return ideaVersionRepository.findByIdeaIdAndVersionNumber(ideaId, versionNumber);
    }

    public IdeaVersion createIdeaVersion(IdeaVersionUpsertRequest request) {
        IdeaVersionUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Idea idea = findIdeaOrThrow(validRequest.getIdeaId());

        if (ideaVersionRepository.existsByIdeaIdAndVersionNumber(idea.getId(), validRequest.getVersionNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une version avec ce numéro existe déjà pour cette idée.");
        }

        IdeaVersion version = new IdeaVersion();
        version.setIdea(idea);
        version.setVersionNumber(validRequest.getVersionNumber());
        version.setName(validRequest.getName());
        version.setDescription(validRequest.getDescription());

        return ideaVersionRepository.save(version);
    }

    public IdeaVersion updateIdeaVersion(Long id, IdeaVersionUpsertRequest request) {
        requirePositiveId(id, "version_id");
        IdeaVersion version = findIdeaVersionOrThrow(id);

        IdeaVersionUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Idea idea = findIdeaOrThrow(validRequest.getIdeaId());

        if (ideaVersionRepository.existsByIdeaIdAndVersionNumberAndIdNot(idea.getId(), validRequest.getVersionNumber(), version.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une autre version avec ce numéro existe déjà pour cette idée.");
        }

        version.setIdea(idea);
        version.setVersionNumber(validRequest.getVersionNumber());
        version.setName(validRequest.getName());
        version.setDescription(validRequest.getDescription());

        return ideaVersionRepository.save(version);
    }

    public void deleteIdeaVersion(Long id) {
        requirePositiveId(id, "version_id");
        IdeaVersion version = findIdeaVersionOrThrow(id);
        ideaVersionRepository.delete(version);
    }

    public IdeaVersionResponse toResponse(IdeaVersion version) {
        return IdeaVersionResponse.builder()
                .id(version.getId())
                .ideaId(version.getIdea().getId())
                .versionNumber(version.getVersionNumber())
                .name(version.getName())
                .description(version.getDescription())
                .createdAt(version.getCreatedAt())
                .updatedAt(version.getUpdatedAt())
                .build();
    }

    public List<IdeaVersionResponse> toResponseList(List<IdeaVersion> versions) {
        return versions.stream()
                .map(this::toResponse)
                .toList();
    }

    private IdeaVersionUpsertRequest validateAndNormalizeRequest(IdeaVersionUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le corps de la requête est vide.");
        }
        if (request.getIdeaId() == null || request.getIdeaId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de l'idée associée doit être un entier positif.");
        }
        if (request.getVersionNumber() == null || request.getVersionNumber() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le numéro de version doit être un entier positif.");
        }
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom de la version est requis.");
        }
        if (request.getName().length() > MAX_NAME_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le nom ne doit pas dépasser " + MAX_NAME_LENGTH + " caractères.");
        }
        if (request.getDescription() != null && request.getDescription().length() > MAX_DESCRIPTION_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "La description ne doit pas dépasser " + MAX_DESCRIPTION_LENGTH + " caractères.");
        }

        request.setName(request.getName().trim());
        if (request.getDescription() != null) {
            request.setDescription(request.getDescription().trim());
        }

        return request;
    }

    private IdeaVersion findIdeaVersionOrThrow(Long id) {
        return ideaVersionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version d'idée introuvable"));
    }

    private Idea findIdeaOrThrow(Long ideaId) {
        return ideaRepository.findById(ideaId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Idée introuvable"));
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la " + fieldName + " doit être un entier positif.");
        }
    }
}