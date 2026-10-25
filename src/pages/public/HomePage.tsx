import React from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BookOpen,
  Compass,
  Feather,
  HeartHandshake,
  Lock,
  MessageSquareHeart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { GlitchText } from '../../components/ui/GlitchText';
import { MarqueeBanner } from '../../components/ui/MarqueeBanner';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { useApp } from '../../context/AppContext';
import { OFFICIAL_SLOGAN, STORIES_SIGNATURE } from '../../lib/securityEngine';

const SIX_PILLAR_CARDS = [
  {
    title: 'Être écouté',
    description:
      'Échange avec notre assistant réflexif ou dépose une demande confidentielle auprès d’un écoutant humain bienveillant.',
    to: '/espace/ecoute',
    icon: HeartHandshake,
    accent: 'orange',
    cta: 'Demander une écoute',
  },
  {
    title: 'Comprendre ses émotions',
    description:
      'Mets des mots précis sur ton humeur, tes tensions et tes besoins sans jugement ni étiquette clinique.',
    to: '/espace/assistant',
    icon: MessageSquareHeart,
    accent: 'bordeaux',
    cta: 'Parler à l’assistant',
  },
  {
    title: 'Suivre son évolution',
    description:
      'Visualise ton sommeil, ton niveau de stress et tes bilans validés (OMS-5) sur 7 jours, 30 jours ou à ton rythme.',
    to: '/espace/bien-etre',
    icon: Activity,
    accent: 'orange',
    cta: 'Explorer mon suivi',
  },
  {
    title: 'Écrire librement',
    description:
      'Un journal intime chiffré et strictement personnel, avec des amorces d’écriture pour t’aider à démarrer.',
    to: '/espace/journal',
    icon: BookOpen,
    accent: 'bordeaux',
    cta: 'Ouvrir mon journal',
  },
  {
    title: 'Lire des histoires',
    description:
      'Découvre des récits authentiques et anonymes publiés uniquement avec l’accord explicite de leurs auteurs.',
    to: '/histoires',
    icon: Feather,
    accent: 'orange',
    cta: 'Lire les témoignages',
  },
  {
    title: 'Découvrir les conseils',
    description:
      'Des pistes de réflexion courtes, humaines et accessibles pour cultiver la franchise et l’apaisement au quotidien.',
    to: '/conseils',
    icon: Compass,
    accent: 'bordeaux',
    cta: 'Parcourir les conseils',
  },
];

