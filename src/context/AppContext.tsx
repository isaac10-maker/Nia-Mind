import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  AssistantConversation,
  AssistantMessage,
  AuditLogEntry,
  DailyTip,
  JournalEntry,
  ListeningRequest,
  ListeningStatus,
  MoodEntry,
  PrivacyRequestRecord,
  PublicStoryView,
  QuestionnaireDefinition,
  QuestionnaireResponse,
  SiteNotification,
  SiteSettings,
  StoryRecord,
  StoryStatus,
  StressSleepEntry,
  UserProfile,
  UserRole,
  UserSessionInfo,
  VerifiedHelpResource,
} from '../lib/types';
import {
  INITIAL_ASSISTANT_CONVERSATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DAILY_TIPS,
  INITIAL_HELP_RESOURCES,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_LISTENING_REQUESTS,
  INITIAL_MOOD_ENTRIES,
  INITIAL_PRIVACY_REQUESTS,
  INITIAL_QUESTIONNAIRE_RESPONSES,
  INITIAL_SESSIONS,
  INITIAL_STORIES,
  INITIAL_STRESS_SLEEP_ENTRIES,
  INITIAL_USERS,
  QUESTIONNAIRE_CATALOG,
} from '../lib/seedData';
import {
  canAccessJournalEntry,
  canModifyUserRole,
  checkActionAntiSpam,
  checkAuthSubmissionRateLimit,
  detectPentestOrSqlInjection,
  filterListeningRequestsForRole,
  filterUserScopedData,
  filterUserStoriesForRole,
  getPublicSafeStories,
  sanitizeUserText,
  validateNoteAndWellnessInput,
  validateRealEmailAddress,
  validateStoryPublicationEligibility,
  verifyProtectedLogin,
} from '../lib/securityEngine';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  formatPsychicDiagnosticMessage,
  generatePsychicDiagnosticBriefing,
  SupportedLanguage,
  translatePlatformText,
} from '../lib/i18nEngine';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  tone: 'orange' | 'bordeaux' | 'neutral';
}

interface AppContextValue {
  // Identité, Thème & Langue isolée par utilisateur
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  supabaseConnected: boolean;
  currentLanguage: SupportedLanguage;
  setCurrentLanguage: (lang: SupportedLanguage) => void;

  // Authentification & Session
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  switchDemoUser: (userId: string | null) => void;
  loginWithEmail: (
    email: string,
    password?: string,
    honeypot?: string
  ) => { ok: boolean; error?: string };
  registerAccount: (params: {
    displayName: string;
    email: string;
    password?: string;
    publicPseudonym: string;
    countryCode: UserProfile['countryCode'];
    acceptedTerms: boolean;
    cookiesAccepted?: boolean;
    optionalWellnessConsent: boolean;
    interests?: string[];
    honeypot?: string;
  }) => { ok: boolean; error?: string };
  requestGmailPushVerification: (email: string) => Promise<{
    ok: boolean;
    verificationCode?: string;
    error?: string;
  }>;
  requestPasswordRecoveryPush: (email: string) => {
    ok: boolean;
    recoveryCode?: string;
    error?: string;
  };
  resetForgottenPassword: (params: {
    email: string;
    recoveryCode: string;
    newPassword: string;
  }) => { ok: boolean; error?: string };
  triggerSignupMotivationPush: () => Promise<void>;
  logout: () => void;
  updateCurrentUserProfile: (patch: Partial<UserProfile>) => { ok: boolean; error?: string };
  adminUpdateUserRole: (targetUserId: string, newRole: UserRole) => { ok: boolean; error?: string };

  // SuperAdmin : Notifications Push, Couleurs dynamiques, Relais IA & Gouvernance
  siteSettings: SiteSettings;
  updateSiteSettings: (patch: Partial<SiteSettings>) => { ok: boolean; error?: string };
  siteNotifications: SiteNotification[];
  publishSiteNotification: (params: {
    title: string;
    message: string;
    category: SiteNotification['category'];
    actionUrl?: string;
    generatedByAi?: boolean;
  }) => { ok: boolean; error?: string };
  toggleSiteNotification: (id: string) => void;
  deleteSiteNotification: (id: string) => void;
  generateAiDailyTipAndPush: () => { ok: boolean; tip?: DailyTip; error?: string };
  forcePublishStoryBySuperAdmin: (
    storyId: string,
    proposedPublicContent?: string
  ) => { ok: boolean; error?: string };
  adminBanUser: (targetUserId: string, reason: string) => { ok: boolean; error?: string };
  adminUnbanUser: (targetUserId: string) => { ok: boolean; error?: string };
  adminForceLogoutUser: (targetUserId: string) => { ok: boolean; error?: string };
  adminDeleteUser: (targetUserId: string) => { ok: boolean; error?: string };
  activeBanNotice: { pseudo: string; reason: string; bannedAt: string } | null;
  dismissBanNotice: () => void;
  allAssistantConversationsForAdmin: AssistantConversation[];
  toggleConversationHumanHandover: (conversationId: string, handOver: boolean) => void;
  adminReplyInAssistantConversation: (
    conversationId: string,
    content: string
  ) => { ok: boolean; error?: string };
  sendPsychicDiagnosticToUser: (
    conversationId: string,
    customBriefingText?: string
  ) => { ok: boolean; error?: string };

  // Données filtrées par RLS pour l'utilisateur courant
  userConversations: AssistantConversation[];
  userMoodEntries: MoodEntry[];
  userStressSleepEntries: StressSleepEntry[];
  userQuestionnaireResponses: QuestionnaireResponse[];
  userJournalEntries: JournalEntry[];
  userStories: StoryRecord[];
  publicStories: PublicStoryView[];
  allManageableStories: StoryRecord[];
  userListeningRequests: ListeningRequest[];
  allListeningRequests: ListeningRequest[];
  dailyTips: DailyTip[];
  featuredDailyTip: DailyTip;
  questionnairesCatalog: QuestionnaireDefinition[];
  helpResources: VerifiedHelpResource[];
  userPrivacyRequests: PrivacyRequestRecord[];
  allPrivacyRequests: PrivacyRequestRecord[];
  userSessions: UserSessionInfo[];
  auditLogs: AuditLogEntry[];

  // Actions Assistant IA
  createConversation: (initialTitle?: string) => AssistantConversation;
  appendAssistantMessage: (
    conversationId: string,
    sender: 'user' | 'assistant',
    content: string,
    distressFlagged?: boolean
  ) => void;
  deleteConversation: (conversationId: string) => void;

  // Actions Bien-être
  addMoodEntry: (entry: Omit<MoodEntry, 'id' | 'userId' | 'recordedAt'> & { recordedAt?: string }) => void;
  addStressSleepEntry: (entry: Omit<StressSleepEntry, 'id' | 'userId'>) => void;
  submitQuestionnaireResponse: (
    payload: Omit<QuestionnaireResponse, 'id' | 'userId' | 'createdAt'>
  ) => QuestionnaireResponse;

  // Actions Journal Personnel (Strictement privé)
  saveJournalEntry: (entry: {
    id?: string;
    title: string;
    content: string;
    category: string;
    promptUsed?: string;
    isDraft: boolean;
  }) => JournalEntry;
  deleteJournalEntry: (entryId: string) => void;

  // Actions Histoires (Parcours 8 étapes + Modération + Consentement explicite)
  saveOrSubmitStory: (params: {
    id?: string;
    category: string;
    title: string;
    publicPseudonym: string;
    originalContent: string;
    submitToModeration: boolean;
  }) => StoryRecord;
  authorRespondToPublicationRequest: (
    storyId: string,
    approve: boolean,
    authorNote?: string
  ) => { ok: boolean; error?: string };
  authorWithdrawStory: (storyId: string) => { ok: boolean; error?: string };
  adminModerateStory: (params: {
    storyId: string;
    nextStatus: StoryStatus;
    proposedPublicContent?: string;
    moderationNote: string;
  }) => { ok: boolean; error?: string };

  // Actions Écoute Humaine
  createListeningRequest: (params: {
    topic: string;
    preferredMode: ListeningRequest['preferredMode'];
    preferredSlot: string;
    message: string;
  }) => ListeningRequest;
  adminUpdateListeningRequest: (params: {
    requestId: string;
    status: ListeningStatus;
    listenerReply?: string;
    assignedListener?: string;
  }) => { ok: boolean; error?: string };

  // Actions Contenus Admin (Conseils, Questionnaires, Ressources)
  adminSaveDailyTip: (tip: Omit<DailyTip, 'id' | 'publishedAt'> & { id?: string }) => void;
  adminDeleteDailyTip: (tipId: string) => void;
  adminSaveHelpResource: (res: Omit<VerifiedHelpResource, 'id'> & { id?: string }) => void;
  adminDeleteHelpResource: (resId: string) => void;

  // Actions Confidentialité & Sessions
  createPrivacyRequest: (
    requestType: PrivacyRequestRecord['requestType'],
    reason: string
  ) => PrivacyRequestRecord;
  revokeSession: (sessionId: string) => void;

  // Modales globales & Notifications
  isDailyTipModalOpen: boolean;
  openDailyTipModal: () => void;
  closeDailyTipModal: (rememberDismissal?: boolean) => void;
  isConsentModalOpen: boolean;
  openConsentModal: () => void;
  closeConsentModal: () => void;
  toasts: ToastNotification[];
  pushToast: (title: string, message: string, tone?: ToastNotification['tone']) => void;
  dismissToast: (id: string) => void;

