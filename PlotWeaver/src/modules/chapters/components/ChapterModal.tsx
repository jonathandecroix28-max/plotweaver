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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-[#1c1411] border border-amber-900/40 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden text-amber-50">
        
        <div className="px-6 py-4 border-b border-amber-900/30 flex justify-between items-center bg-neutral-950/60">
          <h2 className="text-xl font-serif font-bold text-amber-100">Nouveau Chapitre</h2>
          <button 
            onClick={onClose}
            className="text-amber-200/50 hover:text-amber-100 transition-colors text-2xl leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-5">
            <label htmlFor="title" className="block text-xs font-serif uppercase tracking-wider text-amber-200/60 mb-2">
              Titre du chapitre
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chapitre 1 - La rencontre"
              className="w-full px-4 py-3 rounded-xl border border-amber-900/40 bg-neutral-900 focus:outline-none focus:ring-1 focus:ring-amber-500 text-amber-100 font-serif placeholder:text-amber-200/30"
              autoFocus
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm mb-4 font-medium">{error}</p>}

          <div className="flex justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-amber-200/70 font-medium hover:bg-neutral-900 transition-colors cursor-pointer text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isCreating || !title.trim()}
              className="px-5 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-sm shadow-md"
            >
              {isCreating ? "Création..." : "Créer le chapitre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}