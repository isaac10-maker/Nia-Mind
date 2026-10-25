export type UserRole = 'user' | 'listener' | 'admin';

export type StoryStatus =
  | 'Brouillon'
  | 'Envoyée'
  | 'En modération'
  | 'Modification demandée'
  | 'Refusée'
  | 'Autorisation demandée'
  | 'Autorisée'
  | 'Publiée'
  | 'Retirée'
  | 'Archivée';

export const ALL_STORY_STATUSES: StoryStatus[] = [
  'Brouillon',
  'Envoyée',
  'En modération',
  'Modification demandée',
  'Refusée',
  'Autorisation demandée',
  'Autorisée',
  'Publiée',
  'Retirée',
  'Archivée',
];

export type ListeningStatus =
  | 'Envoyée'
  | 'En attente'
  | 'En cours'
  | 'Réponse disponible'
  | 'Clôturée';

export const ALL_LISTENING_STATUSES: ListeningStatus[] = [
  'Envoyée',
  'En attente',
  'En cours',
  'Réponse disponible',
  'Clôturée',
];

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  publicPseudonym: string;
  bio: string;
  countryCode: 'BF' | 'FR' | 'SN' | 'CI' | 'BE' | 'CA' | 'INT';
  role: UserRole;
  themePreference: 'light' | 'dark';
  reducedMotion: boolean;
  notificationsEnabled: boolean;
  dailyTipModalEnabled: boolean;
  acceptedTermsVersion: string;
  acceptedTermsAt: string;
  optionalAnalyticsConsent: boolean;
  optionalWellnessInsightsConsent: boolean;
  createdAt: string;
}

export interface AssistantMessage {
  id: string;
  conversationId: string;
  userId: string;
  sender: 'user' | 'assistant';
  content: string;
  distressFlagged?: boolean;
  createdAt: string;
}

export interface AssistantConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AssistantMessage[];
}

export interface MoodEntry {
  id: string;
  userId: string;
  moodScore: 1 | 2 | 3 | 4 | 5;
  moodLabel: string;
  note: string;
  tags: string[];
  recordedAt: string; // YYYY-MM-DD or ISO
}

export interface StressSleepEntry {
  id: string;
  userId: string;
  stressLevel: number; // 1..10
  sleepHours: number; // 0..24
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  note: string;
  recordedDate: string; // YYYY-MM-DD
}

export interface QuestionnaireResponse {
  id: string;
  userId: string;
  questionnaireCode: string;
  questionnaireTitle: string;
  questionnaireVersion: string;
  rawScore: number;
  normalizedScore: number; // 0..100
  interpretationBand: string;
  answers: number[];
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  promptUsed?: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StoryDecisionLog {
  id: string;
  timestamp: string;
  actor: 'auteur' | 'modération';
  status: StoryStatus;
  version: number;
  note: string;
}

export interface StoryRecord {
  id: string;
  authorId: string;
  category: string;
  title: string;
  publicPseudonym: string;
  originalContent: string;
  proposedPublicContent: string;
  currentVersion: number;
  authorApprovedVersion: number | null;
  authorExplicitConsent: boolean;
  authorConsentAt: string | null;
  status: StoryStatus;
  moderationNote: string;
  decisionHistory: StoryDecisionLog[];
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicStoryView {
  id: string;
  category: string;
  title: string;
  publicPseudonym: string;
  content: string;
  version: number;
  publishedAt: string;
}

export interface ListeningRequest {
  id: string;
  userId: string;
  userDisplayName: string;
  topic: string;
  preferredMode: 'Échange écrit asynchrone' | 'Entretien audio planifié' | 'Message confidentiel guidé';
  preferredSlot: string;
  message: string;
  status: ListeningStatus;
  listenerReply: string | null;
  assignedListener: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DailyTip {
  id: string;
  title: string;
  category: 'Écoute' | 'Franchise' | 'Réflexion' | 'Bien-être' | 'Authenticité';
  summary: string;
  content: string;
  reflectionQuestion: string;
  readingTimeMin: number;
  isFeaturedToday?: boolean;
  publishedAt: string;
}

export interface VerifiedHelpResource {
  id: string;
  countryCode: 'BF' | 'FR' | 'SN' | 'CI' | 'BE' | 'CA' | 'INT';
  countryLabel: string;
  organizationName: string;
  phoneOrContact: string;
  availability: string;
  description: string;
  verifiedSource: string;
  isEmergency: boolean;
}

export interface QuestionnaireDefinition {
  code: string;
  title: string;
  version: string;
  sourceAttribution: string;
  licenseNote: string;
  durationMin: number;
  description: string;
  scaleLabels: Array<{ value: number; label: string }>;
  questions: string[];
}

export interface PrivacyRequestRecord {
  id: string;
  userId: string;
  requestType: 'data_access' | 'data_export' | 'account_deletion';
  status: 'Enregistrée' | 'En traitement' | 'Terminée';
  reason: string;
  createdAt: string;
}

export interface UserSessionInfo {
  id: string;
  deviceLabel: string;
  locationLabel: string;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorRole: UserRole;
  actionCode: string;
  targetType: string;
  targetId: string;
  summary: string;
  createdAt: string;
}

export interface SiteNotification {
  id: string;
  title: string;
  message: string;
  category: 'Conseil & Motivation' | 'Annonce officielle' | 'Bien-être & Écoute' | 'Sécurité';
  actionUrl: string;
  generatedByAi: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface SiteSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  themePreset: string;
  aiAutopilotTipsEnabled: boolean;
  strictRateLimitMax: number;
  strictRateLimitWindowSec: number;
  copyProtectionEnabled: boolean;
  updatedAt: string;
}

