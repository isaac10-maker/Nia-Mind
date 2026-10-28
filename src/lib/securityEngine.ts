import {
  AssistantConversation,
  JournalEntry,
  ListeningRequest,
  MoodEntry,
  PublicStoryView,
  QuestionnaireResponse,
  StoryRecord,
  StressSleepEntry,
  UserRole,
} from './types';

export const OFFICIAL_BRAND_NAME = 'Nia-Mind';
export const OFFICIAL_SLOGAN = 'Le vrai sans le masque';
export const STORIES_SIGNATURE = 'Chaque histoire mérite d’être entendue.';

// ============================================================================
// 1. BOUCLIER ANTI-PENTEST, ANTI-SQLi, ANTI-XSS & ANTI-POLLUTION DE PROTOTYPE
// ============================================================================
const PENTEST_PATTERNS: RegExp[] = [
  /<\s*\/?\s*(script|iframe|object|embed|applet|meta|link|style|base|form)\b/i,
  /javascript\s*:/i,
  /vbscript\s*:/i,
  /data\s*:\s*text\/html/i,
  /\bon[a-z]{3,20}\s*=/i,
  /<svg[^>]*\bonload\b/i,
  /\bunion\s+(all\s+)?select\b/i,
  /\bdrop\s+(table|database|schema|view|function|trigger)\b/i,
  /\balter\s+table\b/i,
  /;\s*(delete|update|insert|drop|truncate|select|grant|revoke)\b/i,
  /(['"]|\b)\s*(or|and)\s+(['"]?1['"]?\s*=\s*['"]?1|true\b)/i,
  /\b(pg_sleep\s*\(|waitfor\s+delay\b|benchmark\s*\(|information_schema\b|pg_catalog\b|xp_cmdshell\b)/i,
  /(__proto__|constructor\s*\.\s*prototype|constructor\s*\[|prototype\s*\[)/i,
  /(\{\{\s*7\s*\*\s*7\s*\}\}|\$\{\s*7\s*\*\s*7\s*\})/i,
  /\0/,
];

export function detectPentestOrSqlInjection(input: string): {
  malicious: boolean;
  reason?: string;
} {
  if (!input) return { malicious: false };
  for (const regex of PENTEST_PATTERNS) {
    if (regex.test(input)) {
      return {
        malicious: true,
        reason:
          'SÉCURITÉ NIA-MIND : Motif d’injection (SQLi / XSS / Script) détecté et bloqué par le pare-feu applicatif.',
      };
    }
  }
  return { malicious: false };
}

export function sanitizeUserText(input: string, maxLength = 12000): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<(iframe|object|embed|applet)[^>]*>/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/\bon(error|load|mouseover|focus|click)\s*=/gi, '')
    .trim()
    .slice(0, maxLength);
}

const ALLOWED_INTERNAL_REDIRECTS = new Set<string>([
  '/espace/tableau-de-bord',
  '/espace/assistant',
  '/espace/ecoute',
  '/espace/bien-etre',
  '/espace/journal',
  '/espace/conseils-du-jour',
  '/espace/histoires',
  '/espace/profil',
  '/espace/confidentialite',
  '/gerer',
  '/communautes',
]);

/**
 * Empêche toute faille d'Open Redirect ou de fuite de jeton via l'URL de redirection :
 * Seuls les chemins internes exacts de la liste blanche sont autorisés.
 */
export function sanitizeInternalRedirect(rawRedirect: string | null | undefined): string {
  if (!rawRedirect || typeof rawRedirect !== 'string') {
    return '/espace/tableau-de-bord';
  }
  const clean = rawRedirect.trim().split('?')[0].split('#')[0];
  if (ALLOWED_INTERNAL_REDIRECTS.has(clean)) {
    return clean;
  }
  if (/^\/communautes\/rejoindre\/[a-f0-9]{32}$/.test(clean)) {
    return clean;
  }
  if (/^\/communautes\/espace\/[0-9a-f-]{36}$/i.test(clean)) {
    return clean;
  }
  return '/espace/tableau-de-bord';
}

// ============================================================================
// 2. LIMITEUR DE FRÉQUENCE ANTI-SPAM GLOBAL (Toutes actions & Onglets de notes)
// ============================================================================
const actionRateBuckets = new Map<string, { count: number; resetAt: number; lastHash?: string }>();
const loginBruteForceBuckets = new Map<
  string,
  { failures: number; lockedUntil: number; windowResetAt: number }
>();

export function resetSecurityBucketsForTests(): void {
  actionRateBuckets.clear();
  loginBruteForceBuckets.clear();
}

export function checkActionAntiSpam(params: {
  actionKey: string;
  actorId: string;
  maxCount: number;
  windowMs: number;
  contentForDuplicateCheck?: string;
}): { allowed: boolean; error?: string } {
  const now = Date.now();
  const compositeKey = `${params.actionKey}:${params.actorId || 'anon'}`;
  const normalizedContent = params.contentForDuplicateCheck?.trim().toLowerCase();

  let bucket = actionRateBuckets.get(compositeKey);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + params.windowMs };
    actionRateBuckets.set(compositeKey, bucket);
  }

  if (bucket.count >= params.maxCount) {
    return {
      allowed: false,
      error:
        'ANTI-SPAM NIA-MIND : Trop d’actions rapprochées détectées. Veuillez patienter quelques instants.',
    };
  }

  if (normalizedContent && normalizedContent.length > 5 && bucket.lastHash === normalizedContent) {
    return {
      allowed: false,
      error:
        'ANTI-SPAM NIA-MIND : Contenu identique déjà envoyé. Les envois répétitifs en doublon sont bloqués.',
    };
  }

  bucket.count += 1;
  if (normalizedContent) {
    bucket.lastHash = normalizedContent;
  }

  return { allowed: true };
}

// ============================================================================
// 3. PROTECTION DES CONNEXIONS : E-MAILS RÉELS SEULS & LIMITE 3 FOIS / 15 SECONDES
// ============================================================================
const LOGIN_MAX_FAILURES = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes de blocage

export const AUTH_RATE_LIMIT_MAX = 3;
export const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 1000; // 15 secondes

interface AuthBurstBucket {
  count: number;
  resetAt: number;
}

const authBurstBuckets = new Map<string, AuthBurstBucket>();

const BLOCKED_DISPOSABLE_OR_FAKE_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'test.com',
  'test.fr',
  'test.org',
  'yopmail.com',
  'yopmail.fr',
  'mailinator.com',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  'guerrillamail.com',
  'trashmail.com',
  'sharklasers.com',
  'fake.com',
  'fakemail.com',
  'azerty.com',
  'qwerty.com',
  'aaa.com',
  'bbb.com',
  'localhost',
  'invalid.com',
  'none.com',
]);

