import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BMC_USERNAME = 'ton-pseudo';
const BMC_URL = `https://www.buymeacoffee.com/${BMC_USERNAME}`;

const USES = [
  {
    icon: '🛠️',
    title: 'Le temps de développement',
    text: 'Corriger les bugs, améliorer l’éditeur et faire évoluer Plotweaver au quotidien.',
  },
  {
    icon: '☁️',
    title: 'Le serveur et la synchro',
    text: 'Héberger les données et garder la synchronisation entre tes appareils fiable.',
  },
  {
    icon: '✨',
    title: 'Les nouvelles fonctionnalités',
    text: 'Financer les prochaines idées : meilleurs outils d’écriture, plus de confort de relecture.',
  },
];

export function DonatePage() {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(BMC_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copie ce lien :', BMC_URL);
    }
  };

  return (
    <div className="min-h-full bg-[#1c1411] text-[#fcf9f2] font-serif overflow-x-hidden">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-12 space-y-6 sm:space-y-8">
        <button
          onClick={() => navigate(-1)}
          className="text-amber-200/60 hover:text-amber-100 transition-colors text-sm cursor-pointer flex items-center gap-1 font-sans"
        >
          &larr; Retour
        </button>

        {/* Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-900/25 bg-neutral-950/60 p-6 sm:p-10 shadow-xl text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-56 rounded-full bg-amber-600/10 blur-3xl"
          />

          <div className="relative">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-amber-800/40 bg-amber-950 text-4xl shadow-lg">
              ☕
            </div>

            <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-2">Soutenir Plotweaver</p>
            <h1 className="text-2xl sm:text-4xl font-bold text-amber-100">Offre-moi un café</h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base text-amber-200/60 max-w-xl mx-auto leading-relaxed">
              Plotweaver est développé avec passion pour t’aider à écrire tes romans. Si l’application te plaît et
              t’est utile, tu peux m’encourager avec un petit café. C’est le meilleur moyen de la faire grandir.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-3">
              <a
                href={BMC_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-xl bg-[#FFDD00] px-6 py-3.5 text-base font-bold text-neutral-900 shadow-lg transition hover:bg-[#ffe84d] active:scale-[0.98] font-sans"
              >
                <span aria-hidden className="text-xl">☕</span>
                Buy me a coffee
              </a>

              <button
                onClick={handleCopy}
                className="text-xs text-amber-200/50 hover:text-amber-100 transition-colors cursor-pointer font-sans"
              >
                {copied ? '✓ Lien copié' : 'Copier le lien'}
              </button>
            </div>

            <p className="mt-5 text-xs text-amber-200/40">
              Le paiement se fait sur Buy Me a Coffee, dans un nouvel onglet. Connexion internet requise.
            </p>
          </div>
        </section>

        {/* À quoi servent les dons */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-amber-100">À quoi servent les dons ?</h2>

          <ul className="grid gap-3 sm:grid-cols-3">
            {USES.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-amber-900/25 bg-neutral-950/55 p-4 sm:p-5 shadow-xl"
              >
                <div className="mb-2 text-2xl" aria-hidden>
                  {item.icon}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-amber-100">{item.title}</h3>
                <p className="mt-1 text-xs sm:text-sm text-amber-200/55 leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-center text-sm text-amber-200/50 pb-2">
          Un don est totalement facultatif. Merci d’utiliser Plotweaver, et bonne écriture ! ✍️
        </p>
      </main>
    </div>
  );
}

export default DonatePage;