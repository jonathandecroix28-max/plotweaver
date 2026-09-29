import { useState, useEffect, useCallback, useMemo } from 'react';
import { offlineChapterVersionService } from '../../../services/offlineChapterVersionService';
import type { ChapterVersionResponse } from '../../../types/chapterVersion';

export function useChapterVersions(chapterId: number | null, versionId?: number | null) {
  const [versions, setVersions] = useState<ChapterVersionResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVersions = useCallback(async () => {
    if (!chapterId) {
      setVersions([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await offlineChapterVersionService.getByChapterId(chapterId);
      setVersions(data);
    } catch (err) {
      console.error('Erreur de chargement des versions de chapitre :', err);
      setError('Impossible de charger les versions du chapitre.');
    } finally {
      setIsLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const selectedVersion = useMemo(() => {
    if (versions.length === 0) return null;

    if (versionId) {
      return versions.find((version) => version.id === versionId) ?? versions[versions.length - 1];
    }

    return [...versions].sort((a, b) => Number(b.versionNumber) - Number(a.versionNumber))[0] ?? null;
  }, [versions, versionId]);

  return { versions, selectedVersion, isLoading, error, setVersions, refetch: fetchVersions };
}