const FAKE_LOCAL_PARTS = new Set([
  'test',
  'testing',
  'fake',
  'admin',
  'root',
  'azerty',
  'qwerty',
  '123456',
  'abcdef',
  'user',
  'demo',
  'anonymous',
]);

/**
 * Vérifie qu'une adresse e-mail correspond à un e-mail réel (et bloque les domaines jetables/fictifs).
 */
export function validateRealEmailAddress(email: string): {
  valid: boolean;
  isGmail?: boolean;
  error?: string;
} {
  const clean = (email || '').trim().toLowerCase();
  if (!clean || clean.length < 6 || clean.length > 180) {
    return { valid: false, error: 'Veuillez saisir une adresse e-mail réelle valide.' };
  }

  const probe = detectPentestOrSqlInjection(clean);
  if (probe.malicious) {
    return { valid: false, error: probe.reason };
  }

  const emailRegex = /^[a-z0-9._%+-]{2,64}@([a-z0-9-]+\.)+[a-z]{2,12}$/;
  if (!emailRegex.test(clean)) {
    return {
      valid: false,
      error: 'Format d’adresse e-mail invalide. Utilisez une adresse e-mail réelle (ex. prenom.nom@gmail.com).',
    };
  }

  const [localPart, domain] = clean.split('@');
  if (!localPart || !domain) {
    return { valid: false, error: 'Adresse e-mail incomplète.' };
  }

  if (BLOCKED_DISPOSABLE_OR_FAKE_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: `RESTRICTION SÉCURITÉ : Le domaine « ${domain} » est reconnu comme jetable ou fictif. Seuls les e-mails réels sont autorisés.`,
    };
  }

  if (FAKE_LOCAL_PARTS.has(localPart)) {
    return {
      valid: false,
      error: `RESTRICTION SÉCURITÉ : L’identifiant « ${localPart}@... » semble fictif. Veuillez utiliser votre véritable adresse e-mail personnelle.`,
    };
  }

  const domainParts = domain.split('.');
  if (domainParts.some((p) => p.length < 2)) {
    return {
      valid: false,
      error: 'Domaine e-mail non reconnu. Utilisez un fournisseur d’e-mail réel (Gmail, Outlook, Yahoo, etc.).',
    };
  }

  const isGmail = domain === 'gmail.com' || domain === 'googlemail.com';
  if (isGmail && localPart.replace(/\./g, '').length < 4) {
    return {
      valid: false,
      error: 'Votre identifiant Gmail doit comporter un nom d’utilisateur réel valide.',
    };
  }

  return { valid: true, isGmail };
}

