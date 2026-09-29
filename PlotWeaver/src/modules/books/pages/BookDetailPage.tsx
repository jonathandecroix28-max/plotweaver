import { useState, useEffect } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useBook } from '../hooks/useBook'; 
import { useChapters } from '../../chapters/hooks/useChapter';
import { useDeleteChapter } from '../../chapters/hooks/useDeleteChapter';
import { ChapterModal } from '../../chapters/components/ChapterModal'; 
import { formatDate } from '../../../utils/dateFormatter';
import { BookEditModal } from '../components/BookEditModal';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const bookId = id ? Number(id) : null;

  const { book, refreshBook, isLoading: isBookLoading, error } = useBook(bookId!);
  const { chapters, isLoadingChapters, setChapters } = useChapters(bookId); 
  const { deleteChapter } = useDeleteChapter();

  const [isChapterModalOpen, setIsChapterModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loading = isBookLoading || isLoadingChapters;

  useEffect(() => {
    if (!loading && (error || !book)) {
      navigate('/404', { replace: true });
    }
  }, [loading, error, book, navigate]);

  const handleDeleteChapter = async (chapterId: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm("Voulez-vous vraiment supprimer ce chapitre ?")) return;

    const success = await deleteChapter(chapterId);
    if (success) {
      setChapters(chapters.filter(c => c.id !== chapterId));
    } else {
      alert("Impossible de supprimer le chapitre.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1c1411]">
        <p className="text-lg text-amber-200/60 font-serif italic animate-pulse">Ouverture du grimoire...</p>
      </div>
    );
  }

  if (error || !book) return null; 

  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;
  const bookCreatedAt = (book as any).created_at || book.createdAt;
  const bookCoverImage = (book as any).cover_image || book.coverImage;

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] px-4 sm:px-6 py-8 md:px-16 font-sans overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        
        <button 
          onClick={() => navigate('/books')}
          className="text-amber-200/60 hover:text-amber-100 font-serif text-sm mb-8 flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span> Retour à la bibliothèque
        </button>

        {/* En-tête principal du livre */}
        <div className="bg-neutral-950/70 border border-amber-900/30 rounded-3xl p-6 sm:p-8 md:p-10 shadow-xl mb-10 md:mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {bookCoverImage && (
              <div className="w-full md:w-40 h-56 rounded-2xl overflow-hidden shadow-lg border border-amber-900/30 shrink-0 bg-neutral-900">
                <img 
                  src={bookCoverImage} 
                  alt={`Couverture de ${book.title}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grow">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-amber-950 text-amber-300 font-sans font-semibold px-3 py-1 rounded-full text-xs tracking-wide uppercase border border-amber-800/40">
                  {chapters.length} {chapters.length > 1 ? 'chapitres' : 'chapitre'}
                </span>
                <span className="text-xs text-amber-200/40 font-serif italic">
                  Créé le {formatDate(bookCreatedAt)}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-100 tracking-tight mb-4">
                {book.title}
              </h1>

              <p className="text-amber-200/80 text-lg leading-relaxed font-serif italic">
                {book.description || "Aucune description fournie pour ce roman."}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 pt-6 mt-8 border-t border-amber-900/30">
            {firstChapter && (
              <button 
                onClick={() => navigate(`/books/${bookId}/chapters/${firstChapter.id}/read`)}
                className="bg-amber-700 hover:bg-amber-600 text-amber-50 font-sans font-medium px-5 py-2.5 rounded-xl shadow-md transition text-sm cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto touch-target"
              >
                <span>📖</span> Commencer la lecture
              </button>
            )}

            <button 
              onClick={() => setIsChapterModalOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-200 font-sans font-medium px-5 py-2.5 rounded-xl border border-amber-900/30 transition text-sm cursor-pointer flex items-center justify-center gap-2 w-full sm:w-auto touch-target"
            >
              <span>+</span> Ajouter un chapitre
            </button>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-transparent hover:bg-neutral-900 text-amber-200/70 hover:text-amber-100 font-sans font-medium px-4 py-2.5 rounded-xl transition text-sm cursor-pointer sm:ml-auto w-full sm:w-auto touch-target"
            >
              Paramètres du roman
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-2xl font-serif font-bold text-amber-100 flex items-center gap-2">
            <span>📚</span> Table des matières
          </h2>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-16 bg-neutral-950/50 rounded-2xl border border-dashed border-amber-900/30 px-6">
            <p className="text-amber-200/60 font-serif text-lg mb-2">Ce livre est encore une page blanche.</p>
            <p className="text-xs text-amber-200/40 font-sans mb-6">Commencez par rédiger votre tout premier chapitre.</p>
            <button 
              onClick={() => setIsChapterModalOpen(true)}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 font-sans font-medium px-5 py-2.5 rounded-xl shadow-md transition text-sm cursor-pointer inline-flex items-center gap-2"
            >
              + Rédiger le chapitre 1
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedChapters.map((chapter, index) => (
              <div 
                key={chapter.id}
                onClick={() => navigate(`/books/${bookId}/chapters/${chapter.id}/read`)}
                className="bg-neutral-950/70 border border-amber-900/20 rounded-2xl p-4 sm:p-5 shadow-md hover:shadow-lg hover:border-amber-700/40 transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-950 group-hover:bg-amber-700 group-hover:text-amber-50 text-amber-300 border border-amber-800/40 flex items-center justify-center font-serif font-bold text-base transition-colors shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-amber-100 text-lg group-hover:text-amber-300 transition-colors">
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-amber-200/40 font-serif italic mt-0.5">
                      Dernière modification le {formatDate(chapter.updated_at || chapter.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 opacity-90 group-hover:opacity-100 w-full sm:w-auto">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/books/${bookId}/chapters/${chapter.id}/read`);
                    }}
                    className="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-200 px-3.5 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
                  >
                    Lire
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/books/${bookId}/chapters/${chapter.id}`);
                    }}
                    className="text-xs bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-amber-900/30 px-3.5 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
                  >
                    Éditer
                  </button>
                  
                  <button 
                    onClick={(e) => handleDeleteChapter(chapter.id, e)}
                    className="text-xs bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-900/30 px-3 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
                    title="Supprimer le chapitre"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <ChapterModal
        isOpen={isChapterModalOpen}
        onClose={() => setIsChapterModalOpen(false)}
        bookId={book.id}
        nextChapterNumber={chapters.length + 1}
        onChapterCreated={(newChapters) => setChapters(newChapters)}
      />

      <BookEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        book={book}
        onBookUpdated={() => refreshBook()}
      />
    </div>
  );
}