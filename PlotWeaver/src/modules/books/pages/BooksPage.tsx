import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { useBooks } from '../hooks/useBooks';          
import { useDeleteBook } from '../hooks/useDeleteBook';
import { BookCard } from '../components/BookCard';
import { BookModal } from '../components/BookModal';

export function BooksPage() {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const navigate = useNavigate(); 

  const { books, isLoading, error, setBooks } = useBooks();
  const { deleteBook } = useDeleteBook();

  const handleSelectBook = (bookId: number) => {
    navigate(`/books/${bookId}`);
  };

  const handleDeleteBook = async (bookId: number) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce livre ? Cette action est irréversible.")) {
      return;
    }

    const updatedBooks = await deleteBook(bookId);
    if (updatedBooks) {
      setBooks(updatedBooks); 
    } else {
      alert("Erreur lors de la suppression du livre.");
    }
  };

  if (isLoading && books.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fcf9f2]">
        <p className="text-lg text-amber-900/60 font-serif italic animate-pulse">Ouverture de la bibliothèque...</p>
      </div>
    );
  }

  if (error && books.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#fcf9f2]">
        <p className="text-red-700 font-serif font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c221e] px-6 py-10 md:px-16 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête de la bibliothèque */}
        <div className="bg-[#fffdf9] border border-amber-900/10 rounded-3xl p-8 md:p-10 shadow-xs mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-900/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <span className="bg-amber-100/80 text-amber-900 font-sans font-semibold px-3 py-1 rounded-full text-xs tracking-wide uppercase border border-amber-900/10 inline-block mb-3">
                {books.length} {books.length > 1 ? 'romans' : 'roman'} enregistré{books.length > 1 ? 's' : ''}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-amber-950 tracking-tight">
                Votre Bibliothèque
              </h1>
              <p className="text-amber-900/70 mt-2 font-serif italic text-lg max-w-xl">
                « Chaque livre est un univers en attente d'être exploré. »
              </p>
            </div>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-sans font-medium px-5 py-3 rounded-xl shadow-xs transition-all duration-200 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span className="text-lg leading-none">+</span> Nouveau Roman
            </button>
          </div>
        </div>

        {/* Grille des cartes de livres */}
        {books.length === 0 ? (
          <div className="text-center py-20 bg-[#fffdf9] rounded-3xl border border-dashed border-amber-900/20 px-6">
            <p className="text-amber-900/60 font-serif text-xl mb-2">Votre bibliothèque est vide.</p>
            <p className="text-xs text-amber-900/40 font-sans mb-6">Posez votre première pierre narrative dès aujourd'hui.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 font-sans font-medium px-5 py-2.5 rounded-xl shadow-xs transition text-sm cursor-pointer inline-flex items-center gap-2"
            >
              + Créer mon premier roman
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <BookCard 
                key={book.id} 
                book={book} 
                onSelect={handleSelectBook} 
                onDelete={handleDeleteBook}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modale de création */}
      <BookModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onBookCreated={(newBooksList) => setBooks(newBooksList)}
      />
    </div>
  );
}