import type { IdeaResponse, IdeaStatus } from '../../../types/idea';
import { formatDate } from '../../../utils/dateFormatter';

interface IdeaCardProps {
  idea: IdeaResponse & { bookTitle?: string };
  onEdit: (idea: IdeaResponse) => void;
  onDelete: (id: number, e: React.MouseEvent) => void;
  onVersions: (idea: IdeaResponse) => void;
}

const statusConfig: Record<IdeaStatus, { label: string; bg: string; text: string; border: string }> = {
  draft: { label: '💡 Idée brute', bg: 'bg-amber-950/60', text: 'text-amber-300', border: 'border-amber-800/40' },
  'in-progress': { label: '🛠️ En cours', bg: 'bg-blue-950/60', text: 'text-blue-300', border: 'border-blue-800/40' },
  integrated: { label: '✅ Intégrée', bg: 'bg-emerald-950/60', text: 'text-emerald-300', border: 'border-emerald-800/40' },
};

export function IdeaCard({ idea, onEdit, onDelete, onVersions }: IdeaCardProps) {
  const currentStatus = idea.status ? statusConfig[idea.status] : statusConfig['draft'];

  return (
    <div className="bg-neutral-950/70 border border-amber-900/25 rounded-2xl p-5 sm:p-6 md:p-8 shadow-xl hover:border-amber-600/40 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
              {currentStatus.label}
            </span>
            
            {/* 💡 C'est ici qu'on ajoute l'affichage du titre du roman ! */}
            <span className="text-xs font-serif text-amber-400 font-medium">
              📚 {idea.bookTitle || 'Roman non rattaché'}
            </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity shrink-0 w-full sm:w-auto">
            <button
              onClick={() => onVersions(idea)}
              className="text-xs bg-amber-950/80 hover:bg-amber-900 text-amber-200 border border-amber-900/30 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
            >
              Versions
            </button>
            <button
              onClick={() => onEdit(idea)}
              className="text-xs bg-neutral-900 hover:bg-neutral-800 text-amber-200 border border-amber-900/30 px-3 py-1.5 rounded-lg transition font-medium cursor-pointer"
            >
              Éditer
            </button>
            <button
              onClick={(e) => onDelete(idea.id, e)}
              className="text-xs bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-900/30 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
              title="Supprimer l'idée"
            >
              ✕
            </button>
          </div>
        </div>

        <h3 className="font-serif font-bold text-amber-100 text-xl md:text-2xl tracking-tight mb-3">
          {idea.name}
        </h3>

        {/* Espace de lecture long format */}
        <div className="text-amber-200/80 font-serif text-base leading-relaxed whitespace-pre-wrap pt-3 border-t border-amber-900/20 mb-6 wrap-break-word">
          {idea.description || "Aucune description détaillée."}
        </div>
      </div>

      <div className="pt-4 border-t border-amber-900/25 flex items-center justify-between text-xs text-amber-200/40 font-serif">
        <span>Créée le {formatDate(idea.createdAt)}</span>
      </div>
    </div>
  );
}