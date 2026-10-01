import JSZip from 'jszip';
import DOMPurify from 'dompurify';
import { offlineBookService } from './offlineBookService';
import { offlineChapterService } from './offlineChapterService';

export type ExportFormat = 'pdf' | 'epub' | 'doc' | 'txt';

export type ExportChapter = { number: number; title: string; content: string };
export type ExportBook = { title: string; author?: string; chapters: ExportChapter[] };
export type ExportOptions = { titlePage: boolean; chapterNumbers: boolean };

export const EXPORT_FORMATS: { key: ExportFormat; icon: string; label: string; hint: string }[] = [
  { key: 'pdf', icon: '📄', label: 'PDF', hint: 'Ouvre l’impression : choisis « Enregistrer au format PDF »' },
  { key: 'epub', icon: '📖', label: 'EPUB', hint: 'Pour les liseuses et applications de lecture' },
  { key: 'doc', icon: '📝', label: 'Word', hint: 'Fichier .doc modifiable (Word, LibreOffice)' },
  { key: 'txt', icon: '🔤', label: 'Texte brut', hint: 'Fichier .txt sans mise en forme' },
];

/* ───────────────────────── Chargement des données ───────────────────────── */

/**
 * Récupère le roman et ses chapitres depuis le stockage hors ligne.
 * ⚠️ Si tes services ont des noms de méthodes différents, c'est la seule
 * fonction à adapter (getById / getByBookId / getAll).
 */
export async function loadBookForExport(bookId: number, author?: string): Promise<ExportBook> {
  const bookService: any = offlineBookService;
  const chapterService: any = offlineChapterService;

  const book = await bookService.getById(bookId);

  const rawChapters: any[] =
    typeof chapterService.getByBookId === 'function'
      ? await chapterService.getByBookId(bookId)
      : await chapterService.getAll();

  const ofThisBook = rawChapters
    .filter((chapter) => Number(chapter.book_id ?? chapter.bookId) === bookId)
    .sort(
      (a, b) =>
        Number(a.chapter_number ?? a.chapterNumber ?? 0) - Number(b.chapter_number ?? b.chapterNumber ?? 0)
    );

  const chapters: ExportChapter[] = await Promise.all(
    ofThisBook.map(async (chapter) => {
      // Certaines listes ne renvoient pas le contenu : on le récupère à la demande
      const full = typeof chapter.content === 'string' ? chapter : await chapterService.getById(chapter.id);
      const number = Number(chapter.chapter_number ?? chapter.chapterNumber ?? 0);
      return {
        number,
        title: full.title ?? full.name ?? `Chapitre ${number}`,
        content: full.content ?? '',
      };
    })
  );

  return {
    title: book?.title ?? book?.name ?? 'Sans titre',
    author,
    chapters,
  };
}

/** Liste des romans disponibles pour l'export (id + titre). */
export async function loadBooksForExport(): Promise<{ id: number; title: string }[]> {
  const bookService: any = offlineBookService;
  const books: any[] = await bookService.getAll();
  return books.map((book) => ({
    id: Number(book.id),
    title: book.title ?? book.name ?? `Roman #${book.id}`,
  }));
}

/* ───────────────────────── Utilitaires ───────────────────────── */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function looksLikeHtml(text: string): boolean {
  return /<[a-z][^>]*>/i.test(text);
}

// HTML nettoyé (le contenu vient de l'éditeur, on ne lui fait jamais confiance aveuglément)
function normalizeContent(raw: string): string {
  const text = raw || '';
  if (looksLikeHtml(text)) return DOMPurify.sanitize(text);

  return text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('\n');
}