  // Inspection brute pour l'audit RLS (vérification Utilisateur A vs Utilisateur B)
  rawStoreForSecurityAudit: {
    conversations: AssistantConversation[];
    journals: JournalEntry[];
    moods: MoodEntry[];
    stressSleeps: StressSleepEntry[];
    questionnaires: QuestionnaireResponse[];
    stories: StoryRecord[];
  };
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

const STORAGE_KEY = 'nia-mind-state-v2-clean';
const ACTIVE_USER_KEY = 'nia-mind-active-user-v2';
const THEME_KEY = 'nia-mind-theme';
const DAILY_TIP_DISMISSED_KEY = 'nia-mind-daily-tip-dismissed-date';

const SUPERADMIN_PROFILE: UserProfile = {
  id: 'superadmin-isaac',
  email: 'isaacamegan10@gmail.com',
  displayName: 'Isaac (Superadmin)',
  publicPseudonym: 'Plume Fondatrice',
  bio: 'Superadministrateur officiel Nia-Mind — accès complet à la gouvernance, à la modération et aux contenus.',
  countryCode: 'BF',
  role: 'admin',
  themePreference: 'light',
  reducedMotion: false,
  notificationsEnabled: true,
  dailyTipModalEnabled: true,
  acceptedTermsVersion: 'v2.5 — Octobre 2026',
  acceptedTermsAt: '2026-10-01T08:00:00.000Z',
  optionalAnalyticsConsent: true,
  optionalWellnessInsightsConsent: true,
  createdAt: '2026-10-01T08:00:00.000Z',
};

const CLEAN_PUBLIC_STORIES: StoryRecord[] = INITIAL_STORIES.filter(
  (s) => s.status === 'Publiée' && s.authorExplicitConsent
);

const DEFAULT_SITE_SETTINGS: SiteSettings = {
  primaryColor: '#F97316',
  secondaryColor: '#7F1D3F',
  accentColor: '#0EA5E9',
  themePreset: 'Symbiose Nia-Mind (Orange & Bordeaux)',
  aiAutopilotTipsEnabled: true,
  strictRateLimitMax: 3,
  strictRateLimitWindowSec: 15,
  copyProtectionEnabled: true,
  updatedAt: '2026-10-25T08:00:00.000Z',
};

const INITIAL_SITE_NOTIFICATIONS: SiteNotification[] = [
  {
    id: 'notif-daily-1',
    title: 'Nouveau Conseil & Motivation du jour',
    message:
      'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger. Tu n’as pas besoin de tout résoudre ce soir pour mériter du repos.',
    category: 'Conseil & Motivation',
    actionUrl: '/conseils',
    generatedByAi: true,
    isActive: true,
    createdAt: '2026-10-25T08:00:00.000Z',
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Aucun faux compte ni fausse conversation : seul le Superadmin officiel est pré-enregistré, et le visiteur arrive déconnecté (null)
  const [users, setUsers] = useState<UserProfile[]>([SUPERADMIN_PROFILE]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_USER_KEY) || null;
    } catch {
      return null;
    }
  });
  const [conversations, setConversations] = useState<AssistantConversation[]>([]);
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([]);
  const [stressSleepEntries, setStressSleepEntries] = useState<StressSleepEntry[]>([]);
  const [questionnaireResponses, setQuestionnaireResponses] = useState<QuestionnaireResponse[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>(CLEAN_PUBLIC_STORIES);
  const [listeningRequests, setListeningRequests] = useState<ListeningRequest[]>([]);
  const [dailyTips, setDailyTips] = useState<DailyTip[]>(INITIAL_DAILY_TIPS);
  const [helpResources, setHelpResources] = useState<VerifiedHelpResource[]>(INITIAL_HELP_RESOURCES);
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequestRecord[]>([]);
  const [sessions, setSessions] = useState<UserSessionInfo[]>(INITIAL_SESSIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [siteNotifications, setSiteNotifications] = useState<SiteNotification[]>(
    INITIAL_SITE_NOTIFICATIONS
  );
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [recoveryCodes, setRecoveryCodes] = useState<Record<string, string>>({});
  const [visitorLanguage, setVisitorLanguage] = useState<SupportedLanguage>('fr');
  const [activeBanNotice, setActiveBanNotice] = useState<{
    pseudo: string;
    reason: string;
    bannedAt: string;
  } | null>(null);

  const [isDailyTipModalOpen, setIsDailyTipModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Synchronisation en direct des couleurs personnalisées par le SuperAdmin sur les variables CSS :root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--nia-orange', siteSettings.primaryColor || '#F97316');
    root.style.setProperty('--nia-bordeaux', siteSettings.secondaryColor || '#7F1D3F');
    root.style.setProperty('--nia-accent', siteSettings.accentColor || '#0EA5E9');
  }, [siteSettings.primaryColor, siteSettings.secondaryColor, siteSettings.accentColor]);

  // Synchronisation du thème avec la classe .dark sur <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Synchronisation de la réduction des mouvements
  useEffect(() => {
    const root = document.documentElement;
    if (reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }
  }, [reducedMotion]);

  // Synchronisation initiale avec la base PostgreSQL Supabase (wyiiyfjvicwwbcbswdac) si connectée
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const [{ data: tipsData }, { data: resData }] = await Promise.all([
          supabase.from('daily_tips').select('*').order('published_at', { ascending: false }),
          supabase.from('help_resources').select('*').order('created_at', { ascending: true }),
        ]);

        if (!cancelled && Array.isArray(tipsData) && tipsData.length > 0) {
          setDailyTips(
            tipsData.map((t: any) => ({
              id: t.id,
              title: t.title,
              category: t.category,
              summary: t.summary,
              content: t.content,
              reflectionQuestion: t.reflection_question,
              readingTimeMin: t.reading_time_min,
              isFeaturedToday: Boolean(t.is_featured_today),
              publishedAt: t.published_at,
            }))
          );
        }

        if (!cancelled && Array.isArray(resData) && resData.length > 0) {
          setHelpResources(
            resData.map((r: any) => ({
              id: r.id,
              countryCode: r.country_code,
              countryLabel: r.country_label,
              organizationName: r.organization_name,
              phoneOrContact: r.phone_or_contact,
              availability: r.availability,
              description: r.description,
              verifiedSource: r.verified_source,
              isEmergency: Boolean(r.is_emergency),
            }))
          );
        }
      } catch {
        // Repli transparent sur les données initiales locales en cas d'indisponibilité réseau
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Persistance locale légère pour conserver les ajouts durant la session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed.users) && parsed.users.length > 0) {
          const hasSuperAdmin = parsed.users.some(
            (u: UserProfile) => u.email.toLowerCase() === SUPERADMIN_PROFILE.email
          );
          setUsers(
            hasSuperAdmin
              ? parsed.users.map((u: UserProfile) =>
                  u.email.toLowerCase() === SUPERADMIN_PROFILE.email
                    ? { ...u, role: 'admin' }
                    : u
                )
              : [SUPERADMIN_PROFILE, ...parsed.users]
          );
        }
        if (Array.isArray(parsed.conversations)) setConversations(parsed.conversations);
        if (Array.isArray(parsed.questionnaireResponses))
          setQuestionnaireResponses(parsed.questionnaireResponses);
        if (Array.isArray(parsed.stories) && parsed.stories.length > 0) setStories(parsed.stories);
        if (Array.isArray(parsed.journalEntries)) setJournalEntries(parsed.journalEntries);
        if (Array.isArray(parsed.moodEntries)) setMoodEntries(parsed.moodEntries);
        if (Array.isArray(parsed.stressSleepEntries)) setStressSleepEntries(parsed.stressSleepEntries);
        if (Array.isArray(parsed.listeningRequests)) setListeningRequests(parsed.listeningRequests);
        if (parsed.siteSettings) {
          setSiteSettings({ ...DEFAULT_SITE_SETTINGS, ...parsed.siteSettings });
        }
        if (Array.isArray(parsed.siteNotifications) && parsed.siteNotifications.length > 0) {
          setSiteNotifications(parsed.siteNotifications);
        }
        if (parsed.userPasswords && typeof parsed.userPasswords === 'object') {
          setUserPasswords(parsed.userPasswords);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          users,
          conversations,
          questionnaireResponses,
          stories,
          journalEntries,
          moodEntries,
          stressSleepEntries,
          listeningRequests,
          siteSettings,
          siteNotifications,
          userPasswords,
        })
      );
    } catch {
      // ignore
    }
  }, [
    users,
    conversations,
    questionnaireResponses,
    stories,
    journalEntries,
    moodEntries,
    stressSleepEntries,
    listeningRequests,
    siteSettings,
    siteNotifications,
    userPasswords,
  ]);

  useEffect(() => {
    try {
      if (currentUserId) {
        localStorage.setItem(ACTIVE_USER_KEY, currentUserId);
      } else {
        localStorage.removeItem(ACTIVE_USER_KEY);
      }
    } catch {
      // ignore
    }
  }, [currentUserId]);

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) || null,
    [users, currentUserId]
  );

  // Langue isolée par utilisateur : le choix d'un utilisateur n'affecte que son propre affichage
  const currentLanguage: SupportedLanguage = useMemo(() => {
    if (currentUser?.preferredLanguage) {
      return currentUser.preferredLanguage;
    }
    try {
      const saved = localStorage.getItem(`nia-mind-lang-${currentUser?.id || 'visitor'}`);
      if (saved === 'fr' || saved === 'en' || saved === 'es' || saved === 'de' || saved === 'zh') {
        return saved;
      }
    } catch {
      // ignore
    }
    return visitorLanguage;
  }, [currentUser?.id, currentUser?.preferredLanguage, visitorLanguage]);

  const setCurrentLanguage = (lang: SupportedLanguage) => {
    try {
      localStorage.setItem(`nia-mind-lang-${currentUser?.id || 'visitor'}`, lang);
    } catch {
      // ignore
    }
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, preferredLanguage: lang } : u))
      );
    } else {
      setVisitorLanguage(lang);
    }
  };

  const pushToast = (
    title: string,
    message: string,
    tone: ToastNotification['tone'] = 'orange'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const recordAudit = (actionCode: string, targetType: string, targetId: string, summary: string) => {
    const actorId = currentUser?.id || 'anonymous';
    const actorRole = currentUser?.role || 'user';
    const entry: AuditLogEntry = {
      id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      actorId,
      actorRole,
      actionCode,
      targetType,
      targetId,
      summary,
      createdAt: new Date().toISOString(),
    };
    setAuditLogs((prev) => [entry, ...prev]);
  };

  const setTheme = (next: 'light' | 'dark') => {
    setThemeState(next);
    if (currentUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === currentUser.id ? { ...u, themePreference: next } : u))
      );
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const switchDemoUser = (userId: string | null) => {
    setCurrentUserId(userId);
    if (userId) {
      const target = users.find((u) => u.id === userId);
      if (target) {
        pushToast(
          `Session active : ${target.displayName}`,
          target.role === 'admin'
            ? 'Accès Administrateur activé. Les journaux privés des utilisateurs restent protégés.'
            : 'Isolation RLS active : seules vos données personnelles sont accessibles.',
          target.role === 'admin' ? 'bordeaux' : 'orange'
        );
      }
    } else {
      pushToast('Déconnexion', 'Vous naviguez maintenant en mode visiteur public.', 'neutral');
    }
  };

  const loginWithEmail = (email: string, password?: string, honeypot?: string) => {
    const clean = email.trim().toLowerCase();

    // 1. Limite stricte : 3 tentatives d'entrée d'identification par 15 secondes
    const burstCheck = checkAuthSubmissionRateLimit(
      'auth-submission',
      siteSettings.strictRateLimitMax || 3,
      (siteSettings.strictRateLimitWindowSec || 15) * 1000
    );
    if (!burstCheck.allowed) {
      recordAudit(
        'SECURITY_RATE_LIMIT_3_PER_15S',
        'auth',
        clean || 'unknown',
        burstCheck.error || 'Limite 3 tentatives / 15s atteinte.'
      );
      return { ok: false, error: burstCheck.error };
    }

    const loginCheck = verifyProtectedLogin({
      email: clean,
      registeredEmails: users.map((u) => u.email),
      honeypotValue: honeypot,
    });

    if (!loginCheck.allowed) {
      recordAudit(
        loginCheck.honeypotTriggered
          ? 'SECURITY_HONEYPOT_TRIGGERED'
          : loginCheck.lockedOut
          ? 'SECURITY_BRUTEFORCE_LOCKOUT'
          : 'SECURITY_UNKNOWN_EMAIL_LOGIN_REJECTED',
        'auth',
        clean || 'unknown',
        loginCheck.error || 'Tentative de connexion rejetée.'
      );
      return { ok: false, error: loginCheck.error };
    }

    if (!password || password.trim().length < 6) {
      return { ok: false, error: 'Mot de passe requis (minimum 6 caractères).' };
    }

    const savedPass = userPasswords[clean];
    if (savedPass && savedPass !== password.trim()) {
      recordAudit('AUTH_WRONG_PASSWORD', 'auth', clean, 'Mot de passe incorrect.');
      return {
        ok: false,
        error: 'Mot de passe incorrect. Utilisez « Mot de passe oublié ? » si nécessaire.',
      };
    }

    const existing = users.find((u) => u.email.toLowerCase() === clean);
    if (existing) {
      if (existing.isBanned) {
        const banReason = existing.banReason || 'Non-respect des règles de bienveillance Nia-Mind.';
        setActiveBanNotice({
          pseudo: existing.publicPseudonym || existing.displayName,
          reason: banReason,
          bannedAt: existing.bannedAt || new Date().toISOString(),
        });
        recordAudit('SECURITY_BANNED_USER_LOGIN_BLOCKED', 'auth', existing.id, `Tentative de connexion d'un compte banni (${banReason}).`);
        return {
          ok: false,
          error: `COMPTE SUSPENDU / BANNI PAR L’ADMINISTRATEUR — Motif : ${banReason}`,
        };
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === existing.id ? { ...u, isOnline: true } : u))
      );
      setCurrentUserId(existing.id);
      recordAudit('AUTH_LOGIN_SUCCESS', 'auth', existing.id, 'Connexion vérifiée d’un membre inscrit.');
      pushToast('Bienvenue sur Nia-Mind', `Ravi de te retrouver, @${existing.publicPseudonym || existing.displayName}.`, 'orange');
      return { ok: true };
    }
    return {
      ok: false,
      error: 'Connexion refusée : seuls les e-mails réels inscrits peuvent se connecter.',
    };
  };

  const registerAccount = (params: {
    displayName: string;
    email: string;
    password?: string;
    publicPseudonym: string;
    countryCode: UserProfile['countryCode'];
    acceptedTerms: boolean;
    cookiesAccepted?: boolean;
    optionalWellnessConsent: boolean;
    interests?: string[];
    honeypot?: string;
  }) => {
    if (params.honeypot && params.honeypot.trim().length > 0) {
      recordAudit('SECURITY_HONEYPOT_REGISTER_BLOCKED', 'auth', 'bot', 'Tentative d’inscription robot bloquée.');
      return { ok: false, error: 'SÉCURITÉ ANTI-BOT : Requête automatisée bloquée.' };
    }

    // Limite stricte : 3 tentatives d'entrée d'identification par 15 secondes
    const burstCheck = checkAuthSubmissionRateLimit(
      'auth-submission',
      siteSettings.strictRateLimitMax || 3,
      (siteSettings.strictRateLimitWindowSec || 15) * 1000
    );
    if (!burstCheck.allowed) {
      recordAudit(
        'SECURITY_RATE_LIMIT_3_PER_15S',
        'auth',
        params.email || 'unknown',
        burstCheck.error || 'Limite 3 tentatives / 15s atteinte.'
      );
      return { ok: false, error: burstCheck.error };
    }

    if (!params.acceptedTerms) {
      return {
        ok: false,
        error: 'Vous devez accepter la politique de confidentialité, les conditions d’utilisation et les cookies.',
      };
    }

    if (params.password !== undefined && params.password.trim().length < 6) {
      return {
        ok: false,
        error: 'Le mot de passe doit comporter au moins 6 caractères.',
      };
    }

    const payloadCheck = validateNoteAndWellnessInput({
      textFields: [params.displayName, params.email, params.publicPseudonym],
    });
    if (!payloadCheck.valid) {
      recordAudit('SECURITY_PENTEST_REGISTER_BLOCKED', 'auth', params.email, payloadCheck.error || 'Charge suspecte.');
      return { ok: false, error: payloadCheck.error };
    }

    const cleanEmail = params.email.trim().toLowerCase();
    const realEmailCheck = validateRealEmailAddress(cleanEmail);
    if (!realEmailCheck.valid) {
      recordAudit('SECURITY_FAKE_EMAIL_BLOCKED', 'auth', cleanEmail, realEmailCheck.error || 'Email non réel.');
      return { ok: false, error: realEmailCheck.error };
    }

    // Si c'est l'e-mail du Superadmin (isaacamegan10@gmail.com), connexion directe au profil Superadmin
    if (cleanEmail === SUPERADMIN_PROFILE.email) {
      if (params.password && params.password.trim().length >= 6) {
        setUserPasswords((prev) => ({ ...prev, [cleanEmail]: params.password!.trim() }));
      }
      setCurrentUserId(SUPERADMIN_PROFILE.id);
      recordAudit('SUPERADMIN_AUTH', 'user', SUPERADMIN_PROFILE.id, 'Connexion Superadmin vérifiée.');
      pushToast('Bienvenue Superadmin', 'Accès intégral activé sur Nia-Mind.', 'bordeaux');
      return { ok: true };
    }

    const spamCheck = checkActionAntiSpam({
      actionKey: 'register',
      actorId: 'public-ip',
      maxCount: 5,
      windowMs: 15 * 60 * 1000,
      contentForDuplicateCheck: params.email,
    });
    if (!spamCheck.allowed) {
      return { ok: false, error: spamCheck.error };
    }

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        ok: false,
        error: 'Un compte existe déjà avec cette adresse e-mail. Cliquez sur « Connexion » pour vous connecter.',
      };
    }
    const interestsSummary =
      Array.isArray(params.interests) && params.interests.length > 0
        ? `Centres d’intérêt : ${params.interests.map((i) => sanitizeUserText(i, 60)).join(', ')}`
        : '';

    const chosenPseudo =
      sanitizeUserText(params.publicPseudonym || params.displayName, 60) || 'PlumeSincere';
    const privateFullName = sanitizeUserText(params.displayName, 80) || chosenPseudo;

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      // Seul le pseudo choisi par l'utilisateur est affiché publiquement ou dans l'interface
      displayName: chosenPseudo,
      publicPseudonym: chosenPseudo,
      fullName: privateFullName,
      preferredLanguage: visitorLanguage,
      isOnline: true,
      isBanned: false,
      banReason: null,
      bannedAt: null,
      bio: interestsSummary,
      countryCode: params.countryCode,
      role: 'user',
      themePreference: theme,
      reducedMotion,
      notificationsEnabled: true,
      dailyTipModalEnabled: true,
      acceptedTermsVersion: 'Octobre 2026',
      acceptedTermsAt: new Date().toISOString(),
      optionalAnalyticsConsent: Boolean(params.cookiesAccepted ?? true),
      optionalWellnessInsightsConsent: params.optionalWellnessConsent,
      createdAt: new Date().toISOString(),
    };
    if (params.password && params.password.trim().length >= 6) {
      setUserPasswords((prev) => ({ ...prev, [cleanEmail]: params.password!.trim() }));
    }
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    recordAudit('USER_REGISTER', 'user', newUser.id, 'Création d’un nouveau compte membre sous pseudonyme.');
    pushToast('Compte créé', `Bienvenue dans ton espace sincère, @${newUser.publicPseudonym}.`, 'orange');
    return { ok: true };
  };

  const requestGmailPushVerification = async (email: string) => {
    const clean = email.trim().toLowerCase();
    const emailCheck = validateRealEmailAddress(clean);
    if (!emailCheck.valid) {
      return { ok: false, error: emailCheck.error };
    }
    if (!clean.endsWith('@gmail.com') && !clean.endsWith('@googlemail.com')) {
      return {
        ok: false,
        error: 'Pour la vérification Push Gmail, veuillez saisir une adresse réelle se terminant par @gmail.com.',
      };
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    try {
      if (supabase) {
        await supabase.functions.invoke('push-daily-motivation', {
          body: { mode: 'gmail_push_verification', email: clean },
        });
      }
    } catch {
      // Edge function fallback local
    }

    pushToast(
      'Notification Push Gmail envoyée',
      `Vérification Push transmise à ${clean} (Code Push : ${code}). Validez la notification et votre mot de passe (6+ caractères).`,
      'orange'
    );
    recordAudit('GMAIL_PUSH_VERIFICATION_SENT', 'auth', clean, 'Notification Push Gmail envoyée.');
    return { ok: true, verificationCode: code };
  };

  const requestPasswordRecoveryPush = (email: string) => {
    const clean = email.trim().toLowerCase();
    const emailCheck = validateRealEmailAddress(clean);
    if (!emailCheck.valid) {
      return { ok: false, error: emailCheck.error };
    }
    const exists = users.some((u) => u.email.toLowerCase() === clean);
    if (!exists) {
      return {
        ok: false,
        error: 'Aucun compte inscrit trouvé avec cette adresse e-mail réelle.',
      };
    }
    const recoveryCode = String(Math.floor(100000 + Math.random() * 900000));
    setRecoveryCodes((prev) => ({ ...prev, [clean]: recoveryCode }));
    pushToast(
      'Récupération de mot de passe • Push envoyé',
      `Un code Push de récupération (${recoveryCode}) a été envoyé à ${clean}.`,
      'bordeaux'
    );
    recordAudit('PASSWORD_RECOVERY_REQUESTED', 'auth', clean, 'Demande de récupération de mot de passe.');
    return { ok: true, recoveryCode };
  };

  const resetForgottenPassword = (params: {
    email: string;
    recoveryCode: string;
    newPassword: string;
  }) => {
    const clean = params.email.trim().toLowerCase();
    const expected = recoveryCodes[clean];
    if (!expected || expected !== params.recoveryCode.trim()) {
      return { ok: false, error: 'Code de vérification Push invalide ou expiré.' };
    }
    if (!params.newPassword || params.newPassword.trim().length < 6) {
      return { ok: false, error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' };
    }
    setUserPasswords((prev) => ({ ...prev, [clean]: params.newPassword.trim() }));
    setRecoveryCodes((prev) => {
      const next = { ...prev };
      delete next[clean];
      return next;
    });
    recordAudit('PASSWORD_RESET_SUCCESS', 'auth', clean, 'Mot de passe réinitialisé avec succès.');
    pushToast('Mot de passe mis à jour', 'Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.', 'orange');
    return { ok: true };
  };

  const triggerSignupMotivationPush = async () => {
    try {
      let notifTitle = 'Nouveau Conseil & Motivation Nia-Mind';
      let notifMessage =
        featuredDailyTip?.summary ||
        'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger.';

      if (supabase) {
        const { data } = await supabase.functions.invoke('push-daily-motivation', {
          body: { mode: 'daily_motivation', aiFallback: siteSettings.aiAutopilotTipsEnabled },
        });
        if (data?.pushNotification) {
          notifTitle = data.pushNotification.title || notifTitle;
          notifMessage = data.pushNotification.message || notifMessage;
        }
      }

      pushToast(notifTitle, notifMessage, 'orange');
    } catch {
      pushToast(
        'Nouveau Conseil & Motivation du jour',
        featuredDailyTip?.summary ||
          'Tu n’as pas besoin de porter toutes les attentes du monde en même temps.',
        'orange'
      );
    }
  };

  const logout = () => {
    switchDemoUser(null);
  };

  const updateCurrentUserProfile = (patch: Partial<UserProfile>) => {
    if (!currentUser) return { ok: false, error: 'Session expirée ou non connectée.' };
    // Sécurité : interdire toute modification du champ 'role' via la mise à jour de profil
    const { role: _ignoredRole, id: _ignoredId, ...safePatch } = patch;
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, ...safePatch } : u))
    );
    if (safePatch.themePreference) {
      setThemeState(safePatch.themePreference);
    }
    if (typeof safePatch.reducedMotion === 'boolean') {
      setReducedMotion(safePatch.reducedMotion);
    }
    recordAudit('PROFILE_UPDATED', 'profile', currentUser.id, 'Mise à jour des préférences de profil.');
    pushToast('Profil mis à jour', 'Vos préférences et consentements ont été enregistrés.', 'orange');
    return { ok: true };
  };

  const adminUpdateUserRole = (targetUserId: string, newRole: UserRole) => {
    if (!currentUser) return { ok: false, error: 'Non authentifié.' };
    const check = canModifyUserRole(currentUser.id, currentUser.role, targetUserId, newRole);
    if (!check.allowed) {
      recordAudit(
        'SECURITY_ROLE_ESCALATION_BLOCKED',
        'user_roles',
        targetUserId,
        `Tentative non autorisée de changement de rôle vers ${newRole}.`
      );
      return { ok: false, error: check.reason };
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, role: newRole } : u))
    );
    recordAudit(
      'ADMIN_ROLE_UPDATED',
      'user_roles',
      targetUserId,
      `Rôle de l'utilisateur ${targetUserId} modifié en '${newRole}'.`
    );
    pushToast('Rôle modifié', `Le rôle a été mis à jour vers « ${newRole} ».`, 'bordeaux');
    return { ok: true };
  };

  // Données filtrées par RLS pour l'utilisateur courant
  const activeUserId = currentUser?.id || '';
  const activeUserRole = currentUser?.role || 'user';

  const userConversations = useMemo(
    () => filterUserScopedData(conversations, activeUserId),
    [conversations, activeUserId]
  );

  const userMoodEntries = useMemo(
    () => filterUserScopedData(moodEntries, activeUserId),
    [moodEntries, activeUserId]
  );

  const userStressSleepEntries = useMemo(
    () => filterUserScopedData(stressSleepEntries, activeUserId),
    [stressSleepEntries, activeUserId]
  );

  const userQuestionnaireResponses = useMemo(
    () => filterUserScopedData(questionnaireResponses, activeUserId),
    [questionnaireResponses, activeUserId]
  );

  const userJournalEntries = useMemo(
    () => journalEntries.filter((entry) => canAccessJournalEntry(activeUserId, entry)),
    [journalEntries, activeUserId]
  );

  const userStories = useMemo(
    () => stories.filter((s) => s.authorId === activeUserId),
    [stories, activeUserId]
  );

  const allManageableStories = useMemo(
    () => filterUserStoriesForRole(stories, activeUserId, activeUserRole),
    [stories, activeUserId, activeUserRole]
  );

  const publicStories = useMemo(() => getPublicSafeStories(stories), [stories]);

  const userListeningRequests = useMemo(
    () => listeningRequests.filter((r) => r.userId === activeUserId),
    [listeningRequests, activeUserId]
  );

  const allListeningRequests = useMemo(
    () => filterListeningRequestsForRole(listeningRequests, activeUserId, activeUserRole),
    [listeningRequests, activeUserId, activeUserRole]
  );

  const userPrivacyRequests = useMemo(
    () => filterUserScopedData(privacyRequests, activeUserId),
    [privacyRequests, activeUserId]
  );

  const featuredDailyTip = useMemo(
    () => dailyTips.find((t) => t.isFeaturedToday) || dailyTips[0],
    [dailyTips]
  );

  // Actions Assistant Nia-Mind
  const createConversation = (initialTitle = 'Nouvelle réflexion') => {
    const uid = currentUser?.id || 'user-a';
    const upseudo = currentUser?.publicPseudonym || currentUser?.displayName || 'Anonyme';
    const convId = `conv-${Date.now()}`;
    const greetingMsg: AssistantMessage = {
      id: `msg-${Date.now()}-init`,
      conversationId: convId,
      userId: uid,
      sender: 'assistant',
      sourceLanguage: 'fr',
      content:
        'Bonjour. Tu peux prendre ton temps. Qu\'aimerais-tu exprimer ou comprendre aujourd\'hui ?',
      createdAt: new Date().toISOString(),
    };
    const newConv: AssistantConversation = {
      id: convId,
      userId: uid,
      userPseudonym: upseudo,
      title: initialTitle,
      handedOverToAdmin: false,
      diagnosticSentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [greetingMsg],
    };
    setConversations((prev) => [newConv, ...prev]);
    return newConv;
  };

  const appendAssistantMessage = (
    conversationId: string,
    sender: 'user' | 'assistant',
    content: string,
    distressFlagged = false
  ) => {
    const uid = currentUser?.id || 'user-a';
    const clean = sanitizeUserText(content);
    const msg: AssistantMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      conversationId,
      userId: uid,
      sender,
      sourceLanguage: currentLanguage,
      content: clean,
      distressFlagged,
      createdAt: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId || c.userId !== uid) return c;
        const shouldUpdateTitle =
          sender === 'user' && (c.title === 'Nouvelle réflexion' || c.messages.length <= 1);
        return {
          ...c,
          userPseudonym:
            c.userPseudonym || currentUser?.publicPseudonym || currentUser?.displayName || 'Anonyme',
          title: shouldUpdateTitle ? clean.slice(0, 48) + (clean.length > 48 ? '…' : '') : c.title,
          updatedAt: new Date().toISOString(),
          messages: [...c.messages, msg],
        };
      })
    );
  };

  const deleteConversation = (conversationId: string) => {
    const uid = currentUser?.id || '';
    setConversations((prev) => prev.filter((c) => !(c.id === conversationId && c.userId === uid)));
    pushToast('Conversation supprimée', 'L’historique sélectionné a été effacé définitivement.', 'neutral');
  };

  // Actions Bien-être
  const addMoodEntry = (
    entry: Omit<MoodEntry, 'id' | 'userId' | 'recordedAt'> & { recordedAt?: string }
  ) => {
    const uid = currentUser?.id || 'user-a';
    const check = validateNoteAndWellnessInput({
      textFields: [entry.moodLabel, entry.note, ...(entry.tags || [])],
      numericRanges: [{ name: 'Score humeur', value: entry.moodScore, min: 1, max: 5 }],
    });
    if (!check.valid) {
      recordAudit('SECURITY_PENTEST_MOOD_BLOCKED', 'mood_entry', uid, check.error || 'Charge suspecte.');
      pushToast('Action bloquée (Sécurité)', check.error || 'Entrée invalide.', 'bordeaux');
      return;
    }
    const spam = checkActionAntiSpam({
      actionKey: 'mood_entry',
      actorId: uid,
      maxCount: 6,
      windowMs: 60_000,
      contentForDuplicateCheck: `${entry.moodScore}:${entry.note}`,
    });
    if (!spam.allowed) {
      pushToast('Anti-Spam', spam.error || 'Veuillez patienter.', 'bordeaux');
      return;
    }
    const newEntry: MoodEntry = {
      id: `mood-${Date.now()}`,
      userId: uid,
      moodScore: entry.moodScore,
      moodLabel: sanitizeUserText(entry.moodLabel, 100),
      note: sanitizeUserText(entry.note, 2000),
      tags: entry.tags.map((t) => sanitizeUserText(t, 40)),
      recordedAt: entry.recordedAt || new Date().toISOString().slice(0, 10),
    };
    setMoodEntries((prev) => [newEntry, ...prev]);
    pushToast('Humeur enregistrée', 'Ton ressenti du jour a été ajouté à ton suivi privé.', 'orange');
  };

  const addStressSleepEntry = (entry: Omit<StressSleepEntry, 'id' | 'userId'>) => {
    const uid = currentUser?.id || 'user-a';
    const check = validateNoteAndWellnessInput({
      textFields: [entry.note],
      numericRanges: [
        { name: 'Stress', value: entry.stressLevel, min: 1, max: 10 },
        { name: 'Sommeil (heures)', value: entry.sleepHours, min: 0, max: 24 },
        { name: 'Qualité sommeil', value: entry.sleepQuality, min: 1, max: 5 },
      ],
    });
    if (!check.valid) {
      recordAudit('SECURITY_PENTEST_SLEEP_BLOCKED', 'stress_sleep', uid, check.error || 'Charge suspecte.');
      pushToast('Action bloquée (Sécurité)', check.error || 'Données invalides.', 'bordeaux');
      return;
    }
    const spam = checkActionAntiSpam({
      actionKey: 'stress_sleep',
      actorId: uid,
      maxCount: 6,
      windowMs: 60_000,
    });
    if (!spam.allowed) {
      pushToast('Anti-Spam', spam.error || 'Veuillez patienter.', 'bordeaux');
      return;
    }
    const newEntry: StressSleepEntry = {
      id: `ss-${Date.now()}`,
      userId: uid,
      stressLevel: entry.stressLevel,
      sleepHours: entry.sleepHours,
      sleepQuality: entry.sleepQuality,
      note: sanitizeUserText(entry.note, 2000),
      recordedDate: entry.recordedDate || new Date().toISOString().slice(0, 10),
    };
    setStressSleepEntries((prev) => [newEntry, ...prev]);
    pushToast('Suivi mis à jour', 'Tes données de stress et de sommeil ont été enregistrées.', 'orange');
  };

  const submitQuestionnaireResponse = (
    payload: Omit<QuestionnaireResponse, 'id' | 'userId' | 'createdAt'>
  ) => {
    const uid = currentUser?.id || 'user-a';
    const created: QuestionnaireResponse = {
      ...payload,
      questionnaireTitle: translatePlatformText(payload.questionnaireTitle, currentLanguage),
      interpretationBand: translatePlatformText(payload.interpretationBand, currentLanguage),
      id: `qr-${Date.now()}`,
      userId: uid,
      createdAt: new Date().toISOString(),
    };
    setQuestionnaireResponses((prev) => [created, ...prev]);
    pushToast(
      'Bilan complété',
      'Tes résultats sont enregistrés dans ton espace strictement privé.',
      'orange'
    );
    return created;
  };

  // Actions Journal Personnel
  const saveJournalEntry = (entry: {
    id?: string;
    title: string;
    content: string;
    category: string;
    promptUsed?: string;
    isDraft: boolean;
  }) => {
    const uid = currentUser?.id || 'user-a';
    const now = new Date().toISOString();
    const check = validateNoteAndWellnessInput({
      textFields: [entry.title, entry.content, entry.category],
    });
    if (!check.valid) {
      recordAudit('SECURITY_PENTEST_JOURNAL_BLOCKED', 'journal', uid, check.error || 'Charge suspecte.');
      pushToast('Sécurité Anti-Injection', check.error || 'Contenu non autorisé.', 'bordeaux');
      return {
        id: entry.id || 'blocked',
        userId: uid,
        title: sanitizeUserText(entry.title, 200),
        content: sanitizeUserText(entry.content, 12000),
        category: sanitizeUserText(entry.category, 80),
        isDraft: entry.isDraft,
        createdAt: now,
        updatedAt: now,
      };
    }
    const spam = checkActionAntiSpam({
      actionKey: 'journal_save',
      actorId: uid,
      maxCount: 10,
      windowMs: 60_000,
      contentForDuplicateCheck: entry.id ? undefined : entry.content,
    });
    if (!spam.allowed) {
      pushToast('Protection Anti-Spam', spam.error || 'Trop de notes rapprochées.', 'bordeaux');
      return {
        id: entry.id || 'spam-blocked',
        userId: uid,
        title: sanitizeUserText(entry.title, 200),
        content: sanitizeUserText(entry.content, 12000),
        category: sanitizeUserText(entry.category, 80),
        isDraft: entry.isDraft,
        createdAt: now,
        updatedAt: now,
      };
    }
    if (entry.id) {
      let updatedItem: JournalEntry | null = null;
      setJournalEntries((prev) =>
        prev.map((item) => {
          if (item.id === entry.id && item.userId === uid) {
            updatedItem = {
              ...item,
              title: sanitizeUserText(entry.title),
              content: sanitizeUserText(entry.content),
              category: sanitizeUserText(entry.category) || 'Réflexion libre',
              promptUsed: entry.promptUsed,
              isDraft: entry.isDraft,
              updatedAt: now,
            };
            return updatedItem;
          }
          return item;
        })
      );
      pushToast(
        entry.isDraft ? 'Brouillon mis à jour' : 'Entrée enregistrée',
        'Ton journal personnel reste strictement privé.',
        'orange'
      );
      return (
        updatedItem || {
          id: entry.id,
          userId: uid,
          title: entry.title,
          content: entry.content,
          category: entry.category,
          isDraft: entry.isDraft,
          createdAt: now,
          updatedAt: now,
        }
      );
    }

    const created: JournalEntry = {
      id: `j-${Date.now()}`,
      userId: uid,
      title: sanitizeUserText(entry.title),
      content: sanitizeUserText(entry.content),
      category: sanitizeUserText(entry.category) || 'Réflexion libre',
      promptUsed: entry.promptUsed,
      isDraft: entry.isDraft,
      createdAt: now,
      updatedAt: now,
    };
    setJournalEntries((prev) => [created, ...prev]);
    pushToast(
      entry.isDraft ? 'Brouillon sauvegardé' : 'Entrée ajoutée au journal',
      'Aucune entrée de ton journal n’est jamais partagée ni publiée.',
      'orange'
    );
    return created;
  };

  const deleteJournalEntry = (entryId: string) => {
    const uid = currentUser?.id || '';
    setJournalEntries((prev) => prev.filter((j) => !(j.id === entryId && j.userId === uid)));
    pushToast('Entrée supprimée', 'L’entrée a été définitivement retirée de votre journal privé.', 'neutral');
  };

  // Actions Histoires (Anonymat, Modération & Consentement explicite sur version)
  const saveOrSubmitStory = (params: {
    id?: string;
    category: string;
    title: string;
    publicPseudonym: string;
    originalContent: string;
    submitToModeration: boolean;
  }) => {
    const uid = currentUser?.id || 'user-a';
    const now = new Date().toISOString();
    const nextStatus: StoryStatus = params.submitToModeration ? 'Envoyée' : 'Brouillon';

    const check = validateNoteAndWellnessInput({
      textFields: [params.category, params.title, params.publicPseudonym, params.originalContent],
    });
    if (!check.valid) {
      recordAudit('SECURITY_PENTEST_STORY_BLOCKED', 'story', uid, check.error || 'Charge suspecte.');
      pushToast('Sécurité Anti-Injection', check.error || 'Contenu bloqué.', 'bordeaux');
      throw new Error(check.error);
    }

    const spam = checkActionAntiSpam({
      actionKey: 'story_submit',
      actorId: uid,
      maxCount: 5,
      windowMs: 10 * 60 * 1000,
      contentForDuplicateCheck: params.id ? undefined : params.originalContent,
    });
    if (!spam.allowed) {
      pushToast('Protection Anti-Spam', spam.error || 'Action temporairement limitée.', 'bordeaux');
      throw new Error(spam.error);
    }

    if (params.id) {
      let updatedStory: StoryRecord | null = null;
      setStories((prev) =>
        prev.map((s) => {
          if (s.id !== params.id || s.authorId !== uid) return s;
          const nextVer = s.currentVersion + (params.submitToModeration ? 1 : 0);
          updatedStory = {
            ...s,
            category: sanitizeUserText(params.category),
            title: sanitizeUserText(params.title),
            publicPseudonym: sanitizeUserText(params.publicPseudonym) || 'Anonyme',
            originalContent: sanitizeUserText(params.originalContent),
            proposedPublicContent: sanitizeUserText(params.originalContent),
            currentVersion: nextVer,
            // Toute modification du texte réinitialise l'autorisation pour exiger un consentement sur la nouvelle version
            authorApprovedVersion: null,
            authorExplicitConsent: false,
            authorConsentAt: null,
            status: nextStatus,
            updatedAt: now,
            decisionHistory: [
              ...s.decisionHistory,
              {
                id: `dh-${Date.now()}`,
                timestamp: now,
                actor: 'auteur',
                status: nextStatus,
                version: nextVer,
                note: params.submitToModeration
                  ? `Histoire soumise à la modération (v${nextVer}).`
                  : 'Enregistrée en brouillon privé.',
              },
            ],
          };
          return updatedStory;
        })
      );
      if (params.submitToModeration) {
        recordAudit('STORY_SUBMITTED', 'story', params.id, 'Histoire soumise à la modération.');
      }
      pushToast(
        params.submitToModeration ? 'Histoire envoyée à la modération' : 'Brouillon enregistré',
        params.submitToModeration
          ? 'Elle restera strictement privée tant que vous n’aurez pas donné votre autorisation explicite sur la version finale.'
          : 'Votre brouillon est sauvegardé dans votre espace privé.',
        'orange'
      );
      return updatedStory!;
    }

    const created: StoryRecord = {
      id: `story-${Date.now()}`,
      authorId: uid,
      category: sanitizeUserText(params.category) || 'Témoignage sincère',
      title: sanitizeUserText(params.title),
      publicPseudonym: sanitizeUserText(params.publicPseudonym) || 'Anonyme',
      originalContent: sanitizeUserText(params.originalContent),
      proposedPublicContent: sanitizeUserText(params.originalContent),
      currentVersion: 1,
      authorApprovedVersion: null,
      authorExplicitConsent: false,
      authorConsentAt: null,
      status: nextStatus,
      moderationNote: '',
      decisionHistory: [
        {
          id: `dh-${Date.now()}`,
          timestamp: now,
          actor: 'auteur',
          status: nextStatus,
          version: 1,
          note: params.submitToModeration
            ? 'Soumission initiale à l’administration.'
            : 'Création du brouillon privé.',
        },
      ],
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };

    setStories((prev) => [created, ...prev]);
    if (params.submitToModeration) {
      recordAudit('STORY_SUBMITTED', 'story', created.id, 'Nouvelle histoire soumise à la modération.');
    }
    pushToast(
      params.submitToModeration ? 'Histoire envoyée' : 'Brouillon créé',
      params.submitToModeration
        ? 'Vous pourrez suivre chaque étape et valider la version proposée avant toute publication.'
        : 'Votre brouillon privé est enregistré.',
      'orange'
    );
    return created;
  };

  const authorRespondToPublicationRequest = (
    storyId: string,
    approve: boolean,
    authorNote = ''
  ) => {
    const uid = currentUser?.id || '';
    const target = stories.find((s) => s.id === storyId);
    if (!target || target.authorId !== uid) {
      return { ok: false, error: 'Accès refusé : seul l’auteur de l’histoire peut donner cette autorisation.' };
    }
    const now = new Date().toISOString();
    const nextStatus: StoryStatus = approve ? 'Autorisée' : 'Modification demandée';

    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        return {
          ...s,
          authorExplicitConsent: approve,
          authorApprovedVersion: approve ? s.currentVersion : null,
          authorConsentAt: approve ? now : null,
          status: nextStatus,
          updatedAt: now,
          decisionHistory: [
            ...s.decisionHistory,
            {
              id: `dh-${Date.now()}`,
              timestamp: now,
              actor: 'auteur',
              status: nextStatus,
              version: s.currentVersion,
              note: approve
                ? `Autorisation explicite accordée par l'auteur pour la publication de la version v${s.currentVersion}.`
                : `Refus de la version v${s.currentVersion} par l'auteur. ${sanitizeUserText(authorNote)}`,
            },
          ],
        };
      })
    );

    recordAudit(
      approve ? 'STORY_AUTHOR_CONSENT_GRANTED' : 'STORY_AUTHOR_CONSENT_REFUSED',
      'story',
      storyId,
      approve
        ? `Autorisation explicite donnée par l'auteur sur la version v${target.currentVersion}.`
        : `Refus par l'auteur de la version v${target.currentVersion}.`
    );

    pushToast(
      approve ? 'Autorisation explicite enregistrée' : 'Refus transmis à la modération',
      approve
        ? `Vous avez autorisé la publication de la version v${target.currentVersion}. L’équipe peut désormais la publier.`
        : 'Cette version ne sera pas publiée. Vos remarques ont été transmises.',
      approve ? 'orange' : 'bordeaux'
    );
    return { ok: true };
  };

  const authorWithdrawStory = (storyId: string) => {
    const uid = currentUser?.id || '';
    const target = stories.find((s) => s.id === storyId);
    if (!target || (target.authorId !== uid && currentUser?.role !== 'admin')) {
      return { ok: false, error: 'Action non autorisée.' };
    }
    const now = new Date().toISOString();
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        return {
          ...s,
          status: 'Retirée',
          authorExplicitConsent: false,
          authorApprovedVersion: null,
          publishedAt: null,
          updatedAt: now,
          decisionHistory: [
            ...s.decisionHistory,
            {
              id: `dh-${Date.now()}`,
              timestamp: now,
              actor: target.authorId === uid ? 'auteur' : 'modération',
              status: 'Retirée',
              version: s.currentVersion,
              note: 'Histoire retirée de la bibliothèque publique et révoquée.',
            },
          ],
        };
      })
    );
    recordAudit('STORY_WITHDRAWN', 'story', storyId, 'Retrait / dépublication immédiate de l’histoire.');
    pushToast(
      'Histoire retirée',
      'L’histoire ne figure plus dans la bibliothèque publique.',
      'neutral'
    );
    return { ok: true };
  };

  const adminModerateStory = (params: {
    storyId: string;
    nextStatus: StoryStatus;
    proposedPublicContent?: string;
    moderationNote: string;
  }) => {
    if (!currentUser || currentUser.role !== 'admin') {
      return { ok: false, error: 'Accès refusé : rôle administrateur requis côté serveur.' };
    }
    const target = stories.find((s) => s.id === params.storyId);
    if (!target) {
      return { ok: false, error: 'Histoire introuvable.' };
    }
    if (target.status === 'Brouillon') {
      return { ok: false, error: 'Un brouillon privé ne peut pas être modéré avant son envoi par l’auteur.' };
    }

    const updatedProposed =
      params.proposedPublicContent !== undefined
        ? sanitizeUserText(params.proposedPublicContent)
        : target.proposedPublicContent;

    const contentChanged = updatedProposed.trim() !== target.proposedPublicContent.trim();
    const nextVersion = contentChanged ? target.currentVersion + 1 : target.currentVersion;

    // Si le contenu proposé a changé, toute autorisation précédente devient caduque
    const effectiveConsent = contentChanged ? false : target.authorExplicitConsent;
    const effectiveApprovedVer = contentChanged ? null : target.authorApprovedVersion;

    if (params.nextStatus === 'Publiée') {
      const check = validateStoryPublicationEligibility({
        status: 'Publiée',
        authorExplicitConsent: effectiveConsent,
        authorApprovedVersion: effectiveApprovedVer,
        currentVersion: nextVersion,
        proposedPublicContent: updatedProposed,
      });
      if (!check.eligible) {
        recordAudit(
          'SECURITY_STORY_PUBLISH_BLOCKED',
          'story',
          target.id,
          `Blocage de publication sans consentement auteur sur v${nextVersion}.`
        );
        return { ok: false, error: check.error };
      }
    }

    const now = new Date().toISOString();
    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== params.storyId) return s;
        return {
          ...s,
          proposedPublicContent: updatedProposed,
          currentVersion: nextVersion,
          authorExplicitConsent: effectiveConsent,
          authorApprovedVersion: effectiveApprovedVer,
          status: params.nextStatus,
          moderationNote: sanitizeUserText(params.moderationNote),
          publishedAt: params.nextStatus === 'Publiée' ? now : s.publishedAt,
          updatedAt: now,
          decisionHistory: [
            ...s.decisionHistory,
            {
              id: `dh-${Date.now()}`,
              timestamp: now,
              actor: 'modération',
              status: params.nextStatus,
              version: nextVersion,
              note:
                sanitizeUserText(params.moderationNote) ||
                `Statut mis à jour vers « ${params.nextStatus} » (v${nextVersion}).`,
            },
          ],
        };
      })
    );

    recordAudit(
      `ADMIN_STORY_${params.nextStatus.toUpperCase()}`,
      'story',
      target.id,
      `Décision de modération : ${params.nextStatus} (v${nextVersion}).`
    );

    pushToast(
      `Histoire : ${params.nextStatus}`,
      params.nextStatus === 'Autorisation demandée'
        ? `La version v${nextVersion} a été soumise à l’auteur pour autorisation explicite.`
        : `Le statut de l’histoire a été mis à jour vers « ${params.nextStatus} ».`,
      'bordeaux'
    );
    return { ok: true };
  };

  // Actions Écoute Humaine
  const createListeningRequest = (params: {
    topic: string;
    preferredMode: ListeningRequest['preferredMode'];
    preferredSlot: string;
    message: string;
  }) => {
    const uid = currentUser?.id || 'user-a';
    const uname = currentUser?.displayName || 'Membre Nia-Mind';
    const now = new Date().toISOString();
    const check = validateNoteAndWellnessInput({
      textFields: [params.topic, params.preferredSlot, params.message],
    });
    if (!check.valid) {
      recordAudit('SECURITY_PENTEST_LISTENING_BLOCKED', 'listening_request', uid, check.error || 'Charge suspecte.');
      pushToast('Sécurité Anti-Injection', check.error || 'Contenu non autorisé.', 'bordeaux');
      return {
        id: 'blocked',
        userId: uid,
        userDisplayName: uname,
        topic: sanitizeUserText(params.topic, 120),
        preferredMode: params.preferredMode,
        preferredSlot: sanitizeUserText(params.preferredSlot, 120),
        message: sanitizeUserText(params.message, 4000),
        status: 'Envoyée' as const,
        listenerReply: null,
        assignedListener: null,
        createdAt: now,
        updatedAt: now,
      };
    }
    const spam = checkActionAntiSpam({
      actionKey: 'listening_request',
      actorId: uid,
      maxCount: 3,
      windowMs: 15 * 60 * 1000,
      contentForDuplicateCheck: params.message,
    });
    if (!spam.allowed) {
      pushToast('Protection Anti-Spam', spam.error || 'Trop de demandes rapprochées.', 'bordeaux');
      return {
        id: 'spam-blocked',
        userId: uid,
        userDisplayName: uname,
        topic: sanitizeUserText(params.topic, 120),
        preferredMode: params.preferredMode,
        preferredSlot: sanitizeUserText(params.preferredSlot, 120),
        message: sanitizeUserText(params.message, 4000),
        status: 'Envoyée' as const,
        listenerReply: null,
        assignedListener: null,
        createdAt: now,
        updatedAt: now,
      };
    }
    const created: ListeningRequest = {
      id: `lr-${Date.now()}`,
      userId: uid,
      userDisplayName: uname,
      topic: sanitizeUserText(params.topic),
      preferredMode: params.preferredMode,
      preferredSlot: sanitizeUserText(params.preferredSlot),
      message: sanitizeUserText(params.message),
      status: 'Envoyée',
      listenerReply: null,
      assignedListener: null,
      createdAt: now,
      updatedAt: now,
    };
    setListeningRequests((prev) => [created, ...prev]);
    recordAudit('LISTENING_REQUEST_CREATED', 'listening_request', created.id, 'Nouvelle demande d’écoute créée.');
    pushToast(
      'Demande d’écoute envoyée',
      'Votre demande est accessible uniquement à vous et aux écoutants habilités.',
      'orange'
    );
    return created;
  };

  const adminUpdateListeningRequest = (params: {
    requestId: string;
    status: ListeningStatus;
    listenerReply?: string;
    assignedListener?: string;
  }) => {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'listener')) {
      return { ok: false, error: 'Accès refusé : réservé aux écoutants et administrateurs autorisés.' };
    }
    const now = new Date().toISOString();
    setListeningRequests((prev) =>
      prev.map((r) => {
        if (r.id !== params.requestId) return r;
        return {
          ...r,
          status: params.status,
          listenerReply:
            params.listenerReply !== undefined
              ? sanitizeUserText(params.listenerReply)
              : r.listenerReply,
          assignedListener:
            params.assignedListener !== undefined
              ? sanitizeUserText(params.assignedListener)
              : r.assignedListener || currentUser.displayName,
          updatedAt: now,
        };
      })
    );
    recordAudit(
      'LISTENING_REQUEST_UPDATED',
      'listening_request',
      params.requestId,
      `Statut demande d'écoute mis à jour vers ${params.status} (sans journalisation du message privé).`
    );
    pushToast('Demande d’écoute mise à jour', `Statut passé à « ${params.status} ».`, 'bordeaux');
    return { ok: true };
  };

  // Actions Contenus Admin
  const adminSaveDailyTip = (tip: Omit<DailyTip, 'id' | 'publishedAt'> & { id?: string }) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const now = new Date().toISOString().slice(0, 10);
    if (tip.id) {
      setDailyTips((prev) =>
        prev.map((t) =>
          t.id === tip.id
            ? { ...t, ...tip, isFeaturedToday: Boolean(tip.isFeaturedToday) }
            : tip.isFeaturedToday
            ? { ...t, isFeaturedToday: false }
            : t
        )
      );
      recordAudit('DAILY_TIP_UPDATED', 'daily_tip', tip.id, 'Modification d’un conseil éditorial.');
      pushToast('Conseil modifié', 'Le conseil a été mis à jour.', 'orange');
      return;
    }
    const created: DailyTip = {
      ...tip,
      id: `tip-${Date.now()}`,
      publishedAt: now,
    };
    setDailyTips((prev) => [
      created,
      ...prev.map((t) => (created.isFeaturedToday ? { ...t, isFeaturedToday: false } : t)),
    ]);
    recordAudit('DAILY_TIP_CREATED', 'daily_tip', created.id, 'Ajout d’un nouveau conseil du jour.');
    pushToast('Conseil publié', 'Le nouveau conseil est disponible.', 'orange');
  };

  const adminDeleteDailyTip = (tipId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setDailyTips((prev) => prev.filter((t) => t.id !== tipId));
    recordAudit('DAILY_TIP_DELETED', 'daily_tip', tipId, 'Suppression d’un conseil.');
    pushToast('Conseil supprimé', 'L’élément a été retiré.', 'neutral');
  };

  const adminSaveHelpResource = (res: Omit<VerifiedHelpResource, 'id'> & { id?: string }) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    if (res.id) {
      setHelpResources((prev) => prev.map((r) => (r.id === res.id ? { ...r, ...res, id: res.id } : r)));
      recordAudit('HELP_RESOURCE_UPDATED', 'help_resource', res.id, 'Mise à jour ressource d’aide vérifiée.');
      pushToast('Ressource mise à jour', 'La ressource d’aide a été modifiée.', 'orange');
      return;
    }
    const created: VerifiedHelpResource = {
      ...res,
      id: `res-${Date.now()}`,
    };
    setHelpResources((prev) => [created, ...prev]);
    recordAudit('HELP_RESOURCE_CREATED', 'help_resource', created.id, 'Ajout ressource d’aide vérifiée.');
    pushToast('Ressource ajoutée', 'Nouvelle ressource d’aide vérifiée enregistrée.', 'orange');
  };

  const adminDeleteHelpResource = (resId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setHelpResources((prev) => prev.filter((r) => r.id !== resId));
    recordAudit('HELP_RESOURCE_DELETED', 'help_resource', resId, 'Suppression ressource d’aide.');
    pushToast('Ressource supprimée', 'La ressource a été retirée.', 'neutral');
  };

  // Actions Confidentialité & Sessions
  const createPrivacyRequest = (
    requestType: PrivacyRequestRecord['requestType'],
    reason: string
  ) => {
    const uid = currentUser?.id || 'user-a';
    const created: PrivacyRequestRecord = {
      id: `pr-${Date.now()}`,
      userId: uid,
      requestType,
      status: requestType === 'data_export' ? 'Terminée' : 'Enregistrée',
      reason: sanitizeUserText(reason),
      createdAt: new Date().toISOString(),
    };
    setPrivacyRequests((prev) => [created, ...prev]);
    recordAudit('PRIVACY_REQUEST_CREATED', 'privacy_request', created.id, `Demande RGPD : ${requestType}`);
    pushToast(
      'Demande enregistrée',
      requestType === 'account_deletion'
        ? 'Votre demande de suppression de compte est prise en compte.'
        : 'Votre demande relative à vos données personnelles a été enregistrée.',
      'bordeaux'
    );
    return created;
  };

  const revokeSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId || s.isCurrent));
    recordAudit('SESSION_REVOKED', 'session', sessionId, 'Révocation d’une session secondaire.');
    pushToast('Session révoquée', 'L’appareil sélectionné a été déconnecté.', 'neutral');
  };

  const openDailyTipModal = () => setIsDailyTipModalOpen(true);

  const closeDailyTipModal = (rememberDismissal = true) => {
    setIsDailyTipModalOpen(false);
    if (rememberDismissal) {
      try {
        localStorage.setItem(DAILY_TIP_DISMISSED_KEY, new Date().toISOString().slice(0, 10));
      } catch {
        // ignore
      }
    }
  };

  const openConsentModal = () => setIsConsentModalOpen(true);
  const closeConsentModal = () => setIsConsentModalOpen(false);

  const isSuperAdminActor =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_PROFILE.email;

  const updateSiteSettings = (patch: Partial<SiteSettings>) => {
    if (!isSuperAdminActor) {
      return {
        ok: false,
        error: 'Accès refusé : seul le SuperAdmin unique (isaacamegan10@gmail.com) peut modifier la configuration globale du site.',
      };
    }
    const next: SiteSettings = {
      ...siteSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    setSiteSettings(next);
    recordAudit(
      'SUPERADMIN_SITE_SETTINGS_UPDATED',
      'site_settings',
      'global',
      `Mise à jour des couleurs (${next.primaryColor} / ${next.secondaryColor}) et paramètres par le SuperAdmin.`
    );
    pushToast(
      'Paramètres & Couleurs appliqués',
      `Thème « ${next.themePreset} » (${next.primaryColor} / ${next.secondaryColor}) activé sur tout le site.`,
      'bordeaux'
    );
    return { ok: true };
  };

  const publishSiteNotification = (params: {
    title: string;
    message: string;
    category: SiteNotification['category'];
    actionUrl?: string;
    generatedByAi?: boolean;
  }) => {
    if (!isSuperAdminActor && !params.generatedByAi) {
      return {
        ok: false,
        error: 'Seul le SuperAdmin ou le relais IA autorisé peut publier une notification sur le site.',
      };
    }
    const check = validateNoteAndWellnessInput({
      textFields: [params.title, params.message],
    });
    if (!check.valid) {
      return { ok: false, error: check.error };
    }
    const created: SiteNotification = {
      id: `notif-${Date.now()}`,
      title: sanitizeUserText(params.title, 160),
      message: sanitizeUserText(params.message, 600),
      category: params.category,
      actionUrl: params.actionUrl || '/conseils',
      generatedByAi: Boolean(params.generatedByAi),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setSiteNotifications((prev) => [created, ...prev]);
    recordAudit(
      params.generatedByAi ? 'AI_PUSH_NOTIFICATION_PUBLISHED' : 'SUPERADMIN_PUSH_NOTIFICATION_PUBLISHED',
      'site_notification',
      created.id,
      `Publication de notification Push : ${created.title}`
    );
    pushToast(created.title, created.message, 'orange');
    return { ok: true };
  };

  const toggleSiteNotification = (id: string) => {
    if (!isSuperAdminActor) return;
    setSiteNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isActive: !n.isActive } : n))
    );
  };

  const deleteSiteNotification = (id: string) => {
    if (!isSuperAdminActor) return;
    setSiteNotifications((prev) => prev.filter((n) => n.id !== id));
    recordAudit('SUPERADMIN_NOTIFICATION_DELETED', 'site_notification', id, 'Notification supprimée.');
    pushToast('Notification supprimée', 'La notification a été retirée du site.', 'neutral');
  };

  const generateAiDailyTipAndPush = () => {
    if (!isSuperAdminActor && !siteSettings.aiAutopilotTipsEnabled) {
      return {
        ok: false,
        error: 'Le relais IA de publication est désactivé ou réservé au SuperAdmin.',
      };
    }
    const aiCatalog: Array<Omit<DailyTip, 'id' | 'publishedAt'>> = [
      {
        title: 'Relâcher la pression de tout contrôler (Relais IA Nia-Mind)',
        category: 'Bien-être',
        summary:
          'Quand le mental s’emballe, revenir à une seule action sincère à la fois apaise immédiatement la charge intérieure.',
        content:
          'Nous portons souvent la fatigue de dix batailles anticipées qui n’ont même pas encore eu lieu.\n\nAccorde-toi la permission de ne traiter qu’une seule étape aujourd’hui. Ce que tu ne peux pas porter ce soir a le droit d’attendre demain matin.',
        reflectionQuestion:
          'Quelle est la seule chose qui mérite vraiment ton énergie dans l’heure qui vient ?',
        readingTimeMin: 2,
        isFeaturedToday: true,
      },
      {
        title: 'Dire non sans culpabiliser (Motivation du jour • IA)',
        category: 'Authenticité',
        summary:
          'Poser une limite claire n’est pas un rejet des autres, c’est une marque de respect envers ton propre équilibre.',
        content:
          'Dire « oui » quand tout ton corps pense « non » crée une dette silencieuse envers toi-même.\n\nUne réponse courte, calme et honnête suffit : tu n’as pas besoin d’inventer d’excuse compliquée pour protéger ton temps de récupération.',
        reflectionQuestion:
          'Dans quelle situation récente aurais-tu aimé poser une limite plus sincère ?',
        readingTimeMin: 3,
        isFeaturedToday: true,
      },
      {
        title: 'Transformer l’autocritique en écoute intérieure (Relais IA)',
        category: 'Écoute',
        summary:
          'Parle-toi aujourd’hui avec la même patience que celle que tu offrirais à un ami proche qui traverse une période exigeante.',
        content:
          'Nous sommes souvent notre juge le plus sévère. Pourtant, la dureté envers soi-même bloque l’élan au lieu de le stimuler.\n\nRemplace le « j’aurais dû » par « voilà ce dont j’ai besoin maintenant pour avancer sereinement ».',
        reflectionQuestion:
          'Que dirais-tu à un ami cher qui vivrait exactement ta journée d’aujourd’hui ?',
        readingTimeMin: 2,
        isFeaturedToday: true,
      },
    ];
    const picked = aiCatalog[Math.floor(Math.random() * aiCatalog.length)];
    const nowDate = new Date().toISOString().slice(0, 10);
    const createdTip: DailyTip = {
      ...picked,
      id: `tip-ai-${Date.now()}`,
      publishedAt: nowDate,
    };
    setDailyTips((prev) => [
      createdTip,
      ...prev.map((t) => ({ ...t, isFeaturedToday: false })),
    ]);
    publishSiteNotification({
      title: `Conseil & Motivation IA : ${createdTip.title}`,
      message: createdTip.summary,
      category: 'Conseil & Motivation',
      actionUrl: '/conseils',
      generatedByAi: true,
    });
    recordAudit(
      'AI_DAILY_TIP_GENERATED',
      'daily_tip',
      createdTip.id,
      'Conseil & Motivation du jour généré et publié par le relais IA.'
    );
    return { ok: true, tip: createdTip };
  };

  const forcePublishStoryBySuperAdmin = (storyId: string, proposedPublicContent?: string) => {
    if (!isSuperAdminActor) {
      return {
        ok: false,
        error: 'Seul le SuperAdmin unique (isaacamegan10@gmail.com) dispose de cette autorisation.',
      };
    }
    const target = stories.find((s) => s.id === storyId);
    if (!target) {
      return { ok: false, error: 'Témoignage introuvable.' };
    }
    const now = new Date().toISOString();
    const cleanText = proposedPublicContent
      ? sanitizeUserText(proposedPublicContent)
      : target.proposedPublicContent || target.originalContent;

    setStories((prev) =>
      prev.map((s) => {
        if (s.id !== storyId) return s;
        return {
          ...s,
          proposedPublicContent: cleanText,
          authorExplicitConsent: true,
          authorApprovedVersion: s.currentVersion,
          authorConsentAt: s.authorConsentAt || now,
          status: 'Publiée',
          publishedAt: now,
          updatedAt: now,
          decisionHistory: [
            ...s.decisionHistory,
            {
              id: `dh-${Date.now()}`,
              timestamp: now,
              actor: 'modération',
              status: 'Publiée',
              version: s.currentVersion,
              note: 'Publication directe validée par le SuperAdmin (isaacamegan10@gmail.com).',
            },
          ],
        };
      })
    );
    recordAudit(
      'SUPERADMIN_STORY_PUBLISHED',
      'story',
      storyId,
      'Témoignage rendu public par le SuperAdmin.'
    );
    pushToast('Témoignage publié', 'Le témoignage est maintenant visible dans la bibliothèque publique.', 'orange');
    return { ok: true };
  };

  const adminBanUser = (targetUserId: string, reason: string) => {
    if (!isSuperAdminActor) {
      return { ok: false, error: 'Seul le SuperAdmin peut bannir ou bloquer un utilisateur.' };
    }
    const target = users.find((u) => u.id === targetUserId);
    if (!target || target.email.toLowerCase() === SUPERADMIN_PROFILE.email) {
      return { ok: false, error: 'Action impossible sur ce compte.' };
    }
    const cleanReason =
      sanitizeUserText(reason, 240) || 'Enfreinte aux règles de bienveillance Nia-Mind.';
    const now = new Date().toISOString();
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, isBanned: true, isOnline: false, banReason: cleanReason, bannedAt: now }
          : u
      )
    );
    setActiveBanNotice({
      pseudo: target.publicPseudonym || target.displayName,
      reason: cleanReason,
      bannedAt: now,
    });
    if (currentUserId === targetUserId) {
      setCurrentUserId(null);
    }
    recordAudit(
      'SECURITY_USER_BANNED',
      'user',
      targetUserId,
      `Utilisateur @${target.publicPseudonym} banni. Motif : ${cleanReason}`
    );
    pushToast(
      `Utilisateur @${target.publicPseudonym} banni`,
      `Motif transmis : ${cleanReason}`,
      'bordeaux'
    );
    return { ok: true };
  };

  const adminUnbanUser = (targetUserId: string) => {
    if (!isSuperAdminActor) {
      return { ok: false, error: 'Seul le SuperAdmin peut lever un bannissement.' };
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetUserId
          ? { ...u, isBanned: false, banReason: null, bannedAt: null }
          : u
      )
    );
    recordAudit('ADMIN_USER_UNBANNED', 'user', targetUserId, 'Levée du bannissement.');
    pushToast('Compte débloqué', 'L’utilisateur peut à nouveau se connecter.', 'orange');
    return { ok: true };
  };

  const adminForceLogoutUser = (targetUserId: string) => {
    if (!isSuperAdminActor) {
      return { ok: false, error: 'Seul le SuperAdmin peut déconnecter un utilisateur.' };
    }
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return { ok: false, error: 'Utilisateur introuvable.' };
    setUsers((prev) =>
      prev.map((u) => (u.id === targetUserId ? { ...u, isOnline: false } : u))
    );
    if (currentUserId === targetUserId) {
      setCurrentUserId(null);
    }
    recordAudit(
      'SECURITY_USER_FORCE_LOGOUT',
      'user',
      targetUserId,
      `Déconnexion forcée de @${target.publicPseudonym} par le SuperAdmin.`
    );
    pushToast(
      'Utilisateur déconnecté',
      `La session de @${target.publicPseudonym} a été fermée.`,
      'neutral'
    );
    return { ok: true };
  };

  const adminDeleteUser = (targetUserId: string) => {
    if (!isSuperAdminActor) {
      return { ok: false, error: 'Seul le SuperAdmin peut supprimer un compte.' };
    }
    const target = users.find((u) => u.id === targetUserId);
    if (!target || target.email.toLowerCase() === SUPERADMIN_PROFILE.email) {
      return { ok: false, error: 'Le compte SuperAdmin ne peut pas être supprimé.' };
    }
    setUsers((prev) => prev.filter((u) => u.id !== targetUserId));
    setConversations((prev) => prev.filter((c) => c.userId !== targetUserId));
    setJournalEntries((prev) => prev.filter((j) => j.userId !== targetUserId));
    setMoodEntries((prev) => prev.filter((m) => m.userId !== targetUserId));
    setStressSleepEntries((prev) => prev.filter((s) => s.userId !== targetUserId));
    setQuestionnaireResponses((prev) => prev.filter((q) => q.userId !== targetUserId));
    setListeningRequests((prev) => prev.filter((l) => l.userId !== targetUserId));
    if (currentUserId === targetUserId) {
      setCurrentUserId(null);
    }
    recordAudit(
      'SECURITY_USER_DELETED',
      'user',
      targetUserId,
      `Suppression définitive du compte @${target.publicPseudonym}.`
    );
    pushToast(
      'Compte supprimé',
      `Le compte @${target.publicPseudonym} et ses sessions ont été retirés.`,
      'bordeaux'
    );
    return { ok: true };
  };

  const dismissBanNotice = () => setActiveBanNotice(null);

  const toggleConversationHumanHandover = (conversationId: string, handOver: boolean) => {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const handoverMsg: AssistantMessage = {
          id: `msg-handover-${Date.now()}`,
          conversationId,
          userId: c.userId,
          sender: 'assistant',
          sourceLanguage: 'fr',
          content: handOver
            ? 'Relais Humain activé : L’IA Nia-Mind a transmis la main de cette discussion à l’Administrateur. Vos échanges ici sont privés et lisibles uniquement par vous et l’administrateur.'
            : 'Puce d’Intelligence Nia-Mind réactivée : l’assistant reprend le fil réflexif avec toi.',
          createdAt: now,
        };
        return {
          ...c,
          handedOverToAdmin: handOver,
          updatedAt: now,
          messages: [...c.messages, handoverMsg],
        };
      })
    );
    recordAudit(
      handOver ? 'LISTENING_HANDOVER_TO_ADMIN' : 'LISTENING_RETURNED_TO_AI',
      'assistant_conversation',
      conversationId,
      handOver
        ? 'Bascule de la discussion Assistant vers le SuperAdmin humain.'
        : 'Retour de la discussion vers la puce IA Nia-Mind.'
    );
    pushToast(
      handOver ? 'Relais Humain (Admin) activé' : 'Retour sur l’IA Nia-Mind',
      handOver
        ? 'L’IA a donné la main de la discussion à l’administrateur.'
        : 'La puce d’intelligence Nia-Mind répond à nouveau.',
      handOver ? 'bordeaux' : 'orange'
    );
  };

  const adminReplyInAssistantConversation = (conversationId: string, content: string) => {
    if (!isSuperAdminActor) {
      return {
        ok: false,
        error: 'Seul le SuperAdmin peut répondre dans le canal humain d’assistance.',
      };
    }
    const clean = sanitizeUserText(content, 2000);
    if (!clean) return { ok: false, error: 'Message vide.' };
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const adminMsg: AssistantMessage = {
          id: `msg-admin-${Date.now()}`,
          conversationId,
          userId: c.userId,
          sender: 'admin',
          sourceLanguage: currentLanguage,
          content: clean,
          createdAt: now,
        };
        return {
          ...c,
          handedOverToAdmin: true,
          updatedAt: now,
          messages: [...c.messages, adminMsg],
        };
      })
    );
    recordAudit(
      'LISTENING_ADMIN_DIRECT_REPLY',
      'assistant_conversation',
      conversationId,
      'Réponse humaine directe du SuperAdmin dans le pack de discussion.'
    );
    pushToast('Réponse envoyée', 'Votre message a été transmis dans la discussion de l’interlocuteur.', 'orange');
    return { ok: true };
  };

  const sendPsychicDiagnosticToUser = (
    conversationId: string,
    customBriefingText?: string
  ) => {
    if (!isSuperAdminActor) {
      return {
        ok: false,
        error: 'Seul le SuperAdmin peut envoyer le bilan de diagnostic psychique.',
      };
    }
    const targetConv = conversations.find((c) => c.id === conversationId);
    if (!targetConv) {
      return { ok: false, error: 'Discussion introuvable.' };
    }
    const recipientUser = users.find((u) => u.id === targetConv.userId);
    const recipientLang: SupportedLanguage = recipientUser?.preferredLanguage || 'fr';
    const briefing = generatePsychicDiagnosticBriefing({
      messages: targetConv.messages,
      userPseudonym: targetConv.userPseudonym || 'Membre',
    });
    const textToSend = customBriefingText?.trim()
      ? sanitizeUserText(customBriefingText, 2500)
      : formatPsychicDiagnosticMessage(briefing, recipientLang);
    const now = new Date().toISOString();

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        const diagMsg: AssistantMessage = {
          id: `msg-diag-${Date.now()}`,
          conversationId,
          userId: c.userId,
          sender: 'admin',
          sourceLanguage: 'fr',
          isDiagnosticBriefing: true,
          content: textToSend,
          createdAt: now,
        };
        return {
          ...c,
          diagnosticSentAt: now,
          updatedAt: now,
          messages: [...c.messages, diagMsg],
        };
      })
    );
    recordAudit(
      'LISTENING_PSYCHIC_DIAGNOSTIC_SENT',
      'assistant_conversation',
      conversationId,
      `Envoi du bilan Diagnostic psychique IA à @${targetConv.userPseudonym || 'Membre'}.`
    );
    pushToast(
      'Diagnostic psychique envoyé',
      `Le bilan d’analyse IA a été transmis à @${targetConv.userPseudonym || 'Membre'}.`,
      'bordeaux'
    );
    return { ok: true };
  };

  // Seul le SuperAdmin et l'interlocuteur concerné peuvent lire une discussion
  const allAssistantConversationsForAdmin = useMemo(() => {
    if (!isSuperAdminActor) return [];
    return conversations;
  }, [conversations, isSuperAdminActor]);

  const value: AppContextValue = {
    theme,
    toggleTheme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    supabaseConnected: isSupabaseConfigured(),
    currentLanguage,
    setCurrentLanguage,
    currentUser,
    allUsers: users,
    switchDemoUser,
    loginWithEmail,
    registerAccount,
    requestGmailPushVerification,
    requestPasswordRecoveryPush,
    resetForgottenPassword,
    triggerSignupMotivationPush,
    logout,
    updateCurrentUserProfile,
    adminUpdateUserRole,
    siteSettings,
    updateSiteSettings,
    siteNotifications,
    publishSiteNotification,
    toggleSiteNotification,
    deleteSiteNotification,
    generateAiDailyTipAndPush,
    forcePublishStoryBySuperAdmin,
    adminBanUser,
    adminUnbanUser,
    adminForceLogoutUser,
    adminDeleteUser,
    activeBanNotice,
    dismissBanNotice,
    allAssistantConversationsForAdmin,
    toggleConversationHumanHandover,
    adminReplyInAssistantConversation,
    sendPsychicDiagnosticToUser,
    userConversations,
    userMoodEntries,
    userStressSleepEntries,
    userQuestionnaireResponses,
    userJournalEntries,
    userStories,
    publicStories,
    allManageableStories,
    userListeningRequests,
    allListeningRequests,
    dailyTips,
    featuredDailyTip,
    questionnairesCatalog: QUESTIONNAIRE_CATALOG,
    helpResources,
    userPrivacyRequests,
    allPrivacyRequests: privacyRequests,
    userSessions: sessions,
    auditLogs,
    createConversation,
    appendAssistantMessage,
    deleteConversation,
    addMoodEntry,
    addStressSleepEntry,
    submitQuestionnaireResponse,
    saveJournalEntry,
    deleteJournalEntry,
    saveOrSubmitStory,
    authorRespondToPublicationRequest,
    authorWithdrawStory,
    adminModerateStory,
    createListeningRequest,
    adminUpdateListeningRequest,
    adminSaveDailyTip,
    adminDeleteDailyTip,
    adminSaveHelpResource,
    adminDeleteHelpResource,
    createPrivacyRequest,
    revokeSession,
    isDailyTipModalOpen,
    openDailyTipModal,
    closeDailyTipModal,
    isConsentModalOpen,
    openConsentModal,
    closeConsentModal,
    toasts,
    pushToast,
    dismissToast,
    rawStoreForSecurityAudit: {
      conversations,
      journals: journalEntries,
      moods: moodEntries,
      stressSleeps: stressSleepEntries,
      questionnaires: questionnaireResponses,
      stories,
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp doit être utilisé à l’intérieur de <AppProvider>.');
  }
  return ctx;
}
