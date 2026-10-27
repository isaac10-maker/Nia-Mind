import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import type {
  AssistantConversation,
  AssistantMessage,
  JournalEntry,
  ListeningRequest,
  MoodEntry,
  QuestionnaireResponse,
  StoryRecord,
  StressSleepEntry,
  UserProfile,
  UserRole,
} from './types';

export const OFFICIAL_SUPERADMIN_EMAIL = 'isaacamegan10@gmail.com';
const STORAGE_KEY = 'nia-mind-state-v2-clean';
const ACTIVE_USER_KEY = 'nia-mind-active-user-v2';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function newRecordId(): string {
  return crypto.randomUUID();
}

export function isUuid(value: string | undefined | null): value is string {
  return Boolean(value && UUID_RE.test(value));
}

export function purgeSensitiveBrowserData(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          siteSettings: parsed.siteSettings,
          siteNotifications: parsed.siteNotifications,
        })
      );
    }
    localStorage.removeItem(ACTIVE_USER_KEY);
  } catch {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(ACTIVE_USER_KEY);
    } catch {
      // Navigateur privé ou stockage bloqué.
    }
  }
}

type ProfileRow = {
  id: string;
  email?: string | null;
  display_name?: string | null;
  public_pseudonym?: string | null;
  full_name?: string | null;
  bio?: string | null;
  country_code?: UserProfile['countryCode'] | null;
  theme_preference?: string | null;
  reduced_motion?: boolean | null;
  notifications_enabled?: boolean | null;
  daily_tip_modal_enabled?: boolean | null;
  accepted_terms_version?: string | null;
  accepted_terms_at?: string | null;
  optional_analytics_consent?: boolean | null;
  optional_wellness_insights_consent?: boolean | null;
  preferred_language?: UserProfile['preferredLanguage'] | null;
  is_online?: boolean | null;
  is_banned?: boolean | null;
  ban_reason?: string | null;
  banned_at?: string | null;
  is_removed?: boolean | null;
  created_at?: string | null;
};

export interface AccountBundle {
  ok: true;
  profile: UserProfile;
  users: UserProfile[];
  conversations: AssistantConversation[];
  journals: JournalEntry[];
  moods: MoodEntry[];
  stressSleeps: StressSleepEntry[];
  questionnaires: QuestionnaireResponse[];
  listening: ListeningRequest[];
  stories: StoryRecord[];
}

export interface AccountFailure {
  ok: false;
  error: string;
  banned?: boolean;
}

function countryOf(value: string | null | undefined): UserProfile['countryCode'] {
  const allowed = ['BF', 'FR', 'SN', 'CI', 'BE', 'CA', 'INT'] as const;
  return allowed.includes(value as UserProfile['countryCode'])
    ? (value as UserProfile['countryCode'])
    : 'INT';
}

function roleOf(value: string | null | undefined, email: string): UserRole {
  if (value === 'admin') {
    return email === OFFICIAL_SUPERADMIN_EMAIL ? 'admin' : 'user';
  }
  if (value === 'listener') return 'listener';
  return 'user';
}

