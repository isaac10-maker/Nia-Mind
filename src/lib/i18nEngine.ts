export type SupportedLanguage = 'fr' | 'en' | 'es' | 'de' | 'zh';

export const LANGUAGE_META: Record<
  SupportedLanguage,
  { code: SupportedLanguage; label: string; short: string }
> = {
  fr: { code: 'fr', label: 'Français', short: 'FR' },
  en: { code: 'en', label: 'English', short: 'EN' },
  es: { code: 'es', label: 'Español', short: 'ES' },
  de: { code: 'de', label: 'Deutsch', short: 'DE' },
  zh: { code: 'zh', label: '中文', short: '中文' },
};

export interface UiTranslations {
  navHome: string;
  navResources: string;
  navTips: string;
  navStories: string;
  navAbout: string;
  navAssistant: string;
  navDashboard: string;
  navListening: string;
  navWellness: string;
  navJournal: string;
  navProfile: string;
  navPrivacy: string;
  login: string;
  register: string;
  logout: string;
  mySpace: string;
  motivationBanner: string;
  lightMode: string;
  darkMode: string;
  switchToHuman: string;
  switchToAi: string;
  humanHandoverActive: string;
  psychicDiagnosticBtn: string;
  sendDiagnosticBtn: string;
  assistantThinking: string;
  privateAdminInterlocutorNotice: string;
  recommendPseudoLabel: string;
  banUserBtn: string;
  disconnectUserBtn: string;
  deleteUserBtn: string;
}

