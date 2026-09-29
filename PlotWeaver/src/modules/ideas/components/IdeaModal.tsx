import { useState, useEffect } from 'react';
import { useCreateIdea } from '../hooks/useCreateIdea';
import { useUpdateIdea } from '../hooks/useUpdateIdea';
import { offlineBookService } from '../../../services/offlineBookService';
import { offlineCategoryService } from '../../../services/offlineCategoryService';
import type { IdeaResponse, IdeaUpsertRequest, IdeaStatus } from '../../../types/idea';
import type { BookResponse } from '../../../types/book';
import type { CategoryResponse } from '../../../types/category';

interface IdeaModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookId?: number | null;
  ideaToEdit?: IdeaResponse | null;
  onSuccess: (updatedIdeas: IdeaResponse[]) => void;
}

const templates = {
  personnage: {
    label: "👤 Personnage",
    text: "Nom:\nÂge:\nObjectif:\nSecret:\nApparence:\nTraits de caractère:\n"
  },
  intrigue: {
    label: "⚡ Rebondissement",
    text: "Situation initiale:\nL'élément perturbateur:\nAction(s) entreprise(s):\nConséquence:\n"
  },
  univers: {
    label: "🌍 Lieu / Lore",
    text: "Nom du lieu:\nAtmosphère/Ambiance:\nParticularité/Règle magique:\nDanger potentiel:\n"
  }
};

export function IdeaModal({ isOpen, onClose, bookId, ideaToEdit, onSuccess }: IdeaModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<number>(0); 
  const [status, setStatus] = useState<IdeaStatus>('draft');
  const [selectedBookId, setSelectedBookId] = useState<number>(bookId || 0);
  
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isListening, setIsListening] = useState(false);

  const { createIdea, isCreating } = useCreateIdea();
  const { updateIdea, isUpdating } = useUpdateIdea();

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        offlineBookService.getAll().catch(() => []),
        offlineCategoryService.getAll().catch(() => [])
      ]).then(([booksData, catsData]) => {
        setBooks(booksData || []);
        setCategories(catsData || []);

        if (catsData && catsData.length > 0 && categoryId === 0 && !ideaToEdit) {
          setCategoryId(catsData[0].id);
        }
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (ideaToEdit) {
      setName(ideaToEdit.name);
      setDescription(ideaToEdit.description || '');
      setCategoryId(ideaToEdit.categoryId);
      setStatus(ideaToEdit.status || 'draft');
      setSelectedBookId(ideaToEdit.bookId || 0);
    } else {
      setName('');
      setDescription('');
      setStatus('draft');
      setSelectedBookId(bookId || 0);
      if (categories.length > 0) {
        setCategoryId(categories[0].id);
      }
    }
  }, [ideaToEdit, isOpen, bookId, categories]);

  if (!isOpen) return null;

  const handleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La dictée vocale n'est pas supportée par votre navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setDescription((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.start();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (!categoryId || categoryId === 0) {
      alert("Veuillez sélectionner une catégorie valide.");
      return;
    }

    const targetBookId = (bookId && bookId !== 0) ? bookId : selectedBookId;

    const data: IdeaUpsertRequest = {
      name,
      description,
      bookId: targetBookId && targetBookId !== 0 ? Number(targetBookId) : null,
      categoryId: Number(categoryId),
      status,
    };

    let result: IdeaResponse[] | null = null;

    if (ideaToEdit) {
      result = await updateIdea(ideaToEdit.id, data);
    } else {
      result = await createIdea(data);
    }

    if (result) {
      onSuccess(result);
      onClose();
    } else {
      alert("Une erreur est survenue lors de l'enregistrement de l'idée.");
    }
  };

  const isLoading = isCreating || isUpdating;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex justify-center items-center z-50 p-4 overflow-y-auto">
      <div className="bg-[#1c1411] border border-amber-900/40 rounded-3xl p-8 max-w-lg w-full shadow-2xl my-8 text-amber-50">
        <h2 className="text-2xl font-serif font-bold text-amber-100 mb-6">
          {ideaToEdit ? "Modifier la note" : "Nouvelle idée de grimoire"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 font-sans">
          {(!bookId || bookId === 0) && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/60 mb-2">
                Roman associé (optionnel)
              </label>
              <select
                value={selectedBookId}
                onChange={(e) => setSelectedBookId(Number(e.target.value))}
                className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif"
              >
                <option value={0}>-- Aucun roman associé (Global) --</option>
                {books.map((book) => (
                  <option key={book.id} value={book.id}>{book.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Sélecteur de Catégorie Globale */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/60 mb-2">
              Type de note / Catégorie
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(Number(e.target.value))}
              required
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif text-sm cursor-pointer"
            >
              {categories.length === 0 ? (
                <option value={0} disabled>-- Aucune catégorie disponible --</option>
              ) : (
                categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/60 mb-2">
              Titre de l'idée
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Le secret du grimoire maudit..."
              required
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/60">
                Description / Notes
              </label>
              
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    const val = e.target.value as keyof typeof templates;
                    if (val) setDescription((prev) => (prev ? `${prev}\n\n${templates[val].text}` : templates[val].text));
                  }}
                  className="bg-amber-950/80 text-amber-200 text-[10px] font-medium px-2 py-1.5 rounded-lg border border-amber-800/50 cursor-pointer hover:bg-amber-900"
                >
                  <option value="">+ Modèle</option>
                  {Object.entries(templates).map(([key, t]) => (
                    <option key={key} value={key}>{t.label}</option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleVoiceDictation}
                  className={`p-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1.5 px-3 text-xs font-medium ${isListening ? 'bg-red-950 text-red-300 animate-pulse border border-red-800' : 'bg-amber-950 text-amber-200 border border-amber-800/50 hover:bg-amber-900'}`}
                  title="Dicter votre idée par la voix"
                >
                  <span>🎙️</span>
                  <span>{isListening ? "Écoute..." : "Dicter"}</span>
                </button>
              </div>
            </div>
            
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isListening ? "Je vous écoute..." : "Détails de l'idée, texte long..."}
              rows={5}
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-3 text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif resize-none leading-relaxed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-200/60 mb-2">
              Statut
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IdeaStatus)}
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-3 py-2.5 text-amber-100 focus:outline-none font-serif text-sm"
            >
              <option value="draft">💡 Brute</option>
              <option value="in-progress">🛠️ En cours</option>
              <option value="integrated">✅ Intégrée</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-900/30">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl text-amber-200/70 hover:bg-neutral-900 transition text-sm font-medium cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-600 text-amber-50 text-sm font-medium transition shadow-md cursor-pointer disabled:opacity-50"
            >
              {isLoading ? "Enregistrement..." : (ideaToEdit ? "Mettre à jour" : "Créer la note")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}