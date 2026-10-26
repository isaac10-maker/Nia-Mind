import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Crown,
  Feather,
  HeartHandshake,
  Loader2,
  Lock,
  MessageSquarePlus,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { NeuralChipIcon } from '../../components/ui/NeuralChipIcon';
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
import { translateMessageForViewer, tUi } from '../../lib/i18nEngine';
import {
  detectDistress,
  generateServerReflectiveReply,
} from '../../../api/assistant';

const OFFICIAL_SUGGESTIONS = [
  'J\'ai besoin de mettre des mots sur ce que je ressens.',
  'Je veux mieux gérer mon stress.',
  'Aide-moi à réfléchir à une situation.',
  'Comment fonctionne Nia-Mind ?',
];

// ============================================================================
// 1. TABLEAU DE BORD PERSONNEL (/espace/tableau-de-bord)
// ============================================================================
export const PersonalDashboardPage: React.FC = () => {
  const {
    currentUser,
    userMoodEntries,
    userStressSleepEntries,
    userJournalEntries,
    userStories,
    userListeningRequests,
    featuredDailyTip,
    openDailyTipModal,
  } = useApp();

  const latestMood = userMoodEntries[0];
  const latestSleep = userStressSleepEntries[0];
  const pendingConsentStories = userStories.filter((s) => s.status === 'Autorisation demandée');
  const repliedListening = userListeningRequests.filter((r) => r.status === 'Réponse disponible');

  return (
    <div className="space-y-8">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Guide Tableau de bord • 1/3',
            title: 'Ton espace personnel démarre 100 % vierge et authentique',
            detail:
              'Aucune fausse donnée ni fausse conversation : tout ce qui s’affiche ici se construit uniquement à partir de tes propres notes, de ton humeur et de tes échanges.',
          },
          {
            badge: 'Guide Tableau de bord • 2/3',
            title: 'Par où commencer aujourd’hui ?',
            detail:
              'Clique sur « Parler à l’Assistant » pour déposer ce que tu ressens, ou sur « Mon bien-être » pour enregistrer ta première météo intérieure.',
          },
          {
            badge: 'Guide Tableau de bord • 3/3',
            title: 'Tes écrits restent sous ton contrôle',
            detail:
              'Ton journal est strictement intime et tes histoires anonymes nécessitent toujours ton accord explicite avant toute publication.',
          },
        ]}
      />

      {/* En-tête d'accueil personnel */}
      <div className="rounded-3xl bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white p-6 sm:p-8 shadow-nia-soft">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-amber-200 text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-nia-orange" />
              Espace Personnel Isolé • Écouter • Comprendre • Avancer
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">
              Bonjour, @{currentUser?.publicPseudonym || currentUser?.displayName}. Prends le temps d’être toi-même.
            </h1>
            <p className="text-sm text-white/85 max-w-2xl">
              Tout ce que tu déposes dans ton journal et ton suivi bien-être t’appartient exclusivement.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/espace/assistant"
              className="px-4 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold shadow-sm transition-colors"
            >
              Parler à l’Assistant
            </Link>
            <Link
              to="/espace/journal"
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold transition-colors"
            >
              Écrire dans mon journal
            </Link>
          </div>
        </div>
      </div>

      {/* Alertes d'action prioritaires : demande d'autorisation de publication ou réponse d'écoute */}
      {(pendingConsentStories.length > 0 || repliedListening.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingConsentStories.map((st) => (
            <div
              key={st.id}
              className="p-5 rounded-2xl bg-amber-500/10 border border-nia-orange/50 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-nia-orange-deep dark:text-nia-orange">
                  Autorisation explicite demandée (Version v{st.currentVersion})
                </span>
                <p className="text-sm font-bold text-nia-gray-dark dark:text-white">
                  Histoire : « {st.title || 'Sans titre'} »
                </p>
                <p className="text-xs text-nia-gray-mid dark:text-gray-300">
                  La modération vous propose une version anonymisée. Elle ne sera jamais publiée sans votre accord explicite.
                </p>
              </div>
              <Link
                to="/espace/histoires"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-nia-orange text-white text-xs font-bold"
              >
                Examiner
              </Link>
            </div>
          ))}

          {repliedListening.map((lr) => (
            <div
              key={lr.id}
              className="p-5 rounded-2xl bg-nia-bordeaux/10 border border-nia-bordeaux/40 flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                  Réponse d’écoute humaine disponible
                </span>
                <p className="text-sm font-bold text-nia-gray-dark dark:text-white">
                  {lr.topic}
                </p>
                <p className="text-xs text-nia-gray-mid dark:text-gray-300">
                  {lr.assignedListener || 'Un écoutant Nia-Mind'} vous a répondu en toute confidentialité.
                </p>
              </div>
              <Link
                to="/espace/ecoute"
                className="shrink-0 px-3.5 py-2 rounded-xl bg-nia-bordeaux text-white text-xs font-bold"
              >
                Lire
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Cartes de synthèse */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/espace/bien-etre"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
            <span>Dernière humeur</span>
            <Activity className="w-4 h-4 text-nia-orange" />
          </div>
          <p className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
            {latestMood ? `${latestMood.moodLabel} (${latestMood.moodScore}/5)` : 'Non renseignée'}
          </p>
          <p className="text-xs text-nia-gray-mid dark:text-gray-400">
            {userMoodEntries.length} entrée(s) enregistrée(s)
          </p>
        </Link>

        <Link
          to="/espace/bien-etre"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
            <span>Sommeil & Stress</span>
            <Sparkles className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
          </div>
          <p className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
            {latestSleep
              ? `${latestSleep.sleepHours}h • Stress ${latestSleep.stressLevel}/10`
              : 'Aucun relevé'}
          </p>
          <p className="text-xs text-nia-gray-mid dark:text-gray-400">
            Voir les courbes 7j / 30j →
          </p>
        </Link>

        <Link
          to="/espace/journal"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
            <span>Mon journal intime</span>
            <BookMarked className="w-4 h-4 text-nia-orange" />
          </div>
          <p className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
            {userJournalEntries.length} note(s) privée(s)
          </p>
          <p className="text-xs text-nia-gray-mid dark:text-gray-400">
            Strictement personnel, jamais publié
          </p>
        </Link>

        <Link
          to="/espace/histoires"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange transition-all space-y-2"
        >
          <div className="flex items-center justify-between text-xs text-nia-gray-mid dark:text-gray-400">
            <span>Mes histoires</span>
            <Feather className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
          </div>
          <p className="text-lg font-extrabold text-nia-gray-dark dark:text-white">
            {userStories.length} récit(s) suivi(s)
          </p>
          <p className="text-xs text-nia-gray-mid dark:text-gray-400">
            Contrôle total de publication
          </p>
        </Link>
      </div>

      {/* Conseil du jour en vedette & Raccourcis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
              <Sparkles className="w-4 h-4" />
              Conseil du jour • {featuredDailyTip.category}
            </span>
            <h2 className="text-xl font-bold text-nia-gray-dark dark:text-white">
              {featuredDailyTip.title}
            </h2>
            <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
              {featuredDailyTip.content}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border-l-4 border-nia-bordeaux flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs font-semibold text-nia-gray-dark dark:text-gray-200">
              « {featuredDailyTip.reflectionQuestion} »
            </p>
            <button
              type="button"
              onClick={openDailyTipModal}
              className="shrink-0 px-3.5 py-2 rounded-xl bg-nia-orange text-white text-xs font-bold"
            >
              Ouvrir en modale
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
          <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
            Accès rapide à tes espaces
          </h2>
          <div className="space-y-2.5">
            <Link
              to="/espace/assistant"
              className="flex items-center justify-between p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark hover:border-nia-orange border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <NeuralChipIcon className="w-4 h-4 shrink-0" />
                Échanger avec l’Assistant Nia-Mind
              </span>
              <ArrowRight className="w-4 h-4 text-nia-gray-mid" />
            </Link>
            <Link
              to="/espace/ecoute"
              className="flex items-center justify-between p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark hover:border-nia-orange border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <HeartHandshake className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
                Demander une écoute humaine
              </span>
              <ArrowRight className="w-4 h-4 text-nia-gray-mid" />
            </Link>
            <Link
              to="/espace/bien-etre"
              className="flex items-center justify-between p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark hover:border-nia-orange border border-transparent transition-all"
            >
              <span className="flex items-center gap-2.5 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-nia-orange" />
                Passer le questionnaire OMS-5
              </span>
              <ArrowRight className="w-4 h-4 text-nia-gray-mid" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. ASSISTANT NIA-MIND (/espace/assistant) — Connecté à /api/assistant
// ============================================================================
export const AssistantPage: React.FC = () => {
  const {
    currentUser,
    currentLanguage,
    userConversations,
    createConversation,
    appendAssistantMessage,
    toggleConversationHumanHandover,
    deleteConversation,
    deleteAssistantMessage,
    clearConversationMessages,
    clearAllUserConversations,
    helpResources,
  } = useApp();

  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [distressAlert, setDistressAlert] = useState(false);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [didInitConv, setDidInitConv] = useState<boolean>(false);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (userConversations.length > 0 && !userConversations.some((c) => c.id === selectedConvId)) {
      setSelectedConvId(userConversations[0].id);
      setDidInitConv(true);
    } else if (userConversations.length === 0 && !didInitConv) {
      const created = createConversation();
      setSelectedConvId(created.id);
      setDidInitConv(true);
    }
  }, [userConversations, selectedConvId, didInitConv]);

  const activeConversation =
    userConversations.find((c) => c.id === selectedConvId) || userConversations[0];
  const isHandedOver = Boolean(activeConversation?.handedOverToAdmin);

  // Défilement automatique vers le dernier message dès qu'un message est envoyé ou reçu
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activeConversation?.messages.length, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend ?? inputMessage).trim();
    if (!content || isLoading) return;

    let conv = activeConversation;
    if (!conv) {
      conv = createConversation();
      setSelectedConvId(conv.id);
    }

    const recentHistory = conv.messages.slice(-6).map((m) => ({
      role: (m.sender === 'admin' ? 'assistant' : m.sender) as 'user' | 'assistant',
      content: m.content,
    }));

    setInputMessage('');
    setApiError(null);
    appendAssistantMessage(conv.id, 'user', content);

    // Si le switch Humain (Admin) est activé, le message est transmis dans le pack privé de l'utilisateur pour l'Admin
    if (conv.handedOverToAdmin) {
      return;
    }

    setIsLoading(true);

    try {
      const [response] = await Promise.all([
        fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content,
            countryCode: currentUser?.countryCode || 'BF',
            language: currentLanguage,
            history: recentHistory,
          }),
        }),
        // Pause d'exactement 1 seconde de réflexion (« Nia analyse votre requête… »)
        new Promise((resolve) => setTimeout(resolve, 1000)),
      ]);

      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 || response.status === 429) {
          setApiError(data?.error || 'Le service IA a rencontré une erreur temporaire.');
        } else {
          const isDistress = detectDistress(content);
          if (isDistress) setDistressAlert(true);
          const fallbackReply = generateServerReflectiveReply(
            content,
            isDistress,
            recentHistory,
            currentLanguage
          );
          appendAssistantMessage(conv.id, 'assistant', fallbackReply, isDistress);
        }
      } else {
        if (data.distressDetected) {
          setDistressAlert(true);
        }
        appendAssistantMessage(
          conv.id,
          'assistant',
          data.reply,
          Boolean(data.distressDetected)
        );
      }
    } catch {
      const isDistress = detectDistress(content);
      if (isDistress) setDistressAlert(true);
      const fallbackReply = generateServerReflectiveReply(
        content,
        isDistress,
        recentHistory,
        currentLanguage
      );
      appendAssistantMessage(conv.id, 'assistant', fallbackReply, isDistress);
    } finally {
      setIsLoading(false);
    }
  };

  const countryEmergencyResources = helpResources.filter(
    (r) => r.countryCode === (currentUser?.countryCode || 'BF') || r.countryCode === 'INT'
  );

  return (
    <div className="space-y-6">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Instructions Assistant • Défilement automatique (1/3)',
            title: 'Comment dialoguer avec l’Assistant Nia-Mind ?',
            detail:
              'Écris librement dans la zone en bas ou clique sur l’une des 4 bulles d’amorce rapide (« J’ai besoin de mettre des mots… », « Je veux mieux gérer mon stress… »).',
          },
          {
            badge: 'Instructions Assistant • Défilement automatique (2/3)',
            title: 'Moteur réflexif autonome & gratuit',
            detail:
              'L’assistant t’écoute sans juger et te pose des questions ouvertes pour t’aider à clarifier ta situation, ta fatigue ou tes émotions.',
          },
          {
            badge: 'Instructions Assistant • Défilement automatique (3/3)',
            title: 'Gestion de tes conversations',
            detail:
              'Tu peux créer plusieurs sujets de réflexion avec le bouton « + Nouvelle » ou supprimer un échange à tout moment avec l’icône corbeille.',
          },
        ]}
      />

      {/* Indication claire et obligatoire + Switch IA ⇄ Humain (Admin) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-orange/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-sky-500/15 border border-emerald-500/30 shrink-0">
            <NeuralChipIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
              {isHandedOver
                ? tUi(currentLanguage, 'humanHandoverActive')
                : 'Puce d’Intelligence Nia-Mind (IA) ou Relais Humain (Admin)'}
            </p>
            <p className="text-xs text-nia-gray-mid dark:text-gray-300">
              {tUi(currentLanguage, 'privateAdminInterlocutorNotice')} — Tes discussions sont classées en pack dédié sous ton pseudonyme <strong>@{currentUser?.publicPseudonym || currentUser?.displayName}</strong>.
            </p>
          </div>
        </div>
        {activeConversation && (
          <button
            type="button"
            onClick={() =>
              toggleConversationHumanHandover(activeConversation.id, !isHandedOver)
            }
            className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-extrabold shadow-sm transition-all ${
              isHandedOver
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white hover:opacity-95'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>
              {isHandedOver
                ? tUi(currentLanguage, 'switchToAi')
                : tUi(currentLanguage, 'switchToHuman')}
            </span>
          </button>
        )}
      </div>

      {/* Bannière de sécurité en cas de mots-clés de détresse détectés */}
      {distressAlert && (
        <div
          role="alert"
          className="p-5 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 space-y-3"
        >
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Tu n’es pas seul(e) — Ressources d’aide immédiate vérifiées ({currentUser?.countryCode || 'BF'})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {countryEmergencyResources.map((res) => (
              <div
                key={res.id}
                className="p-3.5 rounded-xl bg-white dark:bg-nia-surface-dark border border-rose-500/30 text-xs space-y-1"
              >
                <p className="font-bold text-nia-gray-dark dark:text-white">
                  {res.organizationName} ({res.countryLabel})
                </p>
                <p className="font-extrabold text-nia-orange flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5" />
                  {res.phoneOrContact} — {res.availability}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interface Conversationnelle : Historique à gauche + Conversation active à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Historique des conversations */}
        <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark p-4 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-white">
                Mes conversations ({userConversations.length})
              </h2>
              <div className="flex items-center gap-1.5">
                {userConversations.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearAllUserConversations()}
                    title="Vider et nettoyer toutes les discussions"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Nettoyer</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const created = createConversation();
                    setSelectedConvId(created.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold transition-colors"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  Nouvelle conversation
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {userConversations.map((conv) => {
                const isSelected = conv.id === activeConversation?.id;
                return (
                  <div
                    key={conv.id}
                    className={`group flex items-center justify-between gap-2 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-nia-orange/15 border-nia-orange text-nia-gray-dark dark:text-white'
                        : 'bg-nia-bg-light dark:bg-nia-bg-dark border-transparent hover:border-nia-gray-light dark:hover:border-nia-border-dark'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedConvId(conv.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-xs font-bold truncate">{conv.title}</p>
                      <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">
                        {conv.messages.length} message(s)
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConvToDelete(conv.id)}
                      className="p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600 transition-colors"
                      aria-label={`Supprimer la conversation ${conv.title}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-[11px] text-nia-gray-mid dark:text-gray-400 border-t border-nia-gray-light dark:border-nia-border-dark pt-3">
            Pack isolé @{currentUser?.publicPseudonym || currentUser?.displayName} : vos messages sont lisibles uniquement par vous et l’administrateur.
          </p>
        </div>

        {/* Colonne Discussion Active */}
        <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col min-h-[540px]">
          <div className="px-4 sm:px-5 py-4 border-b border-nia-gray-light dark:border-nia-border-dark flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold text-nia-gray-dark dark:text-white truncate">
                  {translateMessageForViewer(
                    activeConversation?.title || 'Assistant Nia-Mind',
                    currentLanguage
                  )}
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                    isHandedOver
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                      : 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                  }`}
                >
                  {isHandedOver ? (
                    <>
                      <Crown className="w-3 h-3 text-amber-500" />
                      <span>Relais Humain (Admin)</span>
                    </>
                  ) : (
                    <>
                      <NeuralChipIcon className="w-3.5 h-3.5" />
                      <span>Puce IA Active</span>
                    </>
                  )}
                </span>
              </div>
              <p className="text-[11px] text-nia-gray-mid dark:text-gray-400 flex items-center gap-1 mt-0.5">
                <Lock className="w-3 h-3 text-nia-orange shrink-0" />
                <span>
                  {tUi(currentLanguage, 'privateAdminInterlocutorNotice')} • Traduction auto ({currentLanguage.toUpperCase()})
                </span>
              </p>
            </div>

            {/* Bouton Vider les messages + Switch direct dans l'en-tête de la discussion */}
            {activeConversation && (
              <div className="flex flex-wrap items-center gap-2">
                {activeConversation.messages.length > 0 && (
                  <button
                    type="button"
                    onClick={() => clearConversationMessages(activeConversation.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-extrabold transition-colors"
                    title="Vider tous les messages de cette discussion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider les messages</span>
                  </button>
                )}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isHandedOver}
                  onClick={() =>
                    toggleConversationHumanHandover(activeConversation.id, !isHandedOver)
                  }
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-extrabold border transition-all ${
                    isHandedOver
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-200'
                      : 'bg-nia-orange/15 border-nia-orange/50 text-nia-bordeaux dark:text-amber-200'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isHandedOver ? 'bg-emerald-500 animate-pulse' : 'bg-sky-500'
                    }`}
                  />
                  <span>
                    {isHandedOver
                      ? tUi(currentLanguage, 'switchToAi')
                      : tUi(currentLanguage, 'switchToHuman')}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Fil de messages avec bouton de suppression individuel sur chaque message */}
          <div
            ref={messagesContainerRef}
            className="flex-1 p-4 sm:p-5 space-y-4 overflow-y-auto max-h-[420px] scroll-smooth"
          >
            {(!activeConversation || activeConversation.messages.length === 0) && (
              <div className="p-6 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-dashed border-nia-gray-light dark:border-nia-border-dark text-center text-xs text-nia-gray-mid">
                Aucun message dans cette discussion. Écris librement ci-dessous ou clique sur une suggestion pour commencer.
              </div>
            )}
            {activeConversation?.messages.map((msg) => {
              const translatedContent = translateMessageForViewer(msg.content, currentLanguage);
              const isUser = msg.sender === 'user';
              const isAdmin = msg.sender === 'admin';
              const isDiag = Boolean(msg.isDiagnosticBriefing);

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {isUser && (
                    <button
                      type="button"
                      onClick={() => deleteAssistantMessage(activeConversation.id, msg.id)}
                      title="Supprimer ce message"
                      aria-label="Supprimer ce message"
                      className="mt-1 p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600 hover:bg-rose-500/10 transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div
                    className={`max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                      isUser
                        ? 'bg-nia-orange text-white font-medium'
                        : isDiag
                        ? 'bg-gradient-to-br from-nia-bordeaux/15 via-amber-500/10 to-sky-500/15 border-2 border-nia-bordeaux/50 text-nia-gray-dark dark:text-white shadow-md'
                        : isAdmin
                        ? 'bg-emerald-500/15 border-2 border-emerald-500/40 text-nia-gray-dark dark:text-white'
                        : 'bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-100'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center justify-between gap-2 text-[11px] font-extrabold uppercase tracking-wider mb-1 text-nia-bordeaux dark:text-amber-300">
                        <span className="flex items-center gap-1.5">
                          {isDiag ? (
                            <>
                              <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
                              <span>{tUi(currentLanguage, 'psychicDiagnosticBtn')} • Bilan IA & Admin</span>
                            </>
                          ) : isAdmin ? (
                            <>
                              <Crown className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Administrateur Nia-Mind (Écoute Humaine)</span>
                            </>
                          ) : (
                            <>
                              <NeuralChipIcon className="w-3.5 h-3.5" />
                              <span>Nia-Mind IA</span>
                            </>
                          )}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteAssistantMessage(activeConversation.id, msg.id)}
                          title="Supprimer ce message"
                          aria-label="Supprimer ce message"
                          className="p-1 rounded hover:bg-rose-500/15 text-nia-gray-mid hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    {translatedContent}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start animate-nia-slide-in">
                <div className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-sky-500/15 via-nia-bordeaux/15 to-nia-orange/15 border-2 border-nia-orange/40 text-xs font-extrabold text-nia-gray-dark dark:text-white shadow-sm">
                  <NeuralChipIcon className="w-6 h-6" />
                  <Loader2 className="w-4 h-4 text-nia-orange animate-spin" />
                  <span>{tUi(currentLanguage, 'assistantThinking')}</span>
                </div>
              </div>
            )}

            {apiError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 font-semibold">
                {apiError}
              </div>
            )}
          </div>

          {/* Suggestions officielles cliquables */}
          <div className="px-5 py-3 bg-nia-bg-light/60 dark:bg-nia-bg-dark/50 border-t border-nia-gray-light dark:border-nia-border-dark">
            <p className="text-[11px] font-bold uppercase tracking-wider text-nia-gray-mid dark:text-gray-400 mb-2">
              Suggestions pour démarrer :
            </p>
            <div className="flex flex-wrap gap-2">
              {OFFICIAL_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleSendMessage(suggestion)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-medium text-nia-gray-dark dark:text-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Zone de saisie */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 border-t border-nia-gray-light dark:border-nia-border-dark flex items-center gap-3"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Écris librement ce que tu ressens ou ce que tu souhaites clarifier…"
              className="flex-1 px-4 py-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm focus:outline-none focus:border-nia-orange"
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep disabled:opacity-50 text-white text-sm font-bold transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Envoyer</span>
            </button>
          </form>
        </div>
      </div>

      {/* Modale de confirmation de suppression de conversation */}
      <Modal
        isOpen={Boolean(convToDelete)}
        onClose={() => setConvToDelete(null)}
        badgeText="Confirmation de suppression"
        title="Supprimer cette conversation ?"
        subtitle="Cette action est définitive et supprimera tous les messages associés."
        accent="bordeaux"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConvToDelete(null)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-sm font-medium"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                if (convToDelete) {
                  deleteConversation(convToDelete);
                  setConvToDelete(null);
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold"
            >
              Confirmer la suppression
            </button>
          </>
        }
      >
        <p>
          Êtes-vous sûr(e) de vouloir supprimer définitivement cet échange avec l’Assistant Nia-Mind ?
        </p>
      </Modal>
    </div>
  );
};
