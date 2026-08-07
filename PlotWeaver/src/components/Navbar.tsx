import { offlineBookService } from "../services/offlineBookService";
export function Navbar() {
  const handleSync = async () => {
    try {
      await offlineBookService.syncToServer();
      alert("Synchronisation réussie avec le serveur !");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la synchronisation.");
    }
  };

  return (
    <nav className="bg-[#fffdf9] border-b border-amber-900/10 sticky top-0 z-50 shadow-xs">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-900 text-amber-50 flex items-center justify-center font-serif font-bold text-lg shadow-sm">
            P
          </div>
          <span className="text-xl font-serif font-bold text-amber-950 tracking-tight">
            Plotweaver
          </span>
        </div>

        {/* Bouton de synchronisation visible si besoin */}
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSync}
            className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-900 px-3 py-1.5 rounded-lg border border-amber-900/20 font-medium transition"
            title="Envoyer les données locales vers le serveur"
          >
            🔄 Synchroniser les données
          </button>
        </div>

      </div>
    </nav>
  );
}