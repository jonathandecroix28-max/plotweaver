import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] flex flex-col items-center justify-center px-6 font-sans relative overflow-hidden">
      
      <div className="absolute w-96 h-96 bg-amber-600/5 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-amber-900/5 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="max-w-md w-full text-center bg-neutral-950/80 border border-amber-900/30 rounded-3xl p-10 md:p-12 shadow-2xl relative z-10 backdrop-blur-xs">
        
        <div className="mb-6">
          <span className="bg-amber-950 text-amber-300 font-sans font-semibold px-3.5 py-1 rounded-full text-xs tracking-widest uppercase border border-amber-800/40 inline-block mb-4">
            Erreur 404
          </span>
          <h1 className="text-7xl md:text-8xl font-serif font-bold text-amber-100 tracking-tight">
            404
          </h1>
        </div>

        <h2 className="text-2xl font-serif font-bold text-amber-100 mb-3">
          Page introuvable dans le grimoire
        </h2>
        <p className="text-amber-200/70 font-serif italic text-base leading-relaxed mb-8">
          « Il semble que cette page se soit égarée entre les lignes d'un chapitre non écrit ou d'un manuscrit oublié. »
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 font-sans">
          <button
            onClick={() => navigate('/books')}
            className="w-full sm:w-auto bg-amber-700 hover:bg-amber-600 text-amber-50 font-medium px-6 py-3 rounded-xl shadow-md transition-all duration-200 cursor-pointer"
          >
            Retour à la bibliothèque
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-amber-900/30 font-medium px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Page précédente
          </button>
        </div>

      </div>

      <footer className="mt-8 text-xs text-amber-200/40 font-serif italic relative z-10">
        PlotWeaver &bull; L'art de tisser des histoires
      </footer>

    </div>
  );
}