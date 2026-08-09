import { useState, useEffect } from 'react';
import { useUpdateBook } from '../hooks/useUpdateBook';
import type { BookResponse } from '../../../types/book';

interface BookEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookResponse | null;
  onBookUpdated: (updatedBooksList: BookResponse[]) => void;
}

export function BookEditModal({ isOpen, onClose, book, onBookUpdated }: BookEditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  const { updateBook, isUpdating, error } = useUpdateBook();

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setDescription(book.description || '');
      setCoverImage(book.coverImage || '');
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const updatedBooksList = await updateBook(book.id, title, description, coverImage);
    
    if (updatedBooksList) {
      onBookUpdated(updatedBooksList);
      onClose();
    } else {
      alert(error || "Erreur lors de la modification du roman.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-xs p-4">
      <div className="bg-[#fffdf9] border border-amber-900/10 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-xl">
        
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-amber-900/10">
          <h2 className="text-2xl font-serif font-bold text-amber-950">Modifier le Grimoire</h2>
          <button 
            onClick={onClose}
            className="text-amber-900/50 hover:text-amber-950 font-serif text-lg cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-900/70 mb-1">
              Titre du roman <span className="text-red-600">*</span>
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-900/70 mb-1">
              Description (Synopsis)
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-900/70 mb-1">
              URL de l'image de couverture
            </label>
            <input 
              type="url" 
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-amber-900/10">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-amber-900/20 text-amber-900 text-sm font-medium hover:bg-amber-100/50 transition cursor-pointer"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}