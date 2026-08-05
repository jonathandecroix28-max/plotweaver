package com.plotweaver.plotweaver_api.modules.chapter.version;

import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.plotweaver.plotweaver_api.modules.chapter.Chapter;
import com.plotweaver.plotweaver_api.modules.chapter.ChapterRepository;

@Service
public class ChapterVersionService {
    
    private static final int MAX_CONTENT_LENGTH = 10000;

    private final ChapterVersionRepository chapterVersionRepository;
    private final ChapterRepository chapterRepository;

    public ChapterVersionService(ChapterVersionRepository chapterVersionRepository, ChapterRepository chapterRepository) {
        this.chapterVersionRepository = chapterVersionRepository;
        this.chapterRepository = chapterRepository;
    }

    public List<ChapterVersion> getAllChapterVersions() {
        return chapterVersionRepository.findAll();
    }

    public ChapterVersion getChapterVersionByIdOrThrow(Long id) {
        requirePositiveId(id, "version_id");
        return findChapterVersionOrThrow(id);
    }

    public Optional<ChapterVersion> getChapterVersionById(Long id) {
        requirePositiveId(id, "version_id");
        return chapterVersionRepository.findById(id);
    }

    public List<ChapterVersion> getVersionsByChapterId(Long chapterId) {
        requirePositiveId(chapterId, "chapter_id");
        findChapterOrThrow(chapterId);
        return chapterVersionRepository.findByChapterId(chapterId);
    }

    public Optional<ChapterVersion> getVersionByChapterIdAndNumber(Long chapterId, Integer versionNumber) {
        requirePositiveId(chapterId, "chapter_id");
        findChapterOrThrow(chapterId);
        return chapterVersionRepository.findByChapterIdAndVersionNumber(chapterId, versionNumber);
    }

    public ChapterVersion createChapterVersion(ChapterVersionUpsertRequest request) {
        ChapterVersionUpsertRequest validRequest = validateAndNormalizeRequest(request);
        Chapter chapter = findChapterOrThrow(validRequest.getChapterId());

        if (chapterVersionRepository.existsByChapterIdAndVersionNumber(chapter.getId(), validRequest.getVersionNumber())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une version avec ce numéro existe déjà pour ce chapitre.");
        }

        ChapterVersion newVersion = ChapterVersion.builder()
                .content(validRequest.getContent())
                .versionNumber(validRequest.getVersionNumber())
                .chapter(chapter)
                .build();

        return chapterVersionRepository.save(newVersion);
    }

    public ChapterVersion updateChapterVersion(Long id, ChapterVersionUpsertRequest request) {
        requirePositiveId(id, "version_id");
        ChapterVersion existingVersion = findChapterVersionOrThrow(id);
        ChapterVersionUpsertRequest validRequest = validateAndNormalizeRequest(request);

        if (chapterVersionRepository.existsByChapterIdAndVersionNumberAndIdNot(
                existingVersion.getChapter().getId(),
                validRequest.getVersionNumber(),
                existingVersion.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Une version avec ce numéro existe déjà pour ce chapitre.");
        }

        existingVersion.setContent(validRequest.getContent());
        existingVersion.setVersionNumber(validRequest.getVersionNumber());

        return chapterVersionRepository.save(existingVersion);
    }

    public void deleteChapterVersion(Long id) {
        requirePositiveId(id, "version_id");
        ChapterVersion version = findChapterVersionOrThrow(id);
        chapterVersionRepository.delete(version);
    }

    public ChapterVersionResponse toResponse(ChapterVersion version) {
        return ChapterVersionResponse.builder()
                .id(version.getId())
                .chapterId(version.getChapter().getId())
                .versionNumber(version.getVersionNumber())
                .content(version.getContent())
                .createdAt(version.getCreatedAt())
                .updatedAt(version.getUpdatedAt())
                .build();
    }

    public List<ChapterVersionResponse> toResponseList(List<ChapterVersion> versions) {
        return versions.stream()
                .map(this::toResponse)
                .toList();
    }

    private ChapterVersionUpsertRequest validateAndNormalizeRequest(ChapterVersionUpsertRequest request) {
        if (request == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le corps de la requête est vide.");
        }
        if (request.getChapterId() == null || request.getChapterId() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant du chapitre associé doit être un entier positif.");
        }
        if (request.getVersionNumber() == null || request.getVersionNumber() <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le numéro de version doit être un entier positif.");
        }
        if (request.getContent() != null && request.getContent().length() > MAX_CONTENT_LENGTH) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Le contenu ne doit pas dépasser " + MAX_CONTENT_LENGTH + " caractères.");
        }

        if (request.getContent() != null) {
            request.setContent(request.getContent().trim());
        }

        return request;
    }

    private ChapterVersion findChapterVersionOrThrow(Long id) {
        return chapterVersionRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Version de chapitre introuvable"));
    }

    private Chapter findChapterOrThrow(Long chapterId) {
        return chapterRepository.findById(chapterId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Chapitre introuvable"));
    }

    private void requirePositiveId(Long id, String fieldName) {
        if (id == null || id <= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "L'identifiant de la " + fieldName + " doit être un entier positif.");
        }
    }
}