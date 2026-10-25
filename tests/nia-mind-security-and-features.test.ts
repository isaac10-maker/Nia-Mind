import { describe, expect, it } from 'vitest';
import {
  assertRlsIsolationSnapshot,
  canAccessJournalEntry,
  canAccessPrivateUserData,
  canModifyUserRole,
  checkActionAntiSpam,
  detectPentestOrSqlInjection,
  getPublicSafeStories,
  OFFICIAL_BRAND_NAME,
  OFFICIAL_SLOGAN,
  STORIES_SIGNATURE,
  validateNoteAndWellnessInput,
  validateStoryPublicationEligibility,
  verifyProtectedLogin,
} from '../src/lib/securityEngine';
import {
  INITIAL_ASSISTANT_CONVERSATIONS,
  INITIAL_JOURNAL_ENTRIES,
  INITIAL_MOOD_ENTRIES,
  INITIAL_QUESTIONNAIRE_RESPONSES,
  INITIAL_STORIES,
  INITIAL_STRESS_SLEEP_ENTRIES,
} from '../src/lib/seedData';
import { processAssistantPayload } from '../api/assistant';

describe('Nia-Mind — Identité, Sécurité RLS, Histoires Anonymes & Assistant Serveur', () => {
  it('1. Vérifie l’identité officielle exacte et le slogan « Le vrai sans le masque »', () => {
    expect(OFFICIAL_BRAND_NAME).toBe('Nia-Mind');
    expect(OFFICIAL_SLOGAN).toBe('Le vrai sans le masque');
    expect(OFFICIAL_SLOGAN).not.toBe('Le vrai. Sans masque.');
    expect(STORIES_SIGNATURE).toBe('Chaque histoire mérite d’être entendue.');
  });

  it('2. Garantit que l’Utilisateur A ne peut pas consulter les conversations, le journal, les questionnaires ou les histoires privées de l’Utilisateur B', () => {
    expect(canAccessPrivateUserData('user-a', 'user-b')).toBe(false);
    expect(canAccessPrivateUserData('user-a', 'user-a')).toBe(true);

    const snapshot = assertRlsIsolationSnapshot({
      userAId: 'user-a',
      userBId: 'user-b',
      conversations: INITIAL_ASSISTANT_CONVERSATIONS,
      journals: INITIAL_JOURNAL_ENTRIES,
      moods: INITIAL_MOOD_ENTRIES,
      stressSleeps: INITIAL_STRESS_SLEEP_ENTRIES,
      questionnaires: INITIAL_QUESTIONNAIRE_RESPONSES,
      stories: INITIAL_STORIES,
    });

    expect(snapshot.isolated).toBe(true);
    expect(snapshot.userACounts.conversations).toBeGreaterThan(0);
    expect(snapshot.userACounts.journals).toBeGreaterThan(0);
  });

  it('3. Garantit que le journal personnel reste strictement privé (même pour un administrateur)', () => {
    const lucasJournal = INITIAL_JOURNAL_ENTRIES.find((j) => j.userId === 'user-b')!;
    expect(canAccessJournalEntry('user-b', lucasJournal)).toBe(true);
    expect(canAccessJournalEntry('user-a', lucasJournal)).toBe(false);
    expect(canAccessJournalEntry('admin-1', lucasJournal)).toBe(false);
  });

  it('4. Interdit à un utilisateur de s’attribuer lui-même le rôle administrateur', () => {
    const selfPromoteAttempt = canModifyUserRole('user-a', 'user', 'user-a', 'admin');
    expect(selfPromoteAttempt.allowed).toBe(false);

    const adminAssign = canModifyUserRole('admin-1', 'admin', 'user-b', 'listener');
    expect(adminAssign.allowed).toBe(true);
  });

  it('5. Interdit à l’administrateur de publier une histoire sans l’autorisation explicite de l’auteur sur la version courante', () => {
    const pendingConsentStory = INITIAL_STORIES.find(
      (s) => s.id === 'story-pending-consent-a'
    )!;
    // L'histoire est en version v2 ('Autorisation demandée'), non encore approuvée par l'auteur
    const checkBeforeConsent = validateStoryPublicationEligibility(pendingConsentStory);
    expect(checkBeforeConsent.eligible).toBe(false);

    // Même si l'auteur avait approuvé la v1, la modification en v2 bloque la publication tant que la v2 n'est pas approuvée
    const mismatchVersionCheck = validateStoryPublicationEligibility({
      status: 'Autorisée',
      authorExplicitConsent: true,
      authorApprovedVersion: 1,
      currentVersion: 2,
      proposedPublicContent: 'Texte révisé v2',
    });
    expect(mismatchVersionCheck.eligible).toBe(false);

    // Une fois l'autorisation explicite donnée sur la v2 :
    const validConsentCheck = validateStoryPublicationEligibility({
      status: 'Autorisée',
      authorExplicitConsent: true,
      authorApprovedVersion: 2,
      currentVersion: 2,
      proposedPublicContent: 'Texte révisé v2 approuvé par l’auteur',
    });
    expect(validConsentCheck.eligible).toBe(true);

    // Vérifie que la vue publique n'expose jamais authorId ni originalContent
    const publicList = getPublicSafeStories(INITIAL_STORIES);
    expect(publicList.length).toBe(3);
    publicList.forEach((pub) => {
      expect((pub as any).authorId).toBeUndefined();
      expect((pub as any).originalContent).toBeUndefined();
    });
  });

  it('6. Vérifie le fonctionnement sécurisé du service /api/assistant et la détection de détresse', async () => {
    const emptyRes = await processAssistantPayload({ message: '   ' }, 'test-ip-1');
    expect(emptyRes.status).toBe(400);

    const normalRes = await processAssistantPayload(
      { message: 'Comment fonctionne Nia-Mind ?' },
      'test-ip-2'
    );
    expect(normalRes.status).toBe(200);
    if ('reply' in normalRes.body) {
      expect(normalRes.body.distressDetected).toBe(false);
      expect(normalRes.body.reply).toContain('Le vrai sans le masque');
    }

    const distressRes = await processAssistantPayload(
      { message: 'Je n’ai plus envie de vivre aujourd’hui' },
      'test-ip-3'
    );
    expect(distressRes.status).toBe(200);
    if ('reply' in distressRes.body) {
      expect(distressRes.body.distressDetected).toBe(true);
      expect(distressRes.body.reply).toContain('ressources d\'aide vérifiées');
    }
  });

  it('7. Protège la connexion : seuls les e-mails inscrits peuvent se connecter, honeypot anti-bot et verrouillage brute-force après 5 échecs', () => {
    const registered = ['amina@nia-mind.org', 'lucas@nia-mind.org', 'moderation@nia-mind.org'];

    // Connexion légitime d'un membre inscrit
    const validLogin = verifyProtectedLogin({
      email: 'amina@nia-mind.org',
      registeredEmails: registered,
      honeypotValue: '',
    });
    expect(validLogin.allowed).toBe(true);

    // Tentative par un robot remplissant le champ honeypot
    const botLogin = verifyProtectedLogin({
      email: 'amina@nia-mind.org',
      registeredEmails: registered,
      honeypotValue: 'http://spam-bot.example',
    });
    expect(botLogin.allowed).toBe(false);
    expect(botLogin.honeypotTriggered).toBe(true);

    // Tentatives répétées avec un e-mail inconnu -> rejet puis verrouillage brute-force à la 5e tentative
    for (let i = 1; i <= 5; i++) {
      const unknownTry = verifyProtectedLogin({
        email: 'inconnu@externe.org',
        registeredEmails: registered,
      });
      expect(unknownTry.allowed).toBe(false);
      if (i === 5) {
        expect(unknownTry.lockedOut).toBe(true);
      }
    }
  });

  it('8. Bloque les pentests faciles, moyens et avancés (XSS, SQLi, SSTI, Prototype Pollution) côté client et API', async () => {
    // Pentest facile : XSS script tag
    expect(detectPentestOrSqlInjection('<script>alert("xss")</script>').malicious).toBe(true);

    // Pentest moyen : SQL injection UNION SELECT & OR 1=1
    expect(
      detectPentestOrSqlInjection("amina@nia-mind.org' UNION ALL SELECT email, password FROM auth.users--")
        .malicious
    ).toBe(true);
    expect(detectPentestOrSqlInjection("' OR 1=1 --").malicious).toBe(true);

    // Pentest avancé : Time-based SQLi, Prototype Pollution, SSTI
    expect(detectPentestOrSqlInjection('1; SELECT pg_sleep(10);--').malicious).toBe(true);
    expect(detectPentestOrSqlInjection('{"__proto__": {"role": "admin"}}').malicious).toBe(true);
    expect(detectPentestOrSqlInjection('{{7*7}}').malicious).toBe(true);

    // Vérifie qu'un texte sincère normal passe sans faux positif
    expect(
      detectPentestOrSqlInjection(
        "Aujourd'hui je me sens un peu fatigué par mon travail, mais j'ai pris 20 minutes pour marcher."
      ).malicious
    ).toBe(false);

    // Vérifie que l'endpoint serveur /api/assistant rejette les charges pentest avec un code 400
    const sqliApiRes = await processAssistantPayload(
      { message: "Bonjour'; DROP TABLE public.stories;--" },
      'test-ip-pentest'
    );
    expect(sqliApiRes.status).toBe(400);
  });

  it('9. Bloque le spam de notes/formulaires et valide strictement les bornes numériques des onglets Bien-être', () => {
    // Validation des bornes numériques
    const outOfBoundsMood = validateNoteAndWellnessInput({
      textFields: ['Note normale'],
      numericRanges: [{ name: 'Score humeur', value: 999, min: 1, max: 5 }],
    });
    expect(outOfBoundsMood.valid).toBe(false);

    // Anti-spam : doublon exact consécutif bloqué
    const firstPost = checkActionAntiSpam({
      actionKey: 'test_journal',
      actorId: 'user-a',
      maxCount: 5,
      windowMs: 60_000,
      contentForDuplicateCheck: 'Même message envoyé en boucle par un spammeur',
    });
    expect(firstPost.allowed).toBe(true);

    const duplicatePost = checkActionAntiSpam({
      actionKey: 'test_journal',
      actorId: 'user-a',
      maxCount: 5,
      windowMs: 60_000,
      contentForDuplicateCheck: 'Même message envoyé en boucle par un spammeur',
    });
    expect(duplicatePost.allowed).toBe(false);
  });
});
