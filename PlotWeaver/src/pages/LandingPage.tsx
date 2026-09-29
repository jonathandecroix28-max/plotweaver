import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#1c1411] text-[#fcf9f2] flex flex-col justify-between overflow-x-hidden relative font-sans">
      
      {/* 🌲 Arrière-plan subtil avec effet de lueur ambrée */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(180,83,9,0.15),transparent_50%)] pointer-events-none" />

      {/* 🧭 Header / Navigation minimaliste */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-900 flex items-center justify-center font-serif font-bold text-xl text-amber-50 shadow-md">
            P
          </div>
          <span className="font-serif font-bold text-xl tracking-tight text-amber-100">Plotweaver</span>
        </div>

        <button
          onClick={() => navigate('/books')}
          className="bg-amber-800 hover:bg-amber-700 text-amber-50 px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-md cursor-pointer w-full sm:w-auto"
        >
          Ouvrir l'application
        </button>
      </header>

      {/* 🎯 Section principale (Hero Section) */}
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center z-10 my-auto">
        
        {/* Texte de gauche */}
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/30 text-amber-300 text-xs font-serif tracking-wide">
            <span>✨ Votre grimoire numérique d'écriture</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tight text-amber-50 leading-[1.1]">
            Plotweaver — Donnez vie à vos <span className="text-amber-500 italic">romans</span>.
          </h1>

          <p className="text-amber-200/70 font-serif text-lg leading-relaxed max-w-xl">
            La plateforme ultime pour structurer vos intrigues, gérer vos chapitres, centraliser vos idées et écrire vos histoires sans distractions.
          </p>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-4 pt-4">
            <button
              onClick={() => navigate('/books')}
              className="flex items-center justify-center sm:justify-start gap-3 bg-amber-600 hover:bg-amber-500 text-amber-950 px-6 py-3 rounded-2xl font-bold transition shadow-lg cursor-pointer transform hover:-translate-y-0.5 w-full sm:w-auto"
            >
              <span className="text-xl">🌐</span>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider opacity-80">Lancer sur</div>
                <div className="text-sm">Version Web</div>
              </div>
            </button>

            <div className="flex items-center justify-center sm:justify-start gap-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 px-6 py-3 rounded-2xl transition cursor-pointer w-full sm:w-auto">
              <span className="text-xl">📱</span>
              <div className="text-left">
                <div className="text-[10px] uppercase tracking-wider opacity-60">Bientôt sur</div>
                <div className="text-sm font-medium">iOS & Android</div>
              </div>
            </div>
          </div>
        </div>

        {/* 📱 Nouveau Visuel de droite (Mockup interactif du Carnet d'Inspiration) */}
        <div className="relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[320px] aspect-[9/19] bg-neutral-950 border-4 border-neutral-800 rounded-[45px] shadow-2xl p-3 overflow-hidden transform rotate-1 hover:rotate-0 transition duration-500 mx-auto lg:mx-0">
            
            {/* Fausse encoche de téléphone */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-neutral-900 rounded-full z-20" />
            
            {/* Écran intérieur du téléphone (Simulant ton application) */}
            <div className="w-full h-full bg-[#1c1411] text-[#fcf9f2] rounded-[35px] p-4 pt-9 overflow-y-auto flex flex-col gap-4">
              
              {/* En-tête de l'app mobile simulée */}
              <div className="flex items-center justify-between border-b border-amber-900/40 pb-2">
                <div className="font-serif font-bold text-amber-100 text-xs">✨ Carnet d'Idées</div>
                <div className="w-5 h-5 rounded-full bg-amber-700 text-amber-50 flex items-center justify-center text-[10px] font-bold">+</div>
              </div>

              {/* Onglets miniatures */}
              <div className="flex gap-3 text-[11px] font-serif overflow-x-hidden text-amber-200/60 border-b border-amber-900/20 pb-2">
                <span className="text-amber-400 font-bold border-b border-amber-400 pb-0.5">Magie</span>
                <span>Factions</span>
                <span>Personnages</span>
              </div>

              {/* Carte idée 1 */}
              <div className="bg-neutral-950 border border-amber-900/30 p-3 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/40">💡 Brute</span>
                  <span className="text-[10px] text-amber-400 font-serif">📚 Grimoire</span>
                </div>
                <div className="font-serif font-bold text-amber-100 text-xs pt-1">La source des runes</div>
                <div className="text-[10px] text-amber-200/70 font-serif line-clamp-2">L'encre magique réagit uniquement au sang de la lignée...</div>
              </div>

              {/* Carte idée 2 */}
              <div className="bg-neutral-950 border border-amber-900/30 p-3 rounded-xl space-y-1 shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800/40">🛠️ En cours</span>
                  <span className="text-[10px] text-amber-400 font-serif">📚 Ombres</span>
                </div>
                <div className="font-serif font-bold text-amber-100 text-xs pt-1">Le pacte secret</div>
                <div className="text-[10px] text-amber-200/70 font-serif line-clamp-2">Travailler le dialogue du chapitre 4 pour plus de tension.</div>
              </div>

              {/* Simulation de barre de navigation basse */}
              <div className="mt-auto bg-neutral-900 border border-amber-900/20 py-2 px-4 rounded-xl flex justify-around text-amber-200/50 text-[10px]">
                <span className="text-amber-400 font-bold">Notes</span>
                <span>Romans</span>
                <span>Paramètres</span>
              </div>

            </div>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 border-t border-neutral-800 flex flex-col md:flex-row items-center justify-between text-xs text-neutral-500 z-10 gap-2 md:gap-0">
        <div>© 2026 Plotweaver. Tous droits réservés.</div>
        <div className="flex gap-4 mt-2 md:mt-0">
          <span className="hover:text-neutral-400 cursor-pointer">Confidentialité</span>
          <span className="hover:text-neutral-400 cursor-pointer">Conditions</span>
          <span className="hover:text-neutral-400 cursor-pointer">Support</span>
        </div>
      </footer>

    </div>
  );
}