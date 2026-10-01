import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  EXPORT_FORMATS,
  buildPreviewDocument,
  countWords,
  exportBook,
  loadBookForExport,
  loadBooksForExport,
  type ExportBook,
  type ExportFormat,
} from '../services/exportService';

const AUTHOR_KEY = 'plotweaver:export-author';

type BookOption = { id: number; title: string };
type Status = { type: 'ok' | 'error'; text: string } | null;

function readAuthor(): string {
  try {
    return localStorage.getItem(AUTHOR_KEY) ?? '';
  } catch {
    return '';
  }
}

export function ExportPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const bookIdParam = Number(searchParams.get('book')) || null;

  const [books, setBooks] = useState<BookOption[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [booksError, setBooksError] = useState<string | null>(null);

  const [book, setBook] = useState<ExportBook | null>(null);
  const [bookLoading, setBookLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [author, setAuthor] = useState(readAuthor);
  const [debouncedAuthor, setDebouncedAuthor] = useState(author);
  const [titlePage, setTitlePage] = useState(true);
  const [chapterNumbers, setChapterNumbers] = useState(true);

  const [showPreview, setShowPreview] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  /* ───── Chargement de la liste des romans ───── */
  useEffect(() => {
    let cancelled = false;

    loadBooksForExport()
      .then((list) => {
        if (cancelled) return;
        setBooks(list);
        // Sans roman choisi dans l'URL, on prend le premier
        if (!bookIdParam && list.length > 0) {
          setSearchParams({ book: String(list[0].id) }, { replace: true });
        }
      })
      .catch((error) => {
        console.error('Erreur de chargement des romans :', error);
        if (!cancelled) setBooksError('Impossible de charger tes romans.');
      })
      .finally(() => {
        if (!cancelled) setBooksLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ───── Chargement du roman choisi (avec ses chapitres) ───── */
  useEffect(() => {
    if (!bookIdParam) {
      setBook(null);
      return;
    }

    let cancelled = false;
    setBookLoading(true);
    setStatus(null);

    loadBookForExport(bookIdParam)
      .then((loaded) => {
        if (cancelled) return;
        setBook(loaded);
        setSelected(new Set(loaded.chapters.map((_, index) => index)));
      })
      .catch((error) => {
        console.error('Erreur de chargement du roman :', error);
        if (cancelled) return;
        setBook(null);
        setStatus({ type: 'error', text: 'Impossible de charger ce roman.' });
      })
      .finally(() => {
        if (!cancelled) setBookLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [bookIdParam]);

  // On attend la fin de la saisie avant de reconstruire l'aperçu
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedAuthor(author), 300);
    return () => clearTimeout(timer);
  }, [author]);

  /* ───── Données dérivées ───── */
  const options = useMemo(() => ({ titlePage, chapterNumbers }), [titlePage, chapterNumbers]);

  const selectedChapters = useMemo(
    () => (book ? book.chapters.filter((_, index) => selected.has(index)) : []),
    [book, selected]
  );

  const totalWords = useMemo(
    () => selectedChapters.reduce((sum, chapter) => sum + countWords(chapter.content), 0),
    [selectedChapters]
  );

  const previewHtml = useMemo(() => {
    if (!showPreview || !book || selectedChapters.length === 0) return '';
    return buildPreviewDocument(
      { ...book, author: debouncedAuthor.trim() || undefined, chapters: selectedChapters },
      options
    );
  }, [showPreview, book, selectedChapters, debouncedAuthor, options]);

  /* ───── Actions ───── */
  const toggleChapter = (index: number) => {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set((book?.chapters ?? []).map((_, index) => index)));
  const selectNone = () => setSelected(new Set());

  const handleExport = async () => {
    if (!book || selectedChapters.length === 0) return;

    setBusy(true);
    setStatus(null);
    try {
      try {
        localStorage.setItem(AUTHOR_KEY, author.trim());
      } catch {
        /* stockage indisponible : on ignore */
      }

      await exportBook(
        { ...book, author: author.trim() || undefined, chapters: selectedChapters },
        format,
        options
      );

      setStatus({
        type: 'ok',
        text:
          format === 'pdf'
            ? 'La boîte d’impression est ouverte : choisis « Enregistrer au format PDF ».'
            : 'Ton fichier a été généré et téléchargé.',
      });
    } catch (error) {
      console.error('Erreur lors de l’export :', error);
      setStatus({ type: 'error', text: 'L’export a échoué. Réessaie dans un instant.' });
    } finally {
      setBusy(false);
    }
  };

  const sectionClass = 'rounded-2xl sm:rounded-3xl border border-amber-900/25 bg-neutral-950/60 p-4 sm:p-5 shadow-xl space-y-3';
  const labelClass = 'block text-[11px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/40';

  /* ───── Rendu ───── */
  return (
    <div className="min-h-full bg-[#1c1411] text-[#fcf9f2] font-serif overflow-x-hidden">
      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <header>
          <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-1 sm:mb-2">Publication</p>
          <h1 className="text-2xl sm:text-4xl font-bold text-amber-100">Exporter un roman</h1>
          <p className="text-sm sm:text-base text-amber-200/55 mt-1 sm:mt-2 max-w-2xl">
            Choisis le roman, les chapitres et le format, vérifie l’aperçu, puis télécharge ton manuscrit.
          </p>
        </header>

        {booksLoading ? (
          <div className={`${sectionClass} text-amber-200/60`}>Chargement de tes romans...</div>
        ) : booksError ? (
          <div className="rounded-2xl border border-red-900/30 bg-red-950/20 p-6 text-red-200">{booksError}</div>
        ) : books.length === 0 ? (
          <div className={`${sectionClass} text-center py-10`}>
            <div className="text-3xl mb-2" aria-hidden>📚</div>
            <p className="text-amber-200/70">Tu n’as pas encore de roman à exporter.</p>
            <Link
              to="/books"
              className="inline-block mt-4 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-medium transition-colors"
            >
              Aller à mes romans
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 lg:gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
            {/* ───── Réglages ───── */}
            <div className="space-y-4">
              {/* Roman */}
              <section className={sectionClass}>
                <label htmlFor="export-book" className={labelClass}>Roman</label>
                <select
                  id="export-book"
                  value={bookIdParam ?? ''}
                  onChange={(event) => setSearchParams({ book: event.target.value })}
                  className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-3 sm:px-4 py-2.5 sm:py-3 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  {books.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </section>

              {/* Chapitres */}
              <section className={sectionClass}>
                <div className="flex items-center justify-between gap-3">
                  <span className={labelClass}>Chapitres</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="px-2.5 py-1.5 rounded-md text-xs border border-amber-900/30 bg-neutral-900 text-amber-200 cursor-pointer"
                    >
                      Tous
                    </button>
                    <button
                      type="button"
                      onClick={selectNone}
                      className="px-2.5 py-1.5 rounded-md text-xs border border-amber-900/30 bg-neutral-900 text-amber-200 cursor-pointer"
                    >
                      Aucun
                    </button>
                  </div>
                </div>

                {bookLoading ? (
                  <p className="text-sm text-amber-200/50 py-4">Chargement des chapitres...</p>
                ) : !book || book.chapters.length === 0 ? (
                  <p className="text-sm text-amber-200/50 py-4">Ce roman ne contient aucun chapitre.</p>
                ) : (
                  <ul className="max-h-60 overflow-y-auto rounded-xl border border-amber-900/20 divide-y divide-amber-900/10">
                    {book.chapters.map((chapter, index) => (
                      <li key={`${chapter.number}-${index}`}>
                        <label className="flex items-center gap-3 px-3 py-2.5 text-sm text-amber-100/90 cursor-pointer hover:bg-neutral-900/50">
                          <input
                            type="checkbox"
                            checked={selected.has(index)}
                            onChange={() => toggleChapter(index)}
                          />
                          <span className="text-amber-200/40 shrink-0">{chapter.number}.</span>
                          <span className="truncate">{chapter.title}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                )}

                {book && book.chapters.length > 0 && (
                  <p className="text-xs text-amber-200/50">
                    {selectedChapters.length} chapitre{selectedChapters.length > 1 ? 's' : ''} sélectionné
                    {selectedChapters.length > 1 ? 's' : ''} · {totalWords.toLocaleString('fr-FR')} mots
                  </p>
                )}
              </section>

              {/* Format */}
              <section className={sectionClass}>
                <span className={labelClass}>Format</span>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {EXPORT_FORMATS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setFormat(item.key)}
                      aria-pressed={format === item.key}
                      className={`text-left rounded-2xl border p-3 transition cursor-pointer ${
                        format === item.key
                          ? 'bg-amber-900/60 border-amber-600 text-amber-50'
                          : 'bg-neutral-900 border-amber-900/30 text-amber-200 hover:border-amber-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        <span aria-hidden className="text-lg">{item.icon}</span>
                        {item.label}
                      </div>
                      <p className="mt-1 text-[11px] sm:text-xs text-amber-200/50 leading-snug">{item.hint}</p>
                    </button>
                  ))}
                </div>
              </section>

              {/* Options */}
              <section className={sectionClass}>
                <div>
                  <label htmlFor="export-author" className={`${labelClass} mb-1.5`}>Auteur (facultatif)</label>
                  <input
                    id="export-author"
                    value={author}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="Ton nom ou ton pseudo"
                    className="w-full rounded-xl border border-amber-900/30 bg-neutral-900 px-4 py-2.5 text-amber-100 placeholder:text-amber-200/30 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-amber-200/80 cursor-pointer">
                  <input type="checkbox" checked={titlePage} onChange={(event) => setTitlePage(event.target.checked)} />
                  Ajouter une page de titre
                </label>
                <label className="flex items-center gap-2 text-sm text-amber-200/80 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chapterNumbers}
                    onChange={(event) => setChapterNumbers(event.target.checked)}
                  />
                  Afficher les numéros de chapitre
                </label>
              </section>

              {/* Action */}
              <section className="space-y-3">
                {status && (
                  <div
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      status.type === 'ok'
                        ? 'border-emerald-900/30 bg-emerald-950/30 text-emerald-300'
                        : 'border-red-900/40 bg-red-950/30 text-red-200'
                    }`}
                  >
                    {status.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleExport}
                  disabled={busy || bookLoading || selectedChapters.length === 0}
                  className="w-full px-4 py-3.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 font-medium transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {busy ? 'Préparation…' : `Exporter en ${EXPORT_FORMATS.find((item) => item.key === format)?.label}`}
                </button>
                {selectedChapters.length === 0 && !bookLoading && book && book.chapters.length > 0 && (
                  <p className="text-xs text-amber-200/50 text-center">Sélectionne au moins un chapitre.</p>
                )}
              </section>
            </div>

            {/* ───── Aperçu ───── */}
            <section className={`${sectionClass} lg:sticky lg:top-24`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className={labelClass}>Aperçu</span>
                  <p className="text-xs text-amber-200/40 mt-1">
                    Mise en page indicative : le rendu final dépend du format choisi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPreview((value) => !value)}
                  className="shrink-0 px-3 py-2 rounded-lg border border-amber-900/30 bg-neutral-900 text-amber-200 text-xs font-medium cursor-pointer"
                >
                  {showPreview ? 'Masquer' : 'Afficher'}
                </button>
              </div>

              {showPreview &&
                (previewHtml ? (
                  <iframe
                    title="Aperçu de l’export"
                    sandbox=""
                    srcDoc={previewHtml}
                    className="w-full h-[60vh] lg:h-[calc(100vh-14rem)] rounded-xl border border-amber-900/20 bg-white"
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-amber-900/30 py-16 text-center text-sm text-amber-200/50">
                    {bookLoading ? 'Chargement...' : 'Rien à afficher pour le moment.'}
                  </div>
                ))}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

export default ExportPage;