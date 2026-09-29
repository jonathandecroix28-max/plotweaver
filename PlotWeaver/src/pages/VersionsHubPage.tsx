import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { offlineChapterService } from '../services/offlineChapterService';
import { offlineChapterVersionService } from '../services/offlineChapterVersionService';
import { offlineIdeaService } from '../services/offlineIdeaService';
import { offlineIdeaVersionService } from '../services/offlineIdeaVersionService';
import type { ChapterVersionResponse } from '../types/chapterVersion';
import type { IdeaVersionResponse } from '../types/ideaVersion';

type VersionRow =
  | {
      kind: 'chapter';
      id: number;
      version: ChapterVersionResponse;
      parentTitle: string;
      parentSubtitle: string;
      openPath: string | null;
    }
  | {
      kind: 'idea';
      id: number;
      version: IdeaVersionResponse;
      parentTitle: string;
      parentSubtitle: string;
      openPath: string | null;
    };

export function VersionsHubPage() {
  const navigate = useNavigate();
  const [chapterRows, setChapterRows] = useState<VersionRow[]>([]);
  const [ideaRows, setIdeaRows] = useState<VersionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [chapterVersions, ideaVersions] = await Promise.all([
          offlineChapterVersionService.getAll(),
          offlineIdeaVersionService.getAll(),
        ]);

        const chapterRowsData = await Promise.all(
          chapterVersions.map(async (version) => {
            try {
              const chapter = await offlineChapterService.getById(version.chapterId);
              return {
                kind: 'chapter' as const,
                id: version.id,
                version,
                parentTitle: chapter.title,
                parentSubtitle: `Chapitre ${chapter.chapter_number} · Livre #${chapter.book_id}`,
                openPath: `/books/${chapter.book_id}/chapters/${chapter.id}/versions/${version.id}`,
              };
            } catch {
              return {
                kind: 'chapter' as const,
                id: version.id,
                version,
                parentTitle: 'Chapitre supprimé',
                parentSubtitle: `Parent introuvable · chapterId ${version.chapterId}`,
                openPath: null,
              };
            }
          })
        );

        const ideaRowsData = await Promise.all(
          ideaVersions.map(async (version) => {
            try {
              const idea = await offlineIdeaService.getById(version.ideaId);
              return {
                kind: 'idea' as const,
                id: version.id,
                version,
                parentTitle: idea.name,
                parentSubtitle: idea.bookId ? `Roman #${idea.bookId}` : 'Carnet global',
                openPath: `/ideas/${idea.id}/versions/${version.id}`,
              };
            } catch {
              return {
                kind: 'idea' as const,
                id: version.id,
                version,
                parentTitle: 'Idée supprimée',
                parentSubtitle: `Parent introuvable · ideaId ${version.ideaId}`,
                openPath: null,
              };
            }
          })
        );

        if (cancelled) return;
        setChapterRows(chapterRowsData);
        setIdeaRows(ideaRowsData);
      } catch (loadError) {
        console.error('Erreur de chargement du tableau des versions :', loadError);
        if (!cancelled) setError('Impossible de charger les versions.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    return [
      { label: 'Versions chapitre', value: chapterRows.length },
      { label: 'Versions idée', value: ideaRows.length },
      { label: 'Total', value: chapterRows.length + ideaRows.length },
    ];
  }, [chapterRows.length, ideaRows.length]);

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] font-serif overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-2">Administration</p>
            <h1 className="text-4xl font-bold text-amber-100">Versions</h1>
            <p className="text-amber-200/55 mt-2 max-w-2xl">
              Accédez aux tableaux de versions pour les chapitres et les idées depuis un point d’entrée unique.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-3xl border border-amber-900/25 bg-neutral-950/60 p-5 sm:p-6 shadow-xl">
              <div className="text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-2">{stat.label}</div>
              <div className="text-4xl font-bold text-amber-100">{stat.value}</div>
            </div>
          ))}
        </section>

        {isLoading ? (
          <div className="rounded-3xl border border-amber-900/25 bg-neutral-950/55 p-8 text-amber-200/60 shadow-xl">
            Chargement du tableau des versions...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-900/30 bg-red-950/20 p-8 text-red-200 shadow-xl">
            {error}
          </div>
        ) : (
          <>
            <section className="rounded-3xl border border-amber-900/25 bg-neutral-950/55 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-900/20 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-amber-100">Versions des chapitres</h2>
                  <p className="text-sm text-amber-200/50">Accès direct à chaque chapitre et à son historique</p>
                </div>
                <div className="text-xs text-amber-200/40 uppercase tracking-[0.22em]">Chapter versions</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-900/20">
                  <thead className="bg-neutral-950/80">
                    <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                      <th className="px-5 py-4 font-medium">Parent</th>
                      <th className="px-5 py-4 font-medium">Version</th>
                      <th className="px-5 py-4 font-medium">Mise à jour</th>
                      <th className="px-5 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10">
                    {chapterRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-amber-200/60">
                          Aucune version de chapitre.
                        </td>
                      </tr>
                    ) : (
                      chapterRows.map((row) => (
                        <tr key={`chapter-${row.id}`} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-amber-100">{row.parentTitle}</div>
                            <div className="text-xs text-amber-200/40">{row.parentSubtitle}</div>
                          </td>
                          <td className="px-5 py-4 text-amber-100">v{row.version.versionNumber}</td>
                          <td className="px-5 py-4 text-amber-200/70 text-sm">{new Date(row.version.updatedAt).toLocaleString()}</td>
                          <td className="px-5 py-4">
                              <button
                                onClick={() => row.openPath && navigate(row.openPath)}
                                disabled={!row.openPath}
                                className="px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {row.openPath ? 'Ouvrir' : 'Parent manquant'}
                              </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-3xl border border-amber-900/25 bg-neutral-950/55 shadow-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-amber-900/20 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-amber-100">Versions des idées</h2>
                  <p className="text-sm text-amber-200/50">Accès direct à chaque idée et à son historique</p>
                </div>
                <div className="text-xs text-amber-200/40 uppercase tracking-[0.22em]">Idea versions</div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-amber-900/20">
                  <thead className="bg-neutral-950/80">
                    <tr className="text-left text-xs uppercase tracking-[0.22em] text-amber-200/40">
                      <th className="px-5 py-4 font-medium">Parent</th>
                      <th className="px-5 py-4 font-medium">Version</th>
                      <th className="px-5 py-4 font-medium">Mise à jour</th>
                      <th className="px-5 py-4 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-900/10">
                    {ideaRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-amber-200/60">
                          Aucune version d’idée.
                        </td>
                      </tr>
                    ) : (
                      ideaRows.map((row) => (
                        <tr key={`idea-${row.id}`} className="hover:bg-neutral-900/50 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-semibold text-amber-100">{row.parentTitle}</div>
                            <div className="text-xs text-amber-200/40">{row.parentSubtitle}</div>
                          </td>
                          <td className="px-5 py-4 text-amber-100">v{row.version.versionNumber}</td>
                          <td className="px-5 py-4 text-amber-200/70 text-sm">{new Date(row.version.updatedAt).toLocaleString()}</td>
                          <td className="px-5 py-4">
                              <button
                                onClick={() => row.openPath && navigate(row.openPath)}
                                disabled={!row.openPath}
                                className="px-3 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-amber-50 text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {row.openPath ? 'Ouvrir' : 'Parent manquant'}
                              </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default VersionsHubPage;