export const UI_TRANSLATIONS: Record<SupportedLanguage, UiTranslations> = {
  fr: {
    navHome: 'Accueil',
    navResources: 'Nos ressources',
    navTips: 'Conseils',
    navStories: 'Histoires',
    navAbout: 'À propos',
    navAssistant: 'Assistance & Espace',
    navDashboard: 'Tableau de bord',
    navListening: 'Demander une écoute humaine',
    navWellness: 'Mon bien-être',
    navJournal: 'Mon journal',
    navProfile: 'Mon profil',
    navPrivacy: 'Confidentialité et paramètres',
    login: 'Connexion',
    register: 'S’inscrire',
    logout: 'Déconnexion',
    mySpace: 'Mon espace',
    motivationBanner: 'Motivation & Conseils',
    lightMode: 'Mode clair',
    darkMode: 'Mode sombre',
    switchToHuman: 'Passer à l’Humain (Admin)',
    switchToAi: 'Repasser à l’IA Nia-Mind',
    humanHandoverActive: 'Relais Humain actif — L’Admin a repris la main de la discussion',
    psychicDiagnosticBtn: 'Diagnostic psychique',
    sendDiagnosticBtn: 'Envoyer le bilan à l’interlocuteur',
    assistantThinking: 'Nia analyse votre requête…',
    privateAdminInterlocutorNotice:
      'Discussion chiffrée : seuls vous et l’administrateur pouvez lire ces messages.',
    recommendPseudoLabel: 'Ton pseudonyme recommandé (affiché sur le site)',
    banUserBtn: 'Bloquer / Bannir avec motif',
    disconnectUserBtn: 'Déconnecter',
    deleteUserBtn: 'Supprimer',
  },
  en: {
    navHome: 'Home',
    navResources: 'Resources',
    navTips: 'Daily Tips',
    navStories: 'Stories',
    navAbout: 'About',
    navAssistant: 'AI & Personal Space',
    navDashboard: 'Dashboard',
    navListening: 'Request Human Listening',
    navWellness: 'My Well-being',
    navJournal: 'My Journal',
    navProfile: 'My Profile',
    navPrivacy: 'Privacy & Settings',
    login: 'Sign in',
    register: 'Sign up',
    logout: 'Sign out',
    mySpace: 'My Space',
    motivationBanner: 'Motivation & Advice',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    switchToHuman: 'Switch to Human (Admin)',
    switchToAi: 'Switch back to Nia-Mind AI',
    humanHandoverActive: 'Human Handover active — Admin has taken over the conversation',
    psychicDiagnosticBtn: 'Psychic Diagnostic',
    sendDiagnosticBtn: 'Send briefing to interlocutor',
    assistantThinking: 'Nia is analyzing your request…',
    privateAdminInterlocutorNotice:
      'Private pack: only you and the administrator can read these messages.',
    recommendPseudoLabel: 'Your recommended pseudonym (displayed on site)',
    banUserBtn: 'Block / Ban with reason',
    disconnectUserBtn: 'Disconnect',
    deleteUserBtn: 'Delete',
  },
  es: {
    navHome: 'Inicio',
    navResources: 'Recursos',
    navTips: 'Consejos',
    navStories: 'Historias',
    navAbout: 'Acerca de',
    navAssistant: 'Asistencia y Espacio',
    navDashboard: 'Panel personal',
    navListening: 'Solicitar escucha humana',
    navWellness: 'Mi bienestar',
    navJournal: 'Mi diario',
    navProfile: 'Mi perfil',
    navPrivacy: 'Privacidad y ajustes',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    logout: 'Cerrar sesión',
    mySpace: 'Mi espacio',
    motivationBanner: 'Motivación y Consejos',
    lightMode: 'Modo claro',
    darkMode: 'Modo oscuro',
    switchToHuman: 'Pasar a Humano (Admin)',
    switchToAi: 'Volver a la IA Nia-Mind',
    humanHandoverActive: 'Relevo humano activo — El Admin ha tomado el control del chat',
    psychicDiagnosticBtn: 'Diagnóstico psíquico',
    sendDiagnosticBtn: 'Enviar informe al interlocutor',
    assistantThinking: 'Nia está analizando tu consulta…',
    privateAdminInterlocutorNotice:
      'Conversación privada: solo tú y el administrador pueden leer estos mensajes.',
    recommendPseudoLabel: 'Tu seudónimo recomendado (visible en el sitio)',
    banUserBtn: 'Bloquear / Suspender con motivo',
    disconnectUserBtn: 'Desconectar',
    deleteUserBtn: 'Eliminar',
  },
  de: {
    navHome: 'Startseite',
    navResources: 'Hilfsangebote',
    navTips: 'Impulse',
    navStories: 'Geschichten',
    navAbout: 'Über uns',
    navAssistant: 'KI & Mein Bereich',
    navDashboard: 'Übersicht',
    navListening: 'Menschliches Zuhören anfragen',
    navWellness: 'Mein Wohlbefinden',
    navJournal: 'Mein Tagebuch',
    navProfile: 'Mein Profil',
    navPrivacy: 'Datenschutz & Einstellungen',
    login: 'Anmelden',
    register: 'Registrieren',
    logout: 'Abmelden',
    mySpace: 'Mein Bereich',
    motivationBanner: 'Motivation & Impulse',
    lightMode: 'Heller Modus',
    darkMode: 'Dunkler Modus',
    switchToHuman: 'Zu Mensch wechseln (Admin)',
    switchToAi: 'Zurück zur Nia-Mind KI',
    humanHandoverActive: 'Menschliche Übergabe aktiv — Admin führt das Gespräch',
    psychicDiagnosticBtn: 'Psychische Diagnostik',
    sendDiagnosticBtn: 'Bericht an Gesprächspartner senden',
    assistantThinking: 'Nia analysiert deine Anfrage…',
    privateAdminInterlocutorNotice:
      'Privates Gesprächspaket: Nur du und der Administrator können diese Nachrichten lesen.',
    recommendPseudoLabel: 'Dein empfohlenes Pseudonym (auf der Website angezeigt)',
    banUserBtn: 'Sperren / Bannen mit Grund',
    disconnectUserBtn: 'Trennen',
    deleteUserBtn: 'Löschen',
  },
  zh: {
    navHome: '首页',
    navResources: '援助资源',
    navTips: '每日建议',
    navStories: '真实故事',
    navAbout: '关于我们',
    navAssistant: '智能助手与空间',
    navDashboard: '个人仪表盘',
    navListening: '申请人工倾听',
    navWellness: '身心健康',
    navJournal: '私密日记',
    navProfile: '个人资料',
    navPrivacy: '隐私与设置',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    mySpace: '我的空间',
    motivationBanner: '每日激励与建议',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    switchToHuman: '切换至人工 (管理员)',
    switchToAi: '切换回 Nia-Mind 智能芯片',
    humanHandoverActive: '人工接管已开启 — 管理员已接手当前对话',
    psychicDiagnosticBtn: '心理诊断简报',
    sendDiagnosticBtn: '向对话者发送评估报告',
    assistantThinking: 'Nia 正在分析您的请求…',
    privateAdminInterlocutorNotice: '加密对话包：仅您本人与管理员可阅读此对话。',
    recommendPseudoLabel: '推荐使用的匿名昵称（仅在站内显示昵称）',
    banUserBtn: '封禁并发送原因',
    disconnectUserBtn: '强制下线',
    deleteUserBtn: '删除账户',
  },
};

export function tUi(lang: SupportedLanguage, key: keyof UiTranslations): string {
  return UI_TRANSLATIONS[lang]?.[key] || UI_TRANSLATIONS.fr[key];
}

const PHRASE_DICTIONARY: Array<{
  fr: string;
  en: string;
  es: string;
  de: string;
  zh: string;
}> = [
  {
    fr: "Bonjour. Tu peux prendre ton temps. Qu'aimerais-tu exprimer ou comprendre aujourd'hui ?",
    en: 'Hello. You can take your time. What would you like to express or understand today?',
    es: 'Hola. Puedes tomarte tu tiempo. ¿Qué te gustaría expresar o comprender hoy?',
    de: 'Hallo. Du kannst dir Zeit lassen. Was möchtest du heute ausdrücken oder verstehen?',
    zh: '你好。请放慢脚步，不必着急。今天你想表达或理清什么心绪？',
  },
  {
    fr: "J'ai besoin de mettre des mots sur ce que je ressens.",
    en: 'I need to put words to what I am feeling.',
    es: 'Necesito poner en palabras lo que siento.',
    de: 'Ich möchte in Worte fassen, was ich gerade fühle.',
    zh: '我需要把内心的感受用语言表达出来。',
  },
  {
    fr: 'Je veux mieux gérer mon stress.',
    en: 'I want to manage my stress better.',
    es: 'Quiero gestionar mejor mi estrés.',
    de: 'Ich möchte meinen Stress besser bewältigen.',
    zh: '我想更好地管理自己的压力。',
  },
  {
    fr: 'Aide-moi à réfléchir à une situation.',
    en: 'Help me reflect on a situation.',
    es: 'Ayúdame a reflexionar sobre una situación.',
    de: 'Hilf mir, über eine Situation nachzudenken.',
    zh: '请帮我梳理并思考一个处境。',
  },
  {
    fr: 'Comment fonctionne Nia-Mind ?',
    en: 'How does Nia-Mind work?',
    es: '¿Cómo funciona Nia-Mind?',
    de: 'Wie funktioniert Nia-Mind?',
    zh: 'Nia-Mind 是如何运作的？',
  },
  {
    fr: 'Relais Humain activé : L’IA Nia-Mind a transmis la main de cette discussion à l’Administrateur. Vos échanges ici sont privés et lisibles uniquement par vous et l’administrateur.',
    en: 'Human Handover activated: Nia-Mind AI has handed control of this conversation to the Administrator. Your exchanges here are private and readable only by you and the administrator.',
    es: 'Relevo Humano activado: La IA Nia-Mind ha entregado el control de esta conversación al Administrador. Tus mensajes aquí son privados y legibles solo por ti y el administrador.',
    de: 'Menschliche Übergabe aktiviert: Die Nia-Mind KI hat dieses Gespräch an den Administrator übergeben. Eure Nachrichten sind privat und nur für dich und den Administrator lesbar.',
    zh: '人工接管已激活：Nia-Mind 智能助手已将本次对话交由管理员接手。您在此处的交流完全私密，仅您与管理员可见。',
  },
];

export function translateMessageForViewer(
  content: string,
  targetLang: SupportedLanguage
): string {
  const clean = (content || '').trim();
  if (!clean) return content;

  for (const entry of PHRASE_DICTIONARY) {
    if (
      clean === entry.fr ||
      clean === entry.en ||
      clean === entry.es ||
      clean === entry.de ||
      clean === entry.zh
    ) {
      return entry[targetLang];
    }
  }

  if (targetLang === 'fr') {
    return content;
  }

  const tokenReplacements: Record<Exclude<SupportedLanguage, 'fr'>, Array<[RegExp, string]>> = {
    en: [
      [/BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE/gi, 'AI ANALYSIS BRIEFING — PSYCHIC DIAGNOSTIC'],
      [/Tonalité émotionnelle dominante/gi, 'Dominant emotional tone'],
      [/Facteurs identifiés/gi, 'Identified factors'],
      [/Piste d’apaisement recommandée/gi, 'Recommended soothing path'],
      [/Synthèse pour l’interlocuteur/gi, 'Summary for interlocutor'],
      [/Bonjour/gi, 'Hello'],
      [/Merci pour ta confiance/gi, 'Thank you for your trust'],
      [/stress/gi, 'stress'],
      [/sommeil/gi, 'sleep'],
      [/fatigue/gi, 'fatigue'],
      [/solitude/gi, 'loneliness'],
    ],
    es: [
      [/BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE/gi, 'INFORME DE ANÁLISIS IA — DIAGNÓSTICO PSÍQUICO'],
      [/Tonalité émotionnelle dominante/gi, 'Tono emocional dominante'],
      [/Facteurs identifiés/gi, 'Factores identificados'],
      [/Piste d’apaisement recommandée/gi, 'Vía de calma recomendada'],
      [/Synthèse pour l’interlocuteur/gi, 'Síntesis para el interlocutor'],
      [/Bonjour/gi, 'Hola'],
      [/Merci pour ta confiance/gi, 'Gracias por tu confianza'],
      [/sommeil/gi, 'sueño'],
      [/fatigue/gi, 'fatiga'],
      [/solitude/gi, 'soledad'],
    ],
    de: [
      [/BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE/gi, 'KI-ANALYSEBERICHT — PSYCHISCHE DIAGNOSTIK'],
      [/Tonalité émotionnelle dominante/gi, 'Dominante emotionale Stimmung'],
      [/Facteurs identifiés/gi, 'Identifizierte Faktoren'],
      [/Piste d’apaisement recommandée/gi, 'Empfohlener Beruhigungsweg'],
      [/Synthèse pour l’interlocuteur/gi, 'Zusammenfassung für den Gesprächspartner'],
      [/Bonjour/gi, 'Hallo'],
      [/Merci pour ta confiance/gi, 'Danke für dein Vertrauen'],
      [/sommeil/gi, 'Schlaf'],
      [/fatigue/gi, 'Erschöpfung'],
      [/solitude/gi, 'Einsamkeit'],
    ],
    zh: [
      [/BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE/gi, 'AI 智能分析简报 — 心理诊断报告'],
      [/Tonalité émotionnelle dominante/gi, '主导情绪状态'],
      [/Facteurs identifiés/gi, '识别出的关键因素'],
      [/Piste d’apaisement recommandée/gi, '建议的舒缓与调节方案'],
      [/Synthèse pour l’interlocuteur/gi, '致对话者的综合反馈'],
      [/Bonjour/gi, '您好'],
      [/Merci pour ta confiance/gi, '感谢您的信任'],
      [/stress/gi, '压力'],
      [/sommeil/gi, '睡眠'],
      [/fatigue/gi, '疲惫'],
      [/solitude/gi, '孤独感'],
    ],
  };

  let translated = content;
  for (const [pattern, replacement] of tokenReplacements[targetLang]) {
    translated = translated.replace(pattern, replacement);
  }

  const badgeByLang: Record<Exclude<SupportedLanguage, 'fr'>, string> = {
    en: '[Auto-translated • EN]',
    es: '[Traducido auto • ES]',
    de: '[Auto-Übersetzung • DE]',
    zh: '[自动翻译 • 中文]',
  };

  if (translated.startsWith('[')) {
    return translated;
  }
  return `${badgeByLang[targetLang]} ${translated}`;
}

export interface PsychicDiagnosticBriefing {
  userPseudonym: string;
  exchangeCount: number;
  emotionalTone: string;
  keyFactors: string[];
  recommendedAction: string;
  summaryForUser: string;
  generatedAt: string;
}

export function generatePsychicDiagnosticBriefing(params: {
  messages: Array<{ sender: 'user' | 'assistant' | 'admin'; content: string }>;
  userPseudonym: string;
}): PsychicDiagnosticBriefing {
  const userMsgs = params.messages.filter((m) => m.sender === 'user');
  const fullText = userMsgs.map((m) => m.content.toLowerCase()).join(' ');

  let emotionalTone = 'Recherche de clarté et besoin d’écoute attentive';
  const keyFactors: string[] = [];
  let recommendedAction =
    'Prendre 5 minutes de respiration calme, noter une seule priorité douce pour la journée et relâcher l’auto-jugement.';

  if (/(stress|pression|surcharge|épuis|fatigu|lourd|travail|examen)/i.test(fullText)) {
    emotionalTone = 'Surcharge mentale & fatigue émotionnelle accumulée';
    keyFactors.push('Pression quotidienne élevée', 'Besoin de récupération mentale');
    recommendedAction =
      'Fractionner les obligations en une seule micro-étape aujourd’hui et protéger un temps de repos sans écran ce soir.';
  }

  if (/(seul|solitude|isol|incompris|personne|vide|triste)/i.test(fullText)) {
    emotionalTone = 'Sentiment d’isolement & besoin de lien authentique';
    keyFactors.push('Vécu de solitude intérieure', 'Besoin d’espace de parole sécurisé');
    recommendedAction =
      'Maintenir un fil d’expression régulier (Journal ou Écoute humaine Nia-Mind) sans garder le silence sur ses ressentis.';
  }

  if (/(sommeil|dormir|nuit|insomnie|réveil)/i.test(fullText)) {
    keyFactors.push('Perturbation du rythme de sommeil et hypervigilance');
  }

  if (/(peur|anxi|angoiss|doute|avenir|incertitude)/i.test(fullText)) {
    keyFactors.push('Anticipation anxieuse face à une décision ou à l’avenir');
  }

  if (keyFactors.length === 0) {
    keyFactors.push(
      'Démarche volontaire d’introspection',
      'Besoin de mettre des mots sincères sur son vécu actuel'
    );
  }

  const summaryForUser = `BILAN D’ANALYSE IA — DIAGNOSTIC PSYCHIQUE (@${params.userPseudonym})
• Tonalité émotionnelle dominante : ${emotionalTone}
• Facteurs identifiés (${userMsgs.length} message(s) analysé(s)) : ${keyFactors.join(' ; ')}
• Piste d’apaisement recommandée : ${recommendedAction}
• Synthèse pour l’interlocuteur : Ce bilan non médical a été généré par la puce d’intelligence Nia-Mind et validé par l’Administrateur pour t’aider à y voir plus clair, à ton rythme.`;

  return {
    userPseudonym: params.userPseudonym,
    exchangeCount: params.messages.length,
    emotionalTone,
    keyFactors,
    recommendedAction,
    summaryForUser,
    generatedAt: new Date().toISOString(),
  };
}

export function formatPsychicDiagnosticMessage(briefing: PsychicDiagnosticBriefing): string {
  return briefing.summaryForUser;
}
