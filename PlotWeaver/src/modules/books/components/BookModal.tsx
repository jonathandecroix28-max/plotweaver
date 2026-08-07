import { useState } from 'react';
import { offlineBookService } from '../../../services/offlineBookService';
import type { BookResponse } from '../../../types/book';

interface BookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookCreated: (newBooksList: BookResponse[]) => void;
}

export function BookModal({ isOpen, onClose, onBookCreated }: BookModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    try {
      const updatedBooks = await offlineBookService.create(title, description, coverImage);
      
      setTitle('');
      setDescription('');
      setCoverImage('');
      
      onBookCreated(updatedBooks); 
      onClose();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la création du roman.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-amber-950/40 backdrop-blur-xs p-4">
      <div className="bg-[#fffdf9] border border-amber-900/10 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-xl">
        
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-amber-900/10">
          <h2 className="text-2xl font-serif font-bold text-amber-950">Nouveau Grimoire</h2>
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
              placeholder="Ex: Les Chroniques d'Onyx"
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 placeholder-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm"
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
              placeholder="De quoi parle votre histoire..."
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 placeholder-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-900/70 mb-1">
              URL de l'image de couverture (optionnel)
            </label>
            <input 
              type="url" 
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://exemple.com/image.jpg"
              className="w-full bg-[#fcf9f2] border border-amber-900/20 rounded-lg px-4 py-2.5 text-amber-950 placeholder-amber-900/30 focus:outline-none focus:ring-2 focus:ring-amber-900/40 font-sans text-sm"
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
              disabled={loading}
              className="bg-amber-900 hover:bg-amber-950 text-amber-50 px-5 py-2 rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Création..." : "Poser la première pierre"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}