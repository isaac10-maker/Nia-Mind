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
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
import { useApp } from '../../context/AppContext';
import { OFFICIAL_SLOGAN, STORIES_SIGNATURE } from '../../lib/securityEngine';

const SIX_PILLAR_CARDS = [
  {
    title: 'Être écouté(e)',
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
      'Un journal intime strictement personnel, avec des amorces d’écriture pour t’aider à démarrer.',
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

const FIVE_AMBIANCES = [
  {
    num: '01',
    title: 'Parler sans masque à l’Assistant réflexif',
    desc: 'Dépose ce qui te pèse à toute heure : l’assistant t’aide à prendre du recul par des questions ouvertes.',
    tone: 'from-nia-orange/25 to-nia-orange/5 border-nia-orange/40',
    numColor: 'text-nia-orange',
    to: '/espace/assistant',
  },
  {
    num: '02',
    title: 'Mesurer sa météo intérieure (Humeur, Stress, Sommeil & OMS-5)',
    desc: 'Suis ton évolution sur 7 ou 30 jours avec des graphiques clairs en symbiose Orange & Bordeaux.',
    tone: 'from-nia-bordeaux/25 to-nia-bordeaux/5 border-nia-bordeaux/40',
    numColor: 'text-nia-bordeaux dark:text-amber-300',
    to: '/espace/bien-etre',
  },
  {
    num: '03',
    title: 'Écrire dans un carnet intime 100 % personnel',
    desc: 'Tes notes et brouillons n’appartiennent qu’à toi : jamais publiés, jamais lus par des tiers.',
    tone: 'from-nia-orange/20 to-nia-bordeaux/15 border-nia-orange/35',
    numColor: 'text-nia-orange-deep dark:text-orange-300',
    to: '/espace/journal',
  },
  {
    num: '04',
    title: 'Lire ou partager une histoire anonyme',
    desc: 'Chaque récit est protégé par le double consentement : rien n’est mis en ligne sans ton accord sur la version finale.',
    tone: 'from-nia-bordeaux/25 to-nia-orange/15 border-nia-bordeaux/35',
    numColor: 'text-nia-bordeaux dark:text-pink-300',
    to: '/histoires',
  },
  {
    num: '05',
    title: 'Demander une écoute humaine ou consulter les urgences',
    desc: 'Échange en toute confidentialité avec un écoutant ou accède immédiatement aux numéros d’aide vérifiés de ton pays.',
    tone: 'from-nia-orange/25 to-nia-bordeaux/20 border-nia-orange/40',
    numColor: 'text-nia-orange',
    to: '/ressources',
  },
];

export const HomePage: React.FC = () => {
  const { currentUser, publicStories, dailyTips, openDailyTipModal, openConsentModal } = useApp();

  const resolveToolLink = (target: string) => {
    if (target.startsWith('/espace') && !currentUser) {
      return `/inscription?redirect=${encodeURIComponent(target)}`;
    }
    return target;
  };

  return (
    <div className="space-y-0">
      {/* ====================================================================
          SECTION PRINCIPALE (HERO) — Symbiose Orange & Bordeaux, Glitch & Arches
          ==================================================================== */}
      <section className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-22">
        {/* Filigrane géant en contour inspiré de MAMAORA */}
        <div
          aria-hidden="true"
          className="nia-stroke-watermark hidden lg:block absolute right-4 -bottom-10 text-[11rem] font-black tracking-tighter leading-none opacity-60"
        >
          VRAI
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-10">
          {/* Bulle glissante d'instructions des onglets (avec bouton croix X) */}
          <InlineSlidingGuideBanner
            slides={[
              {
                badge: 'Bienvenue sur Nia-Mind • Mode Découverte',
                title: 'Tu n’es pas seul(e) à être seul(e) — explore les onglets à ton rythme',
                detail:
                  'En mode visiteur, fais défiler librement nos Ressources, nos Conseils et les Histoires anonymes. Dès que tu veux parler à l’Assistant ou ouvrir ton espace personnel, inscris-toi en quelques secondes avec ton e-mail ou Gmail.',
              },
              {
                badge: 'Astuce Navigation • Onglet Assistance & Bien-être',
                title: 'Un espace personnel vierge de toute fausse donnée',
                detail:
                  'Ton journal, tes conversations et tes courbes de sommeil démarrent à zéro pour refléter uniquement ta propre histoire.',
              },
              {
                badge: 'Astuce Confidentialité • Double Consentement',
                title: 'Tes écrits restent sous ton contrôle absolu',
                detail:
                  'Ton journal intime n’est jamais lisible par quiconque, et aucune histoire anonyme n’est publiée sans ton accord explicite.',
              },
            ]}
          />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Colonne Éditoriale Principale */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full nia-glass-card border-2 border-nia-orange/40 shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-nia-orange animate-ping" />
                <GlitchText
                  text={`Nia-Mind — « ${OFFICIAL_SLOGAN} »`}
                  className="text-xs sm:text-sm font-extrabold tracking-wide text-nia-bordeaux dark:text-amber-200"
                  occasionalIntervalMs={9000}
                />
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-nia-gray-dark dark:text-white leading-[1.04]">
                <span className="block">Tu n’es pas seul(e)</span>
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux">
                  <GlitchText text="à être seul(e)." occasionalIntervalMs={11000} />
                </span>
                <span className="block text-2xl sm:text-4xl mt-2 text-nia-bordeaux dark:text-amber-200">
                  Ici, tu peux déposer le masque.
                </span>
              </h1>

              <p className="text-base sm:text-xl text-nia-gray-dark/90 dark:text-gray-200 max-w-2xl leading-relaxed font-medium">
                Un espace chaleureux d’écoute, de franchise et de réflexion personnelle pour mettre des mots sur ce que tu traverses, écrire librement et avancer sans jouer de rôle.
              </p>

              {/* Tags thématiques flottants cliquables */}
              <div className="flex flex-wrap gap-2 pt-1">
                {[
                  '« Tu n’es pas seul(e) »',
                  'Parler sans jugement',
                  'Déposer sa fatigue',
                  'Journal 100 % intime',
                  'Histoires vraies & anonymes',
                ].map((tag, i) => (
                  <span
                    key={tag}
                    className={`px-3 py-1 rounded-full text-xs font-extrabold border backdrop-blur-sm ${
                      i % 2 === 0
                        ? 'bg-nia-orange/15 border-nia-orange/40 text-nia-orange-deep dark:text-orange-300'
                        : 'bg-nia-bordeaux/15 border-nia-bordeaux/40 text-nia-bordeaux dark:text-rose-200'
                    }`}
                  >
                    ✺ {tag}
                  </span>
                ))}
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-4">
                <Link
                  to={resolveToolLink('/espace/assistant')}
                  className="nia-tactile-card inline-flex items-center gap-2.5 px-7 py-4 rounded-full bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux text-white font-extrabold text-base shadow-lg"
                >
                  <span>
                    {currentUser ? 'Parler à l’Assistant Nia-Mind' : 'Commencer à m’exprimer'}
                  </span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a
                  href="#cinq-ambiances"
                  className="inline-flex items-center gap-2 px-6 py-4 rounded-full nia-glass-card border-2 border-nia-bordeaux/35 hover:border-nia-orange text-nia-gray-dark dark:text-white font-extrabold text-base transition-all"
                >
                  <span>Découvrir les 5 ambiances</span>
                </a>
              </div>

              <div className="pt-3 flex flex-wrap items-center gap-5 text-xs font-bold text-nia-gray-dark dark:text-gray-300">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-nia-orange" />
                  Écoute bienveillante & sans jugement
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
                  Confidentialité totale de tes écrits
                </span>
                <button
                  type="button"
                  onClick={openDailyTipModal}
                  className="inline-flex items-center gap-1.5 text-nia-orange-deep dark:text-nia-orange hover:underline underline-offset-4 font-extrabold"
                >
                  <Sparkles className="w-4 h-4" />
                  Ouvrir le conseil du jour
                </button>
              </div>
            </div>

            {/* Colonne Visuelle Dynamique inspirée des Arches de MAMAORA en Orange & Bordeaux */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl nia-glass-card border-2 border-nia-orange/35 dark:border-nia-border-dark p-6 sm:p-8 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-nia-orange" />
                    <span className="w-3 h-3 rounded-full bg-nia-bordeaux" />
                    <span className="w-3 h-3 rounded-full bg-amber-400" />
                  </div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                    « {OFFICIAL_SLOGAN} »
                  </span>
                </div>

                {/* 5 Arches vivantes (Écoute, Franchise, Réflexion, Bien-être, Authenticité) */}
                <div className="flex items-end justify-center gap-2.5 h-56 pt-4 px-2">
                  {[
                    {
                      label: 'Écoute',
                      h: 'h-36',
                      bg: 'from-nia-orange/85 to-nia-orange-deep/90 text-white',
                    },
                    {
                      label: 'Franchise',
                      h: 'h-44',
                      bg: 'from-nia-bordeaux/90 to-nia-bordeaux-dark/95 text-amber-100',
                    },
                    {
                      label: 'Vérité',
                      h: 'h-52',
                      bg: 'from-nia-orange via-nia-orange-deep to-nia-bordeaux text-white',
                    },
                    {
                      label: 'Apaisement',
                      h: 'h-44',
                      bg: 'from-nia-bordeaux/85 to-nia-orange-deep/85 text-white',
                    },
                    {
                      label: 'Respect',
                      h: 'h-36',
                      bg: 'from-nia-orange/80 to-nia-bordeaux/85 text-white',
                    },
                  ].map((arch, idx) => (
                    <div
                      key={arch.label}
                      style={{ animationDelay: `${idx * 180}ms` }}
                      className={`flex-1 ${arch.h} rounded-t-full bg-gradient-to-b ${arch.bg} p-2 flex flex-col items-center justify-between shadow-lg animate-nia-float border border-white/25`}
                    >
                      <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-[11px] font-black mt-2">
                        0{idx + 1}
                      </div>
                      <span className="text-[10px] sm:text-xs font-extrabold tracking-tight pb-3 text-center">
                        {arch.label}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Ticket incliné façon pass MAMAORA */}
                <div className="mt-5 p-4 rounded-2xl bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white shadow-lg transform -rotate-1">
                  <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-widest text-amber-200">
                    <span>Pass Sincérité Nia-Mind</span>
                    <span>Accès Libre & Confidentiel</span>
                  </div>
                  <p className="text-base sm:text-lg font-black mt-1">
                    « Ton histoire compte. Tes silences aussi. »
                  </p>
                  <p className="text-xs text-amber-100/90 mt-1">
                    Connecte-toi avec ton e-mail ou Gmail pour débloquer ton Assistant, ton Journal et ton Suivi Bien-être.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================================
          BANNIÈRE HORIZONTALE DÉFILANTE INCLINÉE
          ==================================================================== */}
      <div className="transform -rotate-1 my-2">
        <MarqueeBanner />
      </div>

      {/* ====================================================================
          CINQ ÉTAPES, CINQ AMBIANCES (Inspiré de MAMAORA adapté à Nia-Mind)
          ==================================================================== */}
      <section id="cinq-ambiances" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <ScrollReveal>
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 text-xs font-extrabold uppercase tracking-wider">
               Parcours Guidé Nia-Mind
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-nia-gray-dark dark:text-white tracking-tight">
              Cinq espaces, cinq ambiances pour déposer le masque
            </h2>
            <p className="text-base text-nia-gray-mid dark:text-gray-300">
              En mode visiteur, découvre chaque étape ci-dessous. Clique sur celle qui t’appelle aujourd’hui pour t’inscrire ou ouvrir ton espace.
            </p>
          </div>
        </ScrollReveal>

        <ol className="space-y-4">
          {FIVE_AMBIANCES.map((step, i) => (
            <ScrollReveal key={step.num} delayMs={i * 50}>
              <li>
                <Link
                  to={resolveToolLink(step.to)}
                  className={`nia-tactile-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-gradient-to-r ${step.tone} border-2 backdrop-blur-md`}
                >
                  <div className="flex items-start sm:items-center gap-4 sm:gap-6">
                    <span className={`text-3xl sm:text-5xl font-black ${step.numColor} shrink-0`}>
                      {step.num}
                    </span>
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-nia-gray-dark dark:text-white">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300 mt-1">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/75 dark:bg-black/30 text-xs font-extrabold text-nia-bordeaux dark:text-amber-200 shrink-0 self-start sm:self-center">
                    <span>{currentUser || !step.to.startsWith('/espace') ? 'Ouvrir' : 'S’inscrire & ouvrir'}</span>
                    <ArrowRight className="w-4 h-4 text-nia-orange" />
                  </span>
                </Link>
              </li>
            </ScrollReveal>
          ))}
        </ol>
      </section>

      {/* ====================================================================
          LES 6 CARTES D'ACTION NIA-MIND (Tactiles & Flottantes)
          ==================================================================== */}
      <section id="decouvrir-nia-mind" className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-nia-orange">
              Un écosystème complet et humain
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-nia-gray-dark dark:text-white">
              Six façons d’avancer avec sincérité, selon ton besoin du moment
            </h2>
          </div>
        </ScrollReveal>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SIX_PILLAR_CARDS.map((card, index) => {
            const Icon = card.icon;
            const isOrange = card.accent === 'orange';
            return (
              <ScrollReveal key={card.title} delayMs={index * 60}>
                <Link
                  to={resolveToolLink(card.to)}
                  className={`nia-tactile-card group h-full flex flex-col justify-between p-6 rounded-3xl border-2 transition-all duration-300 ${
                    isOrange
                      ? 'bg-gradient-to-br from-nia-orange/20 via-white/75 to-nia-bordeaux/10 dark:from-nia-orange/20 dark:via-nia-surface-dark/85 dark:to-nia-bordeaux/25 border-nia-orange/40'
                      : 'bg-gradient-to-br from-nia-bordeaux/20 via-white/75 to-nia-orange/10 dark:from-nia-bordeaux/30 dark:via-nia-surface-dark/85 dark:to-nia-orange/20 border-nia-bordeaux/40'
                  }`}
                >
                  <div className="space-y-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                        isOrange
                          ? 'bg-nia-orange text-white shadow-sm'
                          : 'bg-nia-bordeaux text-white shadow-sm'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-extrabold text-nia-gray-dark dark:text-white group-hover:text-nia-orange transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-nia-orange/20 dark:border-white/10 flex items-center justify-between text-sm font-extrabold text-nia-bordeaux dark:text-amber-300">
                    <span>{card.cta}</span>
                    <ArrowRight className="w-4 h-4 text-nia-orange transform group-hover:translate-x-1 transition-transform" />
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
      <section className="py-16 nia-glass-card border-y border-nia-orange/25 dark:border-nia-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <ScrollReveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-nia-bordeaux dark:text-amber-300">
                  <Feather className="w-4 h-4 text-nia-orange" />
                  Bibliothèque Anonyme & Vérifiée
                </span>
                <h2 className="text-3xl sm:text-4xl font-black text-nia-gray-dark dark:text-white">
                  <GlitchText text={STORIES_SIGNATURE} occasionalIntervalMs={16000} />
                </h2>
                <p className="text-sm sm:text-base text-nia-gray-mid dark:text-gray-300 max-w-2xl">
                  Seules les histoires explicitement autorisées par leur auteur sur la version finale apparaissent ici.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to={resolveToolLink('/espace/histoires')}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-sm font-extrabold shadow-sm transition-transform hover:-translate-y-0.5"
                >
                  Partager mon histoire
                </Link>
                <Link
                  to="/histoires"
                  className="px-5 py-2.5 rounded-full border-2 border-nia-orange/40 text-sm font-extrabold text-nia-gray-dark dark:text-white hover:border-nia-orange transition-colors"
                >
                  Voir toute la bibliothèque ({publicStories.length})
                </Link>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicStories.slice(0, 3).map((story, idx) => (
              <ScrollReveal key={story.id} delayMs={idx * 80}>
                <article className="nia-tactile-card h-full flex flex-col justify-between p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-bordeaux/25">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
                        {story.category}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Accord auteur vérifié
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
                      {story.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-200 leading-relaxed line-clamp-4">
                      « {story.content} »
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-nia-orange/20 flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-300">
                    <span>Signé : <strong>{story.publicPseudonym}</strong></span>
                    <Link
                      to="/histoires"
                      className="font-extrabold text-nia-orange hover:text-nia-orange-deep"
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
          APERÇU DES CONSEILS ÉDITORIAUX & ENGAGEMENT DE CONFIANCE
          ==================================================================== */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        <ScrollReveal>
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-nia-orange">
                  Repères quotidiens
                </span>
                <h2 className="text-3xl font-black text-nia-gray-dark dark:text-white mt-1">
                  Conseils éditoriaux pour ralentir et réfléchir
                </h2>
              </div>
              <Link
                to="/conseils"
                className="inline-flex items-center gap-1.5 text-sm font-extrabold text-nia-orange hover:text-nia-orange-deep"
              >
                Explorer tous les conseils
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {dailyTips.slice(0, 3).map((tip) => (
                <div
                  key={tip.id}
                  className="nia-tactile-card p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/30 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-nia-orange uppercase tracking-wider">
                        {tip.category}
                      </span>
                      <span className="text-nia-gray-mid dark:text-gray-300 font-semibold">
                        {tip.readingTimeMin} min de lecture
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
                      {tip.title}
                    </h3>
                    <p className="text-sm text-nia-gray-mid dark:text-gray-300">
                      {tip.summary}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-nia-orange/15 to-nia-bordeaux/15 text-xs text-nia-bordeaux dark:text-amber-200 font-bold">
                    Question : « {tip.reflectionQuestion} »
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Appel à l'action final inspiré du grand final MAMAORA */}
        <ScrollReveal>
          <div className="rounded-3xl bg-gradient-to-br from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-amber-200">
              Nia-Mind — « {OFFICIAL_SLOGAN} »
            </p>
            <h2 className="text-3xl sm:text-6xl font-black tracking-tight leading-none">
              Ton histoire compte.<br />
              <span className="text-amber-300">Ne porte plus tout seul(e).</span>
            </h2>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto">
              Inscris-toi gratuitement avec ton adresse e-mail ou ton compte Gmail pour accéder à l’Assistant réflexif, à ton Journal intime et à ton Suivi bien-être.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Link
                to={currentUser ? '/espace/tableau-de-bord' : '/inscription'}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-nia-bordeaux-dark font-black text-base shadow-xl hover:scale-105 transition-transform"
              >
                <span>{currentUser ? 'Ouvrir mon espace personnel' : 'Créer mon compte maintenant'}</span>
                <ArrowRight className="w-5 h-5 text-nia-orange" />
              </Link>
              <button
                type="button"
                onClick={openConsentModal}
                className="inline-flex items-center gap-2 px-6 py-4 rounded-full bg-black/25 hover:bg-black/40 text-white font-bold text-sm border border-white/25 transition-colors"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Politique de confidentialité & Cookies</span>
              </button>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};