function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n');
  const text = new DOMParser().parseFromString(withBreaks, 'text/html').body.textContent ?? '';
  return text.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function chapterLabel(chapter: ExportChapter, options: ExportOptions): string {
  return options.chapterNumbers ? `Chapitre ${chapter.number} — ${chapter.title}` : chapter.title;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ───────────────────────── Mise en page commune ───────────────────────── */

const BOOK_CSS = `
body { font-family: Georgia, 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #111; }
h1 { font-size: 28pt; text-align: center; margin: 0 0 0.4em; }
.title-page { text-align: center; padding-top: 30%; page-break-after: always; break-after: page; }
.author { font-size: 14pt; font-style: italic; margin: 0; }
.chapter { page-break-before: always; break-before: page; }
.chapter header { text-align: center; margin: 2em 0 1.5em; }
.kicker { text-transform: uppercase; letter-spacing: 0.2em; font-size: 9pt; color: #666; margin: 0 0 0.4em; }
h2 { font-size: 20pt; margin: 0; }
.chapter p { margin: 0; text-indent: 1.4em; text-align: justify; }
.chapter header + p, .chapter hr + p { text-indent: 0; }
.chapter hr { border: 0; text-align: center; margin: 1.2em 0; }
.chapter hr::after { content: '* * *'; color: #666; }
blockquote { margin: 1em 2em; font-style: italic; }
`;

function titlePageHtml(book: ExportBook): string {
  return `<section class="title-page"><h1>${escapeHtml(book.title)}</h1>${
    book.author ? `<p class="author">${escapeHtml(book.author)}</p>` : ''
  }</section>`;
}

function chapterHtml(chapter: ExportChapter, options: ExportOptions): string {
  const kicker = options.chapterNumbers ? `<p class="kicker">Chapitre ${chapter.number}</p>` : '';
  return `<section class="chapter"><header>${kicker}<h2>${escapeHtml(chapter.title)}</h2></header>${normalizeContent(
    chapter.content
  )}</section>`;
}

function bookBodyHtml(book: ExportBook, options: ExportOptions): string {
  return [
    options.titlePage ? titlePageHtml(book) : '',
    ...book.chapters.map((chapter) => chapterHtml(chapter, options)),
  ].join('\n');
}

/* ───────────────────────── PDF (via l'impression du navigateur) ───────────────────────── */

function buildPrintableDocument(book: ExportBook, options: ExportOptions): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>${escapeHtml(
    book.title
  )}</title><style>@page { margin: 2.5cm; } ${BOOK_CSS}</style></head><body>${bookBodyHtml(book, options)}</body></html>`;
}

function printHtml(html: string, title: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);

    const previousTitle = document.title;
    const cleanup = () => {
      document.title = previousTitle;
      iframe.remove();
    };

    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) {
        cleanup();
        resolve();
        return;
      }

      // Le titre de la page sert souvent de nom de fichier suggéré pour le PDF
      document.title = title;
      win.addEventListener('afterprint', cleanup, { once: true });
      win.focus();
      win.print();
      resolve();

      // Filet de sécurité : certains navigateurs mobiles n'émettent pas "afterprint"
      setTimeout(cleanup, 120_000);
    };

    iframe.srcdoc = html;
  });
}

/* ───────────────────────── EPUB ───────────────────────── */

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Convertit du HTML en XHTML valide (obligatoire pour l'EPUB)
function toXhtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const serializer = new XMLSerializer();
  return Array.from(doc.body.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join('');
}

function xhtmlPage(title: string, bodyXhtml: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="fr" lang="fr">
<head><meta charset="utf-8"/><title>${escapeHtml(title)}</title><link rel="stylesheet" type="text/css" href="style.css"/></head>
<body>${bodyXhtml}</body>
</html>`;
}

