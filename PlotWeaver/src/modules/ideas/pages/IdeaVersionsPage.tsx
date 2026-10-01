import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useIdeaVersions } from '../hooks/useIdeaVersions';
import { offlineIdeaService } from '../../../services/offlineIdeaService';
import { offlineIdeaVersionService } from '../../../services/offlineIdeaVersionService';
import type { IdeaResponse } from '../../../types/idea';
import type { IdeaVersionResponse } from '../../../types/ideaVersion';

type MergeFields = {
  name: boolean;
  description: boolean;
};

function splitLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  return lines.length === 1 && lines[0] === '' ? [] : lines;
}

function displayLine(line: string): string {
  return line;
}

type LineDiffKind = 'equal' | 'change' | 'current' | 'version';
type LineChoice = 'current' | 'version';

type LineDiffRow = {
  id: string;
  kind: LineDiffKind; // change = ligne modifiée (présente des deux côtés)
  currentIndex: number | null;
  versionIndex: number | null;
  currentLine: string;
  versionLine: string;
};

/**
 * Diff ligne par ligne (LCS). Les suppressions et ajouts consécutifs entre deux
 * lignes identiques sont APPARIÉS : une ligne modifiée = UNE seule ligne "change"
 * avec le texte actuel et le texte de la version en face l'un de l'autre.
 * Seules les lignes réellement sans équivalent restent seules (côté absent).
 */
