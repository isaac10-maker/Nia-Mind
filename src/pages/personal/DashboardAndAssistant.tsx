import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookMarked,
  CheckCircle2,
  Feather,
  HeartHandshake,
  PhoneCall,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AssistantMessenger } from '../../components/assistant/AssistantMessenger';
import { Modal } from '../../components/ui/Modal';
import { NeuralChipIcon } from '../../components/ui/NeuralChipIcon';
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
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

const HIDDEN_SUGGESTIONS_KEY = 'nia-mind-hidden-suggestions';
const SUGGESTIONS_TRAY_KEY = 'nia-mind-suggestions-tray';

function readStoredStringList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

/** Place le message reçu au centre du fil, ou en haut s’il est trop long pour tenir entier. */
function focusNodeInThread(
  scroller: HTMLElement,
  node: HTMLElement,
  behavior: ScrollBehavior
): void {
  const scrollerRect = scroller.getBoundingClientRect();
  const nodeRect = node.getBoundingClientRect();
  const viewHeight = scroller.clientHeight;
  const offsetFromTop =
    nodeRect.height > viewHeight * 0.62
      ? viewHeight * 0.12
      : Math.max(16, (viewHeight - nodeRect.height) / 2);
  const delta = nodeRect.top - scrollerRect.top - offsetFromTop;
  const maxTop = Math.max(0, scroller.scrollHeight - viewHeight);
  scroller.scrollTo({
    top: Math.max(0, Math.min(scroller.scrollTop + delta, maxTop)),
    behavior,
  });
}

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
    reducedMotion,
  } = useApp();

  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [distressAlert, setDistressAlert] = useState(false);
  const [convToDelete, setConvToDelete] = useState<string | null>(null);
  const [didInitConv, setDidInitConv] = useState<boolean>(false);
  const [mobilePane, setMobilePane] = useState<'list' | 'chat'>('chat');
  const [suggestionsOpen, setSuggestionsOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(SUGGESTIONS_TRAY_KEY) !== '0';
    } catch {
      return true;
    }
  });
  const [hiddenSuggestions, setHiddenSuggestions] = useState<string[]>(() =>
    readStoredStringList(HIDDEN_SUGGESTIONS_KEY)
  );
  const [focusedIncomingId, setFocusedIncomingId] = useState<string | null>(null);
  const [threadSpacer, setThreadSpacer] = useState(160);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messageNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

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

  const visibleSuggestions = OFFICIAL_SUGGESTIONS.filter(
    (suggestion) => !hiddenSuggestions.includes(suggestion)
  );

  const persistHiddenSuggestions = (next: string[]) => {
    setHiddenSuggestions(next);
    try {
      localStorage.setItem(HIDDEN_SUGGESTIONS_KEY, JSON.stringify(next));
    } catch {
      /* préférence locale uniquement */
    }
  };

  const dismissSuggestion = (suggestion: string) => {
    if (hiddenSuggestions.includes(suggestion)) return;
    persistHiddenSuggestions([...hiddenSuggestions, suggestion]);
  };

  const setSuggestionsTray = (open: boolean) => {
    setSuggestionsOpen(open);
    try {
      localStorage.setItem(SUGGESTIONS_TRAY_KEY, open ? '1' : '0');
    } catch {
      /* préférence locale uniquement */
    }
  };

  const restoreSuggestions = () => {
    persistHiddenSuggestions([]);
    setSuggestionsTray(true);
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const sync = () => setThreadSpacer(Math.max(120, Math.round(el.clientHeight * 0.46)));
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [activeConversation?.id, mobilePane]);

  // Centre le nouveau message reçu dans le fil (les messages longs restent lisibles depuis le début)
  useEffect(() => {
    const scroller = messagesContainerRef.current;
    if (!scroller) return;
    const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
    const frame = window.requestAnimationFrame(() => {
      if (isLoading) {
        const thinking = scroller.querySelector('[data-nia-thinking="true"]') as HTMLElement | null;
        if (thinking) focusNodeInThread(scroller, thinking, behavior);
        return;
      }
      const messages = activeConversation?.messages ?? [];
      const last = messages[messages.length - 1];
      if (!last) {
        scroller.scrollTop = 0;
        return;
      }
      const node = messageNodeRefs.current.get(last.id);
      if (!node) return;
      if (last.sender === 'user') {
        const scrollerRect = scroller.getBoundingClientRect();
        const nodeRect = node.getBoundingClientRect();
        const delta = nodeRect.bottom - (scrollerRect.bottom - 28);
        if (Math.abs(delta) > 8) {
          const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
          scroller.scrollTo({
            top: Math.max(0, Math.min(scroller.scrollTop + delta, maxTop)),
            behavior,
          });
        }
        return;
      }
      focusNodeInThread(scroller, node, behavior);
      setFocusedIncomingId(last.id);
    });
    const clearFocus = window.setTimeout(() => {
      setFocusedIncomingId((current) => (current ? null : current));
    }, 2200);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clearFocus);
    };
  }, [
    activeConversation?.id,
    activeConversation?.messages.length,
    activeConversation?.messages?.[activeConversation.messages.length - 1]?.id,
    isLoading,
    threadSpacer,
    reducedMotion,
  ]);

  const resizeComposer = () => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

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
    if (composerRef.current) composerRef.current.style.height = '48px';
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
    <div className="flex flex-col min-h-0 h-[calc(100dvh-10.75rem)] sm:h-[calc(100dvh-10.25rem)] lg:h-[calc(100dvh-9.6rem)]">
      {/* Bannière de sécurité en cas de mots-clés de détresse détectés */}
      {distressAlert && (
        <div
          role="alert"
          className="shrink-0 p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 space-y-3 max-h-40 overflow-y-auto"
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

      <AssistantMessenger
        currentLanguage={currentLanguage}
        pseudonym={currentUser?.publicPseudonym || currentUser?.displayName || 'Plume'}
        conversations={userConversations}
        activeConversation={activeConversation}
        isHandedOver={isHandedOver}
        isLoading={isLoading}
        apiError={apiError}
        inputMessage={inputMessage}
        mobilePane={mobilePane}
        suggestionsOpen={suggestionsOpen}
        visibleSuggestions={visibleSuggestions}
        focusedIncomingId={focusedIncomingId}
        threadSpacer={threadSpacer}
        messagesContainerRef={messagesContainerRef}
        messageNodeRefs={messageNodeRefs}
        composerRef={composerRef}
        onInputChange={setInputMessage}
        onComposerResize={resizeComposer}
        onSend={handleSendMessage}
        onSelectConversation={(id) => {
          setSelectedConvId(id);
          setMobilePane('chat');
        }}
        onCreateConversation={() => {
          const created = createConversation();
          setSelectedConvId(created.id);
          setMobilePane('chat');
        }}
        onAskDeleteConversation={setConvToDelete}
        onClearAllConversations={clearAllUserConversations}
        onClearMessages={clearConversationMessages}
        onDeleteMessage={deleteAssistantMessage}
        onToggleHandover={() => {
          if (!activeConversation) return;
          toggleConversationHumanHandover(activeConversation.id, !isHandedOver);
        }}
        onShowList={() => setMobilePane('list')}
        onDismissSuggestion={dismissSuggestion}
        onCloseSuggestions={() => setSuggestionsTray(false)}
        onOpenSuggestions={() => setSuggestionsTray(true)}
        onRestoreSuggestions={restoreSuggestions}
      />

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
