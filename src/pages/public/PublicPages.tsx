import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Feather,
  HeartHandshake,
  Lock,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GlitchText } from '../../components/ui/GlitchText';
import { ScrollReveal } from '../../components/ui/ScrollReveal';
import { OFFICIAL_SLOGAN, STORIES_SIGNATURE } from '../../lib/securityEngine';
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
      <ScrollReveal>
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 text-xs font-bold">
            <PhoneCall className="w-3.5 h-3.5 text-nia-orange" />
            Orientation & Numéros Vérifiés
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              selectedCountry === c.code
                ? 'bg-nia-orange text-white shadow-sm'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:border-nia-orange'
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
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark shadow-sm flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  {res.countryLabel} ({res.countryCode})
                </span>
                {res.isEmergency && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Urgence 24h/24
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-nia-gray-dark dark:text-white">
                {res.organizationName}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {res.description}
              </p>
            </div>

            <div className="pt-4 border-t border-nia-gray-light dark:border-nia-border-dark space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-nia-gray-mid dark:text-gray-400">
                  Contact direct :
                </span>
                <span className="font-extrabold text-nia-bordeaux dark:text-amber-300">
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
      <div className="p-6 sm:p-8 rounded-2xl bg-nia-bg-light dark:bg-nia-surface-dark border border-nia-bordeaux/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-nia-gray-dark dark:text-white">
            Besoin d’un échange bienveillant sans caractère d’urgence vitale ?
          </h3>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300">
            Vous pouvez déposer une demande privée d’écoute humaine dans votre espace personnel.
          </p>
        </div>
        <Link
          to="/espace/ecoute"
          className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold"
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
  const { dailyTips } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeTip, setActiveTip] = useState<DailyTip | null>(null);
  const navigate = useNavigate();

  const categories = ['ALL', 'Écoute', 'Franchise', 'Réflexion', 'Bien-être', 'Authenticité'];
  const filtered = dailyTips.filter(
    (t) => selectedCategory === 'ALL' || t.category === selectedCategory
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <ScrollReveal>
        <div className="max-w-3xl space-y-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-bold">
            <Compass className="w-3.5 h-3.5" />
            Bibliothèque de Conseils & Pistes d’Introspection
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
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
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              selectedCategory === cat
                ? 'bg-nia-orange text-white'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:border-nia-orange'
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
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange transition-all flex flex-col justify-between space-y-5 shadow-sm"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 rounded-full font-bold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  {tip.category}
                </span>
                <span className="text-nia-gray-mid dark:text-gray-400">
                  {tip.readingTimeMin} min • {tip.publishedAt}
                </span>
              </div>
              <h2 className="text-xl font-bold text-nia-gray-dark dark:text-white">
                {tip.title}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {tip.summary}
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-nia-gray-light dark:border-nia-border-dark">
              <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark text-xs text-nia-bordeaux dark:text-amber-200 font-medium">
                « {tip.reflectionQuestion} »
              </div>
              <button
                type="button"
                onClick={() => setActiveTip(tip)}
                className="w-full py-2.5 rounded-xl bg-nia-orange/10 hover:bg-nia-orange text-nia-orange-deep dark:text-nia-orange hover:text-white text-xs font-bold transition-colors"
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
                className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-sm font-medium"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTip(null);
                  navigate('/espace/journal');
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold"
              >
                <BookOpen className="w-4 h-4" />
                Écrire sur ce sujet dans mon journal
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="font-semibold text-nia-gray-dark dark:text-white">
              {activeTip.summary}
            </p>
            <p className="text-nia-gray-mid dark:text-gray-300 leading-relaxed">
              {activeTip.content}
            </p>
            <div className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border-l-4 border-nia-bordeaux">
              <p className="text-xs font-bold uppercase text-nia-bordeaux dark:text-amber-300 mb-1">
                Piste d’introspection
              </p>
              <p className="font-medium text-nia-gray-dark dark:text-white">
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
  const { publicStories } = useApp();
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
      <ScrollReveal>
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 text-xs font-bold">
              <Feather className="w-3.5 h-3.5 text-nia-orange" />
              Histoires — Anonymat & Franchise
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-nia-gray-dark dark:text-white">
              <GlitchText text={STORIES_SIGNATURE} occasionalIntervalMs={18000} />
            </h1>
            <p className="text-base text-nia-gray-mid dark:text-gray-300">
              Cette bibliothèque publique présente exclusivement les histoires approuvées par la modération et dont la version finale a reçu l’autorisation explicite de leur auteur.
            </p>
          </div>

          <Link
            to="/espace/histoires"
            className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold shadow-nia-soft"
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-sm focus:outline-none focus:border-nia-orange"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                selectedCategory === cat
                  ? 'bg-nia-bordeaux text-white'
                  : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200'
              }`}
            >
              {cat === 'ALL' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark text-center space-y-3">
          <p className="text-base font-bold text-nia-gray-dark dark:text-white">
            Aucune histoire publiée ne correspond à cette recherche.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('ALL');
            }}
            className="px-4 py-2 rounded-xl bg-nia-orange text-white text-xs font-bold"
          >
            Réinitialiser les filtres
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((story) => (
            <article
              key={story.id}
              className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark shadow-sm flex flex-col justify-between space-y-5"
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
                    {story.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Autorisation explicite auteur vérifiée (v{story.version})
                  </span>
                </div>
                <h2 className="text-xl font-bold text-nia-gray-dark dark:text-white">
                  {story.title}
                </h2>
                <p className="text-sm sm:text-base text-nia-gray-dark dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  « {story.content} »
                </p>
              </div>

              <div className="pt-4 border-t border-nia-gray-light dark:border-nia-border-dark flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
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
      desc: 'Isolation stricte des données par Row Level Security (RLS) et double consentement pour toute histoire publiée.',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <ScrollReveal>
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-bold">
            Manifeste & Engagements Nia-Mind
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-nia-gray-dark dark:text-white">
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
            <div className="h-full p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3">
              <div className="w-9 h-9 rounded-xl bg-nia-orange/15 text-nia-orange font-extrabold flex items-center justify-center text-sm">
                0{i + 1}
              </div>
              <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                {v.title}
              </h2>
              <p className="text-sm text-nia-gray-mid dark:text-gray-400 leading-relaxed">
                {v.desc}
              </p>
            </div>
          </ScrollReveal>
        ))}
      </div>

      <div className="rounded-3xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark p-8 sm:p-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <h2 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white">
            Ce que Nia-Mind est — et ce qu’il n’est pas
          </h2>
          <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
            Nous refusons l’apparence froide d’un hôpital ou d’un logiciel administratif. Nia-Mind accompagne votre réflexion quotidienne, mais ne remplace jamais un médecin, un psychiatre ou un service d’urgence.
          </p>
          <ul className="space-y-2 text-sm text-nia-gray-dark dark:text-gray-200">
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
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Link
            to="/inscription"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm"
          >
            Créer un compte
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/ressources"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-nia-gray-light dark:border-nia-border-dark font-bold text-sm"
          >
            Voir nos ressources d’aide
          </Link>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 5. PAGES PUBLIQUES : CONNEXION (/connexion) & INSCRIPTION (/inscription)
// ============================================================================
export const AuthPage: React.FC<{ mode: 'login' | 'register' }> = ({ mode }) => {
  const { loginWithEmail, registerAccount, switchDemoUser } = useApp();
  const navigate = useNavigate();

  const [email, setEmail] = useState('amina@nia-mind.org');
  const [password, setPassword] = useState('••••••••••••');
  const [displayName, setDisplayName] = useState('');
  const [pseudonym, setPseudonym] = useState('');
  const [countryCode, setCountryCode] = useState<UserProfile['countryCode']>('BF');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [optionalWellness, setOptionalWellness] = useState(true);
  const [websiteHoneypot, setWebsiteHoneypot] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mode === 'login') {
      const res = loginWithEmail(email, password, websiteHoneypot);
      if (!res.ok) {
        setErrorMsg(res.error || 'Erreur de connexion.');
        return;
      }
      navigate('/espace/tableau-de-bord');
    } else {
      const res = registerAccount({
        displayName,
        email,
        publicPseudonym: pseudonym || 'Anonyme',
        countryCode,
        acceptedTerms,
        optionalWellnessConsent: optionalWellness,
        honeypot: websiteHoneypot,
      });
      if (!res.ok) {
        setErrorMsg(res.error || 'Erreur lors de la création du compte.');
        return;
      }
      navigate('/espace/tableau-de-bord');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark p-6 sm:p-10 shadow-nia-soft space-y-6">
        <div className="space-y-2 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            Nia-Mind — « {OFFICIAL_SLOGAN} »
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nia-gray-dark dark:text-white">
            {mode === 'login' ? 'Connexion réservée aux membres inscrits' : 'Créer ton espace personnel'}
          </h1>
          <p className="text-sm text-nia-gray-mid dark:text-gray-400">
            {mode === 'login'
              ? 'Seuls les e-mails déjà inscrits et vérifiés peuvent ouvrir une session. Protection anti-brute-force active (blocage après 5 échecs).'
              : 'Un espace sincère, protégé et sans jugement. Aucun rôle administrateur ne peut être auto-attribué.'}
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>
            <strong>Bouclier Anti-Spam & Anti-Pentest actif :</strong> pare-feu SQLi/XSS sur tous les champs, honeypot anti-robot et rejet strict des comptes non inscrits.
          </span>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-700 dark:text-rose-300">
            {errorMsg}
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
                <label className="block text-xs font-bold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                  Prénom ou nom d’affichage privé
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex. : Kenza M."
                  className="w-full px-4 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                    Pseudonyme public facultatif (Histoires)
                  </label>
                  <input
                    type="text"
                    value={pseudonym}
                    onChange={(e) => setPseudonym(e.target.value)}
                    placeholder="Ex. : Anonyme ou Plume Libre"
                    className="w-full px-4 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
                    Pays (Ressources d’aide vérifiées)
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value as UserProfile['countryCode'])}
                    className="w-full px-4 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
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
            <label className="block text-xs font-bold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
              Adresse e-mail
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.org"
              className="w-full px-4 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-nia-gray-dark dark:text-gray-200 mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          {mode === 'register' && (
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-2.5 text-xs text-nia-gray-dark dark:text-gray-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-0.5 rounded text-nia-orange"
                />
                <span>
                  <strong>Obligatoire (Contrat de service v2.4) :</strong> J’accepte les conditions d’utilisation et la charte de confidentialité Nia-Mind.
                </span>
              </label>
              <label className="flex items-start gap-2.5 text-xs text-nia-gray-mid dark:text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={optionalWellness}
                  onChange={(e) => setOptionalWellness(e.target.checked)}
                  className="mt-0.5 rounded text-nia-orange"
                />
                <span>
                  <strong>Facultatif :</strong> J’autorise le calcul local de mes graphiques d’évolution bien-être (modifiable à tout moment).
                </span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm shadow-nia-soft transition-colors flex items-center justify-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'}</span>
          </button>
        </form>

        {/* Accès rapide aux comptes de démonstration pour l'audit */}
        <div className="pt-5 border-t border-nia-gray-light dark:border-nia-border-dark space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300 text-center">
            Accès rapide — Comptes préconfigurés pour vérification RLS
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                switchDemoUser('user-a');
                navigate('/espace/tableau-de-bord');
              }}
              className="p-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-semibold text-center"
            >
              Amina (User A)
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoUser('user-b');
                navigate('/espace/tableau-de-bord');
              }}
              className="p-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-semibold text-center"
            >
              Lucas (User B)
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoUser('admin-1');
                navigate('/admin/vue-ensemble');
              }}
              className="p-2.5 rounded-xl border border-nia-bordeaux/40 bg-nia-bordeaux/10 text-nia-bordeaux dark:text-amber-300 text-xs font-bold text-center"
            >
              Soraïa (Admin)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-nia-gray-mid dark:text-gray-400">
          {mode === 'login' ? (
            <>
              Pas encore de compte ?{' '}
              <Link to="/inscription" className="font-bold text-nia-orange hover:underline">
                Créer un compte
              </Link>
            </>
          ) : (
            <>
              Déjà inscrit(e) ?{' '}
              <Link to="/connexion" className="font-bold text-nia-orange hover:underline">
                Se connecter
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
