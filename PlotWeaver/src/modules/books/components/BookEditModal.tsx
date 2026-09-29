import { useState, useEffect } from 'react';
import { useUpdateBook } from '../hooks/useUpdateBook';
import type { BookResponse } from '../../../types/book';
import { fileService } from '../../../services/fileService';

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
  const [urlError, setUrlError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const { updateBook, isUpdating, error } = useUpdateBook();

  useEffect(() => {
    if (book) {
      setTitle(book.title || '');
      setDescription(book.description || '');
      setCoverImage(book.coverImage || '');
      setUrlError(null);
    }
  }, [book, isOpen]);

  if (!isOpen || !book) return null;

  // Petite validation simple d'URL si elle est remplie
  const validateUrl = (url: string) => {
    if (!url.trim()) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (coverImage && !validateUrl(coverImage)) {
      setUrlError("Veuillez entrer une URL valide.");
      return;
    }
    setUrlError(null);

    const updatedBooksList = await updateBook(book.id, title, description, coverImage);
    if (updatedBooksList) {
      onBookUpdated(updatedBooksList);
      onClose();
    } else {
      alert(error || "Erreur lors de la modification du roman.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await fileService.uploadCover(file);
      setCoverImage(url);
      setUrlError(null);
    } catch (err) {
      alert("Erreur lors de l'upload de l'image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#1c1411] border border-amber-900/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-amber-50">
        
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-amber-900/30">
          <h2 className="text-2xl font-serif font-bold text-amber-100">Modifier le Grimoire</h2>
          <button 
            onClick={onClose}
            className="text-amber-200/50 hover:text-amber-100 font-serif text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-200/60 mb-1">
              Titre du roman <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2.5 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-200/60 mb-1">
              Description (Synopsis)
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2.5 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-200/60 mb-1">
              Image de couverture
            </label>
            
            <div className="flex gap-2 items-center">
              <input 
                type="url" 
                value={coverImage}
                onChange={(e) => {
                  setCoverImage(e.target.value);
                  if (urlError) setUrlError(null);
                }}
                placeholder="https://... ou uploadez un fichier"
                className={`w-full bg-neutral-900 border rounded-xl px-4 py-2.5 text-amber-100 placeholder-amber-200/30 focus:outline-none font-sans text-sm ${
                  urlError ? 'border-red-500 ring-1 ring-red-500' : 'border-amber-900/40 focus:ring-1 focus:ring-amber-500'
                }`}
              />

              <label className="bg-amber-950 hover:bg-amber-900 text-amber-200 px-4 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer shrink-0 border border-amber-800/50 flex items-center gap-1">
                {isUploading ? "Envoi..." : "Parcourir"}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleFileChange}
                  disabled={isUploading}
                />
              </label>
            </div>
            {urlError && <p className="text-red-400 text-xs mt-1 font-sans">{urlError}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-amber-900/30">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-amber-900/30 text-amber-200/70 text-sm font-medium hover:bg-neutral-900 transition cursor-pointer"
            >
              Annuler
            </button>
            <button 
              type="submit"
              disabled={isUpdating}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-5 py-2 rounded-xl text-sm font-medium transition shadow-md disabled:opacity-50 cursor-pointer"
            >
              {isUpdating ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}