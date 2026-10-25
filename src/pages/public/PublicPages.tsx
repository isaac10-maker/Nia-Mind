import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Cookie,
  Feather,
  HeartHandshake,
  Lock,
  Mail,
  PhoneCall,
  Search,
  ShieldCheck,
  SkipForward,
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
  const { publicStories, currentUser } = useApp();
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
            Nia-Mind — « {OFFICIAL_SLOGAN} »
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

// ============================================================================
// 5. PAGES PUBLIQUES : CONNEXION (/connexion) & INSCRIPTION (/inscription)
//    Avec E-mail / Gmail, Politique de confidentialité, Cookies &
//    Enquête facultative « Dites-nous-en plus sur vous » avec touche Skip
// ============================================================================
const INTEREST_OPTIONS = [
  'Parler sans masque à l’Assistant réflexif',
  'Apaiser mon stress & améliorer mon sommeil',
  'Écrire librement dans mon journal intime',
  'Lire ou partager une histoire anonyme',
  'Demander une écoute humaine bienveillante',
  'Recevoir le conseil de réflexion du jour',
];

const LIFE_MOMENT_OPTIONS = [
  'Pression au travail ou dans mes études',
  'Questionnements sur mes relations ou ma famille',
  'Sentiment de solitude (« seul(e) au milieu des autres »)',
  'Fatigue mentale et besoin de lâcher prise',
  'Envie de mieux me connaître à mon rythme',
];

