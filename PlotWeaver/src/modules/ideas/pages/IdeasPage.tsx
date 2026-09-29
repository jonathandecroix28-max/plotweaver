import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIdeas } from '../hooks/useIdeas';
import { useDeleteIdea } from '../hooks/useDeleteIdea';
import { offlineBookService } from '../../../services/offlineBookService';
import { offlineCategoryService } from '../../../services/offlineCategoryService';
import { IdeaModal } from '../components/IdeaModal';
import { ManageCategoriesModal } from '../../categories/components/ManageCategoriesModal';
import { IdeaCard } from '../components/IdeaCard';
import type { IdeaResponse, IdeaStatus } from '../../../types/idea';
import type { BookResponse } from '../../../types/book';
import type { CategoryResponse } from '../../../types/category';

export function IdeasPage() {
  const navigate = useNavigate();

  const { ideas, setIdeas, isLoading: areIdeasLoading, error: ideasError, refreshIdeas } = useIdeas(null);
  const { deleteIdea } = useDeleteIdea();

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<IdeaResponse | null>(null);

  const [ideaSearch, setIdeaSearch] = useState('');
  const [bookTitleFilter, setBookTitleFilter] = useState(''); 
  const [statusFilter, setStatusFilter] = useState<IdeaStatus | 'all'>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  
  const [books, setBooks] = useState<BookResponse[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const fetchInitialData = async () => {
    try {
      const [catsData, booksData] = await Promise.all([
        offlineCategoryService.getAll(),
        offlineBookService.getAll()
      ]);
      setCategories(catsData || []);
      setBooks(booksData || [] );
    } catch (err) {
      console.error("Erreur de chargement initial :", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const tabs = useMemo(() => {
    return [
      { id: 'all', label: 'Toutes les notes' },
      ...categories.map(cat => ({ id: String(cat.id), label: cat.name }))
    ];
  }, [categories]);

  const ideasWithDetails = useMemo(() => {
    return ideas.map((idea) => {
      const foundBook = books.find((b) => b.id === idea.bookId);
      return {
        ...idea,
        bookTitle: foundBook ? foundBook.title : 'Roman non rattaché',
      };
    });
  }, [ideas, books]);

  const handleTabChange = (catId: string) => {
    setActiveTab(catId);
    const index = tabs.findIndex(t => t.id === catId);
    if (scrollContainerRef.current && index !== -1) {
      const width = scrollContainerRef.current.offsetWidth;
      scrollContainerRef.current.scrollTo({
        left: width * index,
        behavior: 'smooth'
      });
    }
  };

  const handleDelete = async (ideaId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Voulez-vous vraiment supprimer cette note ?")) return;

    const success = await deleteIdea(ideaId);
    if (success) {
      setIdeas(ideas.filter((i) => i.id !== ideaId));
    } else {
      alert("Impossible de supprimer.");
    }
  };

  if (areIdeasLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-[#1c1411]">
        <p className="text-lg text-amber-200/60 font-serif italic animate-pulse">Ouverture du grimoire...</p>
      </div>
    );
  }

  if (ideasError) return null;

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] flex flex-col font-sans overflow-x-hidden">
      
      {/* En-tête fixe et barre d'onglets globaux */}
      <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-6 pt-6 sm:pt-8 md:px-12 shrink-0">
        

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-amber-100 tracking-tight leading-tight">
            Carnet d'Inspiration Global
          </h1>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 self-start md:self-auto w-full md:w-auto">
            <button
              onClick={() => setIsManageCategoriesOpen(true)}
              className="bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-amber-900/40 font-medium px-4 py-2.5 rounded-xl transition text-sm cursor-pointer shadow-sm inline-flex items-center justify-center gap-1.5 w-full sm:w-auto touch-target"
            >
              <span>⚙️</span> Gérer les catégories
            </button>

            <button
              onClick={() => { setSelectedIdea(null); setIsModalOpen(true); }}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 font-medium px-5 py-2.5 rounded-xl transition text-sm cursor-pointer shadow-md inline-flex items-center justify-center gap-2 w-full sm:w-auto touch-target"
            >
              <span>+</span> Nouvelle note
            </button>
          </div>
        </div>

        {/* 📑 Onglets dynamiques générés depuis les catégories */}
        <div className="flex items-center gap-4 sm:gap-8 border-b border-amber-900/40 mb-6 overflow-x-auto text-sm font-serif scrollbar-none pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`pb-3 transition-colors cursor-pointer whitespace-nowrap shrink-0 ${activeTab === tab.id ? 'text-amber-400 border-b-2 border-amber-400 font-bold' : 'text-amber-200/60 hover:text-amber-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 🔍 Barre de filtres */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-6">
          <input 
            type="text"
            placeholder="🔍 Rechercher dans le contenu des notes..."
            value={ideaSearch}
            onChange={(e) => setIdeaSearch(e.target.value)}
            className="w-full sm:w-96 bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif placeholder:text-amber-200/30"
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <input 
              type="text"
              placeholder="📚 Filtrer par titre de roman..."
              value={bookTitleFilter}
              onChange={(e) => setBookTitleFilter(e.target.value)}
              className="w-full sm:w-64 bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2.5 text-sm text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-serif placeholder:text-amber-200/30 touch-target"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-neutral-900 border border-amber-900/40 rounded-xl px-4 py-2.5 text-sm text-amber-200/80 focus:outline-none font-serif cursor-pointer touch-target"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">💡 Brutes</option>
              <option value="in-progress">🛠️ En cours</option>
              <option value="integrated">✅ Intégrées</option>
            </select>
          </div>
        </div>
      </div>

      {/* ↔️ Conteneur de glissement horizontal */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory scroll-smooth w-full no-scrollbar overscroll-x-contain"
        onScroll={(e) => {
          const target = e.currentTarget;
          const index = Math.round(target.scrollLeft / target.offsetWidth);
          if (tabs[index] && tabs[index].id !== activeTab) {
            setActiveTab(tabs[index].id);
          }
        }}
      >
        {tabs.map((tab) => {
          const columnIdeas = ideasWithDetails.filter((idea) => {
            const matchesSearch = 
              idea.name.toLowerCase().includes(ideaSearch.toLowerCase()) ||
              (idea.description && idea.description.toLowerCase().includes(ideaSearch.toLowerCase()));
            
            const matchesBookTitle = bookTitleFilter === '' || 
              idea.bookTitle.toLowerCase().includes(bookTitleFilter.toLowerCase());

            const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
            
            const ideaCatId = (idea as any).categoryId ?? (idea as any).category_id;
            const matchesTab = tab.id === 'all' || String(ideaCatId) === String(tab.id);
            return matchesSearch && matchesBookTitle && matchesStatus && matchesTab;
          });

          return (
            <div 
              key={tab.id} 
              className="w-full min-w-full shrink-0 snap-start px-4 sm:px-6 md:px-12 py-4 flex flex-col"
            >
              <div className="w-full max-w-[1700px] mx-auto flex-1">
                <div className="text-xs uppercase tracking-wider text-amber-200/40 font-serif mb-4 font-semibold">
                  {tab.label} &bull; {columnIdeas.length} {columnIdeas.length > 1 ? 'éléments' : 'élément'}
                </div>

                {columnIdeas.length === 0 ? (
                  <div className="text-center py-24 bg-neutral-950/40 rounded-3xl border border-amber-900/20 px-6 max-w-2xl mx-auto my-12">
                    <p className="text-amber-200/60 font-serif text-lg mb-2">Aucune note dans cette section.</p>
                    <p className="text-xs text-amber-200/40 font-sans">Modifiez vos filtres ou créez une nouvelle note dans cette catégorie.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                    
                    {/* 💡 C'est ici que l'on utilise le composant IdeaCard ! */}
                    {columnIdeas.map((idea) => (
                      <IdeaCard 
                        key={idea.id} 
                        idea={idea as any} 
                        onEdit={(ideaToEdit) => { setSelectedIdea(ideaToEdit); setIsModalOpen(true); }}
                        onDelete={(id, e) => handleDelete(id, e)}
                        onVersions={(ideaToOpen) => navigate(`/ideas/${ideaToOpen.id}/versions`)}
                      />
                    ))}

                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modales */}
      <IdeaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        bookId={null}
        ideaToEdit={selectedIdea}
        onSuccess={() => refreshIdeas()}
      />

      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChanged={async () => {
          await fetchInitialData();
          refreshIdeas();
        }}
      />
    </div>
  );
}