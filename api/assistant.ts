// Fonction Serverless Vercel : /api/assistant
// Garantit qu'aucune clé API secrète (OPENAI_API_KEY, etc.) n'est jamais exposée côté navigateur.
// Inclut : validation des entrées, limitation de débit (rate-limit), détection bienveillante de détresse,
// et moteur réflexif serveur de secours si aucune clé API IA externe n'est configurée.

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
const RATE_LIMIT_MAX_REQUESTS = 12;
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

export function generateServerReflectiveReply(
  message: string,
  distress: boolean,
  history: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  language: 'fr' | 'en' | 'es' | 'de' | 'zh' = 'fr'
): string {
  const lower = message.toLowerCase();
  const turnCount = history.filter((h) => h.role === 'user').length;

  if (language === 'en') {
    if (distress) {
      return "I hear you, and what you are going through sounds very heavy right now. You do not have to carry this alone. Please reach out immediately to one of the verified emergency support numbers displayed below or switch to Human Support (Admin) at the top of this chat.";
    }
    return "Thank you for sharing this openly. Here on Nia-Mind, you do not have to wear a mask.\n\nWhen you pause and take a slow breath, what is the single need that matters most to you right now: rest, clarity, being heard without judgment, or taking one small step forward?";
  }

  if (language === 'es') {
    if (distress) {
      return "Te escucho, y lo que estás atravesando parece muy pesado en este momento. No tienes que llevar esto a solas. Por favor, contacta de inmediato con uno de los recursos de ayuda verificados que aparecen abajo o activa el botón de Relevo Humano (Admin).";
    }
    return "Gracias por compartir esto con sinceridad. Aquí en Nia-Mind no necesitas llevar ninguna máscara.\n\nSi tomas una respiración profunda ahora mismo, ¿cuál es tu necesidad más importante hoy: descanso, claridad, escucha sin juicio o dar un pequeño paso concreto?";
  }

  if (language === 'de') {
    if (distress) {
      return "Ich höre dich, und was du gerade durchmachst, klingt sehr belastend. Du musst das nicht alleine tragen. Bitte wende dich sofort an eine der unten angezeigten verifizierten Hilfsstellen oder nutze den Schalter für menschliche Unterstützung (Admin).";
    }
    return "Danke, dass du das so offen teilst. Hier bei Nia-Mind musst du keine Maske tragen.\n\nWenn du kurz tief durchatmest: Welches Bedürfnis steht für dich heute an erster Stelle – Ruhe, Klarheit, urteilsfreies Zuhören oder ein kleiner konkreter Schritt?";
  }

  if (language === 'zh') {
    if (distress) {
      return "我听到了你的心声，你现在经历的一切听起来非常沉重。你不必独自承担。请立即联系下方经过验证的紧急援助热线，或点击对话顶部的“转接人工支持（管理员）”按钮。";
    }
    return "感谢你如此坦诚地倾诉。在 Nia-Mind，你无需佩戴任何面具。\n\n如果你现在深呼吸一次，你今天最核心的需求是什么：休息、理清思绪、不带评判的倾听，还是迈出小小的一步？";
  }

  if (distress) {
    return (
      "Je t'entends, et ce que tu traverses semble particulièrement lourd en ce moment. " +
      "Tu n'as pas à porter cela seul(e). Comme je suis un assistant numérique et non un service d'urgence ni un professionnel de santé, " +
      "je t'invite vivement à contacter immédiatement l'une des ressources d'aide vérifiées affichées ci-dessous ou un proche de confiance. " +
      "Si tu le souhaites, tu peux aussi déposer une demande dans l'onglet « Demander une écoute humaine »."
    );
  }

  if (lower.includes('comment fonctionne nia-mind') || lower.includes('fonctionne nia-mind')) {
    return (
      "Nia-Mind (« Le vrai sans le masque ») s'organise autour de 5 espaces complémentaires :\n\n" +
      "1. **Cet espace de réflexion IA** pour poser tes idées à ton rythme, sans jugement.\n" +
      "2. **Mon bien-être** pour suivre ton humeur, ton sommeil, ton niveau de stress et faire le point via des questionnaires validés (comme l'indice OMS-5).\n" +
      "3. **Mon journal** strictement privé pour écrire librement avec ou sans amorce.\n" +
      "4. **Histoires** pour lire des témoignages authentiques ou partager le tien de façon anonyme — aucune histoire n'est jamais publiée sans ton autorisation explicite sur la version finale.\n" +
      "5. **Demander une écoute humaine** pour échanger en toute confidentialité avec un écoutant de l'équipe.\n\n" +
      "Par quoi aimerais-tu commencer aujourd'hui ?"
    );
  }

  if (
    lower.includes('sommeil') ||
    lower.includes('dormir') ||
    lower.includes('insomnie') ||
    lower.includes('nuit') ||
    lower.includes('fatigu')
  ) {
    const variants = [
      "Le manque de repos ou la fatigue accumulée brouille souvent toutes nos émotions. Quand le corps est épuisé, chaque difficulté paraît deux fois plus haute.\n\n" +
        "Qu'est-ce qui empêche le plus ton esprit de décrocher le soir en ce moment : des pensées sur ce que tu dois faire demain, ou quelque chose de la journée qui reste en suspens ?",
      "Merci de le partager. La fatigue que l'on cache derrière un sourire quotidien est souvent la plus lourde à porter.\n\n" +
        "Si tu t'accordais ce soir un vrai sas de décompression de 15 minutes loin des écrans et des obligations, de quoi aurais-tu le plus besoin pour relâcher la pression ?",
    ];
    return variants[turnCount % variants.length];
  }

  if (
    lower.includes('stress') ||
    lower.includes('pression') ||
    lower.includes('anxieux') ||
    lower.includes('angoisse') ||
    lower.includes('épuis') ||
    lower.includes('surcharg')
  ) {
    const variants = [
      "Merci de le déposer ici avec franchise. Quand le stress ou la pression prend toute la place, le corps et l'esprit cherchent souvent à tout gérer en même temps.\n\n" +
        "Si tu prends une respiration lente maintenant, quelle est **la chose précise** qui te pèse le plus dans les prochaines 24 heures — celle sur laquelle tu as un vrai pouvoir d'action, même minime, et celle que tu peux t'autoriser à poser un instant ?",
      "Je comprends cette sensation de surcharge. Porter le masque de la personne qui assure tout le temps finit par user en silence.\n\n" +
        "Parmi tout ce que tu portes aujourd'hui, quelle est l'exigence que tu t'imposes à toi-même et que tu pourrais alléger de 20 % sans que le monde s'écroule ?",
    ];
    return variants[turnCount % variants.length];
  }

  if (
    lower.includes('masque') ||
    lower.includes('semblant') ||
    lower.includes('cacher') ||
    lower.includes('honte') ||
    lower.includes('jugement') ||
    lower.includes('culpabil')
  ) {
    return (
      "Faire semblant d'aller bien ou de tout maîtriser demande une énergie immense. Ici, sur Nia-Mind, tu n'as aucun personnage à défendre.\n\n" +
      "Si tu pouvais dire une seule vérité aujourd'hui sans craindre de décevoir qui que ce soit, quelle serait cette phrase ?"
    );
  }

  if (
    lower.includes('seul') ||
    lower.includes('solitude') ||
    lower.includes('isol') ||
    lower.includes('incompris') ||
    lower.includes('personne ne')
  ) {
    return (
      "On peut parfois être entouré toute la journée et se sentir profondément seul avec ce que l'on vit vraiment à l'intérieur.\n\n" +
      "Qu'est-ce que tu aimerais que l'on comprenne de toi en ce moment sans que tu aies besoin de te justifier ? Si tu ressens le besoin d'un échange humain bienveillant, n'hésite pas non plus à utiliser l'onglet « Demander une écoute humaine »."
    );
  }

  if (
    lower.includes('colère') ||
    lower.includes('énerv') ||
    lower.includes('injuste') ||
    lower.includes('frustr') ||
    lower.includes('marre')
  ) {
    return (
      "La colère ou la frustration est souvent le signal sain qu'une de tes limites importantes n'a pas été respectée.\n\n" +
      "Derrière cette irritation légitime, quelle est la limite ou le besoin fondamental (respect, reconnaissance, espace, équité) qui demande à être protégé aujourd'hui ?"
    );
  }

  if (
    lower.includes('mettre des mots') ||
    lower.includes('ressens') ||
    lower.includes('émotion') ||
    lower.includes('triste') ||
    lower.includes('perdu') ||
    lower.includes('vide')
  ) {
    const variants = [
      "Mettre des mots sur ce que l'on ressent sans porter de masque demande déjà du courage. Tu n'as pas besoin de faire des phrases parfaites ici.\n\n" +
        "Si tu devais décrire ce ressenti comme une météo intérieure ou une sensation physique (un poids, un flou, une tension, une fatigue calme), à quoi ressemblerait-il en ce moment ?",
      "C'est tout à fait normal de traverser des zones de flou où l'on ne sait plus très bien nommer ce qui se passe en soi.\n\n" +
        "À quel moment de la journée ce ressenti est-il le plus présent, et y a-t-il un petit moment où il s'apaise, même légèrement ?",
    ];
    return variants[turnCount % variants.length];
  }

  if (
    lower.includes('situation') ||
    lower.includes('décision') ||
    lower.includes('choix') ||
    lower.includes('relation') ||
    lower.includes('travail') ||
    lower.includes('famille') ||
    lower.includes('étude')
  ) {
    return (
      "Prenons le temps de regarder cette situation avec recul, étape par étape.\n\n" +
      "Pour t'aider à y voir plus clair :\n" +
      "- **Les faits** : que s'est-il passé concrètement ?\n" +
      "- **Ton ressenti** : qu'est-ce que cette situation touche d'important pour toi (une valeur, une limite, un besoin de respect ou de clarté) ?\n" +
      "- **Le prochain pas** : qu'est-ce que tu dirais à un ami très cher s'il vivait exactement la même chose ?"
    );
  }

  const generalVariants = [
    "Merci pour ta franchise. Ici, tu n'as aucun rôle à jouer.\n\n" +
      "En te relisant, j'entends que ce sujet compte vraiment pour toi aujourd'hui. " +
      "Qu'est-ce qui te ferait le plus de bien maintenant : continuer à creuser cette pensée ensemble par une question, " +
      "la transformer en note privée dans ton journal, ou explorer une piste concrète d'apaisement ?",
    "Je te lis avec attention. Prendre le temps de formuler cela honnêtement est déjà une vraie démarche pour soi.\n\n" +
      "Quand tu relis ce que tu viens d'écrire, quel est le détail ou le mot qui résonne le plus fort en toi en ce moment ?",
    "Merci de déposer cela en confiance. Si tu regardes cette pensée avec bienveillance envers toi-même, quel est le besoin principal qui se cache derrière aujourd'hui : du repos, de la clarté, de l'écoute ou un changement concret ?",
  ];

  return generalVariants[turnCount % generalVariants.length];
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
          temperature: 0.65,
          max_tokens: 450,
          messages: [
            {
              role: 'system',
              content:
                `Tu es l'Assistant Nia-Mind (« Le vrai sans le masque »). Ton ton est humain, sincère, accessible, chaleureux et non médical. Tu écoutes sans juger, tu poses des questions d'introspection ouvertes, tu ne prétends jamais être un thérapeute ou un médecin, tu ne poses aucun diagnostic clinique et tu ne promets jamais une surveillance continue. ${langInstructionMap[normalizedLang]}`,
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
