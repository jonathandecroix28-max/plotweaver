import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useChapterVersions } from '../hooks/useChapterVersions';
import { offlineChapterService } from '../../../services/offlineChapterService';
import { offlineChapterVersionService } from '../../../services/offlineChapterVersionService';
import type { ChapterResponse } from '../../../types/chapter';
import type { ChapterVersionResponse } from '../../../types/chapterVersion';

type MergeFields = {
  title: boolean;
  content: boolean;
};

type LineDiffRow = {
  id: string;
  kind: 'equal' | 'current' | 'version';
  currentIndex: number | null;
  versionIndex: number | null;
  currentLine: string;
  versionLine: string;
};

function splitLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines.length === 1 && lines[0] === '' ? [] : lines;
}

function buildLineDiff(currentText: string, versionText: string): LineDiffRow[] {
  const currentLines = splitLines(currentText);
  const versionLines = splitLines(versionText);
  const rows: LineDiffRow[] = [];

  const dp: number[][] = Array.from({ length: currentLines.length + 1 }, () =>
    Array(versionLines.length + 1).fill(0)
  );

  for (let i = currentLines.length - 1; i >= 0; i -= 1) {
    for (let j = versionLines.length - 1; j >= 0; j -= 1) {
      dp[i][j] = currentLines[i] === versionLines[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0;
  let j = 0;
  while (i < currentLines.length && j < versionLines.length) {
    if (currentLines[i] === versionLines[j]) {
      rows.push({
        id: `eq-${i}-${j}`,
        kind: 'equal',
        currentIndex: i,
        versionIndex: j,
        currentLine: currentLines[i],
        versionLine: versionLines[j],
      });
      i += 1;
      j += 1;
      continue;
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      rows.push({
        id: `cur-${i}-${j}`,
        kind: 'current',
        currentIndex: i,
        versionIndex: null,
        currentLine: currentLines[i],
        versionLine: '',
      });
      i += 1;
    } else {
      rows.push({
        id: `ver-${i}-${j}`,
        kind: 'version',
        currentIndex: null,
        versionIndex: j,
        currentLine: '',
        versionLine: versionLines[j],
      });
      j += 1;
    }
  }

  while (i < currentLines.length) {
    rows.push({
      id: `cur-${i}-${j}`,
      kind: 'current',
      currentIndex: i,
      versionIndex: null,
      currentLine: currentLines[i],
      versionLine: '',
    });
    i += 1;
  }

  while (j < versionLines.length) {
    rows.push({
      id: `ver-${i}-${j}`,
      kind: 'version',
      currentIndex: null,
      versionIndex: j,
      currentLine: '',
      versionLine: versionLines[j],
    });
    j += 1;
  }

  return rows;
}

function defaultLineChoices(rows: LineDiffRow[]): Record<string, 'current' | 'version'> {
  return rows.reduce<Record<string, 'current' | 'version'>>((acc, row) => {
    acc[row.id] = row.kind === 'version' ? 'version' : 'current';
    return acc;
  }, {});
}

function composeLineMerge(rows: LineDiffRow[], choices: Record<string, 'current' | 'version'>): string {
  return rows
    .flatMap((row) => {
      const choice = choices[row.id] ?? (row.kind === 'version' ? 'version' : 'current');
      if (row.kind === 'equal') return [row.currentLine];
      if (choice === 'version') return row.kind === 'version' ? [row.versionLine] : [];
      return row.kind === 'current' ? [row.currentLine] : [];
    })
    .join('\n');
}

export function ChapterVersionsPage() {
  const { bookId, chapterId, versionId } = useParams<{ bookId: string; chapterId: string; versionId?: string }>();
  const navigate = useNavigate();

  const numBookId = bookId ? Number(bookId) : null;
  const numChapterId = chapterId ? Number(chapterId) : null;
  const numVersionId = versionId ? Number(versionId) : null;

  const { versions, selectedVersion, isLoading, error, refetch } = useChapterVersions(numChapterId, numVersionId);
  const [chapter, setChapter] = useState<ChapterResponse | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'version'>('newest');
  const [mergeFields, setMergeFields] = useState<MergeFields>({ title: true, content: true });
  const [compareMode, setCompareMode] = useState<'current-left' | 'version-left'>('current-left');
  const [contentLineChoices, setContentLineChoices] = useState<Record<string, 'current' | 'version'>>({});

  useEffect(() => {
    if (!numChapterId) return;

    offlineChapterService.getById(numChapterId).then(setChapter).catch(() => setChapter(null));
  }, [numChapterId]);

  useEffect(() => {
    if (!isLoading && (error || !chapter)) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, error, chapter, navigate]);

  const visibleVersions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const filtered = versions.filter((version) => {
      if (!normalizedSearch) return true;
      return (
        version.name.toLowerCase().includes(normalizedSearch) ||
        String(version.versionNumber).includes(normalizedSearch) ||
        String(version.id).includes(normalizedSearch)
      );
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'version') return Number(b.versionNumber) - Number(a.versionNumber);
      const left = new Date(a.updatedAt).getTime();
      const right = new Date(b.updatedAt).getTime();
      return sortBy === 'newest' ? right - left : left - right;
    });
  }, [versions, search, sortBy]);

  const versionToCompare = selectedVersion ?? visibleVersions[0] ?? null;
  const contentDiffRows = useMemo(
    () => buildLineDiff(chapter?.content || '', versionToCompare?.content || ''),
    [chapter?.content, versionToCompare?.content]
  );

  useEffect(() => {
    setContentLineChoices(defaultLineChoices(contentDiffRows));
  }, [versionToCompare?.id, chapter?.content]);

  const mergedContentPreview = composeLineMerge(contentDiffRows, contentLineChoices);

  const handleRestoreVersion = async (version: ChapterVersionResponse | null = versionToCompare) => {
    if (!numChapterId || !version || !chapter) return;

    setIsRestoring(true);
    try {
      await offlineChapterService.update(
        numChapterId,
        mergeFields.title ? version.name : chapter.title,
        mergeFields.content ? mergedContentPreview : chapter.content
      );
      setFeedback('Fusion appliquée au chapitre courant.');
      navigate(`/books/${numBookId}/chapters/${numChapterId}`);
    } catch (restoreError) {
      console.error('Erreur lors de la restauration de la version :', restoreError);
      setFeedback('Impossible de restaurer cette version.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteVersion = async (version: ChapterVersionResponse) => {
    if (!confirm(`Supprimer la version ${version.versionNumber} ?`)) return;

    const success = await offlineChapterVersionService.remove(version.id);
    if (success) {
      setFeedback(`Version ${version.versionNumber} supprimée.`);
      await refetch();
      return;
    }

    setFeedback('Impossible de supprimer cette version.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1c1411] flex items-center justify-center font-serif text-amber-200/60">
        Consultation de l’historique...
      </div>
    );
  }

  if (error || !chapter) return null;

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] font-serif">
      <header className="sticky top-0 z-10 border-b border-amber-900/40 bg-neutral-950/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              onClick={() => navigate(`/books/${numBookId}/chapters/${numChapterId}`)}
              className="text-amber-200/60 hover:text-amber-100 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans mb-2"
            >
              &larr; Retour à l'écritoire
            </button>
            <h1 className="text-3xl font-bold text-amber-100">Tableau des versions du chapitre</h1>
            <p className="text-sm text-amber-200/50 mt-1">{chapter.title}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="rounded-2xl border border-amber-900/30 bg-neutral-900 px-4 py-3 min-w-28">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200/40">Versions</div>
              <div className="text-xl font-bold text-amber-100">{versions.length}</div>
            </div>
            <div className="rounded-2xl border border-amber-900/30 bg-neutral-900 px-4 py-3 min-w-28">
              <div className="text-[11px] uppercase tracking-[0.22em] text-amber-200/40">Sélection</div>
              <div className="text-xl font-bold text-amber-100">{selectedVersion ? `v${selectedVersion.versionNumber}` : '-'}</div>
            </div>
            <button
              onClick={() => navigate(`/books/${numBookId}/chapters/${numChapterId}`)}
              className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Ouvrir l’éditeur
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6 overflow-x-hidden">
        {feedback && (
          <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/30 px-4 py-3 text-emerald-300 text-sm font-medium">
            {feedback}
          </div>
        )}

        <section className="rounded-3xl border border-amber-900/25 bg-neutral-950/55 p-4 sm:p-5 shadow-xl space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_180px] flex-1">
              <div>
                <label className="block text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-2">Filtrer</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, version, id..."
                  className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-4 py-3 text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-2">Trier</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-4 py-3 text-amber-100 focus:outline-none"
                >
                  <option value="newest">Plus récentes</option>
                  <option value="oldest">Plus anciennes</option>
                  <option value="version">Numéro de version</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMergeFields({ title: true, content: true })}
                className="px-3 py-2 rounded-lg border border-amber-900/30 bg-neutral-900 text-amber-200 text-xs font-medium"
              >
                Tout reprendre
              </button>
              <button
                onClick={() => setMergeFields({ title: false, content: false })}
                className="px-3 py-2 rounded-lg border border-amber-900/30 bg-neutral-900 text-amber-200 text-xs font-medium"
              >
                Garder l’éditeur
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] items-start">
          <section className="rounded-3xl border border-amber-900/25 bg-neutral-950/55 shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-amber-900/20 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-amber-100">Versions</h2>
                <p className="text-sm text-amber-200/50">Tableau de gestion compact et filtrable</p>
              </div>
              <div className="text-xs text-amber-200/40 uppercase tracking-[0.22em]">Admin view</div>
            </div>

            <div className="max-h-[68vh] overflow-auto">
              <table className="min-w-full divide-y divide-amber-900/20">
                <thead className="bg-neutral-950/80 sticky top-0 z-10">
                  <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                    <th className="px-5 py-4 font-medium">Version</th>
                    <th className="px-5 py-4 font-medium">Nom</th>
                    <th className="px-5 py-4 font-medium">Mise à jour</th>
                    <th className="px-5 py-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-900/10">
                  {visibleVersions.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-amber-200/60">
                        Aucune version ne correspond à ce filtre.
                      </td>
                    </tr>
                  ) : (
                    visibleVersions.map((version) => {
                      const isSelected = selectedVersion?.id === version.id;
                      return (
                        <tr
                          key={version.id}
                          className={`transition-colors ${isSelected ? 'bg-amber-950/40' : 'bg-transparent hover:bg-neutral-900/50'}`}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-amber-800/40 bg-amber-950 text-amber-300 text-sm font-bold">
                                {version.versionNumber}
                              </span>
                              <div>
                                <div className="font-semibold text-amber-100">{isSelected ? 'Sélectionnée' : 'Disponible'}</div>
                                <div className="text-xs text-amber-200/40">ID {version.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-amber-100">{version.name}</td>
                          <td className="px-5 py-4 text-amber-200/70 text-sm">{new Date(version.updatedAt).toLocaleString()}</td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => navigate(`/books/${numBookId}/chapters/${numChapterId}/versions/${version.id}`)}
                                className="px-3 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Voir
                              </button>
                              <button
                                onClick={() => handleRestoreVersion(version)}
                                disabled={isRestoring && isSelected}
                                className="px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {isRestoring && isSelected ? 'Restauration...' : 'Fusionner'}
                              </button>
                              <button
                                onClick={() => handleDeleteVersion(version)}
                                className="px-3 py-2 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-900/40 text-red-200 text-xs font-medium transition-colors cursor-pointer"
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {versionToCompare && chapter && (
            <section className="rounded-3xl border border-amber-900/25 bg-neutral-950/70 p-5 sm:p-6 shadow-xl space-y-6 lg:sticky lg:top-24">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-2">Comparaison</p>
                  <h2 className="text-3xl font-bold text-amber-100">Comparer et fusionner</h2>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setCompareMode('current-left')}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${compareMode === 'current-left' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                  >
                    Actuel à gauche
                  </button>
                  <button
                    onClick={() => setCompareMode('version-left')}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors cursor-pointer ${compareMode === 'version-left' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                  >
                    Version à gauche
                  </button>
                </div>
              </div>

              <div className="grid gap-4">
                {compareMode === 'current-left' ? (
                  <>
                    <article className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-3">Chapitre actuel</div>
                      <h3 className="text-2xl font-bold text-amber-100 mb-3">{chapter.title}</h3>
                      <div className="prose prose-invert max-w-none text-amber-100/90 font-serif text-base">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chapter.content || '') }} />
                      </div>
                    </article>

                    <article className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-3">Version sélectionnée</div>
                      <h3 className="text-2xl font-bold text-amber-100 mb-3">{versionToCompare.name}</h3>
                      <div className="prose prose-invert max-w-none text-amber-100/90 font-serif text-base">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(versionToCompare.content || '') }} />
                      </div>
                    </article>
                  </>
                ) : (
                  <>
                    <article className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-3">Version sélectionnée</div>
                      <h3 className="text-2xl font-bold text-amber-100 mb-3">{versionToCompare.name}</h3>
                      <div className="prose prose-invert max-w-none text-amber-100/90 font-serif text-base">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(versionToCompare.content || '') }} />
                      </div>
                    </article>

                    <article className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5">
                      <div className="text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-3">Chapitre actuel</div>
                      <h3 className="text-2xl font-bold text-amber-100 mb-3">{chapter.title}</h3>
                      <div className="prose prose-invert max-w-none text-amber-100/90 font-serif text-base">
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(chapter.content || '') }} />
                      </div>
                    </article>
                  </>
                )}
              </div>

              <div className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5 space-y-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-2">Diff ligne par ligne</div>
                  <p className="text-sm text-amber-200/60">Chaque ligne différente peut être gardée depuis le chapitre actuel ou la version.</p>
                </div>

                <div className="max-h-[38vh] overflow-auto rounded-2xl border border-amber-900/20">
                  <table className="min-w-full divide-y divide-amber-900/10">
                    <thead className="bg-neutral-950/80 sticky top-0 z-10">
                      <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                        <th className="px-4 py-3 font-medium">Ligne</th>
                        <th className="px-4 py-3 font-medium">Actuel</th>
                        <th className="px-4 py-3 font-medium">Version</th>
                        <th className="px-4 py-3 font-medium">Choix</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10">
                      {contentDiffRows.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-amber-200/50">Aucune ligne de contenu à comparer.</td>
                        </tr>
                      ) : (
                        contentDiffRows.map((row) => {
                          const selectedChoice = contentLineChoices[row.id] ?? (row.kind === 'version' ? 'version' : 'current');
                          const activeLine = selectedChoice === 'version' ? row.versionLine : row.currentLine;
                          const lineNumber = row.currentIndex != null ? row.currentIndex + 1 : row.versionIndex != null ? row.versionIndex + 1 : '-';

                          return (
                            <tr key={row.id} className={row.kind === 'equal' ? 'bg-neutral-950/35' : 'bg-neutral-950/55'}>
                              <td className="px-4 py-3 align-top text-xs text-amber-200/40">{lineNumber}</td>
                              <td className="px-4 py-3 align-top whitespace-pre-wrap text-sm text-amber-100/80">{row.currentLine || '—'}</td>
                              <td className="px-4 py-3 align-top whitespace-pre-wrap text-sm text-amber-100/80">{row.versionLine || '—'}</td>
                              <td className="px-4 py-3 align-top">
                                {row.kind === 'equal' ? (
                                  <span className="text-xs text-emerald-300">Identique</span>
                                ) : (
                                  <div className="flex flex-col gap-2">
                                    <div className="text-xs text-amber-200/50">Garde: {selectedChoice === 'version' ? 'version' : 'actuel'}</div>
                                    <div className="flex flex-wrap gap-2">
                                      <button
                                        onClick={() => setContentLineChoices((current) => ({ ...current, [row.id]: 'current' }))}
                                        className={`px-2.5 py-1.5 rounded-md text-xs border ${selectedChoice === 'current' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                                      >
                                        Garder actuel
                                      </button>
                                      <button
                                        onClick={() => setContentLineChoices((current) => ({ ...current, [row.id]: 'version' }))}
                                        className={`px-2.5 py-1.5 rounded-md text-xs border ${selectedChoice === 'version' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                                      >
                                        Garder version
                                      </button>
                                    </div>
                                    <div className="text-[11px] text-amber-200/40 whitespace-pre-wrap">{activeLine || '—'}</div>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-5">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-amber-100">Choix de fusion</span>
                  <label className="flex items-center gap-2 text-sm text-amber-200/70">
                    <input
                      type="checkbox"
                      checked={mergeFields.title}
                      onChange={(e) => setMergeFields((current) => ({ ...current, title: e.target.checked }))}
                    />
                    Titre
                  </label>
                  <label className="flex items-center gap-2 text-sm text-amber-200/70">
                    <input
                      type="checkbox"
                      checked={mergeFields.content}
                      onChange={(e) => setMergeFields((current) => ({ ...current, content: e.target.checked }))}
                    />
                    Contenu
                  </label>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => handleRestoreVersion(versionToCompare)}
                    disabled={isRestoring}
                    className="px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-medium transition-colors shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? 'Restauration...' : 'Fusionner les champs cochés'}
                  </button>
                  <button
                    onClick={() => setMergeFields({ title: true, content: true })}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 text-sm font-medium transition-colors border border-amber-900/30"
                  >
                    Tout cocher
                  </button>
                  <button
                    onClick={() => setMergeFields({ title: false, content: false })}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 text-sm font-medium transition-colors border border-amber-900/30"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>
            </section>
          )}
        </section>
      </main>
    </div>
  );
}

export default ChapterVersionsPage;