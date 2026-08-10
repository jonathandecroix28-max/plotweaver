import { useState } from 'react';
import { useCreateChapter } from '../hooks/useCreateChapter';
import type { ChapterResponse } from '../../../types/chapter';

interface ChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId: number;
  nextChapterNumber: number;
  onChapterCreated: (chapters: ChapterResponse[]) => void;
}

export function ChapterModal({ isOpen, onClose, bookId, nextChapterNumber, onChapterCreated }: ChapterModalProps) {
  const [title, setTitle] = useState('');
  const { createChapter, isCreating, error } = useCreateChapter();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    const updatedChapters = await createChapter(bookId, title, nextChapterNumber, "Rédigez votre chapitre ici...");

    if (updatedChapters) {
      onChapterCreated(updatedChapters);
      setTitle(''); 
      onClose();    
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#2c221e]/40 backdrop-blur-sm">
      <div className="bg-[#fcf9f2] rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-amber-900/20">
        
        <div className="px-6 py-4 border-b border-amber-900/10 flex justify-between items-center bg-[#fffdf9]">
          <h2 className="text-xl font-serif font-bold text-amber-950">Nouveau Chapitre</h2>
          <button 
            onClick={onClose}
            className="text-amber-900/50 hover:text-amber-900 transition-colors text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label htmlFor="title" className="block text-sm font-medium text-amber-900/80 mb-2">
              Titre du chapitre
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chapitre 1 - La rencontre"
              className="w-full px-4 py-2.5 rounded-lg border border-amber-900/20 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900/30 text-[#2c221e] font-serif"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-red-600 text-sm mb-4 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-amber-900 font-medium hover:bg-amber-900/5 transition-colors cursor-pointer text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="px-5 py-2 rounded-lg bg-amber-900 text-amber-50 font-medium hover:bg-amber-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm shadow-sm"
            >
              {isCreating ? "Création..." : "Créer le chapitre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}