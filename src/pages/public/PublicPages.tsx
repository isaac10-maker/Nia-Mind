import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Feather,
  HeartHandshake,
  Lock,
  Mail,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlitchText } from '../../components/ui/GlitchText';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
import {
  OFFICIAL_SLOGAN,
  sanitizeInternalRedirect,
  STORIES_SIGNATURE,
} from '../../lib/securityEngine';
import { DailyTip, UserProfile } from '../../lib/types';
import { Modal } from '../../components/ui/Modal';
import { platformNotice } from '../../lib/platformControls';

// ============================================================================
// 1. PAGE PUBLIQUE : NOS RESSOURCES (/ressources)
// ============================================================================
export const ResourcesPage: React.FC = () => {
  const { helpResources, currentUser } = useApp();
  const [selectedCountry, setSelectedCountry] = useState<string>(
    currentUser?.countryCode || 'ALL'
  );

  const countries = [
    { code: 'ALL', label: 'Tous les pays vérifiés' },
    { code: 'BF', label: 'Burkina Faso (BF)' },
    { code: 'FR', label: 'France (FR)' },
    { code: 'SN', label: 'Sénégal (SN)' },
    { code: 'CI', label: 'Côte d’Ivoire (CI)' },
    { code: 'BE', label: 'Belgique (BE)' },
    { code: 'CA', label: 'Canada (CA)' },
    { code: 'INT', label: 'International' },
  ];

  const filtered = helpResources.filter(
    (r) => selectedCountry === 'ALL' || r.countryCode === selectedCountry || r.countryCode === 'INT'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Guide Onglet • Nos Ressources d’Aide',
            title: 'Numéros d’urgence et d’orientation vérifiés par pays',
            detail:
              'Sélectionnez votre pays (Burkina Faso, France, Sénégal, Côte d’Ivoire, Belgique, Canada ou International) pour afficher les lignes gratuites disponibles 24h/24.',
          },
          {
            badge: 'Écoute Humaine Non Urgente',
            title: 'Besoin de parler à un écoutant de l’équipe Nia-Mind ?',
            detail:
              'Cliquez sur « Demander une écoute humaine » en bas de page pour vous connecter et déposer une demande confidentielle.',
          },
        ]}
      />

      <ScrollReveal>
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 text-xs font-extrabold">
            <PhoneCall className="w-3.5 h-3.5 text-nia-orange" />
            Orientation & Numéros Vérifiés
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-nia-gray-dark dark:text-white tracking-tight">
            Nos ressources d’aide et d’écoute d’urgence
          </h1>
          <p className="text-base text-nia-gray-mid dark:text-gray-300 leading-relaxed">
            Nia-Mind est un espace d’expression et de réflexion personnelle, mais ne remplace pas un service médical d’urgence. Si vous ou un proche traversez une situation de détresse aiguë, contactez immédiatement l’une des ressources publiques vérifiées ci-dessous.
          </p>
        </div>
      </ScrollReveal>

      {/* Filtre par pays */}
      <div className="flex flex-wrap items-center gap-2">
        {countries.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setSelectedCountry(c.code)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-all ${
              selectedCountry === c.code
                ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-orange/30 text-nia-gray-dark dark:text-gray-200 hover:border-nia-orange'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Liste des ressources vérifiées */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map((res) => (
          <div
            key={res.id}
            className="nia-tactile-card p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/30 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  {res.countryLabel} ({res.countryCode})
                </span>
                {res.isEmergency && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Urgence 24h/24
                  </span>
                )}
              </div>
              <h2 className="text-xl font-extrabold text-nia-gray-dark dark:text-white">
                {res.organizationName}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-4 border-t border-nia-orange/20 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-nia-gray-mid dark:text-gray-300">
                  Contact direct :
                </span>
                <span className="font-black text-nia-bordeaux dark:text-amber-300">
                  {res.phoneOrContact}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
                <span>Disponibilité : {res.availability}</span>
                <span>Source : {res.verifiedSource}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rappel écoute humaine non urgente */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-nia-orange/20 via-white/80 to-nia-bordeaux/20 dark:from-nia-orange/20 dark:via-nia-surface-dark dark:to-nia-bordeaux/30 border-2 border-nia-bordeaux/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
            Besoin d’un échange bienveillant sans caractère d’urgence vitale ?
          </h3>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300">
            Connectez-vous à votre espace personnel pour déposer une demande privée d’écoute humaine.
          </p>
        </div>
        <Link
          to={currentUser ? '/espace/ecoute' : '/inscription?redirect=%2Fespace%2Fecoute'}
          className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-sm font-extrabold shadow-md"
        >
          <HeartHandshake className="w-4 h-4" />
          Demander une écoute humaine
        </Link>
      </div>
    </div>
  );
};