function profileFromRow(row: ProfileRow, role: UserRole, fallbackEmail = ''): UserProfile {
  const email = (row.email || fallbackEmail || '').toLowerCase();
  const pseudo = row.public_pseudonym || row.display_name || 'Anonyme';
  return {
    id: row.id,
    email,
    displayName: pseudo,
    publicPseudonym: pseudo,
    fullName: row.full_name || undefined,
    preferredLanguage: row.preferred_language || 'fr',
    isOnline: Boolean(row.is_online),
    isBanned: Boolean(row.is_banned),
    banReason: row.ban_reason || null,
    bannedAt: row.banned_at || null,
    bio: row.bio || '',
    countryCode: countryOf(row.country_code),
    role: roleOf(role, email),
    themePreference: row.theme_preference === 'dark' ? 'dark' : 'light',
    reducedMotion: Boolean(row.reduced_motion),
    notificationsEnabled: row.notifications_enabled !== false,
    dailyTipModalEnabled: row.daily_tip_modal_enabled !== false,
    acceptedTermsVersion: row.accepted_terms_version || 'v2.5 — Octobre 2026',
    acceptedTermsAt: row.accepted_terms_at || new Date().toISOString(),
    optionalAnalyticsConsent: Boolean(row.optional_analytics_consent),
    optionalWellnessInsightsConsent: row.optional_wellness_insights_consent !== false,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function frenchAuthError(message: string): string {
  const text = message.toLowerCase();
  if (text.includes('invalid login') || text.includes('invalid credentials')) {
    return 'E-mail ou mot de passe incorrect.';
  }
  if (text.includes('already registered') || text.includes('already been registered')) {
    return 'Un compte existe déjà avec cette adresse. Utilisez « Connexion ».';
  }
  if (text.includes('password')) {
    return 'Le mot de passe doit contenir au moins 6 caractères.';
  }
  if (text.includes('rate limit') || text.includes('too many')) {
    return 'Trop de tentatives. Patientez quelques secondes avant de réessayer.';
  }
  if (text.includes('failed to fetch') || text.includes('network') || text.includes('middleware')) {
    return 'Le pont vers le compte est indisponible pour le moment. Réessayez dans un instant.';
  }
  return 'La demande de compte n’a pas abouti. Réessayez dans un instant.';
}

async function resolveServerRole(user: User): Promise<UserRole> {
  if (!supabase) return 'user';
  const email = (user.email || '').toLowerCase();
  if (email === OFFICIAL_SUPERADMIN_EMAIL) {
    await supabase.rpc('ensure_superadmin');
  }
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
  return roleOf(data?.role, email);
}

async function upsertOwnProfile(user: User, role: UserRole, patch?: Partial<UserProfile>): Promise<UserProfile> {
  const email = (user.email || patch?.email || '').toLowerCase();
  const { data: existing } = await supabase!.from('profiles').select('*').eq('id', user.id).maybeSingle();
  if (existing && !patch) {
    await supabase!.from('profiles').update({ is_online: true, email }).eq('id', user.id);
    return profileFromRow({ ...(existing as ProfileRow), is_online: true, email }, role, email);
  }
  const current = (existing || {}) as ProfileRow;
  const pseudo =
    patch?.publicPseudonym ||
    patch?.displayName ||
    current.public_pseudonym ||
    current.display_name ||
    email.split('@')[0] ||
    'Anonyme';
  const row = {
    id: user.id,
    email,
    display_name: pseudo,
    public_pseudonym: pseudo,
    full_name: patch?.fullName ?? current.full_name ?? null,
    bio: patch?.bio ?? current.bio ?? '',
    country_code: patch?.countryCode || current.country_code || 'BF',
    theme_preference: patch?.themePreference || current.theme_preference || 'light',
    reduced_motion: patch?.reducedMotion ?? Boolean(current.reduced_motion),
    notifications_enabled: patch?.notificationsEnabled ?? current.notifications_enabled !== false,
    daily_tip_modal_enabled: patch?.dailyTipModalEnabled ?? current.daily_tip_modal_enabled !== false,
    accepted_terms_version: patch?.acceptedTermsVersion || current.accepted_terms_version || 'v2.5 — Octobre 2026',
    accepted_terms_at: patch?.acceptedTermsAt || current.accepted_terms_at || new Date().toISOString(),
    optional_analytics_consent: patch?.optionalAnalyticsConsent ?? Boolean(current.optional_analytics_consent),
    optional_wellness_insights_consent:
      patch?.optionalWellnessInsightsConsent ?? current.optional_wellness_insights_consent !== false,
    preferred_language: patch?.preferredLanguage || current.preferred_language || 'fr',
    is_online: true,
  };
  const { data, error } = await supabase!
    .from('profiles')
    .upsert(row, { onConflict: 'id' })
    .select('*')
    .maybeSingle();
  if (error || !data) {
    return profileFromRow({ ...row, created_at: new Date().toISOString() }, role, email);
  }
  return profileFromRow(data as ProfileRow, role, email);
}

export async function loadAccountBundle(
  user: User,
  patch?: Partial<UserProfile>
): Promise<AccountBundle | AccountFailure> {
  if (!supabase) {
    return { ok: false, error: 'Le compte serveur n’est pas configuré.' };
  }
  const role = await resolveServerRole(user);
  const profile = await upsertOwnProfile(user, role, patch);
  if (profile.isBanned) {
    await supabase.auth.signOut();
    return {
      ok: false,
      banned: true,
      error: `COMPTE SUSPENDU / BANNI PAR L’ADMINISTRATEUR — Motif : ${profile.banReason || 'Non-respect des règles de bienveillance Nia-Mind.'}`,
    };
  }

  const [conversations, messages, journals, moods, stress, questionnaires, listening, stories, profiles, roles] =
    await Promise.all([
      supabase.from('assistant_conversations').select('*').order('updated_at', { ascending: false }),
      supabase.from('assistant_messages').select('*').order('created_at', { ascending: true }),
      supabase.from('journal_entries').select('*').order('updated_at', { ascending: false }),
      supabase.from('mood_entries').select('*').order('recorded_at', { ascending: false }),
      supabase.from('stress_sleep_entries').select('*').order('recorded_date', { ascending: false }),
      supabase.from('questionnaire_responses').select('*').order('created_at', { ascending: false }),
      supabase.from('listening_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('stories').select('*').order('updated_at', { ascending: false }),
      role === 'admin' ? supabase.from('profiles').select('*') : Promise.resolve({ data: null, error: null }),
      role === 'admin' ? supabase.from('user_roles').select('user_id, role') : Promise.resolve({ data: null, error: null }),
    ]);

  const messageRows = (messages.data || []) as Array<Record<string, unknown>>;
  const byConversation = new Map<string, AssistantMessage[]>();
  for (const row of messageRows) {
    const conversationId = String(row.conversation_id);
    const sender = row.sender === 'user' || row.sender === 'admin' ? row.sender : 'assistant';
    const message: AssistantMessage = {
      id: String(row.id),
      conversationId,
      userId: String(row.user_id),
      sender,
      content: String(row.content || ''),
      distressFlagged: Boolean(row.distress_flagged),
      offerHumanHandover: Boolean(row.offer_handover),
      isDiagnosticBriefing: Boolean(row.is_diagnostic),
      createdAt: String(row.created_at || new Date().toISOString()),
    };
    const list = byConversation.get(conversationId) || [];
    list.push(message);
    byConversation.set(conversationId, list);
  }

  const mappedConversations: AssistantConversation[] = ((conversations.data || []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      title: String(row.title || 'Réflexion'),
      handedOverToAdmin: Boolean(row.handed_over),
      diagnosticSentAt: (row.diagnostic_sent_at as string | null) || null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
      messages: byConversation.get(String(row.id)) || [],
    })
  );

  const roleByUser = new Map<string, string>();
  for (const row of (roles.data || []) as Array<{ user_id: string; role: string }>) {
    roleByUser.set(row.user_id, row.role);
  }
  const directory = ((profiles.data || []) as ProfileRow[])
    .filter((row) => !row.is_removed)
    .map((row) =>
      profileFromRow(row, roleOf(roleByUser.get(row.id), (row.email || '').toLowerCase()), row.email || '')
    );
  const users = directory.some((item) => item.id === profile.id) ? directory : [profile, ...directory];

  return {
    ok: true,
    profile,
    users,
    conversations: mappedConversations,
    journals: ((journals.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      title: String(row.title || ''),
      content: String(row.content || ''),
      category: String(row.category || 'Réflexion libre'),
      promptUsed: (row.prompt_used as string | null) || undefined,
      isDraft: Boolean(row.is_draft),
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    moods: ((moods.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      moodScore: Number(row.mood_score) as MoodEntry['moodScore'],
      moodLabel: String(row.mood_label || ''),
      note: String(row.note || ''),
      tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
      recordedAt: String(row.recorded_at || '').slice(0, 10),
    })),
    stressSleeps: ((stress.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      stressLevel: Number(row.stress_level),
      sleepHours: Number(row.sleep_hours),
      sleepQuality: Number(row.sleep_quality) as StressSleepEntry['sleepQuality'],
      note: String(row.note || ''),
      recordedDate: String(row.recorded_date || '').slice(0, 10),
    })),
    questionnaires: ((questionnaires.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      questionnaireCode: String(row.questionnaire_code || ''),
      questionnaireTitle: String(row.questionnaire_title || row.questionnaire_code || ''),
      questionnaireVersion: String(row.questionnaire_version || '1'),
      rawScore: Number(row.raw_score || 0),
      normalizedScore: Number(row.normalized_score || 0),
      interpretationBand: String(row.interpretation_band || ''),
      answers: Array.isArray(row.answers) ? (row.answers as number[]) : [],
      createdAt: String(row.created_at),
    })),
    listening: ((listening.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      userId: String(row.user_id),
      userDisplayName: profile.publicPseudonym,
      topic: String(row.topic || ''),
      preferredMode: (row.preferred_mode as ListeningRequest['preferredMode']) || 'Échange écrit asynchrone',
      preferredSlot: String(row.preferred_slot || ''),
      message: String(row.message || ''),
      status: (row.status as ListeningRequest['status']) || 'Envoyée',
      listenerReply: (row.listener_reply as string | null) || null,
      assignedListener: (row.assigned_listener as string | null) || null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
    stories: ((stories.data || []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      authorId: String(row.author_id),
      category: String(row.category || ''),
      title: String(row.title || ''),
      publicPseudonym: String(row.public_pseudonym || 'Anonyme'),
      originalContent: String(row.original_content || ''),
      proposedPublicContent: String(row.proposed_public_content || ''),
      currentVersion: Number(row.current_version || 1),
      authorApprovedVersion: (row.author_approved_version as number | null) ?? null,
      authorExplicitConsent: Boolean(row.author_explicit_consent),
      authorConsentAt: (row.author_consent_at as string | null) || null,
      status: (row.status as StoryRecord['status']) || 'Brouillon',
      moderationNote: String(row.moderation_note || ''),
      decisionHistory: Array.isArray(row.decision_history)
        ? (row.decision_history as StoryRecord['decisionHistory'])
        : [],
      publishedAt: (row.published_at as string | null) || null,
      createdAt: String(row.created_at),
      updatedAt: String(row.updated_at),
    })),
  };
}

export async function signInAccount(email: string, password: string): Promise<AccountBundle | AccountFailure> {
  if (!supabase) return { ok: false, error: 'Le compte serveur n’est pas configuré.' };
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return { ok: false, error: frenchAuthError(error?.message || 'invalid credentials') };
  return loadAccountBundle(data.user);
}

export async function signUpAccount(params: {
  email: string;
  password: string;
  profile: Partial<UserProfile>;
}): Promise<AccountBundle | AccountFailure | { ok: true; pending: true }> {
  if (!supabase) return { ok: false, error: 'Le compte serveur n’est pas configuré.' };
  const { data, error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
  });
  if (error || !data.user) return { ok: false, error: frenchAuthError(error?.message || 'signup failed') };
  if (!data.session) {
    return {
      ok: true,
      pending: true,
    };
  }
  return loadAccountBundle(data.user, params.profile);
}

export async function sendPasswordReset(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'Le compte serveur n’est pas configuré.' };
  const redirectTo =
    typeof window !== 'undefined' ? `${window.location.origin}/connexion` : 'https://nia-mind.vercel.app/connexion';
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, error: frenchAuthError(error.message) };
  return { ok: true };
}