/**
 * Limite strictement le nombre de tentatives de connexion ou d'entrée d'identifiants à 3 fois / 15 secondes.
 */
export function checkAuthSubmissionRateLimit(
  identifier: string,
  maxAttempts: number = AUTH_RATE_LIMIT_MAX,
  windowMs: number = AUTH_RATE_LIMIT_WINDOW_MS
): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSec: number;
  error?: string;
} {
  const key = (identifier || 'global-auth').trim().toLowerCase();
  const now = Date.now();
  let bucket = authBurstBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs };
    authBurstBuckets.set(key, bucket);
  }

  if (bucket.count >= maxAttempts) {
    const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSec,
      error: `LIMITE DE SÉCURITÉ (3 essais / 15s) : Vous avez dépassé la limite d'entrées d'identification. Patientez ${retryAfterSec} seconde(s) avant de réessayer.`,
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remainingAttempts: Math.max(0, maxAttempts - bucket.count),
    retryAfterSec: 0,
  };
}

export function resetAuthSubmissionRateLimit(identifier?: string): void {
  if (identifier) {
    authBurstBuckets.delete(identifier.trim().toLowerCase());
  } else {
    authBurstBuckets.clear();
  }
}

export function verifyProtectedLogin(params: {
  email: string;
  registeredEmails: string[];
  honeypotValue?: string;
}): {
  allowed: boolean;
  lockedOut?: boolean;
  honeypotTriggered?: boolean;
  error?: string;
} {
  // 1. Piège anti-robot (Honeypot)
  if (params.honeypotValue && params.honeypotValue.trim().length > 0) {
    return {
      allowed: false,
      honeypotTriggered: true,
      error: 'SÉCURITÉ ANTI-BOT : Requête automatisée détectée et bloquée.',
    };
  }

  const cleanEmail = (params.email || '').trim().toLowerCase();
  const realEmailCheck = validateRealEmailAddress(cleanEmail);
  if (!realEmailCheck.valid) {
    return {
      allowed: false,
      error: realEmailCheck.error || 'Format d’adresse e-mail invalide.',
    };
  }

  // 2. Vérification d'injection SQL/XSS dans le champ email
  const probe = detectPentestOrSqlInjection(cleanEmail);
  if (probe.malicious) {
    return {
      allowed: false,
      error: probe.reason,
    };
  }

  const now = Date.now();
  let bf = loginBruteForceBuckets.get(cleanEmail);
  if (!bf || (bf.windowResetAt <= now && bf.lockedUntil <= now)) {
    bf = { failures: 0, lockedUntil: 0, windowResetAt: now + LOGIN_WINDOW_MS };
    loginBruteForceBuckets.set(cleanEmail, bf);
  }

  // 3. Vérification du verrouillage anti-brute-force
  if (bf.lockedUntil > now) {
    const minutesLeft = Math.max(1, Math.ceil((bf.lockedUntil - now) / 60000));
    return {
      allowed: false,
      lockedOut: true,
      error: `ANTI-SPAM CONNEXION : Trop de tentatives échouées. Accès verrouillé temporairement (${minutesLeft} min).`,
    };
  }

  // 4. Seuls les e-mails explicitement inscrits peuvent se connecter
  const isRegistered = params.registeredEmails.some(
    (reg) => reg.trim().toLowerCase() === cleanEmail
  );

  if (!isRegistered) {
    bf.failures += 1;
    if (bf.failures >= LOGIN_MAX_FAILURES) {
      bf.lockedUntil = now + LOGIN_LOCKOUT_MS;
      return {
        allowed: false,
        lockedOut: true,
        error:
          'ANTI-SPAM CONNEXION : Seuil maximal de tentatives sur e-mail inconnu atteint. Connexion bloquée pendant 15 minutes.',
      };
    }
    return {
      allowed: false,
      error: `Connexion refusée : seuls les e-mails inscrits sur Nia-Mind peuvent se connecter (${
        LOGIN_MAX_FAILURES - bf.failures
      } essai(s) restant(s) avant verrouillage).`,
    };
  }

  // Réinitialisation du compteur après succès
  bf.failures = 0;
  bf.lockedUntil = 0;
  return { allowed: true };
}