export const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const {
    loginWithEmail,
    registerAccount,
    requestGmailPushVerification,
    requestPasswordRecoveryPush,
    resetForgottenPassword,
    triggerSignupMotivationPush,
    featuredDailyTip,
    openConsentModal,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const redirectTarget = sanitizeInternalRedirect(searchParams.get('redirect'));
  const fromAssistant = searchParams.get('from') === 'assistant';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [countryCode, setCountryCode] = useState<UserProfile['countryCode']>('BF');
  const [acceptedPrivacyAndTerms, setAcceptedPrivacyAndTerms] = useState(false);
  const [acceptedCookies, setAcceptedCookies] = useState(false);
  const [optionalWellness, setOptionalWellness] = useState(true);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [redirectBannerOpen, setRedirectBannerOpen] = useState<boolean>(
    Boolean(searchParams.get('redirect') || fromAssistant)
  );
  const [edgePushBannerOpen, setEdgePushBannerOpen] = useState<boolean>(mode === 'register');

  // Déclenchement automatique de l'Edge Function de notification Push sur la page d'inscription
  React.useEffect(() => {
    if (mode === 'register') {
      setEdgePushBannerOpen(true);
      void triggerSignupMotivationPush();
    }
  }, [mode]);

  // Modale / Étape « Continuer avec Gmail / Google » avec Vérification Push Gmail + Mot de passe 6+ caractères
  const [isGmailModalOpen, setIsGmailModalOpen] = useState(false);
  const [gmailAddress, setGmailAddress] = useState('');
  const [gmailName, setGmailName] = useState('');
  const [gmailPassword, setGmailPassword] = useState('');
  const [gmailPushSent, setGmailPushSent] = useState(false);
  const [gmailExpectedCode, setGmailExpectedCode] = useState('');
  const [gmailEnteredCode, setGmailEnteredCode] = useState('');
  const [gmailPrivacyAccepted, setGmailPrivacyAccepted] = useState(true);
  const [gmailCookiesAccepted, setGmailCookiesAccepted] = useState(true);

  // Coin « Mot de passe oublié ? » pour récupération de compte
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSentCode, setForgotSentCode] = useState<string | null>(null);
  const [forgotEnteredCode, setForgotEnteredCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState<string | null>(null);

  // Enquête facultative « Dites-nous-en plus sur vous » avec bouton Skip & bouton Croix (X)
  const [showOnboardingSurvey, setShowOnboardingSurvey] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedMoment, setSelectedMoment] = useState<string>('');
  const [freeNote, setFreeNote] = useState<string>('');

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const finishAndEnterSpace = () => {
    setShowOnboardingSurvey(false);
    navigate(redirectTarget);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      const res = loginWithEmail(email, password, websiteHoneypot);
      if (!res.ok) {
        setErrorMsg(res.error || 'Erreur de connexion.');
        return;
      }
      navigate(redirectTarget);
    } else {
      if (!acceptedPrivacyAndTerms || !acceptedCookies) {
        setErrorMsg(
          'Veuillez accepter la Politique de confidentialité et la réception des cookies essentiels pour continuer.'
        );
        return;
      }
      if (password.trim().length < 6) {
        setErrorMsg('Veuillez choisir un mot de passe d’au moins 6 caractères.');
        return;
      }
      const res = registerAccount({
        displayName,
        email,
        password,
        publicPseudonym: pseudonym || 'Anonyme',
        countryCode,
        acceptedTerms: acceptedPrivacyAndTerms,
        cookiesAccepted: acceptedCookies,
        optionalWellnessConsent: optionalWellness,
        honeypot: websiteHoneypot,
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Erreur lors de la création du compte.');
        return;
      }
      // Ouvre l'enquête facultative « Dites-nous-en plus sur vous » avec touche Skip
      setShowOnboardingSurvey(true);
    }
  };

  const handleSendGmailPush = async () => {
    setErrorMsg(null);
    const clean = gmailAddress.trim().toLowerCase();
    const res = await requestGmailPushVerification(clean);
    if (!res.ok) {
      setErrorMsg(res.error || 'Adresse Gmail non valide.');
      return;
    }
    setGmailPushSent(true);
    setGmailExpectedCode(res.verificationCode || '');
    setGmailEnteredCode(res.verificationCode || '');
  };

  const handleGmailContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const clean = gmailAddress.trim().toLowerCase();
    if (!clean || (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com'))) {
      setErrorMsg('Veuillez saisir une adresse Gmail réelle se terminant par @gmail.com.');
      return;
    }
    if (gmailPassword.trim().length < 6) {
      setErrorMsg('Le mot de passe associé à votre compte Gmail doit contenir au moins 6 caractères.');
      return;
    }
    if (!gmailPrivacyAccepted || !gmailCookiesAccepted) {
      setErrorMsg('Veuillez accepter la politique de confidentialité et les cookies.');
      return;
    }

    if (!gmailPushSent) {
      await handleSendGmailPush();
      return;
    }

    if (gmailExpectedCode && gmailEnteredCode.trim() !== gmailExpectedCode) {
      setErrorMsg('Code de vérification Push Gmail incorrect.');
      return;
    }

    // Essayer d'abord de connecter si déjà inscrit (ex. Superadmin isaacamegan10@gmail.com)
    const loginTry = loginWithEmail(clean, gmailPassword.trim());
    if (loginTry.ok) {
      setIsGmailModalOpen(false);
      navigate(redirectTarget);
      return;
    }

    // Sinon inscrire le compte Gmail vérifié par Push avec mot de passe (6+ caractères)
    const defaultName =
      gmailName.trim() ||
      clean
        .split('@')[0]
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase());

    const regTry = registerAccount({
      displayName: defaultName,
      email: clean,
      password: gmailPassword.trim(),
      publicPseudonym: 'Anonyme',
      countryCode,
      acceptedTerms: gmailPrivacyAccepted,
      cookiesAccepted: gmailCookiesAccepted,
      optionalWellnessConsent: true,
    });

    if (!regTry.ok) {
      setErrorMsg(regTry.error || 'Impossible de finaliser l’inscription Gmail.');
      return;
    }

    setIsGmailModalOpen(false);
    setShowOnboardingSurvey(true);
  };

  const handleRequestPasswordRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatusMsg(null);
    const res = requestPasswordRecoveryPush(forgotEmail);
    if (!res.ok) {
      setForgotStatusMsg(res.error || 'Impossible d’envoyer la récupération.');
      return;
    }
    setForgotSentCode(res.recoveryCode || '');
    setForgotEnteredCode(res.recoveryCode || '');
    setForgotStatusMsg(
      `Code Push de récupération envoyé à ${forgotEmail.trim().toLowerCase()} : ${res.recoveryCode}`
    );
  };

  const handleConfirmPasswordReset = (e: React.FormEvent) => {
    e.preventDefault();
    const res = resetForgottenPassword({
      email: forgotEmail,
      recoveryCode: forgotEnteredCode,
      newPassword: forgotNewPassword,
    });
    if (!res.ok) {
      setForgotStatusMsg(res.error || 'Erreur de réinitialisation.');
      return;
    }
    setEmail(forgotEmail.trim().toLowerCase());
    setPassword(forgotNewPassword.trim());
    setIsForgotModalOpen(false);
    setForgotSentCode(null);
    setForgotStatusMsg(null);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-6">
      {/* Notification Push Edge Function sur la page d'inscription : Nouveau Conseil & Motivation */}
      {mode === 'register' && edgePushBannerOpen && (
        <div className="rounded-3xl bg-gradient-to-r from-sky-900/90 via-nia-bordeaux to-nia-orange-deep text-white p-4 sm:p-5 shadow-xl border border-white/25 flex items-start justify-between gap-3 animate-nia-slide-in">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-[11px] font-extrabold uppercase tracking-wider text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-nia-orange animate-pulse" />
              Edge Function Push • Nouveau Conseil & Motivation du jour
            </span>
            <p className="text-sm font-black text-white">
              {featuredDailyTip?.title || 'Déposer le masque 5 minutes aujourd’hui'}
            </p>
            <p className="text-xs font-medium text-white/90 leading-relaxed">
              {featuredDailyTip?.summary ||
                'Tu n’as pas besoin de porter toutes les attentes du monde en même temps. Respire et avance à ton rythme.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEdgePushBannerOpen(false)}
            aria-label="Fermer la notification push"
            className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-white/15 hover:bg-white/30 text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bannière d'information si le visiteur a cliqué sur l'Assistance ou un onglet personnel */}
      {redirectBannerOpen && (
        <div className="rounded-3xl bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white p-4 sm:p-5 shadow-lg flex items-start justify-between gap-3 animate-nia-slide-in">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
              Accès à l’Assistance & aux Onglets Personnels
            </span>
            <p className="text-xs sm:text-sm font-medium text-white/95">
              En mode visiteur, vous pouvez parcourir les pages publiques. Pour dialoguer avec l’Assistant Nia-Mind, tenir votre journal ou suivre votre bien-être, connectez-vous ou inscrivez-vous gratuitement avec votre e-mail ou Gmail.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRedirectBannerOpen(false)}
            aria-label="Fermer ce message"
            className="w-7 h-7 rounded-full inline-flex items-center justify-center bg-white/15 hover:bg-white/30 text-white shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="rounded-3xl nia-glass-card border-2 border-nia-orange/40 dark:border-nia-border-dark p-6 sm:p-10 shadow-2xl space-y-6">
        {/* Sélecteur d'onglet Connexion / Inscription */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-full bg-nia-bordeaux/10 dark:bg-black/30 border border-nia-orange/25">
          <Link
            to={`/connexion${location.search}`}
            className={`text-center py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                : 'text-nia-gray-dark dark:text-gray-300 hover:text-nia-orange'
            }`}
          >
            Se connecter
          </Link>
          <Link
            to={`/inscription${location.search}`}
            className={`text-center py-2.5 rounded-full text-xs sm:text-sm font-extrabold transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                : 'text-nia-gray-dark dark:text-gray-300 hover:text-nia-orange'
            }`}
          >
            Créer un compte
          </Link>
        </div>

        <div className="space-y-2 text-center">
          <div className="flex justify-center mb-2">
            <img
              src="/images/nia-mind-logo.png"
              alt="Logo Nia-Mind"
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-nia-orange/50 shadow-lg"
            />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-extrabold">
            <Lock className="w-3.5 h-3.5" />
            Nia-Mind — « {OFFICIAL_SLOGAN} »
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-nia-gray-dark dark:text-white">
            {mode === 'login'
              ? 'Bon retour dans ton espace sincère'
              : 'Rejoins Nia-Mind — « Tu n’es pas seul(e) »'}
          </h1>
          <p className="text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300">
            {mode === 'login'
              ? 'Connecte-toi avec ton adresse e-mail inscrite ou ton compte Gmail.'
              : 'Inscris-toi en quelques secondes avec ton e-mail ou Gmail pour débloquer tous les onglets personnels.'}
          </p>
        </div>

        {/* Bouton Continuer avec Gmail / Google */}
        <div>
          <button
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setIsGmailModalOpen(true);
            }}
            className="nia-tactile-opt w-full py-3.5 px-5 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-nia-bordeaux/40 hover:border-nia-orange flex items-center justify-center gap-3 text-sm font-extrabold text-nia-gray-dark dark:text-white"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.8C6.2 7.2 8.9 5 12 5z"
              />
              <path
                fill="#4285F4"
                d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6l3.7 2.9c2.2-2 3.7-5 3.7-8.7z"
              />
              <path
                fill="#FBBC05"
                d="M5.3 14.8c-.2-.8-.4-1.6-.4-2.5s.2-1.7.4-2.5L1.6 7C.6 9 0 11.2 0 13.5s.6 4.5 1.6 6.5l3.7-2.9z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.1-6.7-5l-3.7 2.8C3.5 21.4 7.4 24 12 24z"
              />
            </svg>
            <span>Continuer avec Gmail / Google</span>
          </button>
        </div>

        <div className="relative flex py-1 items-center">
          <div className="flex-grow border-t border-nia-orange/25 dark:border-white/10" />
          <span className="flex-shrink mx-3 text-xs font-bold uppercase tracking-wider text-nia-gray-mid dark:text-gray-400">
            ou avec ton adresse e-mail
          </span>
          <div className="flex-grow border-t border-nia-orange/25 dark:border-white/10" />
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 flex items-start justify-between gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
            <span>{errorMsg}</span>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              aria-label="Fermer l’alerte"
              className="p-0.5 rounded hover:bg-rose-500/20"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Champ Honeypot invisible contre les robots de spam */}
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

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                  Ton prénom ou pseudo privé
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex. : Isaac, Sarah, Kenza…"
                  className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-nia-bg-dark border-2 border-nia-orange/35 focus:border-nia-orange focus:outline-none text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                    Signature publique facultative (Histoires)
                  </label>
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="Ex. : Anonyme ou Plume Libre"
                    className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-nia-bg-dark border-2 border-nia-orange/35 focus:border-nia-orange focus:outline-none text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                    Pays (Ressources d’aide)
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value as UserProfile['countryCode'])}
                    className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-nia-bg-dark border-2 border-nia-orange/35 focus:border-nia-orange focus:outline-none text-sm font-semibold"
                  >
                    <option value="BF">Burkina Faso (BF)</option>
                    <option value="FR">France (FR)</option>
                    <option value="SN">Sénégal (SN)</option>
                    <option value="CI">Côte d’Ivoire (CI)</option>
                    <option value="BE">Belgique (BE)</option>
                    <option value="CA">Canada (CA)</option>
                    <option value="INT">International</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
              Adresse e-mail ou Gmail
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-nia-orange absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre.nom@gmail.com"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/90 dark:bg-nia-bg-dark border-2 border-nia-orange/35 focus:border-nia-orange focus:outline-none text-sm font-semibold"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200">
                Mot de passe (min. 6 caractères)
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotSentCode(null);
                  setForgotStatusMsg(null);
                  setIsForgotModalOpen(true);
                }}
                className="text-xs font-extrabold text-nia-bordeaux dark:text-amber-300 hover:text-nia-orange underline"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              className="w-full px-4 py-3 rounded-2xl bg-white/90 dark:bg-nia-bg-dark border-2 border-nia-orange/35 focus:border-nia-orange focus:outline-none text-sm font-semibold"
            />
          </div>

          <div className="px-3.5 py-2.5 rounded-2xl bg-nia-bordeaux/10 dark:bg-white/5 border border-nia-bordeaux/25 flex flex-wrap items-center justify-between gap-2 text-[11px] font-bold text-nia-bordeaux dark:text-amber-200">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-nia-orange shrink-0" />
              Restriction : accessible uniquement aux e-mails réels
            </span>
            <span>Limite sécurité : max 3 essais / 15 secondes</span>
          </div>

          {mode === 'register' && (
            <div className="space-y-2.5 pt-2">
              <label className="flex items-start gap-3 p-3 rounded-2xl bg-nia-orange/10 border border-nia-orange/30 text-xs text-nia-gray-dark dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedPrivacyAndTerms}
                  onChange={(e) => setAcceptedPrivacyAndTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-nia-orange"
                />
                <span>
                  <strong>Politique de confidentialité (Obligatoire) :</strong> J’accepte la{' '}
                  <button
                    type="button"
                    onClick={openConsentModal}
                    className="underline font-extrabold text-nia-bordeaux dark:text-amber-300"
                  >
                    politique de confidentialité
                  </button>{' '}
                  et les conditions d’utilisation de Nia-Mind.
                </span>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-2xl bg-nia-bordeaux/10 border border-nia-bordeaux/30 text-xs text-nia-gray-dark dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedCookies}
                  onChange={(e) => setAcceptedCookies(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-nia-orange"
                />
                <span>
                  <strong className="inline-flex items-center gap-1">
                    <Cookie className="w-3.5 h-3.5 text-nia-orange" />
                    Réception des cookies (Obligatoire) :
                  </strong>{' '}
                  J’accepte la réception des cookies essentiels et de confort pour sécuriser ma session et mémoriser mes préférences.
                </span>
              </label>

              <label className="flex items-start gap-3 px-3 py-2 text-xs text-nia-gray-mid dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optionalWellness}
                  onChange={(e) => setOptionalWellness(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded text-nia-orange"
                />
                <span>
                  <strong>Facultatif :</strong> Activer mes courbes d’évolution bien-être (humeur, stress, sommeil).
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="nia-tactile-card w-full py-4 rounded-full bg-gradient-to-r from-nia-orange via-nia-orange-deep to-nia-bordeaux text-white font-black text-sm shadow-lg flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>
              {mode === 'login'
                ? 'Se connecter à mon espace'
                : 'S’inscrire & continuer →'}
            </span>
          </button>
        </form>
      </div>

      {/* ====================================================================
          MODALE GMAIL / GOOGLE AVEC VÉRIFICATION PUSH GMAIL & MOT DE PASSE 6+ CARACTÈRES
          ==================================================================== */}
      <Modal
        isOpen={isGmailModalOpen}
        onClose={() => setIsGmailModalOpen(false)}
        badgeText="Vérification Push Compte Gmail"
        title="S’inscrire / Continuer avec votre compte Gmail"
        subtitle="Une vérification Push est envoyée à votre compte Gmail réel avec un mot de passe d’au moins 6 caractères."
        accent="orange"
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsGmailModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => void handleSendGmailPush()}
              className="px-4 py-2 rounded-xl bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-200 text-xs font-extrabold hover:bg-nia-bordeaux/25"
            >
              Envoyer Push Gmail
            </button>
            <button
              type="submit"
              form="gmail-auth-form"
              className="px-5 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold shadow-sm"
            >
              {gmailPushSent ? 'Valider Push & Continuer →' : 'Envoyer Push & Continuer →'}
            </button>
          </>
        }
      >
        <form id="gmail-auth-form" onSubmit={handleGmailContinue} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
              Votre adresse Gmail réelle (@gmail.com)
            </label>
            <input
              type="email"
              required
              value={gmailAddress}
              onChange={(e) => {
                setGmailAddress(e.target.value);
                setGmailPushSent(false);
              }}
              placeholder="prenom.nom@gmail.com"
              className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/40 text-sm font-semibold"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                Mot de passe (min. 6 caractères)
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={gmailPassword}
                onChange={(e) => setGmailPassword(e.target.value)}
                placeholder="Min. 6 caractères"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/40 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                Prénom d’affichage
              </label>
              <input
                type="text"
                value={gmailName}
                onChange={(e) => setGmailName(e.target.value)}
                placeholder="Ex. : Isaac"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border border-nia-orange/30 text-sm"
              />
            </div>
          </div>

          {gmailPushSent && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 space-y-2">
              <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-200">
                ✓ Notification Push envoyée sur votre compte Gmail ({gmailAddress}).
              </p>
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider mb-1">
                  Code de confirmation Push Gmail reçu
                </label>
                <input
                  type="text"
                  required
                  value={gmailEnteredCode}
                  onChange={(e) => setGmailEnteredCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-nia-bg-dark border border-emerald-500/50 text-sm font-black tracking-widest"
                />
              </div>
            </div>
          )}

          <label className="flex items-start gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={gmailPrivacyAccepted}
              onChange={(e) => setGmailPrivacyAccepted(e.target.checked)}
              className="mt-0.5 rounded text-nia-orange"
            />
            <span>J’accepte la Politique de confidentialité et les Conditions d’utilisation.</span>
          </label>
          <label className="flex items-start gap-2.5 text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={gmailCookiesAccepted}
              onChange={(e) => setGmailCookiesAccepted(e.target.checked)}
              className="mt-0.5 rounded text-nia-orange"
            />
            <span>J’accepte la réception des cookies essentiels et de préférences.</span>
          </label>
        </form>
      </Modal>

      {/* ====================================================================
          MODALE COIN « MOT DE PASSE OUBLIÉ ? » (RÉCUPÉRATION DE COMPTE)
          ==================================================================== */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        badgeText="Récupération Sécurisée"
        title="Mot de passe oublié ?"
        subtitle="Recevez une notification Push de récupération sur votre adresse e-mail réelle inscrite."
        accent="bordeaux"
        footer={
          <button
            type="button"
            onClick={() => setIsForgotModalOpen(false)}
            className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
          >
            Fermer
          </button>
        }
      >
        <div className="space-y-4">
          {forgotStatusMsg && (
            <div className="p-3 rounded-2xl bg-nia-orange/15 border border-nia-orange/40 text-xs font-bold text-nia-gray-dark dark:text-white">
              {forgotStatusMsg}
            </div>
          )}

          <form onSubmit={handleRequestPasswordRecovery} className="space-y-3">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                Adresse e-mail réelle de votre compte
              </label>
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="votre.nom@gmail.com"
                className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/40 text-sm font-semibold"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-nia-bordeaux text-white text-xs font-extrabold shadow-sm"
            >
              Envoyer le code Push de récupération
            </button>
          </form>

          {forgotSentCode && (
            <form
              onSubmit={handleConfirmPasswordReset}
              className="pt-3 border-t border-nia-orange/25 space-y-3"
            >
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                  Code Push de récupération (6 chiffres)
                </label>
                <input
                  type="text"
                  required
                  value={forgotEnteredCode}
                  onChange={(e) => setForgotEnteredCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/40 text-sm font-black tracking-widest"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
                  Nouveau mot de passe (min. 6 caractères)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/40 text-sm font-semibold"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold shadow-md"
              >
                Enregistrer mon nouveau mot de passe →
              </button>
            </form>
          )}
        </div>
      </Modal>

      {/* ====================================================================
          MODALE ENQUÊTE FACULTATIVE : « DITES-NOUS-EN PLUS SUR VOUS »
          Style tactile MAMAORA + Bouton Skip (Passer) + Bouton Croix (X)
          ==================================================================== */}
      <Modal
        isOpen={showOnboardingSurvey}
        onClose={finishAndEnterSpace}
        badgeText="Facultatif • Personnalisation Douce"
        title="Dites-nous-en plus sur vous"
        subtitle="Il n’y a pas de bonne ou de mauvaise réponse. Vous pouvez passer cette étape à tout moment."
        accent="bordeaux"
        maxWidthClass="max-w-2xl"
        footer={
          <div className="w-full flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={finishAndEnterSpace}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 border-nia-bordeaux/35 hover:border-nia-orange text-xs sm:text-sm font-extrabold text-nia-gray-dark dark:text-gray-200"
            >
              <SkipForward className="w-4 h-4 text-nia-orange" />
              <span>Passer cette étape (Skip)</span>
            </button>

            <button
              type="button"
              onClick={finishAndEnterSpace}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs sm:text-sm font-extrabold shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistrer mes centres d’intérêt & entrer</span>
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Bandeau supérieur Skip rapide */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-nia-orange/15 to-nia-bordeaux/15">
            <span className="text-xs font-bold text-nia-bordeaux dark:text-amber-200">
              ✺ Adaptons votre espace à vos besoins du moment
            </span>
            <button
              type="button"
              onClick={finishAndEnterSpace}
              className="text-xs font-extrabold text-nia-orange hover:underline inline-flex items-center gap-1"
            >
              <span>Skip →</span>
            </button>
          </div>

          {/* Question 1 : Centres d'intérêt */}
          <div className="space-y-2.5">
            <p className="text-sm font-black text-nia-gray-dark dark:text-white">
              1. Qu’est-ce qui vous attire le plus sur Nia-Mind ? (Plusieurs choix possibles)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {INTEREST_OPTIONS.map((opt) => {
                const checked = selectedInterests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleInterest(opt)}
                    className={`nia-tactile-opt text-left p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center gap-2.5 ${
                      checked
                        ? 'bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white border-nia-orange'
                        : 'bg-white dark:bg-nia-bg-dark text-nia-gray-dark dark:text-gray-200 border-nia-bordeaux/30'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                        checked ? 'bg-white text-nia-bordeaux border-white' : 'border-nia-orange'
                      }`}
                    >
                      {checked ? '✓' : ''}
                    </span>
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 2 : Ce que vous traversez */}
          <div className="space-y-2.5">
            <p className="text-sm font-black text-nia-gray-dark dark:text-white">
              2. Quel sujet résonne le plus avec votre quotidien actuel ?
            </p>
            <div className="space-y-2">
              {LIFE_MOMENT_OPTIONS.map((moment) => {
                const active = selectedMoment === moment;
                return (
                  <button
                    key={moment}
                    type="button"
                    onClick={() => setSelectedMoment(moment)}
                    className={`nia-tactile-opt w-full text-left p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center gap-2.5 ${
                      active
                        ? 'bg-nia-orange text-white border-nia-bordeaux'
                        : 'bg-white dark:bg-nia-bg-dark text-nia-gray-dark dark:text-gray-200 border-nia-orange/30'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? 'bg-white border-white' : 'border-nia-bordeaux'
                      }`}
                    />
                    <span>{moment}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Question 3 : Un mot libre facultatif */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
              3. Un mot ou un souhait pour votre espace ? (Facultatif)
            </label>
            <input
              type="text"
              value={freeNote}
              onChange={(e) => setFreeNote(e.target.value)}
              placeholder="Ex. : Prendre 10 minutes chaque soir pour souffler…"
              className="w-full px-4 py-2.5 rounded-2xl bg-white dark:bg-nia-bg-dark border-2 border-nia-orange/35 text-xs font-semibold"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