// ============================================================================
// 2. PAGE PUBLIQUE : CONSEILS (/conseils)
// ============================================================================
export const PublicTipsPage: React.FC = () => {
  const { dailyTips, currentUser } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTip, setActiveTip] = useState<DailyTip | null>(null);
  const navigate = useNavigate();

  const categories = ['ALL', 'Écoute', 'Franchise', 'Réflexion', 'Bien-être', 'Authenticité'];
  const filtered = dailyTips.filter(
    (t) => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Guide Onglet • Conseils & Pistes d’Introspection',
            title: 'Lisez librement nos réflexions par thématique',
            detail:
              'Chaque carte propose une lecture de 2 minutes et une question ouverte. Cliquez sur « Lire le conseil complet » pour ouvrir la fiche détaillée.',
          },
          {
            badge: 'Passer de la lecture à l’écriture',
            title: 'Répondez aux questions dans votre journal intime',
            detail:
              'Depuis chaque conseil, cliquez sur « Écrire sur ce sujet dans mon journal » (connexion requise) pour garder une trace privée de vos réflexions.',
          },
        ]}
      />

      <ScrollReveal>
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-extrabold">
            <Compass className="w-3.5 h-3.5" />
            Bibliothèque de Conseils & Pistes d’Introspection
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-nia-gray-dark dark:text-white tracking-tight">
            Conseils pour avancer avec justesse et sincérité
          </h1>
          <p className="text-base text-nia-gray-mid dark:text-gray-300">
            Chaque conseil est accompagné d’une question ouverte que vous pouvez explorer librement dans votre journal personnel.
          </p>
        </div>
      </ScrollReveal>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-extrabold transition-colors ${
              selectedCategory === cat
                ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-orange/30 text-nia-gray-dark dark:text-gray-200 hover:border-nia-orange'
            }`}
          >
            {cat === 'ALL' ? 'Toutes les thématiques' : cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((tip) => (
          <article
            key={tip.id}
            className="nia-tactile-card p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/30 flex flex-col justify-between space-y-5"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-3 py-1 rounded-full font-extrabold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  {tip.category}
                </span>
                <span className="text-nia-gray-mid dark:text-gray-400 font-semibold">
                  {tip.readingTimeMin} min • {tip.publishedAt}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-nia-gray-dark dark:text-white">
                {tip.title}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {tip.summary}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-nia-orange/20">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-nia-orange/15 to-nia-bordeaux/15 text-xs text-nia-bordeaux dark:text-amber-200 font-bold">
                « {tip.reflectionQuestion} »
              </div>
              <button
                type="button"
                onClick={() => setActiveTip(tip)}
                className="w-full py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold transition-transform hover:scale-[1.01]"
              >
                Lire le conseil complet
              </button>
            </div>
          </article>
        ))}
      </div>

      {activeTip && (
        <Modal
          isOpen={Boolean(activeTip)}
          onClose={() => setActiveTip(null)}
          badgeText={activeTip.category}
          title={activeTip.title}
          subtitle={`Temps de lecture : ${activeTip.readingTimeMin} min`}
          accent="orange"
          footer={
            <>
              <button
                type="button"
                onClick={() => setActiveTip(null)}
                className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs sm:text-sm font-bold"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTip(null);
                  navigate(
                    currentUser
                      ? '/espace/journal'
                      : '/inscription?redirect=%2Fespace%2Fjournal'
                  );
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs sm:text-sm font-bold"
              >
                <BookOpen className="w-4 h-4" />
                {currentUser
                  ? 'Écrire sur ce sujet dans mon journal'
                  : 'S’inscrire pour noter dans mon journal'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="font-bold text-nia-gray-dark dark:text-white">
              {activeTip.summary}
            </p>
            <p className="text-nia-gray-mid dark:text-gray-300 leading-relaxed">
              {activeTip.content}
            </p>
            <div className="p-4 rounded-2xl bg-gradient-to-r from-nia-orange/15 to-nia-bordeaux/15 border-l-4 border-nia-bordeaux">
              <p className="text-xs font-extrabold uppercase text-nia-bordeaux dark:text-amber-300 mb-1">
                Piste d’introspection
              </p>
              <p className="font-semibold text-nia-gray-dark dark:text-white">
                « {activeTip.reflectionQuestion} »
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// 3. PAGE PUBLIQUE : HISTOIRES (/histoires)
// ============================================================================
export const PublicStoriesPage: React.FC = () => {
  const { publicStories, currentUser, siteSettings, currentLanguage } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const categories = [
    'ALL',
    ...Array.from(new Set(publicStories.map((s) => s.category))),
  ];

  const filtered = publicStories.filter((s) => {
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.publicPseudonym.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (siteSettings.publicStoriesVisible === false) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <div className="p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border border-nia-orange/30 space-y-3">
          <h1 className="text-2xl font-black text-nia-gray-dark dark:text-white">Histoires</h1>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300">
            {platformNotice(currentLanguage, 'storiesHidden')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Guide Onglet • Histoires Anonymes',
            title: '« Tu n’es pas seul(e) à être seul(e) »',
            detail:
              'Lisez des témoignages sincères signés sous pseudonyme. Aucun récit n’apparaît ici sans le double accord de la modération et de son auteur.',
          },
          {
            badge: 'Raconter votre propre histoire',
            title: 'Vous souhaitez déposer votre témoignage ?',
            detail:
              'Cliquez sur « Rédiger ou gérer mon histoire » : vous serez invité(e) à vous connecter pour écrire en brouillon privé avant tout envoi.',
          },
        ]}
      />

      <ScrollReveal>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 text-xs font-extrabold">
              <Feather className="w-3.5 h-3.5 text-nia-orange" />
              Histoires — Anonymat & Franchise
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-nia-gray-dark dark:text-white tracking-tight">
              <GlitchText text={STORIES_SIGNATURE} occasionalIntervalMs={16000} />
            </h1>
            <p className="text-base text-nia-gray-mid dark:text-gray-300">
              Cette bibliothèque publique présente exclusivement les histoires approuvées par la modération et dont la version finale a reçu l’autorisation explicite de leur auteur.
            </p>
          </div>

          <Link
            to={currentUser ? '/espace/histoires' : '/inscription?redirect=%2Fespace%2Fhistoires'}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-sm font-extrabold shadow-nia-soft"
          >
            <Feather className="w-4 h-4" />
            Rédiger ou gérer mon histoire
          </Link>
        </div>
      </ScrollReveal>

      {/* Recherche et filtre */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-nia-gray-mid absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher dans les histoires publiées…"
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white dark:bg-nia-surface-dark border border-nia-orange/35 text-sm focus:outline-none focus:border-nia-orange"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-extrabold transition-colors ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white'
                  : 'bg-white dark:bg-nia-surface-dark border border-nia-orange/30 text-nia-gray-dark dark:text-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-3xl bg-white dark:bg-nia-surface-dark border border-nia-orange/30 text-center space-y-3">
          <p className="text-base font-extrabold text-nia-gray-dark dark:text-white">
            Aucune histoire publiée ne correspond à cette recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="px-5 py-2 rounded-full bg-nia-orange text-white text-xs font-extrabold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((story) => (
            <article
              key={story.id}
              className="nia-tactile-card p-6 sm:p-8 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-bordeaux/30 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
                    {story.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Accord explicite auteur vérifié
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-nia-gray-dark dark:text-white">
                  {story.title}
                </h2>
                <p className="text-sm sm:text-base text-nia-gray-dark dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  « {story.content} »
                </p>
              </div>

              <div className="pt-4 border-t border-nia-orange/20 flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-300">
                <span>Signé : <strong>{story.publicPseudonym}</strong></span>
                <span>Publiée le {new Date(story.publishedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. PAGE PUBLIQUE : À PROPOS (/a-propos)
// ============================================================================
export const AboutPage: React.FC = () => {
  const values = [
    {
      title: 'La franchise',
      desc: 'Pouvoir nommer ce que l’on traverse avec honnêteté, sans embellir ni dramatiser.',
    },
    {
      title: 'L’authenticité',
      desc: 'Déposer les masques sociaux et professionnels dans un espace conçu pour la sincérité.',
    },
    {
      title: 'L’écoute sans jugement',
      desc: 'Chaque pensée ou émotion est accueillie avec respect, sans morale ni étiquette.',
    },
    {
      title: 'Le respect de la vie privée',
      desc: 'Cloisonnement strict de votre espace personnel et double consentement pour toute histoire publiée.',
    },
    {
      title: 'La réflexion personnelle',
      desc: 'Des outils d’écriture et des questions ouvertes pour reprendre du recul à son propre rythme.',
    },
    {
      title: 'L’évolution individuelle',
      desc: 'Observer ses repères d’humeur, de sommeil et de bien-être dans la durée, sans pression de performance.',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-14">
      <ScrollReveal>
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-extrabold">
            Manifeste & Engagements Nia-Mind
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-nia-gray-dark dark:text-white tracking-tight">
            Nia-Mind — Écouter • Comprendre • Avancer
          </h1>
          <p className="text-lg text-nia-gray-mid dark:text-gray-300 leading-relaxed">
            Nia-Mind est un espace numérique d’écoute, de réflexion, de bien-être et d’expression personnelle où chacun peut parler avec sincérité, écrire ses pensées et raconter son histoire sans être obligé de jouer un rôle.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {values.map((v, i) => (
          <ScrollReveal key={v.title} delayMs={i * 50}>
            <div className="nia-tactile-card h-full p-6 rounded-3xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/30 space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-nia-orange to-nia-bordeaux text-white font-black flex items-center justify-center text-sm shadow-sm">
                0{i + 1}
              </div>
              <h2 className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
                {v.title}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {v.desc}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-nia-orange/20 via-white/85 to-nia-bordeaux/20 dark:from-nia-bordeaux/30 dark:via-nia-surface-dark dark:to-nia-orange/20 border-2 border-nia-bordeaux/35 p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-nia-gray-dark dark:text-white">
            Ce que Nia-Mind est — et ce qu’il n’est pas
          </h2>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
            Nous refusons l’apparence froide d’un hôpital ou d’un logiciel administratif. Nia-Mind accompagne votre réflexion quotidienne, mais ne remplace jamais un médecin, un psychiatre ou un service d’urgence.
          </p>
          <ul className="space-y-2 text-sm font-semibold text-nia-gray-dark dark:text-gray-200">
            <li className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nia-orange shrink-0" />
              Aucun diagnostic médical automatisé ni seuil clinique inventé.
            </li>
            <li className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-nia-bordeaux dark:text-amber-300 shrink-0" />
              Aucune publication d’histoire sans l’accord explicite de l’auteur sur la version modérée.
            </li>
            <li className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-nia-orange shrink-0" />
              Aucun effet visuel agressif sur vos questionnaires ou résultats personnels.
            </li>
          </ul>
        </div>
        <div className="flex flex-col items-center lg:items-end gap-4">
          <img
            src="/images/wellness-harmony.png"
            alt="Harmonie d'écoute et de réflexion Nia-Mind"
            className="w-48 h-48 rounded-3xl object-cover border-2 border-nia-orange/40 shadow-xl"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/inscription"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white font-extrabold text-sm shadow-md"
            >
              Créer un compte
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/ressources"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full border-2 border-nia-bordeaux/40 font-extrabold text-sm"
            >
              Voir nos ressources d’aide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================================================
//    Fenêtre courte : e-mail ou Gmail, mot de passe, pseudonyme
// ===========================================================================
export const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const {
    loginWithEmail,
    resendEmailVerification,
    registerAccount,
    requestPasswordRecoveryPush,
    openConsentModal,
    siteSettings,
    currentLanguage,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = sanitizeInternalRedirect(searchParams.get('redirect'));
  const fromAssistant = searchParams.get('from') === 'assistant';
  const isRegister = mode === 'register';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectBannerOpen, setRedirectBannerOpen] = useState<boolean>(
    Boolean(searchParams.get('redirect') || fromAssistant)
  );
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState<string | null>(null);
  const [awaitingEmailLink, setAwaitingEmailLink] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isRegister) {
      const res = await loginWithEmail(email, password, websiteHoneypot);
      if (!res.ok) {
        if (res.needsVerification) setAwaitingEmailLink(true);
        setErrorMsg(res.error || 'Erreur de connexion.');
        return;
      }
      navigate(redirectTarget);
      return;
    }

    if (!accepted) {
      setErrorMsg('Veuillez accepter la Politique de confidentialité et la réception des cookies essentiels pour continuer.');
      return;
    }
    if (password.trim().length < 6) {
      setErrorMsg('Veuillez choisir un mot de passe d’au moins 6 caractères.');
      return;
    }
    const chosenPseudo = pseudonym.trim() || 'PlumeSincere';
    const res = await registerAccount({
      displayName: chosenPseudo,
      email,
      password,
      publicPseudonym: chosenPseudo,
      countryCode: 'INT',
      acceptedTerms: true,
      cookiesAccepted: true,
      optionalWellnessConsent: true,
      honeypot: websiteHoneypot,
    });
    if (res.pending) {
      setAwaitingEmailLink(true);
      setErrorMsg(null);
      return;
    }
    if (!res.ok) {
      setErrorMsg(res.error || 'Erreur lors de la création du compte.');
      return;
    }
    navigate(redirectTarget);
  };

  const handleRequestPasswordRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatusMsg(null);
    const res = await requestPasswordRecoveryPush(forgotEmail);
    setForgotStatusMsg(
      res.ok
        ? 'Si un compte existe pour cette adresse, un lien de réinitialisation vient d’être envoyé. Le nouveau mot de passe se choisit dans ce lien, jamais sur cette page.'
        : res.error || 'Impossible d’envoyer la récupération.'
    );
  };

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      {redirectBannerOpen && (
        <div className="mb-4 rounded-3xl bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep p-4 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-medium leading-relaxed">
              En mode visiteur, vous pouvez parcourir les pages publiques. Pour dialoguer avec l’Assistant Nia-Mind, tenir votre journal ou suivre votre bien-être, connectez-vous ou inscrivez-vous gratuitement avec votre e-mail ou Gmail.
            </p>
            <button
              type="button"
              onClick={() => setRedirectBannerOpen(false)}
              aria-label="Fermer ce message"
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 rounded-3xl border-2 border-[#0F9F6E]/35 p-5 shadow-xl nia-auth-card sm:p-6">
        <div className="grid grid-cols-2 gap-2 rounded-full border border-nia-orange/25 bg-nia-bordeaux/10 p-1.5 dark:bg-black/30">
          <Link
            to={`/connexion${location.search}`}
            className={`rounded-full py-2 text-center text-xs font-extrabold ${
              !isRegister
                ? 'bg-[#0F9F6E] text-white'
                : 'text-nia-gray-dark dark:text-gray-300'
            }`}
          >
            Se connecter
          </Link>
          <Link
            to={`/inscription${location.search}`}
            className={`rounded-full py-2 text-center text-xs font-extrabold ${
              isRegister
                ? 'bg-[#7F1D3F] text-white'
                : 'text-nia-gray-dark dark:text-gray-300'
            }`}
          >
            Créer un compte
          </Link>
        </div>

        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-black text-nia-gray-dark dark:text-white">
            {isRegister ? 'Rejoins Nia-Mind — « Tu n’es pas seul(e) »' : 'Bon retour dans ton espace sincère'}
          </h1>
          <p className="text-sm font-bold text-[#0F9F6E]">Une seule fenêtre pour l’e-mail ou Gmail.</p>
          <p className="text-xs leading-relaxed text-nia-gray-mid dark:text-gray-300">
            Pseudonyme, e-mail et mot de passe. Tes écrits restent liés à ce compte.
          </p>
        </div>

        {awaitingEmailLink && (
          <div className="space-y-2 rounded-2xl border-2 border-[#0F9F6E] bg-white p-3">
            <p className="text-sm font-bold text-[#1F2937]">
              Un message de confirmation a été envoyé à {email.trim().toLowerCase()}. Ouvrez-le : le lien ouvre l’accueil automatiquement. Il n’y a pas de code à saisir.
            </p>
            <button
              type="button"
              onClick={async () => {
                const sent = await resendEmailVerification(email);
                setErrorMsg(sent.ok ? 'Un nouveau message de confirmation a été envoyé.' : sent.error || 'Impossible de renvoyer le message.');
              }}
              className="rounded-full border-2 border-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-[#7F1D3F]"
            >
              Renvoyer le message
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-start justify-between gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-3 text-xs font-bold text-rose-800 dark:text-rose-200">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg(null)} aria-label="Fermer l’alerte">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="hidden" aria-hidden="true">
            <label htmlFor="website_url_hp">Ne pas remplir ce champ</label>
            <input
              id="website_url_hp"
              name="website_url_hp"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={websiteHoneypot}
              onChange={(e) => setWebsiteHoneypot(e.target.value)}
            />
          </div>

          {isRegister && (
            <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200">
              Ton pseudonyme recommandé (seul affiché sur le site)
              <input
                type="text"
                required
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="Ex. : PlumeSincere"
                className="mt-1 w-full rounded-2xl border-2 border-[#0F9F6E]/35 px-4 py-3 text-sm font-semibold"
              />
              <span className="mt-1 block text-[11px] normal-case tracking-normal text-[#7F1D3F] dark:text-amber-300">
                Anonymat garanti — évite ton vrai prénom
              </span>
            </label>
          )}

          <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200">
            Adresse e-mail ou Gmail
            <span className="relative mt-1 block">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0F9F6E]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.nom@gmail.com"
                className="w-full rounded-2xl border-2 border-[#0F9F6E]/35 py-3 pl-11 pr-4 text-sm font-semibold"
              />
            </span>
          </label>

          <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200">
            Mot de passe (min. 6 caractères)
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="mt-1 w-full rounded-2xl border-2 border-[#0F9F6E]/35 px-4 py-3 text-sm font-semibold"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setForgotEmail(email);
              setForgotStatusMsg(null);
              setIsForgotModalOpen(true);
            }}
            className="text-xs font-extrabold text-[#7F1D3F] underline dark:text-amber-300"
          >
            Mot de passe oublié ?
          </button>

          <p className="text-[11px] font-bold text-[#7F1D3F] dark:text-amber-200">
            Gmail utilise les mêmes champs. Il n’y a pas de code à saisir.
          </p>

          {isRegister && (
            <label className="flex items-start gap-2 text-xs text-nia-gray-dark dark:text-gray-200">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                <button type="button" onClick={openConsentModal} className="font-extrabold text-[#7F1D3F] underline dark:text-amber-300">
                  J’accepte la politique de confidentialité, les conditions et les cookies essentiels.
                </button>
              </span>
            </label>
          )}

          {isRegister && siteSettings.registrationOpen === false && (
            <p className="rounded-xl bg-[#7F1D3F]/10 px-3 py-2 text-xs font-bold text-[#7F1D3F] dark:text-amber-200">
              {platformNotice(currentLanguage, 'registrationClosed')}
            </p>
          )}

          <button
            type="submit"
            disabled={isRegister && siteSettings.registrationOpen === false}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-[#0F9F6E] py-3.5 text-sm font-black text-white disabled:pointer-events-none disabled:opacity-50"
          >
            <UserPlus className="h-4 w-4" />
            <span>{isRegister ? 'S’inscrire & continuer →' : 'Se connecter à mon espace'}</span>
          </button>
        </form>
      </div>

      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        badgeText="Récupération Sécurisée"
        title="Mot de passe oublié ?"
        subtitle="Un lien de réinitialisation est envoyé par e-mail. Le mot de passe n’est jamais enregistré dans le navigateur."
        accent="bordeaux"
        footer={
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(false)}
            className="rounded-xl border px-4 py-2 text-xs font-bold"
          >
            Fermer
          </button>
        }
      >
        <form onSubmit={handleRequestPasswordRecovery} className="space-y-3">
          {forgotStatusMsg && (
            <p className="rounded-2xl border border-[#0F9F6E]/40 bg-[#0F9F6E]/10 p-3 text-xs font-bold">
              {forgotStatusMsg}
            </p>
          )}
          <label className="block text-xs font-extrabold uppercase tracking-wider">
            Adresse e-mail réelle de votre compte
            <input
              type="email"
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="votre.nom@gmail.com"
              className="mt-1 w-full rounded-2xl border-2 border-[#0F9F6E]/40 px-4 py-2.5 text-sm font-semibold"
            />
          </label>
          <button type="submit" className="w-full rounded-full bg-[#7F1D3F] py-2.5 text-xs font-extrabold text-white">
            Envoyer le lien de réinitialisation
          </button>
        </form>
      </Modal>
    </div>
  );
};
