import { useNavigate } from 'react-router-dom';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#fcf9f2] text-[#2c221e] flex flex-col items-center justify-center px-6 font-sans relative overflow-hidden">
      
      {/* Élément décoratif en arrière-plan (effet parchemin ancien / mystique) */}
      <div className="absolute w-96 h-96 bg-amber-900/5 rounded-full blur-3xl pointer-events-none -top-20 -left-20" />
      <div className="absolute w-96 h-96 bg-amber-950/5 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

      <div className="max-w-md w-full text-center bg-[#fffdf9] border border-amber-900/15 rounded-3xl p-10 md:p-12 shadow-sm relative z-10">
        
        {/* En-tête / Numéro 404 stylisé */}
        <div className="mb-6">
          <span className="bg-amber-100/80 text-amber-900 font-sans font-semibold px-3.5 py-1 rounded-full text-xs tracking-widest uppercase border border-amber-900/10 inline-block mb-4">
            Erreur 404
          </span>
          <h1 className="text-7xl md:text-8xl font-serif font-bold text-amber-950 tracking-tight">
            404
          </h1>
        </div>

        {/* Message poétique et explicite */}
        <h2 className="text-2xl font-serif font-bold text-amber-950 mb-3">
          Page introuvable dans le grimoire
        </h2>
        <p className="text-amber-900/70 font-serif italic text-base leading-relaxed mb-8">
          « Il semble que cette page se soit égarée entre les lignes d'un chapitre non écrit ou d'un manuscrit oublié. »
        </p>

        {/* Boutons d'action pour s'en sortir */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 font-sans">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-amber-900 hover:bg-amber-950 text-amber-50 font-medium px-6 py-3 rounded-xl shadow-xs transition-all duration-200 cursor-pointer"
          >
            Retour à la bibliothèque
          </button>
          <button
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto bg-amber-950/5 hover:bg-amber-950/10 text-amber-950 border border-amber-900/20 font-medium px-6 py-3 rounded-xl transition-all duration-200 cursor-pointer"
          >
            Page précédente
          </button>
        </div>

      </div>

      {/* Petit détail de bas de page */}
      <footer className="mt-8 text-xs text-amber-900/40 font-serif italic relative z-10">
        PlotWeaver &bull; L'art de tisser des histoires
      </footer>

    </div>
  );
}