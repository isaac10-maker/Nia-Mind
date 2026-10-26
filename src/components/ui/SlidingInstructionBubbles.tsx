import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sparkles, X, ChevronLeft, ChevronRight, HelpCircle, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface InstructionSlide {
  badge: string;
  title: string;
  detail: string;
  ctaLabel?: string;
  ctaPath?: string;
}

const DEFAULT_PUBLIC_SLIDES: InstructionSlide[] = [
  {
    badge: 'Mode Visiteur • Navigation libre',
    title: 'Explorez librement les onglets publics',
    detail:
      'Parcourez l’Accueil, Nos ressources d’aide, les Conseils du jour et les Histoires anonymes. Pour utiliser l’Assistant ou ouvrir votre espace personnel, connectez-vous en un clic.',
    ctaLabel: 'S’inscrire / Se connecter',
    ctaPath: '/inscription',
  },
  {
    badge: 'Onglet Assistant & Réflexion',
    title: 'Parlez sans masque à votre rythme',
    detail:
      'Dès votre connexion, l’Assistant réflexif vous accueille dans une bulle 100 % vierge et privée : posez vos pensées, votre stress ou vos choix du moment.',
    ctaLabel: 'Ouvrir mon compte',
    ctaPath: '/connexion',
  },
  {
    badge: 'Onglets Bien-être & Journal privé',
    title: 'Vos courbes et vos écrits vous appartiennent',
    detail:
      'Notez votre météo intérieure, votre sommeil, passez le bilan OMS-5 ou écrivez dans votre journal personnel strictement confidentiel.',
    ctaLabel: 'Commencer maintenant',
    ctaPath: '/inscription',
  },
  {
    badge: 'Onglet Histoires & Écoute humaine',
    title: 'Chaque histoire mérite d’être entendue',
    detail:
      'Lisez des récits authentiques ou partagez le vôtre sous pseudonyme : aucune histoire n’est jamais publiée sans votre accord explicite.',
    ctaLabel: 'Découvrir les histoires',
    ctaPath: '/histoires',
  },
];

const PERSONAL_SLIDES_BY_PATH: Record<string, InstructionSlide[]> = {
  '/espace/assistant': [
    {
      badge: 'Guide Assistant • Étape 1/3',
      title: 'Démarrez votre première réflexion sincère',
      detail:
        'Cliquez sur « Nouvelle conversation » ou choisissez une amorce rapide ci-dessous pour déposer ce que vous ressentez sans filtre ni jugement.',
    },
    {
      badge: 'Guide Assistant • Étape 2/3',
      title: 'Comment l’assistant vous accompagne',
      detail:
        'Il vous aide à mettre des mots sur votre fatigue, votre stress ou vos décisions grâce à des questions ouvertes — sans jamais poser de diagnostic médical.',
    },
    {
      badge: 'Guide Assistant • Étape 3/3',
      title: 'Orientation immédiate en cas de coup dur',
      detail:
        'Si vous traversez une détresse intense, les numéros d’aide vérifiés de votre pays et la demande d’écoute humaine s’affichent instantanément.',
    },
  ],
  '/espace/bien-etre': [
    {
      badge: 'Guide Bien-être • 4 sous-onglets',
      title: '1. Humeur • 2. Stress & Sommeil • 3. Bilan OMS-5 • 4. Progression',
      detail:
        'Enregistrez votre premier ressenti du jour pour voir vos graphiques Orange & Bordeaux se construire automatiquement sur 7 ou 30 jours.',
    },
    {
      badge: 'Indice OMS-5 Vérifié',
      title: '5 questions simples sur les 2 dernières semaines',
      detail:
        'Calculez votre score d’équilibre général sur 100 avec une interprétation bienveillante et non clinique.',
    },
  ],
  '/espace/journal': [
    {
      badge: 'Guide Journal Privé • 100 % Confidentiel',
      title: 'Votre carnet intime démarre vierge',
      detail:
        'Utilisez une amorce d’écriture (« Ce que je n’ose pas dire… ») ou écrivez librement. Même l’administrateur ne peut jamais lire votre journal.',
    },
    {
      badge: 'Brouillons & Recherche',
      title: 'Retrouvez vos pensées par catégorie',
      detail:
        'Enregistrez en brouillon ou validez vos notes : tout reste isolé dans votre espace personnel sécurisé.',
    },
  ],
  '/espace/histoires': [
    {
      badge: 'Guide Histoires Anonymes • Étape 1/2',
      title: 'Partagez sous pseudonyme en toute sécurité',
      detail:
        'Écrivez votre vécu en brouillon privé, puis soumettez-le à la modération bienveillante uniquement quand vous êtes prêt(e).',
    },
    {
      badge: 'Double Consentement Garanti • Étape 2/2',
      title: 'Vous gardez le dernier mot sur la publication',
      detail:
        'Si l’équipe propose d’anonymiser un détail, vous recevez une notification pour approuver ou refuser la version exacte avant toute mise en ligne.',
    },
  ],
  '/espace/ecoute-humaine': [
    {
      badge: 'Guide Écoute Humaine',
      title: 'Demandez un échange confidentiel avec un écoutant',
      detail:
        'Indiquez le sujet, votre mode préféré (écrit asynchrone ou créneau dédié) et suivez l’évolution de votre demande en temps réel.',
    },
  ],
};

