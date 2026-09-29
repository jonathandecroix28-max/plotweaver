import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { offlineBookService } from "../services/offlineBookService";
import { offlineIdeaService } from "../services/offlineIdeaService";
import { offlineChapterService } from "../services/offlineChapterService";
import { offlineCategoryService } from "../services/offlineCategoryService";
import { ThemeToggle } from "./themes/ThemeToggle";

type NavKey = "books" | "ideas" | "versions";

const NAV_ITEMS: { key: NavKey; label: string; short: string; icon: string; path: string }[] = [
  { key: "books", label: "Romans", short: "Romans", icon: "📚", path: "/books" },
  { key: "ideas", label: "Carnet d'idées", short: "Idées", icon: "💡", path: "/ideas" },
  { key: "versions", label: "Versions", short: "Versions", icon: "🗂️", path: "/versions" },
];

export function Navbar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      await Promise.all([
        offlineBookService.syncToServer(),
        offlineChapterService.syncToServer?.() || Promise.resolve(),
        offlineIdeaService.syncToServer(),
        offlineCategoryService.syncToServer(),
      ]);
      alert("Synchronisation réussie avec le serveur !");
      window.location.reload();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la synchronisation.");
      setSyncing(false);
    }
  };

  // Les pages de versions (/versions, /ideas/:id/versions, /books/.../versions)
  // sont rattachées à l'onglet "Versions"
  const inVersions = pathname.includes("/versions");
  const active: Record<NavKey, boolean> = {
    versions: inVersions,
    ideas: pathname.startsWith("/ideas") && !inVersions,
    books: (pathname.startsWith("/books") || pathname === "/") && !inVersions,
  };

  const syncIcon = (
    <span
      className={`inline-block transition-transform duration-500 ${
        syncing ? "animate-spin" : "group-hover:rotate-180"
      }`}
    >
      🔄
    </span>
  );

  const Logo = (
    <button
      type="button"
      onClick={() => navigate("/books")}
      className="flex items-center gap-3 min-w-0 group cursor-pointer"
      aria-label="Plotweaver, retour à la bibliothèque"
    >
      <span className="w-9 h-9 rounded-xl bg-amber-800 text-amber-50 flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:bg-amber-700 transition shrink-0">
        P
      </span>
      <span className="text-lg sm:text-xl font-serif font-bold text-amber-100 tracking-tight group-hover:text-amber-50 transition truncate">
        Plotweaver
      </span>
    </button>
  );

  return (
    <>
      {/* ───────── Desktop / tablette : barre en haut ───────── */}
      <header className="hidden sm:block bg-[#1c1411] border-b border-amber-900/40 sticky top-0 z-50 shadow-md">
        <nav
          aria-label="Navigation principale"
          className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8"
        >
          {Logo}

          <ul className="flex items-center gap-1.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.key}>
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={active[item.key] ? "page" : undefined}
                  className={`px-3.5 py-2 rounded-lg text-sm font-serif font-medium whitespace-nowrap border transition cursor-pointer flex items-center gap-2 ${
                    active[item.key]
                      ? "bg-amber-900/70 text-amber-100 border-amber-700"
                      : "bg-transparent text-amber-200/60 border-transparent hover:text-amber-100 hover:bg-amber-950/60"
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              title="Envoyer toutes les données locales vers le serveur"
              className="group text-xs bg-amber-950/80 hover:bg-amber-900 disabled:opacity-60 text-amber-200 px-3.5 py-2 rounded-xl border border-amber-800/50 font-medium transition cursor-pointer flex items-center gap-2 shadow-xs"
            >
              {syncIcon}
              <span className="hidden md:inline">
                {syncing ? "Synchronisation…" : "Synchroniser"}
              </span>
            </button>
          </div>
        </nav>
      </header>

      {/* ───────── Mobile : petit bandeau en haut (logo + thème) ───────── */}
      <header className="sm:hidden bg-[#1c1411] border-b border-amber-900/40 sticky top-0 z-40 shadow-md">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          {Logo}
          <ThemeToggle />
        </div>
      </header>

      {/* ───────── Mobile : barre d'onglets fixe en bas ───────── */}
      <nav
        aria-label="Navigation principale"
        className="sm:hidden fixed bottom-0 inset-x-0 z-50 bg-[#1c1411]/95 backdrop-blur border-t border-amber-900/40 shadow-[0_-4px_12px_rgba(0,0,0,0.25)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <li key={item.key}>
              <button
                type="button"
                onClick={() => navigate(item.path)}
                aria-current={active[item.key] ? "page" : undefined}
                className={`relative w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-serif font-medium transition cursor-pointer ${
                  active[item.key]
                    ? "text-amber-100"
                    : "text-amber-200/50 active:text-amber-100"
                }`}
              >
                {active[item.key] && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-b bg-amber-500" />
                )}
                <span className="text-xl leading-none" aria-hidden>
                  {item.icon}
                </span>
                <span className="truncate max-w-full px-1">{item.short}</span>
              </button>
            </li>
          ))}

          <li>
            <button
              type="button"
              onClick={handleSync}
              disabled={syncing}
              aria-label="Synchroniser avec le serveur"
              className="group w-full h-16 flex flex-col items-center justify-center gap-1 text-[11px] font-serif font-medium text-amber-200/50 active:text-amber-100 disabled:opacity-60 transition cursor-pointer"
            >
              <span className="text-xl leading-none" aria-hidden>
                {syncIcon}
              </span>
              <span>{syncing ? "Sync…" : "Sync"}</span>
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}