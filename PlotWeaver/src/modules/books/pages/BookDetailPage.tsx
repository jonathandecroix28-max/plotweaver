import { useState, useEffect } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { useBook } from '../hooks/useBook'; 
import { useChapters } from '../../chapters/hooks/useChapter';
import { ChapterModal } from '../../chapters/components/ChapterModal'; 
import { formatDate } from '../../../utils/dateFormatter';
import { offlineChapterService } from '../../../services/offlineChapterService'; 
import { BookEditModal } from '../components/BookEditModal';

export function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const bookId = id ? Number(id) : null;


  const { book, refreshBook, isLoading: isBookLoading, error } = useBook(bookId!);
  const { chapters, isLoadingChapters, setChapters } = useChapters(bookId); 
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

    try {
      await offlineChapterService.remove(chapterId); 
      setChapters(chapters.filter(c => c.id !== chapterId));
    } catch (err) {
      console.error("Erreur lors de la suppression du chapitre :", err);
      alert("Impossible de supprimer le chapitre.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fcf9f2]">
        <p className="text-lg text-amber-900/60 font-serif italic animate-pulse">Ouverture du grimoire...</p>
      </div>
    );
  }

  if (error || !book) {
    return null; 
  }

  const sortedChapters = [...chapters].sort((a, b) => a.chapter_number - b.chapter_number);
  const firstChapter = sortedChapters.length > 0 ? sortedChapters[0] : null;
  const bookCreatedAt = (book as any).created_at || book.createdAt;
  const bookCoverImage = (book as any).cover_image || book.coverImage;

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c221e] px-6 py-10 md:px-16 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Fil d'Ariane / Retour */}
        <button 
          onClick={() => navigate('/')}
          className="text-amber-900/60 hover:text-amber-950 font-serif text-sm mb-8 flex items-center gap-1.5 transition-colors cursor-pointer group"
        >
          <span className="transition-transform group-hover:-translate-x-1">&larr;</span> Retour à la bibliothèque
        </button>

        {/* En-tête principal du livre */}
        <div className="bg-[#fffdf9] border border-amber-900/10 rounded-3xl p-8 md:p-10 shadow-xs mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-900/5 rounded-bl-full pointer-events-none" />
          
          {/* Flex container pour intégrer l'image et le texte côte à côte */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Vignette de la couverture */}
            {bookCoverImage && (
              <div className="w-full md:w-40 h-56 rounded-2xl overflow-hidden shadow-md border border-amber-900/15 shrink-0 bg-amber-950/5">
                <img 
                  src={bookCoverImage} 
                  alt={`Couverture de ${book.title}`} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Informations textuelles */}
            <div className="grow">
              <div className="flex items-center gap-3 mb-3">
                <span className="bg-amber-100/80 text-amber-900 font-sans font-semibold px-3 py-1 rounded-full text-xs tracking-wide uppercase border border-amber-900/10">
                  {chapters.length} {chapters.length > 1 ? 'chapitres' : 'chapitre'}
                </span>
                <span className="text-xs text-amber-900/40 font-serif italic">
                  Créé le {formatDate(bookCreatedAt)}
                </span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-950 tracking-tight mb-4">
                {book.title}
              </h1>

              <p className="text-amber-900/80 text-lg leading-relaxed font-serif italic">
                {book.description || "Aucune description fournie pour ce roman."}
              </p>
            </div>

          </div>

          {/* Barre d'actions globales du livre */}
          <div className="flex flex-wrap items-center gap-3 pt-6 mt-8 border-t border-amber-900/10">
            {firstChapter && (
              <button 
                onClick={() => navigate(`/books/${bookId}/chapters/${firstChapter.id}/read`)}
                className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-sans font-medium px-5 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer flex items-center gap-2"
              >
                <span>📖</span> Commencer la lecture
              </button>
            )}

            <button 
              onClick={() => setIsChapterModalOpen(true)}
              className="bg-amber-950/5 hover:bg-amber-950/10 text-amber-950 font-sans font-medium px-5 py-2.5 rounded-xl border border-amber-900/15 transition text-sm cursor-pointer flex items-center gap-2"
            >
              <span>+</span> Ajouter un chapitre
            </button>

            <button 
              onClick={() => setIsEditModalOpen(true)}
              className="bg-transparent hover:bg-amber-950/5 text-amber-900/70 hover:text-amber-950 font-sans font-medium px-4 py-2.5 rounded-xl transition text-sm cursor-pointer ml-auto"
            >
              Paramètres du roman
            </button>
          </div>
        </div>

        {/* Section de la table des matières (Chapitres) */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-serif font-bold text-amber-950 flex items-center gap-2">
            <span>📚</span> Table des matières
          </h2>
        </div>

        {chapters.length === 0 ? (
          <div className="text-center py-16 bg-[#fffdf9] rounded-2xl border border-dashed border-amber-900/20 px-6">
            <p className="text-amber-900/60 font-serif text-lg mb-2">Ce livre est encore une page blanche.</p>
            <p className="text-xs text-amber-900/40 font-sans mb-6">Commencez par rédiger votre tout premier chapitre.</p>
            <button 
              onClick={() => setIsChapterModalOpen(true)}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-sans font-medium px-5 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer inline-flex items-center gap-2"
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
                className="bg-[#fffdf9] border border-amber-900/10 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-amber-900/30 transition-all flex items-center justify-between cursor-pointer group"
              >
                {/* Info Chapitre */}
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-amber-900/5 group-hover:bg-amber-900 group-hover:text-amber-50 text-amber-900 flex items-center justify-center font-serif font-bold text-base transition-colors shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-amber-950 text-lg group-hover:text-amber-900 transition-colors">
                      {chapter.title}
                    </h3>
                    <p className="text-xs text-amber-900/50 font-serif italic mt-0.5">
                      Dernière modification le {formatDate(chapter.updated_at || chapter.created_at)}
                    </p>
                  </div>
                </div>

                {/* Boutons d'action contextuels */}
                <div className="flex items-center gap-2.5 opacity-90 group-hover:opacity-100">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/books/${bookId}/chapters/${chapter.id}/read`);
                    }}
                    className="text-xs bg-amber-900/10 hover:bg-amber-900/20 text-amber-950 px-3.5 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
                  >
                    Lire
                  </button>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/books/${bookId}/chapters/${chapter.id}`);
                    }}
                    className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-900/15 px-3.5 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
                  >
                    Éditer
                  </button>
                  
                  <button 
                    onClick={(e) => handleDeleteChapter(chapter.id, e)}
                    className="text-xs bg-red-50/50 hover:bg-red-100 text-red-700 border border-red-900/10 px-3 py-2 rounded-lg transition font-sans font-medium cursor-pointer"
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
        onBookUpdated={(_updatedBooksList) => {
          refreshBook();
        }}
      />
    </div>
  );
}