export async function signOutAccount(): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    await supabase.from('profiles').update({ is_online: false }).eq('id', data.user.id);
  }
  await supabase.auth.signOut();
}

async function replaceOwned(
  table: string,
  userColumn: string,
  userId: string,
  rows: Array<Record<string, unknown>>
): Promise<void> {
  if (!supabase) return;
  if (rows.length > 0) {
    const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
    if (error) return;
  }
  const { data } = await supabase.from(table).select('id').eq(userColumn, userId);
  const keep = new Set(rows.map((row) => String(row.id)));
  const stale = ((data || []) as Array<{ id: string }>).map((row) => row.id).filter((id) => !keep.has(id));
  if (stale.length > 0) {
    await supabase.from(table).delete().in('id', stale);
  }
}

export async function pushPrivateVault(userId: string, snapshot: {
  conversations: AssistantConversation[];
  journals: JournalEntry[];
  moods: MoodEntry[];
  stressSleeps: StressSleepEntry[];
  questionnaires: QuestionnaireResponse[];
  listening: ListeningRequest[];
  stories: StoryRecord[];
}): Promise<void> {
  if (!supabase || !isUuid(userId)) return;
  const own = <T extends { userId?: string; authorId?: string; id: string }>(rows: T[], key: 'userId' | 'authorId') =>
    rows.filter((row) => row[key] === userId && isUuid(row.id));

  const conversations = own(snapshot.conversations, 'userId');
  await replaceOwned(
    'assistant_conversations',
    'user_id',
    userId,
    conversations.map((row) => ({
      id: row.id,
      user_id: userId,
      title: row.title || 'Réflexion',
      handed_over: Boolean(row.handedOverToAdmin),
      diagnostic_sent_at: row.diagnosticSentAt || null,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  const messages = conversations.flatMap((conversation) =>
    conversation.messages.filter((message) => isUuid(message.id)).map((message) => ({
      id: message.id,
      conversation_id: conversation.id,
      user_id: userId,
      sender: message.sender === 'admin' ? 'admin' : message.sender === 'user' ? 'user' : 'assistant',
      content: message.content || ' ',
      distress_flagged: Boolean(message.distressFlagged),
      offer_handover: Boolean(message.offerHumanHandover),
      is_diagnostic: Boolean(message.isDiagnosticBriefing),
      created_at: message.createdAt,
    }))
  );
  await replaceOwned('assistant_messages', 'user_id', userId, messages);
  await replaceOwned(
    'journal_entries',
    'user_id',
    userId,
    own(snapshot.journals, 'userId').map((row) => ({
      id: row.id,
      user_id: userId,
      title: row.title || '',
      content: row.content || ' ',
      category: row.category || 'Réflexion libre',
      prompt_used: row.promptUsed || null,
      is_draft: Boolean(row.isDraft),
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await replaceOwned(
    'mood_entries',
    'user_id',
    userId,
    own(snapshot.moods, 'userId').map((row) => ({
      id: row.id,
      user_id: userId,
      mood_score: row.moodScore,
      mood_label: row.moodLabel || 'Ressenti',
      note: row.note || '',
      tags: row.tags || [],
      recorded_at: row.recordedAt || new Date().toISOString(),
    }))
  );
  await replaceOwned(
    'stress_sleep_entries',
    'user_id',
    userId,
    own(snapshot.stressSleeps, 'userId').map((row) => ({
      id: row.id,
      user_id: userId,
      stress_level: row.stressLevel,
      sleep_hours: row.sleepHours,
      sleep_quality: row.sleepQuality,
      note: row.note || '',
      recorded_date: (row.recordedDate || new Date().toISOString()).slice(0, 10),
    }))
  );
  await replaceOwned(
    'questionnaire_responses',
    'user_id',
    userId,
    own(snapshot.questionnaires, 'userId').map((row) => ({
      id: row.id,
      user_id: userId,
      questionnaire_code: row.questionnaireCode,
      questionnaire_title: row.questionnaireTitle,
      questionnaire_version: row.questionnaireVersion,
      raw_score: row.rawScore,
      normalized_score: row.normalizedScore,
      interpretation_band: row.interpretationBand,
      answers: row.answers || [],
      created_at: row.createdAt,
    }))
  );
  await replaceOwned(
    'listening_requests',
    'user_id',
    userId,
    own(snapshot.listening, 'userId').map((row) => ({
      id: row.id,
      user_id: userId,
      topic: row.topic,
      preferred_mode: row.preferredMode,
      preferred_slot: row.preferredSlot,
      message: row.message || ' ',
      status: row.status,
      listener_reply: row.listenerReply,
      assigned_listener: row.assignedListener,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
  await replaceOwned(
    'stories',
    'author_id',
    userId,
    own(snapshot.stories, 'authorId').map((row) => ({
      id: row.id,
      author_id: userId,
      category: row.category || 'Témoignage',
      title: row.title || '',
      public_pseudonym: row.publicPseudonym || 'Anonyme',
      original_content: row.originalContent || ' ',
      proposed_public_content: row.proposedPublicContent || null,
      current_version: row.currentVersion || 1,
      author_approved_version: row.authorApprovedVersion,
      author_explicit_consent: Boolean(row.authorExplicitConsent),
      author_consent_at: row.authorConsentAt,
      status: row.status,
      moderation_note: row.moderationNote || '',
      decision_history: row.decisionHistory || [],
      published_at: row.publishedAt,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    }))
  );
}

export async function suspendAccount(targetUserId: string, reason: string, removed = false): Promise<boolean> {
  if (!supabase || !isUuid(targetUserId)) return false;
  const { error } = await supabase
    .from('profiles')
    .update({
      is_banned: true,
      is_online: false,
      ban_reason: reason,
      banned_at: new Date().toISOString(),
      is_removed: removed,
    })
    .eq('id', targetUserId);
  return !error;
}

export async function restoreAccount(targetUserId: string): Promise<boolean> {
  if (!supabase || !isUuid(targetUserId)) return false;
  const { error } = await supabase
    .from('profiles')
    .update({ is_banned: false, ban_reason: null, banned_at: null, is_removed: false })
    .eq('id', targetUserId);
  return !error;
}
