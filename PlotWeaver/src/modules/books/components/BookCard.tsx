import type { BookResponse } from '../../../types/book';
import { formatDate } from '../../../utils/dateFormatter';

interface BookCardProps {
  book: BookResponse;
  onSelect?: (bookId: number) => void; 
  onDelete?: (bookId: number) => void;
}

export function BookCard({ book, onSelect, onDelete }: BookCardProps) {
  return (
    <div 
      onClick={() => onSelect && onSelect(book.id)}
      className="group relative bg-[#fffdf9] border border-amber-900/10 rounded-2xl overflow-hidden shadow-xs hover:shadow-lg hover:border-amber-900/30 transition-all duration-300 flex flex-col justify-between cursor-pointer"
    >

      {/* Bouton de suppression discret en haut à droite */}
      {onDelete && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete(book.id);
          }}
          className="absolute top-3 right-3 bg-red-950/40 hover:bg-red-700 text-amber-50 text-xs font-sans font-medium px-2.5 py-1 rounded-lg backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer"
          title="Supprimer le livre"
        >
          Supprimer
        </button>
      )}
      
      {/* Conteneur de l'image de couverture */}
      <div className="relative h-44 w-full bg-amber-950/3 overflow-hidden flex items-center justify-center border-b border-amber-900/10">
        {book.coverImage ? (
          <img 
            src={book.coverImage} 
            alt={`Couverture de ${book.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-amber-900/30 p-4 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2 stroke-current" fill="none" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span className="text-xs font-serif italic">Griffe d'encre</span>
          </div>
        )}

        {/* Badge du nombre de chapitres */}
        <div className="absolute top-3 left-3 bg-[#fffdf9]/90 backdrop-blur-xs text-amber-950 text-xs font-sans font-medium px-2.5 py-1 rounded-lg border border-amber-900/10 shadow-2xs">
          {book.chapterCount ?? 0} {book.chapterCount && book.chapterCount > 1 ? 'chapitres' : 'chapitre'}
        </div>
      </div>

      {/* Contenu textuel du livre */}
      <div className="p-6 flex flex-col grow justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold text-amber-950 group-hover:text-amber-900 transition-colors mb-2 line-clamp-1">
            {book.title}
          </h2>
          <p className="text-amber-900/70 text-sm line-clamp-2 mb-6 font-normal leading-relaxed font-serif italic">
            {book.description || "Aucune description fournie pour ce grimoire..."}
          </p>
        </div>

        <div className="pt-4 border-t border-amber-950/5 flex justify-between items-center text-xs text-amber-900/50">
          <span className="font-serif italic">Créé le {formatDate(book.createdAt)}</span>
          <span className="text-amber-900 font-sans font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
            Explorer &rarr;
          </span>
        </div>
      </div>
    </div>
  );
}