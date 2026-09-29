import { useState, useEffect } from 'react';
import { offlineCategoryService } from '../../../services/offlineCategoryService';
import type { CategoryResponse } from '../../../types/category';

interface ManageCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChanged: () => void;
}

export function ManageCategoriesModal({ isOpen, onClose, onCategoriesChanged }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#b45309');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await offlineCategoryService.getAll();
      setCategories(data || []);
    } catch (err) {
      console.error("Erreur chargement catégories :", err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setName('');
      setColor('#b45309');
      setEditingId(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsLoading(true);
      if (editingId) {
        await offlineCategoryService.update(editingId, { name: name.trim(), color });
      } else {
        await offlineCategoryService.create({ name: name.trim(), color });
      }

      setName('');
      setColor('#b45309');
      setEditingId(null);
      await fetchCategories();
      onCategoriesChanged();
    } catch (err) {
      alert("Erreur lors de l'enregistrement de la catégorie (Vérifiez qu'elle n'existe pas déjà).");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (cat: CategoryResponse) => {
    setEditingId(cat.id);
    setName(cat.name);
    setColor(cat.color || '#b45309');
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer cette catégorie ?")) return;
    try {
      await offlineCategoryService.remove(id);
      await fetchCategories();
      onCategoriesChanged();
    } catch (err) {
      alert("Impossible de supprimer la catégorie.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-[#1c1411] border border-amber-900/40 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl text-amber-50 font-sans">
        
        <div className="flex justify-between items-center mb-6 pb-3 border-b border-amber-900/30">
          <h2 className="text-xl font-serif font-bold text-amber-100">
            Gestion des catégories générales
          </h2>
          <button 
            onClick={onClose}
            className="text-amber-200/50 hover:text-amber-100 font-serif text-xl cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Formulaire d'ajout / modification */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 bg-neutral-900/50 p-4 rounded-2xl border border-amber-900/20">
          <div>
            <label className="block text-xs font-serif uppercase tracking-wider text-amber-200/60 mb-1">
              {editingId ? "Modifier la catégorie" : "Nouvelle catégorie"} <span className="text-red-400">*</span>
            </label>
            <input 
              type="text" 
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Factions, Magie, Artefacts..."
              className="w-full bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2 text-amber-100 placeholder-amber-200/30 focus:outline-none focus:ring-1 focus:ring-amber-500 text-sm font-serif"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input 
                type="color" 
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-10 h-10 bg-neutral-900 border border-amber-900/40 rounded-xl cursor-pointer p-1"
                title="Couleur de l'étiquette"
              />
              <span className="text-xs text-amber-200/60 font-serif">Couleur de l'onglet</span>
            </div>

            <div className="flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setName(''); setColor('#b45309'); }}
                  className="px-3 py-2 rounded-xl text-xs bg-neutral-800 text-amber-200/70 hover:bg-neutral-700 transition cursor-pointer"
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-4 py-2 rounded-xl text-xs font-medium transition shadow-md cursor-pointer disabled:opacity-50"
              >
                {isLoading ? "En cours..." : (editingId ? "Mettre à jour" : "Ajouter")}
              </button>
            </div>
          </div>
        </form>

        {/* Liste des catégories existantes */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <p className="text-center text-xs text-amber-200/40 font-serif py-4">Aucune catégorie enregistrée.</p>
          ) : (
            categories.map((cat) => (
              <div 
                key={cat.id}
                className="flex items-center justify-between bg-neutral-900/80 border border-amber-900/20 px-4 py-3 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span 
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: cat.color || '#b45309' }}
                  />
                  <span className="font-serif font-medium text-amber-100 text-sm">{cat.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(cat)}
                    className="text-xs bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-800/40 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="text-xs bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-900/30 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-amber-900/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-amber-900/30 text-amber-200 text-sm font-medium transition cursor-pointer"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}