export const HomePage: React.FC = () => {
  const { publicStories, dailyTips, openDailyTipModal, openConsentModal } = useApp();

  return (
    <div className="space-y-0">
      {/* ====================================================================
          SECTION PRINCIPALE (HERO) — Clarté immédiate au-dessus de la flottaison
          ==================================================================== */}
      <section className="relative overflow-hidden pt-10 pb-20 sm:pt-16 sm:pb-24">
        {/* Formes abstraites flottantes discrètes */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-nia-orange/10 dark:bg-nia-orange/15 blur-3xl animate-nia-float"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -left-24 w-80 h-80 rounded-full bg-nia-bordeaux/10 dark:bg-nia-bordeaux/20 blur-3xl animate-nia-float"
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Colonne Éditoriale Principale */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-nia-surface-dark border border-nia-orange/30 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-nia-orange animate-pulse" />
                <GlitchText
                  text={`« ${OFFICIAL_SLOGAN} »`}
                  className="text-xs sm:text-sm font-extrabold tracking-wide text-nia-bordeaux dark:text-amber-200"
                  occasionalIntervalMs={12000}
                />
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-nia-gray-dark dark:text-white leading-[1.12]">
                Ici, tu peux être{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux">
                  toi-même.
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-nia-gray-mid dark:text-gray-300 max-w-2xl leading-relaxed">
                Un espace pour exprimer ce que tu ressens, mettre des mots sur tes pensées, raconter ton histoire et avancer à ton rythme.
              </p>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  to="/espace/assistant"
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-base shadow-nia-soft hover:shadow-nia-glow transition-all"
                >
                  <span>Commencer à m&apos;exprimer</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#decouvrir-nia-mind"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-bordeaux text-nia-gray-dark dark:text-white font-bold text-base transition-all"
                >
                  <span>Découvrir Nia-Mind</span>
                </a>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-medium text-nia-gray-mid dark:text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-nia-orange" />
                  Écoute sans jugement
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
                  Journal et bilans 100% privés (RLS)
                </span>
                <button
                  type="button"
                  onClick={openDailyTipModal}
                  className="inline-flex items-center gap-1.5 text-nia-orange hover:text-nia-orange-deep font-semibold underline underline-offset-4"
                >
                  <Sparkles className="w-4 h-4" />
                  Lire le conseil du jour
                </button>
              </div>
            </div>

            {/* Colonne Composition Visuelle Originale & Illustration Humaine Sobre */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark p-6 sm:p-8 shadow-nia-soft">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-nia-orange" />
                    <span className="w-3 h-3 rounded-full bg-nia-bordeaux" />
                    <span className="w-3 h-3 rounded-full bg-nia-gray-light dark:bg-nia-border-dark" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                    Espace Sincère • Sans Rôle
                  </span>
                </div>

                {/* Illustration vectorielle éditoriale sobre : déposer le masque et respirer */}
                <div className="rounded-2xl bg-gradient-to-br from-nia-bg-light via-orange-50/60 to-rose-50/40 dark:from-nia-bg-dark dark:via-nia-surface-dark dark:to-nia-bordeaux-dark/30 p-6 border border-nia-gray-light/70 dark:border-nia-border-dark">
                  <svg
                    viewBox="0 0 360 220"
                    className="w-full h-48"
                    role="img"
                    aria-label="Illustration éditoriale Nia-Mind : une silhouette apaisée déposant un masque social pour s'exprimer avec sincérité"
                  >
                    <defs>
                      <linearGradient id="niaGradOrange" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F97316" />
                        <stop offset="100%" stopColor="#EA580C" />
                      </linearGradient>
                      <linearGradient id="niaGradBordeaux" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#7F1D3F" />
                        <stop offset="100%" stopColor="#57152D" />
                      </linearGradient>
                    </defs>

                    {/* Formes organiques d'apaisement */}
                    <circle cx="280" cy="60" r="46" fill="url(#niaGradOrange)" opacity="0.18" />
                    <circle cx="85" cy="155" r="52" fill="url(#niaGradBordeaux)" opacity="0.15" />

                    {/* Silhouette humaine sobre au centre */}
                    <path
                      d="M130 185 C130 142 156 122 180 122 C204 122 230 142 230 185"
                      fill="url(#niaGradBordeaux)"
                    />
                    <circle cx="180" cy="86" r="26" fill="url(#niaGradOrange)" />

                    {/* Onde de parole sincère */}
                    <path
                      d="M222 78 Q255 62 288 78"
                      stroke="#F97316"
                      strokeWidth="3"
                      strokeLinecap="round"
                      fill="none"
                    />
                    <path
                      d="M226 94 Q260 80 296 94"
                      stroke="#7F1D3F"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />

                    {/* Symbole discret du masque posé de côté */}
                    <g transform="translate(58, 52)">
                      <rect
                        x="0"
                        y="0"
                        width="54"
                        height="36"
                        rx="16"
                        fill="none"
                        stroke="#7F1D3F"
                        strokeWidth="2.2"
                        strokeDasharray="4 3"
                      />
                      <circle cx="18" cy="16" r="3" fill="#7F1D3F" />
                      <circle cx="36" cy="16" r="3" fill="#7F1D3F" />
                      <path
                        d="M18 25 Q27 29 36 25"
                        stroke="#F97316"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  </svg>

                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-bold text-nia-gray-dark dark:text-white">
                      « Ce qui occupe mon esprit aujourd’hui… »
                    </p>
                    <p className="text-xs text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                      Parler avec franchise, noter ses pensées dans un journal chiffré ou partager une histoire anonyme : chaque démarche reste sous ton contrôle.
                    </p>
                  </div>
                </div>

                {/* Mini-indicateurs d'engagement éthique */}
                <div className="mt-5 grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
                    <p className="text-base font-extrabold text-nia-orange">100%</p>
                    <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">Journal privé</p>
                  </div>
                  <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
                    <p className="text-base font-extrabold text-nia-bordeaux dark:text-amber-300">Double</p>
                    <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">Validation Histoires</p>
                  </div>
                  <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
                    <p className="text-base font-extrabold text-nia-gray-dark dark:text-white">OMS-5</p>
                    <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">Bilans vérifiés</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BANNIÈRE HORIZONTALE DÉFILANTE (Écoute • Franchise • Réflexion • Bien-être • Authenticité)
          ==================================================================== */}
      <MarqueeBanner />

      {/* ====================================================================
          LES 6 CARTES D'ACTION NIA-MIND
          ==================================================================== */}
      <section id="decouvrir-nia-mind" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-nia-orange">
              Un écosystème complet et humain
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
              Six façons d’avancer avec sincérité, selon ton besoin du moment
            </h2>
            <p className="text-base text-nia-gray-mid dark:text-gray-400">
              Que tu préfères le dialogue, l’écriture solitaire ou la lecture de témoignages, chaque espace a été conçu sans jargon médical ni lourdeur administrative.
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIX_PILLAR_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isOrange = card.accent === 'orange';
            return (
              <ScrollReveal key={card.title} delayMs={index * 60}>
                <Link
                  to={card.to}
                  className="group h-full flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange dark:hover:border-nia-orange shadow-sm hover:shadow-nia-soft hover:-translate-y-1 transition-all duration-300"
                >
                  <div className="space-y-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isOrange
                          ? 'bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange'
                          : 'bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-nia-gray-dark dark:text-white group-hover:text-nia-orange transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-400 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-nia-gray-light/70 dark:border-nia-border-dark flex items-center justify-between text-sm font-bold text-nia-orange">
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ====================================================================
          APERÇU DES HISTOIRES PUBLIQUES (« Chaque histoire mérite d'être entendue. »)
          ==================================================================== */}
      <section className="py-20 bg-white dark:bg-nia-surface-dark border-y border-nia-gray-light dark:border-nia-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-nia-bordeaux dark:text-amber-300">
                  <Feather className="w-4 h-4 text-nia-orange" />
                  Bibliothèque Anonyme & Vérifiée
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
                  <GlitchText text={STORIES_SIGNATURE} occasionalIntervalMs={20000} />
                </h2>
                <p className="text-sm sm:text-base text-nia-gray-mid dark:text-gray-400 max-w-2xl">
                  Seules les histoires approuvées par la modération <strong>et</strong> explicitement autorisées par leur auteur sur la version finale apparaissent ici.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/espace/histoires"
                  className="px-4 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold transition-colors"
                >
                  Partager mon histoire
                </Link>
                <Link
                  to="/histoires"
                  className="px-4 py-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-sm font-semibold text-nia-gray-dark dark:text-white transition-colors"
                >
                  Voir toute la bibliothèque ({publicStories.length})
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicStories.slice(0, 3).map((story, idx) => (
              <ScrollReveal key={story.id} delayMs={idx * 80}>
                <article className="h-full flex flex-col justify-between p-6 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-bordeaux/50 transition-all">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
                        {story.category}
                      </span>
                      <span className="text-[11px] text-nia-gray-mid dark:text-gray-400">
                        Version autorisée v{story.version}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                      {story.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed line-clamp-4">
                      « {story.content} »
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-nia-gray-light dark:border-nia-border-dark flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
                    <span>Par {story.publicPseudonym}</span>
                    <Link
                      to="/histoires"
                      className="font-bold text-nia-orange hover:text-nia-orange-deep"
                    >
                      Lire →
                    </Link>
                  </div>
                </article>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================================
          APERÇU DES CONSEILS ÉDITORIAUX & SECTION CONFIDENTIALITÉ
          ==================================================================== */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* Conseils éditoriaux */}
        <ScrollReveal>
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-nia-orange">
                  Repères quotidiens
                </span>
                <h2 className="text-3xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
                  Conseils éditoriaux pour ralentir et réfléchir
                </h2>
              </div>
              <Link
                to="/conseils"
                className="inline-flex items-center gap-1.5 text-sm font-bold text-nia-orange hover:text-nia-orange-deep"
              >
                Explorer tous les conseils
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dailyTips.slice(0, 3).map((tip) => (
                <div
                  key={tip.id}
                  className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-nia-orange uppercase tracking-wider">
                        {tip.category}
                      </span>
                      <span className="text-nia-gray-mid dark:text-gray-400">
                        {tip.readingTimeMin} min de lecture
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                      {tip.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-400">
                      {tip.summary}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark text-xs text-nia-bordeaux dark:text-amber-200 font-medium">
                    Question : « {tip.reflectionQuestion} »
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Section consacrée à la confidentialité et à l'éthique */}
        <ScrollReveal>
          <div className="rounded-3xl bg-gradient-to-br from-nia-bordeaux-dark via-nia-bordeaux to-nia-gray-dark text-white p-8 sm:p-12 shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-200 text-xs font-bold">
                  <Lock className="w-3.5 h-3.5 text-nia-orange" />
                  Architecture de Confiance & Vie Privée
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold">
                  Ta sincérité mérite une protection technique irréprochable.
                </h2>
                <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                  Sur Nia-Mind, la confidentialité n’est pas un simple slogan. Vos entrées de journal, vos bilans de bien-être et vos conversations sont isolés par des politiques <strong>Row Level Security (RLS)</strong>. Aucune histoire soumise n’est jamais publiée sans votre accord explicite sur la version finale révisée.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
                    <p className="font-bold text-nia-orange">Isolation Utilisateur A / B</p>
                    <p className="mt-1 text-white/80">
                      Chaque membre n’accède qu’à ses propres données privées.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
                    <p className="font-bold text-amber-300">Journal 100% Intime</p>
                    <p className="mt-1 text-white/80">
                      Aucune transformation automatique en témoignage public.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-black/20 border border-white/10">
                    <p className="font-bold text-emerald-300">Zéro Clé Secrète Client</p>
                    <p className="mt-1 text-white/80">
                      Les appels IA passent par une fonction serveur sécurisée.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col gap-3">
                <Link
                  to="/espace/confidentialite"
                  className="w-full text-center py-3.5 px-5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm shadow-lg transition-colors"
                >
                  Inspecter mes paramètres de confidentialité
                </Link>
                <button
                  type="button"
                  onClick={openConsentModal}
                  className="w-full text-center py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm border border-white/15 transition-colors"
                >
                  Vérifier mes consentements RGPD
                </button>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* Appel à l'action final */}
        <ScrollReveal>
          <div className="text-center max-w-3xl mx-auto py-8 space-y-5">
            <p className="text-sm font-extrabold uppercase tracking-widest text-nia-bordeaux dark:text-amber-300">
              Nia-Mind — « {OFFICIAL_SLOGAN} »
            </p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
              Prêt(e) à déposer ce que tu portes en toi, à ton rythme ?
            </h2>
            <p className="text-base text-nia-gray-mid dark:text-gray-400">
              Crée ton espace personnel en quelques secondes ou commence immédiatement une réflexion guidée.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to="/inscription"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold shadow-nia-soft transition-all"
              >
                <span>Créer mon espace privé</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/espace/tableau-de-bord"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange font-bold text-nia-gray-dark dark:text-white transition-all"
              >
                <span>Accéder au tableau de bord</span>
              </Link>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};