// ============================================================================
// 4. VALIDATION STRICTE DES ONGLETS DE NOTES, JOURNAL, HUMEUR & QUESTIONNAIRES
// ============================================================================
export function validateNoteAndWellnessInput(params: {
  textFields: string[];
  numericRanges?: Array<{ name: string; value: number; min: number; max: number }>;
}): { valid: boolean; error?: string } {
  for (const field of params.textFields) {
    const check = detectPentestOrSqlInjection(field);
    if (check.malicious) {
      return { valid: false, error: check.reason };
    }
  }

  if (params.numericRanges) {
    for (const r of params.numericRanges) {
      if (
        typeof r.value !== 'number' ||
        Number.isNaN(r.value) ||
        !Number.isFinite(r.value) ||
        r.value < r.min ||
        r.value > r.max
      ) {
        return {
          valid: false,
          error: `SÉCURITÉ : Valeur numérique hors limites pour « ${r.name} » (attendu entre ${r.min} et ${r.max}).`,
        };
      }
    }
  }

  return { valid: true };
}

/**
 * Vérifie qu'un utilisateur A ne peut jamais consulter les conversations,
 * les questionnaires, l'humeur ou les histoires privées d'un utilisateur B.
 */
export function canAccessPrivateUserData(actorUserId: string, ownerUserId: string): boolean {
  if (!actorUserId || !ownerUserId) return false;
  return actorUserId === ownerUserId;
}

/**
 * Le journal personnel est strictement privé : même un administrateur ne peut pas le lire.
 */
export function canAccessJournalEntry(
  actorUserId: string,
  entry: Pick<JournalEntry, 'userId'>
): boolean {
  if (!actorUserId || !entry?.userId) return false;
  return actorUserId === entry.userId;
}

/**
 * Contrôle des rôles côté serveur : un utilisateur ne peut jamais s'attribuer lui-même le rôle admin.
 */
export function canModifyUserRole(
  actorId: string,
  actorRole: UserRole,
  targetUserId: string,
  newRole: UserRole
): { allowed: boolean; reason?: string } {
  if (actorRole !== 'admin') {
    return {
      allowed: false,
      reason: 'Accès refusé : seul un administrateur vérifié côté serveur peut modifier un rôle.',
    };
  }
  if (actorId === targetUserId && newRole !== 'admin') {
    return {
      allowed: false,
      reason:
        'Sécurité : un administrateur ne peut pas révoquer son propre rôle actif sans transfert.',
    };
  }
  return { allowed: true };
}

/**
 * Vérifie les conditions strictes avant toute publication d'histoire anonyme :
 * - L'administrateur ne peut jamais publier une histoire sans l'autorisation explicite de l'auteur
 *   pour la version concernée (authorExplicitConsent === true && authorApprovedVersion === currentVersion).
 */