async function buildEpub(book: ExportBook, options: ExportOptions): Promise<Blob> {
  const zip = new JSZip();
  const bookId = `urn:uuid:${uuid()}`;
  const modified = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  // Le fichier "mimetype" doit être le premier et non compressé
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
  zip.file(
    'META-INF/container.xml',
    `<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
  );
  zip.file('OEBPS/style.css', BOOK_CSS);

  const pages: { id: string; href: string; title: string }[] = [];

  if (options.titlePage) {
    pages.push({ id: 'title', href: 'title.xhtml', title: 'Page de titre' });
    zip.file('OEBPS/title.xhtml', xhtmlPage(book.title, toXhtml(titlePageHtml(book))));
  }

  book.chapters.forEach((chapter, index) => {
    const href = `chapter-${index + 1}.xhtml`;
    pages.push({ id: `chapter-${index + 1}`, href, title: chapterLabel(chapter, options) });
    zip.file(`OEBPS/${href}`, xhtmlPage(chapter.title, toXhtml(chapterHtml(chapter, options))));
  });

  zip.file(
    'OEBPS/nav.xhtml',
    xhtmlPage(
      'Table des matières',
      `<nav epub:type="toc" id="toc"><h1>Table des matières</h1><ol>${pages
        .map((page) => `<li><a href="${page.href}">${escapeHtml(page.title)}</a></li>`)
        .join('')}</ol></nav>`
    )
  );

  zip.file(
    'OEBPS/toc.ncx',
    `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head><meta name="dtb:uid" content="${bookId}"/></head>
  <docTitle><text>${escapeHtml(book.title)}</text></docTitle>
  <navMap>${pages
    .map(
      (page, i) =>
        `<navPoint id="np-${i + 1}" playOrder="${i + 1}"><navLabel><text>${escapeHtml(
          page.title
        )}</text></navLabel><content src="${page.href}"/></navPoint>`
    )
    .join('')}</navMap>
</ncx>`
  );

  zip.file(
    'OEBPS/content.opf',
    `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="fr">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${bookId}</dc:identifier>
    <dc:title>${escapeHtml(book.title)}</dc:title>
    <dc:language>fr</dc:language>${book.author ? `\n    <dc:creator>${escapeHtml(book.author)}</dc:creator>` : ''}
    <meta property="dcterms:modified">${modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    ${pages.map((page) => `<item id="${page.id}" href="${page.href}" media-type="application/xhtml+xml"/>`).join('\n    ')}
  </manifest>
  <spine toc="ncx">
    ${pages.map((page) => `<itemref idref="${page.id}"/>`).join('\n    ')}
  </spine>
</package>`
  );

  return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

/* ───────────────────────── Word (.doc) ───────────────────────── */

function buildWord(book: ExportBook, options: ExportOptions): Blob {
  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>${escapeHtml(book.title)}</title><style>${BOOK_CSS}</style></head>
<body>${bookBodyHtml(book, options)}</body></html>`;
  return new Blob(['\ufeff', html], { type: 'application/msword' });
}

/* ───────────────────────── Texte brut ───────────────────────── */

function buildText(book: ExportBook, options: ExportOptions): Blob {
  const parts: string[] = [];

  if (options.titlePage) {
    parts.push([book.title.toUpperCase(), book.author ?? ''].filter(Boolean).join('\n'));
  }

  book.chapters.forEach((chapter) => {
    const heading = chapterLabel(chapter, options);
    parts.push(`${heading}\n${'-'.repeat(Math.min(heading.length, 60))}\n\n${htmlToText(normalizeContent(chapter.content))}`);
  });

  return new Blob([parts.join('\n\n\n')], { type: 'text/plain;charset=utf-8' });
}

/* ───────────────────────── Aperçu et statistiques ───────────────────────── */

/** Nombre de mots d'un chapitre (contenu HTML ou texte brut). */
export function countWords(content: string): number {
  const text = htmlToText(normalizeContent(content));
  return text ? text.split(/\s+/).length : 0;
}

/** Document HTML complet pour l'aperçu à l'écran (à afficher dans une iframe isolée). */
export function buildPreviewDocument(book: ExportBook, options: ExportOptions): string {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><style>${BOOK_CSS}
html { background: #e7e0d2; }
body { max-width: 42rem; margin: 1rem auto; padding: 2.5rem 2rem; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,.25); }
.title-page { padding: 3rem 0; }
.chapter { page-break-before: auto; break-before: auto; border-top: 1px dashed #ccc; margin-top: 2rem; padding-top: 1rem; }
.title-page + .chapter, body > .chapter:first-child { border-top: 0; margin-top: 0; }
@media (max-width: 600px) { body { margin: 0; padding: 1.25rem 1rem; box-shadow: none; } }
</style></head><body>${bookBodyHtml(book, options)}</body></html>`;
}

/* ───────────────────────── Point d'entrée ───────────────────────── */

export async function exportBook(book: ExportBook, format: ExportFormat, options: ExportOptions): Promise<void> {
  const baseName = slugify(book.title) || 'roman';

  switch (format) {
    case 'pdf':
      await printHtml(buildPrintableDocument(book, options), book.title);
      return;
    case 'epub':
      downloadBlob(await buildEpub(book, options), `${baseName}.epub`);
      return;
    case 'doc':
      downloadBlob(buildWord(book, options), `${baseName}.doc`);
      return;
    case 'txt':
      downloadBlob(buildText(book, options), `${baseName}.txt`);
      return;
  }
}