function buildLineDiff(currentText: string, versionText: string): LineDiffRow[] {
  const currentLines = splitLines(currentText);
  const versionLines = splitLines(versionText);
  const same = (a: string, b: string) => a.trimEnd() === b.trimEnd();
  const rows: LineDiffRow[] = [];

  const dp: number[][] = Array.from({ length: currentLines.length + 1 }, () =>
    Array(versionLines.length + 1).fill(0)
  );

  for (let i = currentLines.length - 1; i >= 0; i -= 1) {
    for (let j = versionLines.length - 1; j >= 0; j -= 1) {
      dp[i][j] = same(currentLines[i], versionLines[j])
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let removed: number[] = []; // indices présents seulement côté actuel
  let added: number[] = []; // indices présents seulement côté version

  const flush = () => {
    const pairs = Math.min(removed.length, added.length);

    for (let k = 0; k < pairs; k += 1) {
      const ci = removed[k];
      const vi = added[k];
      rows.push({
        id: `chg-${ci}-${vi}`,
        kind: 'change',
        currentIndex: ci,
        versionIndex: vi,
        currentLine: currentLines[ci],
        versionLine: versionLines[vi],
      });
    }
    for (let k = pairs; k < removed.length; k += 1) {
      const ci = removed[k];
      rows.push({
        id: `cur-${ci}`,
        kind: 'current',
        currentIndex: ci,
        versionIndex: null,
        currentLine: currentLines[ci],
        versionLine: '',
      });
    }
    for (let k = pairs; k < added.length; k += 1) {
      const vi = added[k];
      rows.push({
        id: `ver-${vi}`,
        kind: 'version',
        currentIndex: null,
        versionIndex: vi,
        currentLine: '',
        versionLine: versionLines[vi],
      });
    }

    removed = [];
    added = [];
  };

  let i = 0;
  let j = 0;
  while (i < currentLines.length && j < versionLines.length) {
    if (same(currentLines[i], versionLines[j])) {
      flush();
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
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      removed.push(i);
      i += 1;
    } else {
      added.push(j);
      j += 1;
    }
  }

  while (i < currentLines.length) {
    removed.push(i);
    i += 1;
  }
  while (j < versionLines.length) {
    added.push(j);
    j += 1;
  }
  flush();

  return rows;
}

// Par défaut : on garde l'actuel, et on prend les lignes qui n'existent que dans la version
function defaultChoice(row: LineDiffRow): LineChoice {
  return row.kind === 'version' ? 'version' : 'current';
}

function defaultLineChoices(rows: LineDiffRow[]): Record<string, LineChoice> {
  return rows.reduce<Record<string, LineChoice>>((acc, row) => {
    acc[row.id] = defaultChoice(row);
    return acc;
  }, {});
}

function composeLineMerge(rows: LineDiffRow[], choices: Record<string, LineChoice>): string {
  return rows
    .flatMap((row) => {
      if (row.kind === 'equal') return [row.currentLine];
      const choice = choices[row.id] ?? defaultChoice(row);
      if (choice === 'version') return row.kind === 'current' ? [] : [row.versionLine];
      return row.kind === 'version' ? [] : [row.currentLine];
    })
    .join('\n');
}

function choiceLabels(kind: LineDiffKind): { current: string; version: string } {
  if (kind === 'current') return { current: 'Garder', version: 'Retirer' };
  if (kind === 'version') return { current: 'Ignorer', version: 'Ajouter' };
  return { current: 'Garder actuel', version: 'Garder version' };
}

function choiceSummary(kind: LineDiffKind, choice: LineChoice): string {
  if (kind === 'current') return choice === 'current' ? 'ligne conservée' : 'ligne retirée';
  if (kind === 'version') return choice === 'version' ? 'ligne ajoutée' : 'ligne ignorée';
  return choice === 'version' ? 'version' : 'actuel';
}

function lineNumberOf(row: LineDiffRow): string {
  const c = row.currentIndex != null ? row.currentIndex + 1 : null;
  const v = row.versionIndex != null ? row.versionIndex + 1 : null;
  if (c != null && v != null && c !== v) return `${c} / ${v}`;
  return String(c ?? v ?? '-');
}

function isSideMissing(row: LineDiffRow, side: LineChoice): boolean {
  return side === 'current' ? row.kind === 'version' : row.kind === 'current';
}

// Fond rouge = ce qui disparaît / change côté actuel, vert = ce qui apparaît côté version
function sideBg(row: LineDiffRow, side: LineChoice): string {
  if (row.kind === 'equal' || isSideMissing(row, side)) return '';
  return side === 'current' ? 'bg-red-950/25' : 'bg-emerald-950/25';
}

function renderSide(row: LineDiffRow, side: LineChoice) {
  if (isSideMissing(row, side)) return <span className="italic text-amber-200/30">absente</span>;
  const line = side === 'current' ? row.currentLine : row.versionLine;
  if (line.trim() === '') return <span className="italic text-amber-200/30">(ligne vide)</span>;
  return displayLine(line);
}

export function IdeaVersionsPage() {
  const { ideaId, versionId } = useParams<{ ideaId: string; versionId?: string }>();
  const navigate = useNavigate();

  const numIdeaId = ideaId ? Number(ideaId) : null;
  const numVersionId = versionId ? Number(versionId) : null;

  const { versions, selectedVersion, isLoading, error, refetch } = useIdeaVersions(numIdeaId, numVersionId);
  const [idea, setIdea] = useState<IdeaResponse | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'version'>('newest');
  const [mergeFields, setMergeFields] = useState<MergeFields>({ name: true, description: true });
  const [compareMode, setCompareMode] = useState<'current-left' | 'version-left'>('current-left');
  const [descriptionLineChoices, setDescriptionLineChoices] = useState<Record<string, 'current' | 'version'>>({});

  useEffect(() => {
    if (!numIdeaId) return;

    offlineIdeaService.getById(numIdeaId).then(setIdea).catch(() => setIdea(null));
  }, [numIdeaId]);

  useEffect(() => {
    if (!isLoading && (error || !idea)) {
      navigate('/404', { replace: true });
    }
  }, [isLoading, error, idea, navigate]);

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
  const descriptionDiffRows = useMemo(
    () => buildLineDiff(idea?.description || '', versionToCompare?.description || ''),
    [idea?.description, versionToCompare?.description]
  );

  useEffect(() => {
    setDescriptionLineChoices(defaultLineChoices(descriptionDiffRows));
  }, [versionToCompare?.id, idea?.description]);

  const mergedDescriptionPreview = composeLineMerge(descriptionDiffRows, descriptionLineChoices);

  const handleCreateVersion = async () => {
    if (!numIdeaId || !idea) return;

    const nextVersionNumber = versions.length > 0
      ? Math.max(...versions.map((version) => Number(version.versionNumber))) + 1
      : 1;

    try {
      await offlineIdeaVersionService.create({
        ideaId: numIdeaId,
        versionNumber: nextVersionNumber,
        name: idea.name,
        description: idea.description,
      });
      setFeedback(`Version ${nextVersionNumber} créée.`);
      await refetch();
    } catch (createError) {
      console.error('Erreur lors de la création de version idée :', createError);
      setFeedback('Impossible de créer cette version.');
    }
  };

  const handleRestoreVersion = async (version: IdeaVersionResponse | null = versionToCompare) => {
    if (!numIdeaId || !version || !idea) return;

    setIsRestoring(true);
    try {
      await offlineIdeaService.update(numIdeaId, {
        name: mergeFields.name ? version.name : idea.name,
        description: mergeFields.description ? mergedDescriptionPreview : idea.description,
        bookId: idea.bookId,
        categoryId: idea.categoryId,
        status: idea.status,
      });
      setFeedback('Fusion appliquée à l’idée courante.');
      navigate('/ideas');
    } catch (restoreError) {
      console.error('Erreur lors de la restauration de la version idée :', restoreError);
      setFeedback('Impossible de restaurer cette version.');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDeleteVersion = async (version: IdeaVersionResponse) => {
    if (!confirm(`Supprimer la version ${version.versionNumber} ?`)) return;

    const success = await offlineIdeaVersionService.remove(version.id);
    if (success) {
      setFeedback(`Version ${version.versionNumber} supprimée.`);
      await refetch();
      return;
    }

    setFeedback('Impossible de supprimer cette version.');
  };

  if (isLoading) {
    return (
      <div className="min-h-full bg-[#1c1411] flex items-center justify-center font-serif text-amber-200/60 py-24">
        Consultation de l’historique...
      </div>
    );
  }

  if (error || !idea) {
    return (
      <div className="min-h-full bg-[#1c1411] text-[#fcf9f2] font-serif px-4 py-20">
        <div className="max-w-xl mx-auto rounded-2xl border border-red-900/30 bg-red-950/20 p-6 text-center text-red-200">
          {error ?? 'Cette idée n’existe plus ou est introuvable.'}
        </div>
      </div>
    );
  }

  const btnBase = 'rounded-lg border text-xs font-medium transition-colors cursor-pointer';
  const choiceBtn = (active: boolean) =>
    `px-2.5 py-1.5 rounded-md text-xs border cursor-pointer ${active ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`;

  const renderVersionActions = (version: IdeaVersionResponse, isSelected: boolean, className: string) => (
    <div className={className}>
      <button
        onClick={() => navigate(`/ideas/${numIdeaId}/versions/${version.id}`)}
        className={`${btnBase} px-3 py-2 bg-neutral-900 hover:bg-neutral-800 border-amber-900/30 text-amber-200`}
      >
        Voir
      </button>
      <button
        onClick={() => handleRestoreVersion(version)}
        disabled={isRestoring && isSelected}
        className={`${btnBase} px-3 py-2 bg-amber-700 hover:bg-amber-600 border-amber-700 text-amber-50 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {isRestoring && isSelected ? '...' : 'Fusionner'}
      </button>
      <button
        onClick={() => handleDeleteVersion(version)}
        className={`${btnBase} px-3 py-2 bg-red-950/60 hover:bg-red-900/70 border-red-900/40 text-red-200`}
      >
        Supprimer
      </button>
    </div>
  );

  const renderLineChoice = (row: LineDiffRow) => {
    if (row.kind === 'equal') return <span className="text-xs text-emerald-300">Identique</span>;

    const selectedChoice = descriptionLineChoices[row.id] ?? defaultChoice(row);
    const labels = choiceLabels(row.kind);
    const activeLine = selectedChoice === 'version' ? row.versionLine : row.currentLine;

    return (
      <div className="flex flex-col gap-2">
        <div className="text-xs text-amber-200/50">Résultat : {choiceSummary(row.kind, selectedChoice)}</div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setDescriptionLineChoices((c) => ({ ...c, [row.id]: 'current' }))}
            className={choiceBtn(selectedChoice === 'current')}
          >
            {labels.current}
          </button>
          <button
            onClick={() => setDescriptionLineChoices((c) => ({ ...c, [row.id]: 'version' }))}
            className={choiceBtn(selectedChoice === 'version')}
          >
            {labels.version}
          </button>
        </div>
        <div className="text-[11px] text-amber-200/40 whitespace-pre-wrap break-words">{activeLine || '—'}</div>
      </div>
    );
  };

  const currentCard = { label: 'Idée actuelle', name: idea.name, description: idea.description };
  const versionCard = versionToCompare
    ? { label: 'Version sélectionnée', name: versionToCompare.name, description: versionToCompare.description }
    : null;
  const compareCards = versionCard
    ? compareMode === 'current-left'
      ? [currentCard, versionCard]
      : [versionCard, currentCard]
    : [];

  return (
    <div className="min-h-full bg-[#1c1411] text-[#fcf9f2] font-serif">
      {/* Plus de sticky : la navbar est déjà collée et ce bandeau mangeait l'écran */}
      <header className="border-b border-amber-900/40 bg-neutral-950/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <button
              onClick={() => navigate('/ideas')}
              className="text-amber-200/60 hover:text-amber-100 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans mb-1 sm:mb-2"
            >
              &larr; Retour au carnet
            </button>
            <h1 className="text-xl sm:text-3xl font-bold text-amber-100">Versions de l’idée</h1>
            <p className="text-sm text-amber-200/50 mt-1 truncate">{idea.name}</p>
          </div>

          <div className="flex flex-wrap items-stretch gap-2 sm:gap-3">
            <div className="rounded-xl sm:rounded-2xl border border-amber-900/30 bg-neutral-900 px-3 sm:px-4 py-2 sm:py-3 sm:min-w-28">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-amber-200/40">Versions</div>
              <div className="text-lg sm:text-xl font-bold text-amber-100">{versions.length}</div>
            </div>
            <div className="rounded-xl sm:rounded-2xl border border-amber-900/30 bg-neutral-900 px-3 sm:px-4 py-2 sm:py-3 sm:min-w-28">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-amber-200/40">Sélection</div>
              <div className="text-lg sm:text-xl font-bold text-amber-100">{selectedVersion ? `v${selectedVersion.versionNumber}` : '-'}</div>
            </div>
            <button
              onClick={() => navigate('/ideas')}
              className="hidden sm:block px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-sm font-medium transition-colors cursor-pointer"
            >
              Ouvrir le carnet
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
        {feedback && (
          <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/30 px-4 py-3 text-emerald-300 text-sm font-medium">
            {feedback}
          </div>
        )}

        {/* Filtres */}
        <section className="rounded-2xl sm:rounded-3xl border border-amber-900/25 bg-neutral-950/55 p-3 sm:p-5 shadow-xl space-y-3 sm:space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 lg:grid-cols-[minmax(0,1fr)_180px] flex-1">
              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-1.5">Filtrer</label>
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Nom, version, id..."
                  className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-3 sm:px-4 py-2.5 sm:py-3 text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div>
                <label className="block text-[11px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-1.5">Trier</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-3 sm:px-4 py-2.5 sm:py-3 text-amber-100 focus:outline-none"
                >
                  <option value="newest">Récentes</option>
                  <option value="oldest">Anciennes</option>
                  <option value="version">N° version</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 lg:flex">
              <button onClick={handleCreateVersion} className={`${btnBase} px-2 sm:px-3 py-2 border-amber-900/30 bg-amber-950 text-amber-200`}>
                Snapshot
              </button>
              <button onClick={() => setMergeFields({ name: true, description: true })} className={`${btnBase} px-2 sm:px-3 py-2 border-amber-900/30 bg-neutral-900 text-amber-200`}>
                Tout reprendre
              </button>
              <button onClick={() => setMergeFields({ name: false, description: false })} className={`${btnBase} px-2 sm:px-3 py-2 border-amber-900/30 bg-neutral-900 text-amber-200`}>
                Garder l’actuelle
              </button>
            </div>
          </div>
        </section>

        {/* Colonne unique : Versions puis Comparaison */}
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* ───── Versions ───── */}
          <section className="rounded-2xl sm:rounded-3xl border border-amber-900/25 bg-neutral-950/55 shadow-xl overflow-hidden">
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-amber-900/20 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-amber-100">Versions</h2>
                <p className="text-xs sm:text-sm text-amber-200/50">{visibleVersions.length} résultat{visibleVersions.length > 1 ? 's' : ''}</p>
              </div>
            </div>

            {visibleVersions.length === 0 ? (
              <div className="px-5 py-10 text-center text-amber-200/60">Aucune version ne correspond à ce filtre.</div>
            ) : (
              <>
                {/* Mobile : cartes compactes, liste scrollable */}
                <ul className="md:hidden max-h-[42vh] overflow-y-auto divide-y divide-amber-900/10">
                  {visibleVersions.map((version) => {
                    const isSelected = selectedVersion?.id === version.id;
                    return (
                      <li key={version.id} className={`p-3 space-y-2.5 ${isSelected ? 'bg-amber-950/40' : ''}`}>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-800/40 bg-amber-950 text-amber-300 text-sm font-bold">
                            {version.versionNumber}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-amber-100 truncate">{version.name}</div>
                            <div className="text-[11px] text-amber-200/40 truncate">
                              {isSelected ? 'Sélectionnée · ' : ''}ID {version.id} · {new Date(version.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        {renderVersionActions(version, isSelected, 'grid grid-cols-3 gap-2')}
                      </li>
                    );
                  })}
                </ul>

                {/* Desktop : tableau pleine largeur */}
                <div className="hidden md:block max-h-[40vh] overflow-auto">
                  <table className="min-w-full divide-y divide-amber-900/20">
                    <thead className="bg-neutral-950/90 sticky top-0 z-10">
                      <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                        <th className="px-5 py-3 font-medium">Version</th>
                        <th className="px-5 py-3 font-medium">Nom</th>
                        <th className="px-5 py-3 font-medium">Mise à jour</th>
                        <th className="px-5 py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-amber-900/10">
                      {visibleVersions.map((version) => {
                        const isSelected = selectedVersion?.id === version.id;
                        return (
                          <tr key={version.id} className={`transition-colors ${isSelected ? 'bg-amber-950/40' : 'hover:bg-neutral-900/50'}`}>
                            <td className="px-5 py-3">
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
                            <td className="px-5 py-3 text-amber-100">{version.name}</td>
                            <td className="px-5 py-3 text-amber-200/70 text-sm whitespace-nowrap">{new Date(version.updatedAt).toLocaleString()}</td>
                            <td className="px-5 py-3">{renderVersionActions(version, isSelected, 'flex flex-wrap gap-2')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>

          {/* ───── Comparaison ───── */}
          {versionToCompare && (
            <section className="rounded-2xl sm:rounded-3xl border border-amber-900/25 bg-neutral-950/70 p-3 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-1">Comparaison</p>
                  <h2 className="text-xl sm:text-3xl font-bold text-amber-100">Comparer et fusionner</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 lg:flex">
                  <button
                    onClick={() => setCompareMode('current-left')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${compareMode === 'current-left' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                  >
                    Actuelle à gauche
                  </button>
                  <button
                    onClick={() => setCompareMode('version-left')}
                    className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-medium transition-colors cursor-pointer ${compareMode === 'version-left' ? 'bg-amber-700 text-amber-50 border-amber-600' : 'bg-neutral-900 text-amber-200 border-amber-900/30'}`}
                  >
                    Version à gauche
                  </button>
                </div>
              </div>

              {/* Les deux textes : côte à côte dès md, empilés sur mobile */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                {compareCards.map((card) => (
                  <article key={card.label} className="rounded-xl sm:rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-3 sm:p-5 min-w-0">
                    <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-2">{card.label}</div>
                    <h3 className="text-lg sm:text-2xl font-bold text-amber-100 mb-2 break-words">{card.name}</h3>
                    <div className="max-h-56 md:max-h-72 overflow-y-auto text-sm sm:text-base text-amber-100/90 font-serif whitespace-pre-wrap break-words leading-relaxed">
                      {card.description || 'Aucune description.'}
                    </div>
                  </article>
                ))}
              </div>

              {/* Diff ligne par ligne */}
              <div className="rounded-xl sm:rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-3 sm:p-5 space-y-3">
                <div>
                  <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/40 mb-1">Diff ligne par ligne</div>
                  <p className="text-xs sm:text-sm text-amber-200/60">Choisis pour chaque ligne modifiée celle à conserver.</p>
                </div>

                {descriptionDiffRows.length === 0 ? (
                  <div className="px-4 py-6 text-center text-amber-200/50 text-sm">Aucune ligne de description à comparer.</div>
                ) : (
                  <>
                    {/* Mobile : une carte par ligne */}
                    <ul className="md:hidden max-h-[45vh] overflow-y-auto space-y-2">
                      {descriptionDiffRows.map((row) => (
                        <li key={row.id} className={`rounded-lg border border-amber-900/20 p-3 space-y-2 ${row.kind === 'equal' ? 'bg-neutral-950/35' : 'bg-neutral-950/70'}`}>
                          <div className="flex items-center justify-between text-[11px] text-amber-200/40">
                            <span>Ligne {lineNumberOf(row)}</span>
                            {row.kind === 'equal' && <span className="text-emerald-300">Identique</span>}
                          </div>
                          {row.kind === 'equal' ? (
                            <div className="text-sm text-amber-100/80 whitespace-pre-wrap break-words">{renderSide(row, 'current')}</div>
                          ) : (
                            <>
                              <div>
                                <div className="text-[10px] uppercase tracking-widest text-amber-200/40 mb-0.5">Actuel</div>
                                <div className={`rounded px-2 py-1 text-sm text-amber-100/80 whitespace-pre-wrap break-words ${sideBg(row, 'current')}`}>{renderSide(row, 'current')}</div>
                              </div>
                              <div>
                                <div className="text-[10px] uppercase tracking-widest text-amber-200/40 mb-0.5">Version</div>
                                <div className={`rounded px-2 py-1 text-sm text-amber-100/80 whitespace-pre-wrap break-words ${sideBg(row, 'version')}`}>{renderSide(row, 'version')}</div>
                              </div>
                              {renderLineChoice(row)}
                            </>
                          )}
                        </li>
                      ))}
                    </ul>

                    {/* Desktop : tableau */}
                    <div className="hidden md:block max-h-[38vh] overflow-auto rounded-2xl border border-amber-900/20">
                      <table className="min-w-full divide-y divide-amber-900/10">
                        <thead className="bg-neutral-950/90 sticky top-0 z-10">
                          <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                            <th className="px-4 py-3 font-medium">Ligne</th>
                            <th className="px-4 py-3 font-medium">Actuel</th>
                            <th className="px-4 py-3 font-medium">Version</th>
                            <th className="px-4 py-3 font-medium">Choix</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-900/10">
                          {descriptionDiffRows.map((row) => (
                            <tr key={row.id} className={row.kind === 'equal' ? 'bg-neutral-950/35' : 'bg-neutral-950/55'}>
                              <td className="px-4 py-3 align-top text-xs text-amber-200/40 whitespace-nowrap">{lineNumberOf(row)}</td>
                              <td className={`px-4 py-3 align-top whitespace-pre-wrap break-words text-sm text-amber-100/80 ${sideBg(row, 'current')}`}>{renderSide(row, 'current')}</td>
                              <td className={`px-4 py-3 align-top whitespace-pre-wrap break-words text-sm text-amber-100/80 ${sideBg(row, 'version')}`}>{renderSide(row, 'version')}</td>
                              <td className="px-4 py-3 align-top">{renderLineChoice(row)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>

              {/* Fusion */}
              <div className="rounded-xl sm:rounded-2xl border border-amber-900/20 bg-neutral-950/60 p-3 sm:p-5 space-y-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <span className="text-sm font-medium text-amber-100">Choix de fusion</span>
                  <label className="flex items-center gap-2 text-sm text-amber-200/70">
                    <input
                      type="checkbox"
                      checked={mergeFields.name}
                      onChange={(e) => setMergeFields((current) => ({ ...current, name: e.target.checked }))}
                    />
                    Nom
                  </label>
                  <label className="flex items-center gap-2 text-sm text-amber-200/70">
                    <input
                      type="checkbox"
                      checked={mergeFields.description}
                      onChange={(e) => setMergeFields((current) => ({ ...current, description: e.target.checked }))}
                    />
                    Description
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRestoreVersion(versionToCompare)}
                    disabled={isRestoring}
                    className="col-span-2 sm:col-span-1 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-medium transition-colors shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isRestoring ? 'Restauration...' : 'Fusionner les champs cochés'}
                  </button>
                  <button
                    onClick={() => setMergeFields({ name: true, description: true })}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 text-sm font-medium transition-colors border border-amber-900/30 cursor-pointer"
                  >
                    Tout cocher
                  </button>
                  <button
                    onClick={() => setMergeFields({ name: false, description: false })}
                    className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-200 text-sm font-medium transition-colors border border-amber-900/30 cursor-pointer"
                  >
                    Tout décocher
                  </button>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export default IdeaVersionsPage;