export const FloatingInstructionPopup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, reducedMotion } = useApp();

  // Fermé par défaut : l'utilisateur doit cliquer sur le bouton "?" pour le déplier
  const [dismissed, setDismissed] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const slides: InstructionSlide[] = React.useMemo(() => {
    for (const [prefix, list] of Object.entries(PERSONAL_SLIDES_BY_PATH)) {
      if (location.pathname.startsWith(prefix)) {
        return list;
      }
    }
    if (location.pathname.startsWith('/espace')) {
      return [
        {
          badge: 'Bienvenue dans votre espace',
          title: 'Tout votre espace démarre propre et sans fausses données',
          detail:
            'Naviguez entre les onglets à gauche : Assistant réflexif, Mon bien-être, Mon journal, Histoires anonymes et Écoute humaine.',
        },
        ...PERSONAL_SLIDES_BY_PATH['/espace/assistant'],
      ];
    }
    return DEFAULT_PUBLIC_SLIDES;
  }, [location.pathname]);

  useEffect(() => {
    setActiveIndex(0);
  }, [location.pathname]);

  useEffect(() => {
    if (dismissed || reducedMotion || slides.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [dismissed, reducedMotion, slides.length]);

  const currentSlide = slides[activeIndex] || slides[0];

  if (dismissed) {
    return (
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setDismissed(false)}
          title="Guide & Instructions"
          aria-label="Afficher le guide et les instructions (?)"
          className="w-12 h-12 rounded-full inline-flex items-center justify-center bg-gradient-to-br from-nia-orange to-nia-bordeaux text-white text-xl font-black shadow-xl hover:scale-110 transition-transform border-2 border-white/40"
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
    );
  }

  return (
    <aside
      aria-label="Bulle flottante d’instructions des onglets"
      className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-96 rounded-3xl nia-glass-card border-2 border-nia-orange/40 dark:border-nia-orange/50 shadow-2xl p-4 sm:p-5 transition-all duration-300"
    >
      {/* En-tête de la pop-up avec bouton croix (X) explicite */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-nia-orange/20 to-nia-bordeaux/20 text-nia-orange-deep dark:text-orange-300 text-[11px] font-extrabold">
          <Sparkles className="w-3.5 h-3.5 text-nia-orange shrink-0" />
          {currentSlide.badge}
        </span>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Fermer la bulle d’instructions"
          title="Fermer"
          className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-nia-bordeaux/15 hover:bg-nia-bordeaux hover:text-white text-nia-bordeaux dark:text-rose-200 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Contenu glissant */}
      <div key={activeIndex} className="space-y-2 animate-nia-slide-in">
        <h3 className="text-sm font-extrabold text-nia-gray-dark dark:text-white leading-snug">
          {currentSlide.title}
        </h3>
        <p className="text-xs text-nia-gray-mid dark:text-gray-300 leading-relaxed">
          {currentSlide.detail}
        </p>

        {!currentUser && currentSlide.ctaLabel && currentSlide.ctaPath && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => navigate(currentSlide.ctaPath!)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <span>{currentSlide.ctaLabel}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Contrôles de défilement glissant */}
      {slides.length > 1 && (
        <div className="mt-3 pt-2.5 border-t border-nia-orange/20 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Instruction ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  idx === activeIndex
                    ? 'w-6 bg-gradient-to-r from-nia-orange to-nia-bordeaux'
                    : 'w-2 bg-nia-gray-light dark:bg-gray-700'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length)}
              aria-label="Instruction précédente"
              className="p-1 rounded-lg hover:bg-nia-orange/15 text-nia-gray-dark dark:text-gray-300"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-bold text-nia-gray-mid dark:text-gray-400">
              {activeIndex + 1}/{slides.length}
            </span>
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => (prev + 1) % slides.length)}
              aria-label="Instruction suivante"
              className="p-1 rounded-lg hover:bg-nia-orange/15 text-nia-gray-dark dark:text-gray-300"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export const InlineSlidingGuideBanner: React.FC<{
  slides: InstructionSlide[];
  storageKey?: string;
  compact?: boolean;
}> = ({ slides, compact = false }) => {
  const { reducedMotion } = useApp();
  const [closed, setClosed] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (closed || reducedMotion || slides.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [closed, reducedMotion, slides.length]);

  if (closed || slides.length === 0) return null;
  const current = slides[index] || slides[0];

  return (
    <div
      className={`relative overflow-hidden nia-glass-card border border-nia-orange/35 dark:border-nia-orange/40 shadow-nia-soft ${
        compact ? 'rounded-2xl p-3' : 'rounded-3xl p-5 sm:p-6'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div key={index} className={`animate-nia-slide-in pr-2 ${compact ? 'space-y-1' : 'space-y-1.5 pr-4'}`}>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-orange-300 text-[11px] font-extrabold">
            <Sparkles className="w-3.5 h-3.5" />
            {current.badge}
          </span>
          <h3
            className={`font-extrabold text-nia-gray-dark dark:text-white ${
              compact ? 'text-sm' : 'text-base sm:text-lg'
            }`}
          >
            {current.title}
          </h3>
          <p
            className={`text-nia-gray-mid dark:text-gray-300 leading-relaxed max-w-3xl ${
              compact ? 'text-xs line-clamp-1' : 'text-xs sm:text-sm'
            }`}
          >
            {current.detail}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setClosed(true)}
          aria-label="Fermer cette bulle d’instruction"
          title="Fermer"
          className="w-8 h-8 rounded-full inline-flex items-center justify-center bg-nia-bordeaux/15 hover:bg-nia-bordeaux hover:text-white text-nia-bordeaux dark:text-rose-200 transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {slides.length > 1 && (
        <div className={`${compact ? 'mt-2' : 'mt-4'} flex items-center gap-2`}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Diapositive ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index
                  ? 'w-7 bg-gradient-to-r from-nia-orange to-nia-bordeaux'
                  : 'w-2 bg-nia-orange/25 dark:bg-white/20'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
