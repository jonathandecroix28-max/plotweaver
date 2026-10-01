import { useEffect, useState } from 'react';
import { EXPORT_FORMATS as FORMATS, exportBook, loadBookForExport, type ExportFormat } from '../services/exportService';

const AUTHOR_KEY = 'plotweaver:export-author';

type ExportMenuProps = {
  bookId: number;
  className?: string;
};

export function ExportMenu({ bookId, className = '' }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [author, setAuthor] = useState(() => {
    try {
      return localStorage.getItem(AUTHOR_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [titlePage, setTitlePage] = useState(true);
  const [chapterNumbers, setChapterNumbers] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy]);

  const close = () => {
    if (!busy) setOpen(false);
  };

  const handleExport = async () => {
    setBusy(true);
    setError(null);

    try {
      try {
        localStorage.setItem(AUTHOR_KEY, author.trim());
      } catch {
        /* stockage indisponible : on ignore */
      }

      const book = await loadBookForExport(bookId, author.trim() || undefined);
      if (book.chapters.length === 0) {
        setError('Ce roman ne contient aucun chapitre à exporter.');
        return;
      }

      await exportBook(book, format, { titlePage, chapterNumbers });
      setOpen(false);
    } catch (exportError) {
      console.error('Erreur lors de l’export :', exportError);
      setError('L’export a échoué. Réessaie dans un instant.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className={`px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-sm font-medium transition-colors cursor-pointer flex items-center justify-center gap-2 ${className}`}
      >
        <span aria-hidden>📤</span>
        Exporter
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-6"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-amber-900/30 bg-[#1c1411] text-[#fcf9f2] font-serif shadow-2xl p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom))] space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 id="export-title" className="text-xl sm:text-2xl font-bold text-amber-100">
                  Exporter le roman
                </h2>
                <p className="text-sm text-amber-200/50 mt-1">Tous les chapitres, dans l’ordre.</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="text-amber-200/50 hover:text-amber-100 text-xl leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Format */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {FORMATS.map((item) => (
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

            {/* Options */}
            <div className="space-y-3">
              <div>
                <label htmlFor="export-author" className="block text-[11px] uppercase tracking-[0.22em] text-amber-200/40 mb-1.5">
                  Auteur (facultatif)
                </label>
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
            </div>

            {error && (
              <div className="rounded-xl border border-red-900/40 bg-red-950/30 px-4 py-3 text-sm text-red-200">{error}</div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={close}
                disabled={busy}
                className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={busy}
                className="px-4 py-3 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-medium transition-colors shadow-md cursor-pointer disabled:opacity-60"
              >
                {busy ? 'Préparation…' : 'Exporter'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExportMenu;