import { describe, expect, it } from 'vitest';
import {
  assertRlsIsolationSnapshot,
  canAccessJournalEntry,
  canAccessPrivateUserData,
  canModifyUserRole,
  checkActionAntiSpam,
  checkAuthSubmissionRateLimit,
  detectPentestOrSqlInjection,
  filterListeningRequestsForRole,
  getPublicSafeStories,
  OFFICIAL_BRAND_NAME,
  OFFICIAL_SLOGAN,
  resetAuthSubmissionRateLimit,
  sanitizeInternalRedirect,
  STORIES_SIGNATURE,
  validateNoteAndWellnessInput,
  validateRealEmailAddress,
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
import {
  classifyConversationalIntent,
  generateServerReflectiveReply,
  processAssistantPayload,
} from '../api/assistant';

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

  it('10. Protège contre les Open Redirects, les fuites de tokens dans les URLs et isole les demandes d’écoute', () => {
    // Open Redirect & fuite de token bloqués
    expect(sanitizeInternalRedirect('https://attacker.example.com/phish')).toBe(
      '/espace/tableau-de-bord'
    );
    expect(sanitizeInternalRedirect('//attacker.example.com')).toBe(
      '/espace/tableau-de-bord'
    );
    expect(sanitizeInternalRedirect('javascript:alert(1)')).toBe(
      '/espace/tableau-de-bord'
    );
    expect(
      sanitizeInternalRedirect(
        '/espace/assistant?access_token=secret123#refresh_token=abc'
      )
    ).toBe('/espace/assistant');

    // Isolation des demandes d'écoute entre membres (RLS)
    const requests = [
      {
        id: 'req-a',
        userId: 'user-a',
        userDisplayName: 'MembreA',
        topic: 'Stress examen',
        message: 'Confidentiel A',
        preferredMode: 'Échange écrit asynchrone' as const,
        preferredSlot: 'Soir',
        status: 'Envoyée' as const,
        listenerReply: null,
        assignedListener: null,
        createdAt: '2026-10-25T10:00:00Z',
        updatedAt: '2026-10-25T10:00:00Z',
      },
      {
        id: 'req-b',
        userId: 'user-b',
        userDisplayName: 'MembreB',
        topic: 'Solitude',
        message: 'Confidentiel B',
        preferredMode: 'Entretien audio planifié' as const,
        preferredSlot: 'Matin',
        status: 'Envoyée' as const,
        listenerReply: null,
        assignedListener: null,
        createdAt: '2026-10-25T10:05:00Z',
        updatedAt: '2026-10-25T10:05:00Z',
      },
    ];
    const seenByUserA = filterListeningRequestsForRole(requests, 'user-a', 'user');
    expect(seenByUserA).toHaveLength(1);
    expect(seenByUserA[0].id).toBe('req-a');
    const seenByListener = filterListeningRequestsForRole(requests, 'user-listener', 'listener');
    expect(seenByListener).toHaveLength(2);
  });

  it('11. Restreint l’accès aux e-mails réels uniquement et limite les tentatives de connexion à 3 fois / 15 secondes', () => {
    expect(validateRealEmailAddress('isaacamegan10@gmail.com').valid).toBe(true);
    expect(validateRealEmailAddress('sarah.kabore@outlook.fr').valid).toBe(true);
    expect(validateRealEmailAddress('fake@yopmail.com').valid).toBe(false);
    expect(validateRealEmailAddress('user@example.com').valid).toBe(false);
    expect(validateRealEmailAddress('test@gmail.com').valid).toBe(false);

    resetAuthSubmissionRateLimit('test-ip-3-per-15s');
    expect(checkAuthSubmissionRateLimit('test-ip-3-per-15s', 3, 15_000).allowed).toBe(true);
    expect(checkAuthSubmissionRateLimit('test-ip-3-per-15s', 3, 15_000).allowed).toBe(true);
    expect(checkAuthSubmissionRateLimit('test-ip-3-per-15s', 3, 15_000).allowed).toBe(true);
    const fourthTry = checkAuthSubmissionRateLimit('test-ip-3-per-15s', 3, 15_000);
    expect(fourthTry.allowed).toBe(false);
    expect(fourthTry.retryAfterSec).toBeGreaterThan(0);
  });

  it('12. Traduit automatiquement toute la plateforme et les échanges dans les 5 langues (FR, EN, ES, DE, ZH) et génère le bilan Diagnostic psychique IA', async () => {
    const {
      tUi,
      translatePlatformText,
      translateMessageForViewer,
      generatePsychicDiagnosticBriefing,
      formatPsychicDiagnosticMessage,
    } = await import('../src/lib/i18nEngine');

    expect(tUi('fr', 'psychicDiagnosticBtn')).toBe('Diagnostic psychique');
    expect(tUi('en', 'psychicDiagnosticBtn')).toBe('Psychic Diagnostic');
    expect(tUi('es', 'psychicDiagnosticBtn')).toBe('Diagnóstico psíquico');
    expect(tUi('de', 'psychicDiagnosticBtn')).toBe('Psychische Diagnostik');
    expect(tUi('zh', 'psychicDiagnosticBtn')).toBe('心理诊断简报');

    // Vérification de la traduction automatique de toute la plateforme (titres, boutons, messages d'accueil)
    const dashboardGreeting = 'Bonjour, @PlumeSincere. Prends le temps d’être toi-même.';
    expect(translatePlatformText(dashboardGreeting, 'fr')).toBe(dashboardGreeting);
    expect(translatePlatformText(dashboardGreeting, 'en')).toBe(
      'Hello, @PlumeSincere. Take the time to be yourself.'
    );
    expect(translatePlatformText(dashboardGreeting, 'es')).toBe(
      'Hola, @PlumeSincere. Tómate el tiempo de ser tú mismo(a).'
    );
    expect(translatePlatformText(dashboardGreeting, 'de')).toBe(
      'Hallo, @PlumeSincere. Nimm dir Zeit, ganz du selbst zu sein.'
    );
    expect(translatePlatformText(dashboardGreeting, 'zh')).toBe(
      '你好，@PlumeSincere。请放慢脚步，安心做回自己。'
    );

    const msgFr = 'Bonjour. Je ressens beaucoup de stress et de fatigue en ce moment.';
    expect(translateMessageForViewer(msgFr, 'fr')).toBe(msgFr);
    expect(translateMessageForViewer(msgFr, 'en')).toContain('stress and fatigue');
    expect(translateMessageForViewer(msgFr, 'zh')).toContain('压力和疲惫');

    const briefing = generatePsychicDiagnosticBriefing({
      userPseudonym: 'PlumeSincere',
      messages: [
        { sender: 'user', content: 'Je me sens épuisé par la pression au travail et le manque de sommeil.' },
        { sender: 'assistant', content: 'Je t’entends.' },
      ],
    });
    expect(briefing.emotionalTone).toContain('Surcharge');
    const formattedFr = formatPsychicDiagnosticMessage(briefing, 'fr');
    expect(formattedFr).toContain('BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE (@PlumeSincere)');
    const formattedEn = formatPsychicDiagnosticMessage(briefing, 'en');
    expect(formattedEn).toContain('AI ANALYSIS BRIEFING — PSYCHIC DIAGNOSTIC');
  });

  it('13. Garantit une traduction centralisée 100 % complète (fr, en, es, de, zh-CN) sans mélange de langues et avec retour exact au français', async () => {
    const {
      canonicalizeToFrench,
      getHtmlLangAttribute,
      normalizeLanguageCode,
      translatePlatformText,
    } = await import('../src/lib/i18nEngine');
    const { QUESTIONNAIRE_CATALOG, INITIAL_DAILY_TIPS, INITIAL_HELP_RESOURCES } = await import(
      '../src/lib/seedData'
    );

    // Support de zh-CN et zh
    expect(normalizeLanguageCode('zh-CN')).toBe('zh');
    expect(getHtmlLangAttribute('zh-CN')).toBe('zh-CN');
    expect(getHtmlLangAttribute('fr')).toBe('fr');

    // Vérifie qu'une phrase complexe contenant des sous-mots ("Conseils", "Histoires") est traduite intégralement sans franglais
    const complexHeading = 'Bibliothèque de Conseils & Pistes d’Introspection';
    expect(translatePlatformText(complexHeading, 'en')).toBe(
      'Library of Tips & Introspection Prompts'
    );
    expect(translatePlatformText(complexHeading, 'es')).toBe(
      'Biblioteca de Consejos y Pistas de Introspección'
    );
    expect(translatePlatformText(complexHeading, 'de')).toBe(
      'Bibliothek für Impulse & Selbstreflexion'
    );
    expect(translatePlatformText(complexHeading, 'zh-CN')).toBe('每日建议与自我探索文库');

    // Aller-retour multi-langues FR -> EN -> ES -> DE -> ZH-CN -> FR sans perte
    const enVal = translatePlatformText(complexHeading, 'en');
    const esFromEn = translatePlatformText(enVal, 'es');
    expect(esFromEn).toBe('Biblioteca de Consejos y Pistas de Introspección');
    const deFromEs = translatePlatformText(esFromEn, 'de');
    expect(deFromEs).toBe('Bibliothek für Impulse & Selbstreflexion');
    const zhFromDe = translatePlatformText(deFromEs, 'zh-CN');
    expect(zhFromDe).toBe('每日建议与自我探索文库');
    const backToFr = canonicalizeToFrench(zhFromDe);
    expect(backToFr).toBe(complexHeading);

    // Vérifie la couverture de tous les questionnaires, conseils du jour et ressources d'aide dans les 5 langues
    for (const q of QUESTIONNAIRE_CATALOG) {
      for (const lang of ['en', 'es', 'de', 'zh-CN'] as const) {
        expect(translatePlatformText(q.title, lang)).not.toBe(q.title);
        for (const item of q.questions) {
          expect(translatePlatformText(item, lang)).not.toBe(item);
        }
      }
    }

    for (const tip of INITIAL_DAILY_TIPS) {
      for (const lang of ['en', 'es', 'de', 'zh-CN'] as const) {
        expect(translatePlatformText(tip.title, lang)).not.toBe(tip.title);
        expect(translatePlatformText(tip.summary, lang)).not.toBe(tip.summary);
      }
    }

    for (const res of INITIAL_HELP_RESOURCES) {
      for (const lang of ['en', 'es', 'de', 'zh-CN'] as const) {
        expect(translatePlatformText(res.description, lang)).not.toBe(res.description);
      }
    }
  });

  it('14. Différencie intelligemment les salutations, la politesse, les remarques méta et la stabilisation émotionnelle', async () => {
    // 1. Simple salutation ("salut", "bonjour")
    expect(classifyConversationalIntent('salut', false)).toBe('greeting_casual');
    expect(classifyConversationalIntent('Bonjour', false)).toBe('greeting_polite');
    const salutReply = generateServerReflectiveReply('salut', false, [], 'fr');
    expect(salutReply).toContain('Salut');
    expect(salutReply).not.toContain('ce sujet compte vraiment pour toi');

    // 2. Remarque méta ("je n'ai encore rien dit")
    expect(classifyConversationalIntent("je n'ai encore rien dit", false)).toBe(
      'meta_nothing_said_yet'
    );
    const metaReply = generateServerReflectiveReply(
      "je n'ai encore rien dit",
      false,
      [],
      'fr'
    );
    expect(metaReply).toContain('Tu as tout à fait raison');

    // 3. Courtoisie ("salut ça va ?", "merci beaucoup")
    expect(classifyConversationalIntent('salut ça va ?', false)).toBe(
      'greeting_with_how_are_you'
    );
    expect(classifyConversationalIntent('merci beaucoup', false)).toBe(
      'politeness_thanks'
    );

    // 4. Stabilisation émotionnelle face au stress / anxiété
    expect(
      classifyConversationalIntent(
        'Je me sens vraiment stressé et sous pression au travail',
        false
      )
    ).toBe('stress_anxiety');
    const stressReply = generateServerReflectiveReply(
      'Je me sens vraiment stressé et sous pression au travail',
      false,
      [],
      'fr'
    );
    expect(stressReply).toContain('Respire doucement');
  });

  it('15. Propose le basculement humain et refuse poliment les sujets hors Nia-Mind', () => {
    expect(classifyConversationalIntent('je veux parler à un humain', false)).toBe(
      'request_human_assistance'
    );
    expect(classifyConversationalIntent('je demande une assistance humaine', false)).toBe(
      'request_human_assistance'
    );
    const humanReply = generateServerReflectiveReply(
      'je veux parler à un humain',
      false,
      [],
      'fr'
    );
    expect(humanReply).toContain('Basculer');
    expect(humanReply).toContain("Passer à l'Humain");
    expect(humanReply).not.toContain("Dis-m'en un petit peu plus");

    expect(classifyConversationalIntent('écris-moi un code python pour trier une liste', false)).toBe(
      'off_topic'
    );
    const outsideReply = generateServerReflectiveReply(
      'écris-moi un code python pour trier une liste',
      false,
      [],
      'fr'
    );
    expect(outsideReply).toContain('Nia-Mind');
    expect(outsideReply).toContain('assistance humaine');

    expect(
      classifyConversationalIntent('dans ma culture on cache sa tristesse', false)
    ).not.toBe('off_topic');
    expect(
      classifyConversationalIntent('Parle-moi des proverbes sur la parole et le silence', false)
    ).toBe('general_culture');
    const cultureReply = generateServerReflectiveReply(
      'Parle-moi du masque social dans les cultures d’Afrique de l’Ouest',
      false,
      [],
      'fr'
    );
    expect(cultureReply).toContain('masque');
    expect(cultureReply).not.toContain('Désolé, je ne réponds qu');
  });
});
