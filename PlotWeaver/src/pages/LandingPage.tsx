import { Link, useNavigate } from 'react-router-dom';
//import { AppDemo } from '../components/landing/AppDemo';
//import { SITE } from '../config/site';

const FEATURES = [
  {
    icon: '📚',
    title: 'Romans & chapitres',
    text: 'Structurez chaque livre en chapitres et écrivez dans un éditeur sobre, pensé pour rester concentré.',
  },
  {
    icon: '💡',
    title: 'Carnet d’idées',
    text: 'Notez vos idées au fil de l’eau, classez-les par statut et rattachez-les à un roman.',
  },
  {
    icon: '🗂️',
    title: 'Versions & fusion',
    text: 'Gardez l’historique de vos textes, comparez-les ligne par ligne et fusionnez ce que vous voulez garder.',
  },
  {
    icon: '📴',
    title: 'Hors ligne d’abord',
    text: 'Écrivez partout, même sans connexion. Vous synchronisez quand vous le décidez.',
  },
  {
    icon: '📤',
    title: 'Export en un clic',
    text: 'PDF, EPUB, Word ou texte brut : récupérez votre manuscrit dans le format qu’il vous faut.',
  },
  {
    icon: '🎨',
    title: 'Thèmes clair & sombre',
    text: 'Une interface chaleureuse, confortable pour les longues sessions d’écriture, jour comme nuit.',
  },
];

const STEPS = [
  { n: '1', title: 'Créez votre roman', text: 'Donnez-lui un titre, ajoutez vos premiers chapitres.' },
  { n: '2', title: 'Écrivez et notez', text: 'Rédigez, et gardez vos idées à portée de main dans le carnet.' },
  { n: '3', title: 'Comparez, exportez', text: 'Retrouvez une ancienne version, fusionnez, puis exportez votre manuscrit.' },
];

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-full bg-[#1c1411] text-[#fcf9f2] overflow-x-hidden relative font-sans">
      {/* Lueurs d'ambiance */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[42rem] bg-[radial-gradient(circle_at_20%_20%,rgba(180,83,9,0.18),transparent_55%),radial-gradient(circle_at_85%_35%,rgba(120,53,15,0.15),transparent_50%)]" />

      {/* ───── Header ───── */}
      <header className="sticky top-0 z-30 border-b border-amber-900/30 bg-[#1c1411]/85 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 min-w-0 group">
            <span className="w-10 h-10 rounded-xl bg-amber-800 group-hover:bg-amber-700 transition flex items-center justify-center font-serif font-bold text-xl text-amber-50 shadow-md shrink-0">
              P
            </span>
            <span className="font-serif font-bold text-xl tracking-tight text-amber-100 truncate">Plotweaver</span>
          </Link>

          <nav aria-label="Sections" className="hidden md:flex items-center gap-7 text-sm text-amber-200/70">
            <a href="#demo" className="hover:text-amber-100 transition">Aperçu</a>
            <a href="#fonctionnalites" className="hover:text-amber-100 transition">Fonctionnalités</a>
            <a href="#comment" className="hover:text-amber-100 transition">Comment ça marche</a>
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {/* <Link
              to="/donate"
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm text-yellow-200 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-500/30 transition"
            >
              <span aria-hidden>☕</span> Soutenir
            </Link> */}
            <button
              onClick={() => navigate('/books')}
              className="bg-amber-700 hover:bg-amber-600 text-amber-50 px-4 sm:px-5 py-2.5 rounded-xl font-medium text-sm transition shadow-md cursor-pointer whitespace-nowrap"
            >
              Ouvrir l’application
            </button>
          </div>
        </div>
      </header>

      {/* ───── Hero ───── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 lg:pt-20 pb-16 sm:pb-24 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,36rem)] gap-12 lg:gap-16 items-center">
        <div className="space-y-6 sm:space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-800/30 text-amber-300 text-xs font-serif tracking-wide">
            ✨ Votre grimoire numérique d’écriture
          </div>

          <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold tracking-tight text-amber-50 leading-[1.08]">
            Donnez vie à vos <span className="text-amber-500 italic">romans</span>, chapitre après chapitre.
          </h1>

          <p className="text-amber-200/70 font-serif text-lg xl:text-xl leading-relaxed max-w-xl">
            Plotweaver réunit vos intrigues, vos chapitres, vos idées et l’historique de vos textes au même endroit, pour écrire sans distraction, même hors ligne.
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 pt-2">
            <button
              onClick={() => navigate('/books')}
              className="flex items-center justify-center sm:justify-start gap-3 bg-amber-600 hover:bg-amber-500 text-amber-950 px-6 py-3 rounded-2xl font-bold transition shadow-lg cursor-pointer hover:-translate-y-0.5"
            >
              <span className="text-xl">🌐</span>
              <span className="text-left">
                <span className="block text-[10px] uppercase tracking-wider opacity-80">Lancer sur</span>
                <span className="block text-sm">Version Web</span>
              </span>
            </button>

            <div className="flex items-center justify-center sm:justify-start gap-3 bg-neutral-900 border border-neutral-700 text-neutral-200 px-6 py-3 rounded-2xl">
              <span className="text-xl">📱</span>
              <span className="text-left">
                <span className="block text-[10px] uppercase tracking-wider opacity-60">Bientôt sur</span>
                <span className="block text-sm font-medium">iOS & Android</span>
              </span>
            </div>
          </div>

          <ul className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-amber-200/60 font-serif">
            <li>✓ Gratuit</li>
            <li>✓ Fonctionne hors ligne</li>
            <li>✓ Vos textes vous appartiennent</li>
          </ul>
        </div>

        <div id="demo" className="scroll-mt-24">
          {/* <AppDemo /> */}
        </div>
      </section>

      {/* ───── Fonctionnalités ───── */}
      <section id="fonctionnalites" className="relative scroll-mt-20 border-t border-amber-900/25 bg-neutral-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-3">Fonctionnalités</p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100">Tout ce qu’il faut pour mener un roman à son terme</h2>
          </div>

          <ul className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <li
                key={feature.title}
                className="rounded-3xl border border-amber-900/25 bg-neutral-950/60 p-6 shadow-xl hover:border-amber-700/50 transition"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-800/40 bg-amber-950 text-2xl" aria-hidden>
                  {feature.icon}
                </div>
                <h3 className="font-serif text-xl font-bold text-amber-100">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-200/60">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ───── Comment ça marche ───── */}
      <section id="comment" className="relative scroll-mt-20 border-t border-amber-900/25">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl mb-10 sm:mb-14">
            <p className="text-xs uppercase tracking-[0.28em] text-amber-200/40 mb-3">Comment ça marche</p>
           <h2 className="text-3xl sm:text-4xl font-serif font-bold text-amber-100">Trois étapes, aucune prise de tête</h2>
          </div>

          {/* Steps */}
           <ol className="grid gap-4 sm:gap-5 md:grid-cols-3">
            {STEPS.map((step) => (
              <li key={step.n} className="relative rounded-3xl border border-amber-900/25 bg-neutral-950/50 p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-800 text-amber-50 font-serif font-bold">
                  {step.n}
                </span>
                <h3 className="mt-4 font-serif text-xl font-bold text-amber-100">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-200/60">{step.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ───── Appel final ───── */}
      <section className="relative border-t border-amber-900/25">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-amber-50">Prêt à tisser votre histoire ?</h2>
          <p className="mt-4 font-serif text-lg text-amber-200/60">Ouvrez Plotweaver et commencez votre premier chapitre.</p>

          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate('/books')}
              className="px-7 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-amber-950 font-bold shadow-lg transition cursor-pointer hover:-translate-y-0.5"
            >
              Ouvrir l’application
            </button>
            <Link
              to="/donate"
              className="px-7 py-3.5 rounded-2xl text-yellow-200 bg-yellow-400/10 hover:bg-yellow-400/20 border border-yellow-500/30 font-medium transition"
            >
              ☕ Soutenir le projet
            </Link>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="relative border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-900 flex items-center justify-center font-serif font-bold text-amber-50">P</span>
            <span>© {new Date().getFullYear()} Plotweaver. Tous droits réservés.</span>
          </div>

          {/* Liens légaux */}
          <nav aria-label="Liens légaux" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/privacy" className="hover:text-neutral-300 transition">Confidentialité</Link>
            <Link to="/terms" className="hover:text-neutral-300 transition">Conditions</Link>
            <Link to="/support" className="hover:text-neutral-300 transition">Support</Link>
            {/* <Link to="/donate" className="hover:text-neutral-300 transition">☕ Soutenir</Link> */}
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;