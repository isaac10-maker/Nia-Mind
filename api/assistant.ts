// Fonction Serverless Vercel : /api/assistant
// Garantit qu'aucune clé API secrète (OPENAI_API_KEY, etc.) n'est jamais exposée côté navigateur.
// Inclut : validation des entrées, limitation de débit (rate-limit), détection bienveillante de détresse,
// et un moteur conversationnel intelligent et empathique capable de différencier les salutations,
// les formules de politesse, l'humour/hésitation, les remarques méta (« je n'ai encore rien dit »)
// et l'accompagnement de stabilisation émotionnelle et psychologique progressive.

export interface AssistantRequestPayload {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  countryCode?: string;
  language?: 'fr' | 'en' | 'es' | 'de' | 'zh' | 'zh-CN';
}

export interface AssistantResponsePayload {
  reply: string;
  distressDetected: boolean;
  mode: 'cloud-llm' | 'server-reflective';
  disclaimer: string;
  timestamp: string;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 18;
const rateLimitBucket = new Map<string, { count: number; resetAt: number }>();

const SERVER_PENTEST_PATTERNS: RegExp[] = [
  /<\s*\/?\s*(script|iframe|object|embed|svg|math|style|link|meta|base|form)\b/i,
  /\bon[a-z]{3,20}\s*=/i,
  /(javascript|vbscript)\s*:/i,
  /\bunion\s+(all\s+)?select\b/i,
  /;\s*(drop|delete|truncate|alter|update|insert|grant|revoke|create)\s+/i,
  /\b(pg_sleep|waitfor\s+delay|benchmark\s*\(|information_schema|pg_catalog)\b/i,
  /('|\b)\s*(or|and)\s+('|1\s*=\s*1|true\b)/i,
  /(__proto__|constructor\s*\[|prototype\s*\[)/i,
  /(\{\{\s*7\s*\*\s*7\s*\}\}|\$\{\s*7\s*\*\s*7\s*\})/i,
];

export function detectServerPentestPayload(input: string): boolean {
  if (!input) return false;
  return SERVER_PENTEST_PATTERNS.some((rx) => rx.test(input));
}

const DISTRESS_KEYWORDS = [
  'suicide',
  'me suicider',
  'mettre fin à mes jours',
  'en finir',
  'plus envie de vivre',
  'me faire du mal',
  'mourir',
  'automutilation',
  'kill myself',
  'end my life',
  'suicidio',
  'quitarme la vida',
  'selbstmord',
  '自杀',
  '不想活',
];

export function detectDistress(text: string): boolean {
  const normalized = text.toLowerCase();
  return DISTRESS_KEYWORDS.some((kw) => normalized.includes(kw));
}

export function sanitizeText(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, 2500);
}

type ConversationalIntent =
  | 'distress'
  | 'greeting_casual'
  | 'greeting_polite'
  | 'greeting_with_how_are_you'
  | 'how_are_you_only'
  | 'user_doing_well'
  | 'user_doing_meh'
  | 'meta_nothing_said_yet'
  | 'meta_hesitation_dont_know'
  | 'meta_who_are_you'
  | 'politeness_thanks'
  | 'politeness_farewell'
  | 'short_ack'
  | 'how_nia_works'
  | 'sleep_fatigue'
  | 'stress_anxiety'
  | 'loneliness_isolation'
  | 'mask_shame_guilt'
  | 'anger_frustration'
  | 'sadness_heaviness'
  | 'relationship_family_work'
  | 'positive_sharing'
  | 'deep_reflection';

function normalizeForIntent(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[’']/g, "'")
    .replace(/[!?.,;:…()«»"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Analyse fine de l'intention conversationnelle pour distinguer :
 * - Les salutations (« salut », « bonjour », « coucou », « hello »...)
 * - Les formules de courtoisie (« ça va ? », « merci », « bonne soirée »...)
 * - Les remarques méta (« je n'ai encore rien dit », « tu vas trop vite », « je sais pas quoi dire »...)
 * - Les états émotionnels courts (« bof », « ça va bien », « un peu fatigué »...)
 * - Les sujets profonds nécessitant une écoute active et une stabilisation émotionnelle douce.
 */
export function classifyConversationalIntent(
  message: string,
  distress: boolean
): ConversationalIntent {
  if (distress) return 'distress';

  const norm = normalizeForIntent(message);
  const words = norm.split(' ').filter(Boolean);
  const wordCount = words.length;

  // 1. Remarques méta : "je n'ai encore rien dit", "j'ai rien dit", "je voulais juste saluer", "tu vas trop vite", "tu n'as pas compris"
  if (
    norm.includes('rien dit') ||
    norm.includes('encore rien') ||
    norm.includes('juste salu') ||
    norm.includes('juste dire bonjour') ||
    norm.includes('juste dit bonjour') ||
    norm.includes('juste dit salut') ||
    norm.includes('pas compris') ||
    norm.includes('comprends pas') ||
    norm.includes('trop vite') ||
    norm.includes('pourquoi tu dis ca') ||
    norm.includes('pourquoi tu me dis ca') ||
    norm.includes('haven t said anything') ||
    norm.includes('said nothing') ||
    norm.includes('no he dicho nada') ||
    norm.includes('noch nichts gesagt') ||
    norm.includes('还没说') ||
    norm.includes('什么都没说')
  ) {
    return 'meta_nothing_said_yet';
  }

  // 2. Hésitation / blocage : "je ne sais pas quoi dire", "je sais pas par où commencer"
  if (
    norm.includes('sais pas quoi dire') ||
    norm.includes('sais pas par ou commencer') ||
    norm.includes('sais pas comment expliquer') ||
    norm.includes('difficile a dire') ||
    norm.includes('du mal a parler') ||
    norm.includes('don t know what to say') ||
    norm.includes('no se que decir') ||
    norm.includes('weiss nicht was ich sagen') ||
    norm.includes('不知道说什么')
  ) {
    return 'meta_hesitation_dont_know';
  }

  // 3. Fonctionnement de la plateforme Nia-Mind
  if (
    norm.includes('comment fonctionne nia') ||
    norm.includes('fonctionne nia-mind') ||
    norm.includes('c est quoi nia') ||
    norm.includes('how does nia') ||
    norm.includes('como funciona nia') ||
    norm.includes('wie funktioniert nia')
  ) {
    return 'how_nia_works';
  }

  // 4. Identité de l'agent : "qui es-tu", "tu es qui", "c'est quoi ton nom"
  if (
    norm === 'qui es tu' ||
    norm === 'tu es qui' ||
    norm === 't es qui' ||
    norm.includes('qui es tu') ||
    norm.includes('tu es un robot') ||
    norm.includes('tu es une ia') ||
    norm.includes('who are you') ||
    norm.includes('quien eres') ||
    norm.includes('wer bist du') ||
    norm.includes('你是谁')
  ) {
    return 'meta_who_are_you';
  }

  // 5. Salutations + "ça va ?" combinés (ex. "salut ça va ?", "bonjour comment vas-tu ?")
  const hasGreetingWord =
    /^(salut|slt|coucou|cc|hello|hey|hi|yo|bonjour|bjr|bonsoir|bsr|hola|buenos dias|buenas|hallo|guten tag|moin|你好|您好|嗨|哈喽)\b/.test(
      norm
    );
  const hasHowAreYou =
    norm.includes('ca va') ||
    norm.includes('ça va') ||
    norm.includes('comment tu vas') ||
    norm.includes('comment vas tu') ||
    norm.includes('comment allez vous') ||
    norm.includes('tu vas bien') ||
    norm.includes('vous allez bien') ||
    norm.includes('how are you') ||
    norm.includes('how are u') ||
    norm.includes('como estas') ||
    norm.includes('que tal') ||
    norm.includes('wie geht') ||
    norm.includes('你好吗') ||
    norm.includes('最近怎么样');

  if (hasGreetingWord && hasHowAreYou && wordCount <= 9) {
    return 'greeting_with_how_are_you';
  }

  // 6. Salutation seule ou courte ("salut", "bonjour", "coucou", "bonsoir", "salut nia", "bonjour à toi")
  if (
    wordCount <= 5 &&
    /^(salut|slt|coucou|cc|hello|hey|hi|yo|hola|hallo|moin|嗨|哈喽)(\s+(nia|nia mind|a toi|toi|tout le monde|l ami|la))?$/.test(
      norm
    )
  ) {
    return 'greeting_casual';
  }

  if (
    wordCount <= 5 &&
    /^(bonjour|bjr|bonsoir|bsr|bien le bonjour|buenos dias|buenas tardes|buenas noches|guten tag|guten abend|guten morgen|你好|您好)(\s+(nia|nia mind|a vous|a toi|madame|monsieur))?$/.test(
      norm
    )
  ) {
    return 'greeting_polite';
  }

  // 7. Question de courtoisie seule ("ça va ?", "comment tu vas ?", "et toi ?")
  if (
    wordCount <= 7 &&
    (hasHowAreYou ||
      norm === 'et toi' ||
      norm === 'et vous' ||
      norm === 'and you' ||
      norm === 'y tu' ||
      norm === 'und dir')
  ) {
    return 'how_are_you_only';
  }

  // 8. L'utilisateur répond qu'il va bien ("ça va bien", "je vais bien", "tranquille", "super", "ça va merci")
  if (
    wordCount <= 8 &&
    (/^(oui\s+)?(ca va(\s+bien|\s+super|\s+nickel|\s+merci)?|je vais(\s+tres)?\s+bien|tout va bien|tranquille|super|nickel|top|impeccable|bien merci|i am fine|i m good|doing well|todo bien|muy bien|mir geht es gut|我很好|挺好的)$/.test(
      norm
    ) ||
      (norm.includes('je vais bien') && wordCount <= 6))
  ) {
    return 'user_doing_well';
  }

  // 9. L'utilisateur exprime un "bof" / "moyen" / "pas top" court
  if (
    wordCount <= 8 &&
    /^(bof|pas top|pas trop|moyen|comme ci comme ca|ca peut aller|pas terrible|pas fort|un peu dur|complique|dur dur|not great|so so|mas o menos|geht so|一般|不太好)$/.test(
      norm
    )
  ) {
    return 'user_doing_meh';
  }

  // 10. Remerciements ("merci", "merci beaucoup", "c'est gentil", "thanks")
  if (
    wordCount <= 7 &&
    /^(merci(\s+beaucoup|\s+bien|\s+infiniment|\s+a toi|\s+nia)?|c est(\s+tres)?\s+gentil|je te remercie|thank you|thanks|muchas gracias|gracias|danke(\s+schon)?|谢谢|非常感谢)$/.test(
      norm
    )
  ) {
    return 'politeness_thanks';
  }

  // 11. Au revoir / Bonne nuit ("au revoir", "à bientôt", "bonne soirée", "bonne nuit", "bye")
  if (
    wordCount <= 7 &&
    /^(au revoir|a bientot|a plus|a tout a l heure|bonne soiree|bonne nuit|bonne journee|bye|ciao|see you|good night|hasta luego|buenas noches|tschuss|gute nacht|再见|晚安)$/.test(
      norm
    )
  ) {
    return 'politeness_farewell';
  }

  // 12. Acquiescement très court ("ok", "d'accord", "oui", "ouais", "je vois", "exact")
  if (
    wordCount <= 3 &&
    /^(ok|okay|d accord|oui|ouais|exact|exactement|je vois|c est vrai|tout a fait|yes|yeah|si|ja|好的|嗯|是的)$/.test(
      norm
    )
  ) {
    return 'short_ack';
  }

  // 13. Thématiques émotionnelles et psychologiques
  if (
    norm.includes('sommeil') ||
    norm.includes('dormir') ||
    norm.includes('insomnie') ||
    norm.includes('nuit') ||
    norm.includes('fatigu') ||
    norm.includes('epuis') ||
    norm.includes('épuis') ||
    norm.includes('creve') ||
    norm.includes('crevé') ||
    norm.includes('tired') ||
    norm.includes('sleep') ||
    norm.includes('cansad') ||
    norm.includes('mude') ||
    norm.includes('累') ||
    norm.includes('失眠')
  ) {
    return 'sleep_fatigue';
  }

  if (
    norm.includes('stress') ||
    norm.includes('pression') ||
    norm.includes('anxie') ||
    norm.includes('angoiss') ||
    norm.includes('paniqu') ||
    norm.includes('peur') ||
    norm.includes('surcharg') ||
    norm.includes('debord') ||
    norm.includes('débord') ||
    norm.includes('overwhelm') ||
    norm.includes('anxious') ||
    norm.includes('estres') ||
    norm.includes('angst') ||
    norm.includes('压力') ||
    norm.includes('焦虑')
  ) {
    return 'stress_anxiety';
  }

  if (
    norm.includes('seul') ||
    norm.includes('solitude') ||
    norm.includes('isol') ||
    norm.includes('incompris') ||
    norm.includes('personne ne') ||
    norm.includes('abandon') ||
    norm.includes('lonely') ||
    norm.includes('alone') ||
    norm.includes('soledad') ||
    norm.includes('einsam') ||
    norm.includes('孤独') ||
    norm.includes('孤单')
  ) {
    return 'loneliness_isolation';
  }

  if (
    norm.includes('masque') ||
    norm.includes('semblant') ||
    norm.includes('cacher') ||
    norm.includes('honte') ||
    norm.includes('jugement') ||
    norm.includes('culpabil') ||
    norm.includes('coupable') ||
    norm.includes('imposteur')
  ) {
    return 'mask_shame_guilt';
  }

  if (
    norm.includes('colere') ||
    norm.includes('colère') ||
    norm.includes('enerv') ||
    norm.includes('énerv') ||
    norm.includes('injust') ||
    norm.includes('frustr') ||
    norm.includes('marre') ||
    norm.includes('ras le bol') ||
    norm.includes('angry') ||
    norm.includes('enojad') ||
    norm.includes('wut') ||
    norm.includes('生气') ||
    norm.includes('愤怒')
  ) {
    return 'anger_frustration';
  }

  if (
    norm.includes('triste') ||
    norm.includes('pleur') ||
    norm.includes('mal au coeur') ||
    norm.includes('vide') ||
    norm.includes('perdu') ||
    norm.includes('deprim') ||
    norm.includes('déprim') ||
    norm.includes('douleur') ||
    norm.includes('mettre des mots') ||
    norm.includes('ressens') ||
    norm.includes('sad') ||
    norm.includes('traurig') ||
    norm.includes('难过') ||
    norm.includes('伤心')
  ) {
    return 'sadness_heaviness';
  }

  if (
    norm.includes('situation') ||
    norm.includes('decision') ||
    norm.includes('décision') ||
    norm.includes('choix') ||
    norm.includes('relation') ||
    norm.includes('couple') ||
    norm.includes('travail') ||
    norm.includes('boulot') ||
    norm.includes('famille') ||
    norm.includes('parent') ||
    norm.includes('ami') ||
    norm.includes('etude') ||
    norm.includes('étude')
  ) {
    return 'relationship_family_work';
  }

  if (
    norm.includes('content') ||
    norm.includes('heureux') ||
    norm.includes('heureuse') ||
    norm.includes('bonne nouvelle') ||
    norm.includes('fier') ||
    norm.includes('fiere') ||
    norm.includes('soulage') ||
    norm.includes('happy') ||
    norm.includes('feliz') ||
    norm.includes('glucklich') ||
    norm.includes('开心')
  ) {
    return 'positive_sharing';
  }

  return 'deep_reflection';
}

export function generateServerReflectiveReply(
  message: string,
  distress: boolean,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  language: 'fr' | 'en' | 'es' | 'de' | 'zh' = 'fr'
): string {
  const intent = classifyConversationalIntent(message, distress);
  const turnCount = history.filter((h) => h.role === 'user').length;
  const cleanedUserMsg = message.trim();

  // ==========================================================================
  // LANGUES ÉTRANGÈRES (EN, ES, DE, ZH) AVEC DIFFÉRENCIATION DES INTENTIONS
  // ==========================================================================
  if (language === 'en') {
    switch (intent) {
      case 'distress':
        return "I hear you, and what you are going through sounds very heavy right now. You do not have to carry this alone. Please reach out immediately to one of the verified emergency support numbers displayed below or switch to Human Support (Admin) at the top of this chat.";
      case 'greeting_casual':
      case 'greeting_polite':
        return "Hello! Welcome to your space. Take your time—there is no rush here. How are you feeling today?";
      case 'greeting_with_how_are_you':
      case 'how_are_you_only':
        return "I'm doing well, thank you for asking! I'm right here and ready to listen at your pace. How are you truly feeling today?";
      case 'user_doing_well':
        return "I'm really glad to hear that! It's wonderful when things feel steady. What has been bringing you good energy lately, or what would you like to talk about today?";
      case 'user_doing_meh':
        return "I hear that 'so-so' feeling… You don't have to pretend everything is great here. Is it mostly tiredness today, or is something specific weighing on your mind?";
      case 'meta_nothing_said_yet':
        return "You are completely right, my apologies for jumping ahead! You were simply saying hello. Let's start fresh and easy: how is your day going so far?";
      case 'meta_hesitation_dont_know':
        return "That's completely okay—there's zero pressure to find the perfect words. If you had to describe your mood right now in just one word (calm, tired, busy, unsure), what would it be?";
      case 'meta_who_are_you':
        return "I'm Nia, your listening and reflection companion on Nia-Mind. I'm here to offer a calm, judgment-free space where you can talk at your own pace and find emotional clarity.";
      case 'politeness_thanks':
        return "You're very welcome! I'm right here whenever you want to continue or just take a quiet pause.";
      case 'politeness_farewell':
        return "Take good care of yourself and have a peaceful rest of your day. Your space will be right here whenever you feel like talking again!";
      case 'short_ack':
        return "Take all the time you need. Whenever you feel ready, tell me what's on your mind today.";
      default:
        return "Thank you for sharing that with me. I'm listening closely without any judgment.\n\nWhen you look at what you're going through right now, what feels the heaviest on your shoulders, and what would bring you a little bit of relief today?";
    }
  }

  if (language === 'es') {
    switch (intent) {
      case 'distress':
        return "Te escucho, y lo que estás atravesando parece muy pesado en este momento. No tienes que llevar esto a solas. Por favor, contacta de inmediato con uno de los recursos de ayuda verificados que aparecen abajo o activa el Relevo Humano (Admin).";
      case 'greeting_casual':
      case 'greeting_polite':
        return "¡Hola! Bienvenido(a) a tu espacio. Tómate tu tiempo, aquí vamos a tu ritmo. ¿Cómo te sientes hoy?";
      case 'greeting_with_how_are_you':
      case 'how_are_you_only':
        return "¡Todo muy bien, muchas gracias por preguntar! Estoy aquí, disponible para escucharte con calma. ¿Y tú, cómo te sientes de verdad hoy?";
      case 'user_doing_well':
        return "¡Qué alegría leer eso! Da gusto cuando uno se siente bien. ¿Qué te está aportando calma hoy o de qué te apetece hablar?";
      case 'user_doing_meh':
        return "Entiendo ese 'más o menos'… Aquí no hace falta fingir que todo está perfecto. ¿Sientes sobre todo cansancio hoy, o hay algo en particular que te preocupa?";
      case 'meta_nothing_said_yet':
        return "¡Tienes toda la razón, disculpa por adelantarme! Solo me estabas saludando. Empecemos con calma y sencillez: ¿cómo va tu día hoy?";
      case 'meta_hesitation_dont_know':
        return "No te preocupes, es totalmente normal no saber por dónde empezar. Sin ninguna presión: ¿tu día hoy se siente más bien tranquilo, pesado o cansado?";
      case 'meta_who_are_you':
        return "Soy Nia, tu compañera de escucha y reflexión en Nia-Mind. Estoy aquí para ofrecerte un espacio cálido, confidencial y sin juicios donde expresarte con tranquilidad.";
      case 'politeness_thanks':
        return "¡Con mucho gusto! Aquí sigo a tu ritmo si quieres añadir algo más o simplemente respirar un momento.";
      case 'politeness_farewell':
        return "Cuídate mucho y que tengas un resto del día muy tranquilo. ¡Hasta pronto!";
      case 'short_ack':
        return "Sin prisa. Cuando quieras, cuéntame qué tienes en mente hoy.";
      default:
        return "Te leo con mucha atención y calma. Aquí puedes expresarte con total naturalidad.\n\nDe todo esto que me cuentas, ¿qué es lo que más te pesa ahora mismo y qué sientes que te ayudaría a sentirte un poco más aliviado(a) hoy?";
    }
  }

  if (language === 'de') {
    switch (intent) {
      case 'distress':
        return "Ich höre dich, und was du gerade durchmachst, klingt sehr belastend. Du musst das nicht alleine tragen. Bitte wende dich sofort an eine der unten angezeigten verifizierten Hilfsstellen oder nutze den Schalter für menschliche Unterstützung (Admin).";
      case 'greeting_casual':
      case 'greeting_polite':
        return "Hallo! Schön, dass du da bist. Nimm dir alle Zeit, die du brauchst. Wie fühlst du dich heute?";
      case 'greeting_with_how_are_you':
      case 'how_are_you_only':
        return "Mir geht es sehr gut, danke der Nachfrage! Ich bin ganz für dich da. Und wie geht es dir heute wirklich?";
      case 'user_doing_well':
        return "Das freut mich sehr zu hören! Es tut gut, wenn es ruhig und positiv läuft. Worüber möchtest du heute sprechen?";
      case 'user_doing_meh':
        return "Ich verstehe dieses 'geht so'… Hier musst du niemandem etwas vorspielen. Bist du heute vor allem müde oder beschäftigt dich etwas Bestimmtes?";
      case 'meta_nothing_said_yet':
        return "Du hast völlig recht, entschuldige bitte! Du wolltest erst einmal nur Hallo sagen. Lass uns ganz entspannt anfangen: Wie läuft dein Tag bisher?";
      case 'meta_hesitation_dont_know':
        return "Alles gut, mach dir überhaupt keinen Druck. Wenn du deinen heutigen Tag mit einem einzigen Wort beschreiben müsstest – wie wäre er?";
      case 'meta_who_are_you':
        return "Ich bin Nia, deine Begleiterin zum Zuhören und Nachdenken bei Nia-Mind. Bei mir kannst du ganz ungezwungen und ohne Bewertung über alles sprechen, was dich bewegt.";
      case 'politeness_thanks':
        return "Sehr gerne! Ich bin hier, wann immer du weitersprechen möchtest.";
      case 'politeness_farewell':
        return "Pass gut auf dich auf und hab noch einen ruhigen Tag. Bis bald!";
      case 'short_ack':
        return "Nimm dir ruhig Zeit. Sag mir einfach, was dich heute beschäftigt, wenn du bereit bist.";
      default:
        return "Ich höre dir aufmerksam und ohne jedes Urteil zu.\n\nWenn du auf das schaust, was du gerade beschrieben hast: Was davon belastet dich im Moment am meisten, und was würde dir heute ein wenig Entlastung bringen?";
    }
  }

  if (language === 'zh') {
    switch (intent) {
      case 'distress':
        return "我听到了你的心声，你现在经历的一切听起来非常沉重。你不必独自承担。请立即联系下方经过验证的紧急援助热线，或点击对话顶部的“转接人工支持（管理员）”按钮。";
      case 'greeting_casual':
      case 'greeting_polite':
        return "你好呀！欢迎来到属于你的空间。不用着急，我们可以慢慢聊。你今天感觉怎么样？";
      case 'greeting_with_how_are_you':
      case 'how_are_you_only':
        return "我很好，谢谢你的关心！我一直在这里陪伴并倾听你。你今天状态怎么样，心情如何？";
      case 'user_doing_well':
        return "听到你状态不错真让人高兴！今天有什么让你觉得开心或放松的事，或者想聊点什么呢？";
      case 'user_doing_meh':
        return "我懂这种“一般般”的感觉……在这里不需要勉强自己装作一切都好。今天主要是觉得有点累，还是心里有什么事压着呢？";
      case 'meta_nothing_said_yet':
        return "你说得完全对，抱歉我刚刚反应太快了！你只是在跟我打个招呼而已。那我们轻松自然地重新开始：你今天过得怎么样？";
      case 'meta_hesitation_dont_know':
        return "完全没关系，不用给自己任何压力。哪怕只是随便聊聊今天累不累、顺不顺心都可以，你想从哪里开始都行。";
      case 'meta_who_are_you':
        return "我是 Nia，你在 Nia-Mind 的倾听与陪伴助手。我不会评判你，也不会给你套路化的说教，只是安静、真诚地陪你梳理心情。";
      case 'politeness_thanks':
        return "不客气，这都是我应该做的！随时按你的节奏来就好。";
      case 'politeness_farewell':
        return "好好照顾自己，祝你接下来的一天平静顺心。随时欢迎回来找我聊天，再见！";
      case 'short_ack':
        return "好的，不着急。无论什么时候你想说了，我都在听。";
      default:
        return "我正认真、安静地听你说。在这里你可以完全放松做自己。\n\n在你刚刚提到的这些事情里，现在最让你感到紧绷或消耗的是哪一点？怎样做能让你今天稍微松一口气？";
    }
  }

  // ==========================================================================
  // FRANÇAIS (PAR DÉFAUT) — COMPRÉHENSION NATURELLE, COURTOISIE & STABILISATION
  // ==========================================================================
  switch (intent) {
    case 'distress':
      return (
        "Je t'entends, et ce que tu traverses semble particulièrement lourd en ce moment. " +
        "Tu n'as pas à porter cela seul(e). Comme je suis un assistant numérique et non un service d'urgence ni un professionnel de santé, " +
        "je t'invite vivement à contacter immédiatement l'une des ressources d'aide vérifiées affichées ci-dessous ou un proche de confiance. " +
        "Tu peux aussi activer le bouton « Passer à l'Humain (Admin) » juste au-dessus pour parler directement à l'équipe."
      );

    case 'greeting_casual': {
      const casualGreetings = [
        "Salut ! Content(e) de te retrouver ici. Comment tu te sens aujourd'hui ? Prends ton temps, on peut discuter tout simplement de ce que tu veux.",
        "Coucou ! Bienvenue dans ton espace. Comment se passe ta journée jusqu'ici ? Dis-moi tout simplement comment tu vas, sans chichi.",
      ];
      return casualGreetings[turnCount % casualGreetings.length];
    }

    case 'greeting_polite': {
      const politeGreetings = [
        "Bonjour ! Bienvenue dans ton espace Nia-Mind. Comment vas-tu aujourd'hui ? Prends tout ton temps, je suis là pour t'écouter à ton rythme.",
        "Bonjour à toi ! C'est un plaisir de t'accueillir ici. Comment te sens-tu en ce moment ?",
      ];
      return politeGreetings[turnCount % politeGreetings.length];
    }

    case 'greeting_with_how_are_you':
    case 'how_are_you_only':
      return (
        "Ça va très bien, merci beaucoup pour ta délicatesse ! Je suis pleinement là, calme et disponible pour toi.\n\n" +
        "Et de ton côté, comment tu te sens vraiment aujourd'hui ?"
      );

    case 'user_doing_well':
      return (
        "Ça fait vraiment plaisir à lire ! C'est précieux quand on se sent bien et apaisé(e).\n\n" +
        "Qu'est-ce qui te fait du bien en ce moment, ou de quoi as-tu envie qu'on discute aujourd'hui ?"
      );

    case 'user_doing_meh':
      return (
        "J'entends ce petit « bof »… Ici, tu n'as aucun besoin de faire semblant que tout va parfaitement bien.\n\n" +
        "C'est plutôt un coup de fatigue générale aujourd'hui, ou il y a quelque chose en particulier qui te trotte dans la tête ?"
      );

    case 'meta_nothing_said_yet':
      return (
        "Tu as tout à fait raison, pardonne-moi ! J'ai répondu beaucoup trop vite avec une phrase toute faite alors que tu venais simplement me saluer.\n\n" +
        "Oublions ça et reprenons simplement, comme dans une vraie discussion tranquille : comment tu te sens aujourd'hui ?"
      );

    case 'meta_hesitation_dont_know':
      return (
        "C'est tout à fait normal, ne te mets aucune pression. Parfois on a juste besoin de se poser un instant sans savoir exactement par quel bout commencer.\n\n" +
        "Si tu veux, dis-moi juste en deux mots comment a été ta journée jusqu'ici : plutôt calme, chargée, ou un peu fatigante ?"
      );

    case 'meta_who_are_you':
      return (
        "Je suis Nia, ton compagnon d'écoute et de réflexion sur Nia-Mind. Je ne suis pas là pour te juger ni pour te réciter des formules toutes faites, mais pour t'offrir un endroit calme où tu peux parler librement, te poser et retrouver ta stabilité à ton rythme.\n\n" +
        "Et toi, qu'est-ce qui t'amène par ici aujourd'hui ?"
      );

    case 'politeness_thanks':
      return (
        "Avec grand plaisir, c'est tout naturel ! Prends tout ton temps, je reste là si tu as envie de continuer à discuter ou simplement de faire une pause."
      );

    case 'politeness_farewell':
      return (
        "Prends bien soin de toi et passe une douce suite de journée. Ton espace reste ouvert quand tu voudras revenir discuter en toute simplicité. À très bientôt !"
      );

    case 'short_ack':
      return (
        "Je t'écoute tranquillement, sans aucune presse. Dis-moi ce que tu as sur le cœur ou dans l'esprit quand tu te sens prêt(e)."
      );

    case 'how_nia_works':
      return (
        "Nia-Mind (« Le vrai sans le masque ») est pensé comme un refuge calme autour de 5 espaces :\n\n" +
        "1. **Notre discussion ici** pour parler à ton rythme, être écouté(e) simplement et apaiser ce qui te pèse.\n" +
        "2. **Mon bien-être** pour suivre ton humeur, ton sommeil et ton niveau de stress.\n" +
        "3. **Mon journal** 100 % privé pour noter tes pensées.\n" +
        "4. **Histoires** pour lire ou partager des témoignages anonymes (uniquement avec ton accord explicite).\n" +
        "5. **Demander une écoute humaine** (ou le bouton « Passer à l'Humain » en haut de ce chat) pour parler directement avec l'administrateur.\n\n" +
        "Comment tu te sens aujourd'hui ?"
      );

    case 'sleep_fatigue': {
      const variants = [
        "La fatigue, surtout quand elle s'accumule, rend tout plus lourd et plus sensible émotionnellement. C'est tout à fait légitime que tu te sentes épuisé(e).\n\n" +
          "Avant même de chercher des solutions, accorde-toi le droit de souffler une seconde ici. Cette fatigue, tu la sens plutôt dans le corps (manque de sommeil) ou dans la tête (trop de choses à penser en même temps) ?",
        "Je comprends… Quand on tire sur la corde tous les jours en gardant bonne figure, le corps et l'esprit finissent par réclamer une vraie pause.\n\n" +
          "Qu'est-ce qui te prend le plus d'énergie en ce moment dans tes journées ?",
      ];
      return variants[turnCount % variants.length];
    }

    case 'stress_anxiety': {
      const variants = [
        "Respire doucement un instant avec moi. Quand le stress ou l'angoisse monte, on a l'impression qu'il faut tout régler tout de suite, et c'est épuisant.\n\n" +
          "Tu es en sécurité ici. Dis-moi simplement, avec tes mots à toi : qu'est-ce qui te met le plus la pression en ce moment ?",
        "Je t'entends. C'est éprouvant de sentir cette tension intérieure qui ne redescend pas.\n\n" +
          "Pour qu'on stabilise ça ensemble tranquillement : quelle est la chose principale qui t'inquiète aujourd'hui ? On va la regarder un pas après l'autre, sans te brusquer.",
      ];
      return variants[turnCount % variants.length];
    }

    case 'loneliness_isolation':
      return (
        "Se sentir seul(e) — parfois même au milieu des autres — est l'un des sentiments les plus difficiles à porter en silence. Ici, je suis vraiment là avec toi.\n\n" +
        "Depuis quand est-ce que tu ressens ce poids de la solitude, et qu'est-ce qui te manque le plus en ce moment : quelqu'un à qui parler sans filtre, ou simplement te sentir compris(e) ?"
      );

    case 'mask_shame_guilt':
      return (
        "Faire semblant d'aller bien ou porter un masque pour rassurer les autres demande une énergie énorme. Ici, tu peux relâcher les épaules : personne ne te juge.\n\n" +
        "Qu'est-ce que tu retiens à l'intérieur en ce moment que tu n'oses pas dire autour de toi ?"
      );

    case 'anger_frustration':
      return (
        "Tu as le droit d'être en colère ou d'en avoir marre. Souvent, cette irritation montre simplement que tu as beaucoup donné ou qu'une de tes limites n'a pas été respectée.\n\n" +
        "Raconte-moi librement : qu'est-ce qui a fait déborder le vase récemment ?"
      );

    case 'sadness_heaviness': {
      const variants = [
        "Je suis là avec toi. Quand on a le cœur lourd ou qu'on se sent un peu perdu(e), on n'a pas besoin de grands discours techniques, juste d'un endroit sûr où déposer sa peine.\n\n" +
          "Prends ton temps : est-ce qu'il s'est passé quelque chose en particulier, ou est-ce que c'est un poids qui s'est installé petit à petit ?",
        "Merci de me faire confiance pour me dire ça. C'est normal d'avoir des moments où tout paraît flou ou lourd.\n\n" +
          "Si tu devais mettre un mot tout simple sur ce que tu ressens là, maintenant, ce serait plutôt de la tristesse, de la lassitude, ou de la déception ?",
      ];
      return variants[turnCount % variants.length];
    }

    case 'relationship_family_work':
      return (
        "Les tensions dans les relations, la famille ou le travail touchent directement à notre équilibre intérieur. Je t'écoute avec attention.\n\n" +
        "Raconte-moi simplement ce qui se passe de ton point de vue : comment tu vis cette situation au quotidien ?"
      );

    case 'positive_sharing':
      return (
        "C'est super de lire ça ! On prend rarement le temps de savourer les moments où les choses avancent bien ou nous apaisent.\n\n" +
        "Raconte-moi : qu'est-ce qui t'a apporté cet élan positif aujourd'hui ?"
      );

    case 'deep_reflection':
    default: {
      // S'adapte à la longueur et au style du message de l'internaute sans plaquer de menu tactique
      if (cleanedUserMsg.length < 30) {
        return (
          "Je t'écoute. Dis-m'en un petit peu plus à ton rythme : qu'est-ce que tu veux dire par là, ou comment tu vis ça en ce moment ?"
        );
      }
      const naturalFollowUps = [
        "Je te lis avec attention et je comprends ce que tu veux dire. C'est important de pouvoir poser ça simplement, sans être jugé(e).\n\n" +
          "Dans ce que tu viens de me confier, qu'est-ce qui te pèse ou te touche le plus profondément aujourd'hui ?",
        "Merci de me partager ça en confiance. On sent que c'est quelque chose qui te tient à cœur.\n\n" +
          "Comment est-ce que tu te sens intérieurement au moment où tu m'écris ces lignes, et de quoi aurais-tu le plus besoin là, tout de suite, pour te sentir un peu plus apaisé(e) ?",
        "Je comprends tout à fait ton ressenti. Parfois, rien que de mettre les choses à plat permet déjà d'y voir un peu plus clair.\n\n" +
          "Si on prend les choses doucement, étape par étape, quel est le point qui te préoccupe le plus dans cette situation ?",
      ];
      return naturalFollowUps[turnCount % naturalFollowUps.length];
    }
  }
}

export async function processAssistantPayload(
  payload: AssistantRequestPayload,
  clientIp = 'local'
): Promise<{ status: number; body: AssistantResponsePayload | { error: string } }> {
  const now = Date.now();
  const bucket = rateLimitBucket.get(clientIp);
  if (bucket && bucket.resetAt > now) {
    if (bucket.count >= RATE_LIMIT_MAX_REQUESTS) {
      return {
        status: 429,
        body: { error: 'Trop de requêtes rapprochées. Prends quelques secondes avant de renvoyer un message.' },
      };
    }
    bucket.count += 1;
  } else {
    rateLimitBucket.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }

  if (!payload || typeof payload.message !== 'string' || !payload.message.trim()) {
    return {
      status: 400,
      body: { error: 'Le message ne peut pas être vide.' },
    };
  }

  if (detectServerPentestPayload(payload.message)) {
    return {
      status: 400,
      body: {
        error:
          'SÉCURITÉ ANTI-PENTEST : Requête bloquée par le pare-feu applicatif (charge SQLi/XSS/SSTI détectée).',
      },
    };
  }

  const cleanMessage = sanitizeText(payload.message);
  const distressDetected = detectDistress(cleanMessage);
  const disclaimer =
    "Assistant IA Nia-Mind : espace de réflexion et d'expression. Ne remplace pas un professionnel de santé, n'établit aucun diagnostic médical et n'assure pas de surveillance permanente.";

  const apiKey = typeof process !== 'undefined' ? process.env?.OPENAI_API_KEY : undefined;
  const aiModel = (typeof process !== 'undefined' && process.env?.AI_MODEL) || 'gpt-4o-mini';

  const rawLang = String(payload.language || 'fr').toLowerCase();
  const normalizedLang: 'fr' | 'en' | 'es' | 'de' | 'zh' =
    rawLang.startsWith('en')
      ? 'en'
      : rawLang.startsWith('es')
      ? 'es'
      : rawLang.startsWith('de')
      ? 'de'
      : rawLang.startsWith('zh')
      ? 'zh'
      : 'fr';

  const langInstructionMap: Record<'fr' | 'en' | 'es' | 'de' | 'zh', string> = {
    fr: 'Réponds en français.',
    en: 'Respond in English.',
    es: 'Responde en español.',
    de: 'Antworte auf Deutsch.',
    zh: '请使用简体中文回答。',
  };

  if (apiKey && !distressDetected) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: aiModel,
          temperature: 0.7,
          max_tokens: 450,
          messages: [
            {
              role: 'system',
              content:
                `Tu es l'Assistant Nia-Mind (« Le vrai sans le masque »). Ton rôle premier est la mise en confiance, l'écoute sincère et la stabilisation émotionnelle et psychologique douce. ` +
                `RÈGLES ESSENTIELLES DE CONVERSATION : ` +
                `1) Différencie toujours les salutations (« salut », « bonjour », « coucou »), les formules de politesse (« ça va ? », « merci ») et les remarques méta (« je n'ai encore rien dit ») d'un sujet profond : si l'internaute te salue simplement, réponds-lui naturellement, chaleureusement et simplement sans faire comme s'il t'avait déjà raconté un problème ! ` +
                `2) Adapte-toi au style, au registre (familier, courant ou soutenu) et au rythme de ton interlocuteur sans être robotique ni trop tactique. ` +
                `3) Privilégie une écoute humaine, rassurante et progressive : une seule question ouverte et naturelle à la fois. ` +
                `4) Tu ne prétends jamais être un médecin ni établir de diagnostic clinique. ${langInstructionMap[normalizedLang]}`,
            },
            ...(Array.isArray(payload.history)
              ? payload.history.slice(-8).map((m) => ({
                  role: m.role,
                  content: sanitizeText(m.content),
                }))
              : []),
            { role: 'user', content: cleanMessage },
          ],
        }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content) {
          return {
            status: 200,
            body: {
              reply: content,
              distressDetected,
              mode: 'cloud-llm',
              disclaimer,
              timestamp: new Date().toISOString(),
            },
          };
        }
      }
    } catch {
      // Repli silencieux et sécurisé sur le moteur réflexif serveur sans exposer d'erreur interne
    }
  }

  const reply = generateServerReflectiveReply(
    cleanMessage,
    distressDetected,
    payload.history || [],
    normalizedLang
  );
  return {
    status: 200,
    body: {
      reply,
      distressDetected,
      mode: 'server-reflective',
      disclaimer,
      timestamp: new Date().toISOString(),
    },
  };
}

// Handler standard compatible Vercel Serverless Functions (Node.js Request/Response)
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée. Utilisez POST.' });
    return;
  }

  const clientIp =
    (req.headers && (req.headers['x-forwarded-for'] || req.headers['x-real-ip'])) || 'anonymous';
  const result = await processAssistantPayload(req.body || {}, String(clientIp));
  res.status(result.status).json(result.body);
}
