import { useParams, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useChapterReader } from '../hooks/useChapterReader'; 

export function ChapterReadPage() {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();

  const numBookId = bookId ? Number(bookId) : null;
  const numChapterId = chapterId ? Number(chapterId) : null;

  const { chapter, isLoading, error, prevChapter, nextChapter } = useChapterReader(numBookId, numChapterId);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcf9f2] flex items-center justify-center font-serif text-amber-950">
        Chargement du grimoire...
      </div>
    );
  }

  if (error || !chapter) {
    navigate('/404', { replace: true });
    return null; 
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c221e] flex flex-col font-serif">
      {/* Barre de navigation épurée */}
      <header className="border-b border-amber-900/10 bg-[#fffdf9] px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <button
          onClick={() => navigate(`/books/${bookId}`)}
          className="text-amber-900/60 hover:text-amber-950 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans"
        >
          &larr; Retour au livre
        </button>
        <span className="text-sm font-sans text-amber-900/70 font-medium">
          Chapitre {chapter.chapter_number}
        </span>
        <div className="w-16"></div>
      </header>

      {/* Contenu du livre stylisé */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-16 flex flex-col">
        <h1 className="text-4xl md:text-5xl font-bold font-serif text-amber-950 mb-10 text-center">
          {chapter.title}
        </h1>

        <div 
          className="prose prose-amber max-w-none text-lg leading-relaxed text-amber-950/90 font-serif mb-16"
          dangerouslySetInnerHTML={{ 
            __html: DOMPurify.sanitize(chapter.content || '') 
          }} 
        />

        {/* Boutons de navigation Précédent / Suivant en bas de page */}
        <div className="border-t border-amber-900/10 pt-6 flex items-center justify-between font-sans">
          {prevChapter ? (
            <button
              onClick={() => navigate(`/books/${bookId}/chapters/${prevChapter.id}/read`)}
              className="px-5 py-2.5 rounded-xl border border-amber-900/20 hover:bg-amber-950/5 text-amber-950 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2"
            >
              &larr; Chapitre précédent
            </button>
          ) : (
            <div></div>
          )}

          {nextChapter && (
            <button
              onClick={() => navigate(`/books/${bookId}/chapters/${nextChapter.id}/read`)}
              className="px-5 py-2.5 rounded-xl bg-amber-900 hover:bg-amber-950 text-amber-50 text-sm font-medium transition-colors shadow-sm cursor-pointer flex items-center gap-2 ml-auto"
            >
              Chapitre suivant &rarr;
            </button>
          )}
        </div>
      </main>
    </div>
  );
}