export function validateStoryPublicationEligibility(
  story: Pick<
    StoryRecord,
    | 'status'
    | 'authorExplicitConsent'
    | 'authorApprovedVersion'
    | 'currentVersion'
    | 'proposedPublicContent'
  >
): { eligible: boolean; error?: string } {
  if (!story.proposedPublicContent || !story.proposedPublicContent.trim()) {
    return {
      eligible: false,
      error: 'La version proposée pour publication est vide.',
    };
  }

  const injectionCheck = detectPentestOrSqlInjection(story.proposedPublicContent);
  if (injectionCheck.malicious) {
    return {
      eligible: false,
      error: injectionCheck.reason,
    };
  }

  if (!story.authorExplicitConsent) {
    return {
      eligible: false,
      error:
        "Publication bloquée : l'auteur n'a pas encore donné son autorisation explicite de publication.",
    };
  }

  if (story.authorApprovedVersion === null || story.authorApprovedVersion !== story.currentVersion) {
    return {
      eligible: false,
      error: `Publication bloquée : l'autorisation de l'auteur porte sur la version v${
        story.authorApprovedVersion ?? 'aucune'
      }, mais la version courante est v${story.currentVersion}.`,
    };
  }

  return { eligible: true };
}

/**
 * Filtre les histoires pour la bibliothèque publique :
 * - Uniquement celles au statut 'Publiée' ET ayant un consentement explicite valide sur la version courante
 * - Supprime authorId et originalContent pour garantir l'anonymat
 */
export function getPublicSafeStories(stories: StoryRecord[]): PublicStoryView[] {
  return stories
    .filter((s) => {
      if (s.status !== 'Publiée') return false;
      const check = validateStoryPublicationEligibility(s);
      return check.eligible;
    })
    .map((s) => ({
      id: s.id,
      category: s.category,
      title: s.title || 'Sans titre',
      publicPseudonym: s.publicPseudonym || 'Anonyme',
      content: s.proposedPublicContent,
      version: s.currentVersion,
      publishedAt: s.publishedAt || s.updatedAt,
    }));
}

/**
 * Filtre les données privées pour un utilisateur donné (simulation fidèle des politiques RLS Supabase)
 */
export function filterUserScopedData<T extends { userId: string }>(
  items: T[],
  authenticatedUserId: string
): T[] {
  return items.filter((item) => canAccessPrivateUserData(authenticatedUserId, item.userId));
}

export function filterUserStoriesForRole(
  stories: StoryRecord[],
  actorUserId: string,
  actorRole: UserRole
): StoryRecord[] {
  if (actorRole === 'admin') {
    // L'admin voit les histoires soumises à la modération, mais jamais les brouillons privés d'autrui
    return stories.filter((s) => s.authorId === actorUserId || s.status !== 'Brouillon');
  }
  return stories.filter((s) => s.authorId === actorUserId);
}

export function filterListeningRequestsForRole(
  requests: ListeningRequest[],
  actorUserId: string,
  actorRole: UserRole
): ListeningRequest[] {
  if (actorRole === 'admin' || actorRole === 'listener') {
    return requests;
  }
  return requests.filter((r) => r.userId === actorUserId);
}

export function assertRlsIsolationSnapshot(params: {
  userAId: string;
  userBId: string;
  conversations: AssistantConversation[];
  journals: JournalEntry[];
  moods: MoodEntry[];
  stressSleeps: StressSleepEntry[];
  questionnaires: QuestionnaireResponse[];
  stories: StoryRecord[];
}) {
  const {
    userAId,
    userBId,
    conversations,
    journals,
    moods,
    stressSleeps,
    questionnaires,
    stories,
  } = params;

  const aConvos = filterUserScopedData(conversations, userAId);
  const aJournals = journals.filter((j) => canAccessJournalEntry(userAId, j));
  const aMoods = filterUserScopedData(moods, userAId);
  const aStress = filterUserScopedData(stressSleeps, userAId);
  const aQuest = filterUserScopedData(questionnaires, userAId);
  const aPrivateStories = filterUserStoriesForRole(stories, userAId, 'user');

  const leakedBInA =
    aConvos.some((c) => c.userId === userBId) ||
    aJournals.some((j) => j.userId === userBId) ||
    aMoods.some((m) => m.userId === userBId) ||
    aStress.some((s) => s.userId === userBId) ||
    aQuest.some((q) => q.userId === userBId) ||
    aPrivateStories.some((st) => st.authorId === userBId);

  return {
    isolated: !leakedBInA,
    userACounts: {
      conversations: aConvos.length,
      journals: aJournals.length,
      moods: aMoods.length,
      stressSleeps: aStress.length,
      questionnaires: aQuest.length,
      stories: aPrivateStories.length,
    },
  };
}
