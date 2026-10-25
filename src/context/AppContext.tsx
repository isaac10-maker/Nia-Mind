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
  detectPentestOrSqlInjection,
  filterListeningRequestsForRole,
  filterUserScopedData,
  filterUserStoriesForRole,
  getPublicSafeStories,
  sanitizeUserText,
  validateNoteAndWellnessInput,
  validateStoryPublicationEligibility,
  verifyProtectedLogin,
} from '../lib/securityEngine';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  tone: 'orange' | 'bordeaux' | 'neutral';
}

interface AppContextValue {
  // Identité & Thème
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  supabaseConnected: boolean;

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
    publicPseudonym: string;
    countryCode: UserProfile['countryCode'];
    acceptedTerms: boolean;
    cookiesAccepted?: boolean;
    optionalWellnessConsent: boolean;
    interests?: string[];
    honeypot?: string;
  }) => { ok: boolean; error?: string };
  logout: () => void;
  updateCurrentUserProfile: (patch: Partial<UserProfile>) => { ok: boolean; error?: string };
  adminUpdateUserRole: (targetUserId: string, newRole: UserRole) => { ok: boolean; error?: string };

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

  const [isDailyTipModalOpen, setIsDailyTipModalOpen] = useState(false);
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

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

    if (password !== undefined && password.trim().length < 6) {
      return { ok: false, error: 'Mot de passe invalide (minimum 6 caractères).' };
    }

    const existing = users.find((u) => u.email.toLowerCase() === clean);
    if (existing) {
      setCurrentUserId(existing.id);
      recordAudit('AUTH_LOGIN_SUCCESS', 'auth', existing.id, 'Connexion vérifiée d’un membre inscrit.');
      pushToast('Bienvenue sur Nia-Mind', `Ravi de te retrouver, ${existing.displayName}.`, 'orange');
      return { ok: true };
    }
    return {
      ok: false,
      error: 'Connexion refusée : seuls les membres inscrits peuvent se connecter.',
    };
  };

  const registerAccount = (params: {
    displayName: string;
    email: string;
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
    if (!params.acceptedTerms) {
      return {
        ok: false,
        error: 'Vous devez accepter la politique de confidentialité, les conditions d’utilisation et les cookies.',
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
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { ok: false, error: 'Veuillez renseigner une adresse e-mail valide.' };
    }

    // Si c'est l'e-mail du Superadmin (isaacamegan10@gmail.com), connexion directe au profil Superadmin
    if (cleanEmail === SUPERADMIN_PROFILE.email) {
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

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      email: cleanEmail,
      displayName: sanitizeUserText(params.displayName, 80) || 'Membre Nia-Mind',
      publicPseudonym: sanitizeUserText(params.publicPseudonym, 60) || 'Anonyme',
      bio: interestsSummary,
      countryCode: params.countryCode,
      role: 'user',
      themePreference: theme,
      reducedMotion,
      notificationsEnabled: true,
      dailyTipModalEnabled: true,
      acceptedTermsVersion: 'v2.5 — Octobre 2026',
      acceptedTermsAt: new Date().toISOString(),
      optionalAnalyticsConsent: Boolean(params.cookiesAccepted ?? true),
      optionalWellnessInsightsConsent: params.optionalWellnessConsent,
      createdAt: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
    setCurrentUserId(newUser.id);
    recordAudit('USER_REGISTER', 'user', newUser.id, 'Création d’un nouveau compte membre.');
    pushToast('Compte créé', `Bienvenue dans ton espace sincère, ${newUser.displayName}.`, 'orange');
    return { ok: true };
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
    const convId = `conv-${Date.now()}`;
    const greetingMsg: AssistantMessage = {
      id: `msg-${Date.now()}-init`,
      conversationId: convId,
      userId: uid,
      sender: 'assistant',
      content:
        'Bonjour. Tu peux prendre ton temps. Qu\'aimerais-tu exprimer ou comprendre aujourd\'hui ?',
      createdAt: new Date().toISOString(),
    };
    const newConv: AssistantConversation = {
      id: convId,
      userId: uid,
      title: initialTitle,
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

  const value: AppContextValue = {
    theme,
    toggleTheme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    supabaseConnected: isSupabaseConfigured(),
    currentUser,
    allUsers: users,
    switchDemoUser,
    loginWithEmail,
    registerAccount,
    logout,
    updateCurrentUserProfile,
    adminUpdateUserRole,
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
