import type { SupportedLanguage } from './i18nEngine';

export interface Riddle {
  id: string;
  prompt: string;
  answer: string;
}

export interface QuizChoice {
  id: string;
  label: string;
}

export interface QuizQuestion {
  prompt: string;
  choices: QuizChoice[];
}

export interface LeisurePack {
  eyebrow: string;
  title: string;
  lead: string;
  disclaimer: string;
  riddleTitle: string;
  reveal: string;
  hide: string;
  quizTitle: string;
  next: string;
  resultTitle: string;
  again: string;
  keep: string;
  kept: string;
  riddles: Riddle[];
  questions: QuizQuestion[];
  portraits: Record<string, { title: string; text: string }>;
}

const packs: Record<SupportedLanguage, LeisurePack> = {
  fr: {
    eyebrow: 'Coin loisir',
    title: 'Devinettes & miroir du jour',
    lead: 'Un petit jeu pour rester, sourire, et mieux te repérer. Rien ici n’est un bilan.',
    disclaimer: 'Jeu de miroir, pas un diagnostic. Pour une écoute réelle, l’assistant et le journal restent là.',
    riddleTitle: 'Devinettes douces',
    reveal: 'Voir la réponse',
    hide: 'Cacher',
    quizTitle: 'Quiz minute',
    next: 'Question suivante',
    resultTitle: 'Ton portrait joueur',
    again: 'Rejouer',
    keep: 'Garder une note privée',
    kept: 'Note gardée. Elle partira dans ton journal à la reconnexion si tu es hors ligne.',
    riddles: [
      { id: 'mask', prompt: 'Je tombe dès que tu dis la vérité. Qui suis-je ?', answer: 'Le masque.' },
      { id: 'rest', prompt: 'Je ne suis pas une fuite, pourtant je te rends plus clair. Qui suis-je ?', answer: 'Une pause.' },
      { id: 'word', prompt: 'Plus je suis nommé, moins je pèse. Qui suis-je ?', answer: 'Un sentiment.' },
    ],
    questions: [
      {
        prompt: 'Quand la journée pèse, tu commences plutôt par…',
        choices: [
          { id: 'a', label: 'Écrire une phrase vraie' },
          { id: 'b', label: 'Marcher ou changer d’air' },
          { id: 'c', label: 'Parler à quelqu’un de sûr' },
        ],
      },
      {
        prompt: 'Devant une devinette, tu…',
        choices: [
          { id: 'a', label: 'Cherches le sens caché' },
          { id: 'b', label: 'Tentes vite, quitte à rire' },
          { id: 'c', label: 'Demandes un indice' },
        ],
      },
      {
        prompt: 'Ce qui te donne envie de rester sur un site, c’est…',
        choices: [
          { id: 'a', label: 'Un endroit calme pour déposer' },
          { id: 'b', label: 'Un jeu court et malin' },
          { id: 'c', label: 'Une voix qui répond vraiment' },
        ],
      },
    ],
    portraits: {
      a: { title: 'Plume claire', text: 'Tu avances en nommant les choses. Le journal est ton terrain de jeu le plus juste.' },
      b: { title: 'Étincelle', text: 'Tu testes, tu bouges, tu allèges. Une pause courte te remet souvent en route.' },
      c: { title: 'Lien vivant', text: 'Tu te poses mieux avec une présence. L’écoute, même brève, te remet au centre.' },
    },
  },
  en: {
    eyebrow: 'Play corner',
    title: 'Riddles & today’s mirror',
    lead: 'A short game to stay, smile, and notice yourself. Nothing here is an assessment.',
    disclaimer: 'A mirror game, not a diagnosis. For real listening, the assistant and journal remain here.',
    riddleTitle: 'Gentle riddles',
    reveal: 'Show the answer',
    hide: 'Hide',
    quizTitle: 'One-minute quiz',
    next: 'Next question',
    resultTitle: 'Your playful portrait',
    again: 'Play again',
    keep: 'Keep a private note',
    kept: 'Note kept. If you are offline, it will enter your journal when you reconnect.',
    riddles: [
      { id: 'mask', prompt: 'I fall as soon as you tell the truth. What am I?', answer: 'The mask.' },
      { id: 'rest', prompt: 'I am not an escape, yet I make you clearer. What am I?', answer: 'A pause.' },
      { id: 'word', prompt: 'The more I am named, the lighter I become. What am I?', answer: 'A feeling.' },
    ],
    questions: [
      {
        prompt: 'When the day feels heavy, you start by…',
        choices: [
          { id: 'a', label: 'Writing one true sentence' },
          { id: 'b', label: 'Walking or changing air' },
          { id: 'c', label: 'Talking to someone safe' },
        ],
      },
      {
        prompt: 'Faced with a riddle, you…',
        choices: [
          { id: 'a', label: 'Look for the hidden meaning' },
          { id: 'b', label: 'Guess fast, even if you laugh' },
          { id: 'c', label: 'Ask for a hint' },
        ],
      },
      {
        prompt: 'What makes you stay on a site is…',
        choices: [
          { id: 'a', label: 'A calm place to set things down' },
          { id: 'b', label: 'A short, clever game' },
          { id: 'c', label: 'A voice that actually answers' },
        ],
      },
    ],
    portraits: {
      a: { title: 'Clear quill', text: 'You move by naming things. The journal is your fairest playground.' },
      b: { title: 'Spark', text: 'You test, move, and lighten the load. A short pause often restarts you.' },
      c: { title: 'Living link', text: 'You settle better with a presence. Even brief listening brings you back.' },
    },
  },
  es: {
    eyebrow: 'Rincón de juego',
    title: 'Adivinanzas y espejo de hoy',
    lead: 'Un juego breve para quedarte, sonreír y reconocerte. Aquí no hay evaluación.',
    disclaimer: 'Juego de espejo, no un diagnóstico. Para una escucha real, siguen el asistente y el diario.',
    riddleTitle: 'Adivinanzas suaves',
    reveal: 'Ver la respuesta',
    hide: 'Ocultar',
    quizTitle: 'Quiz de un minuto',
    next: 'Siguiente pregunta',
    resultTitle: 'Tu retrato juguetón',
    again: 'Jugar de nuevo',
    keep: 'Guardar una nota privada',
    kept: 'Nota guardada. Si estás sin conexión, entrará en tu diario al reconectar.',
    riddles: [
      { id: 'mask', prompt: 'Caigo en cuanto dices la verdad. ¿Quién soy?', answer: 'La máscara.' },
      { id: 'rest', prompt: 'No soy una huida, pero te vuelvo más claro. ¿Quién soy?', answer: 'Una pausa.' },
      { id: 'word', prompt: 'Cuanto más me nombran, menos peso. ¿Quién soy?', answer: 'Un sentimiento.' },
    ],
    questions: [
      {
        prompt: 'Cuando el día pesa, empiezas por…',
        choices: [
          { id: 'a', label: 'Escribir una frase verdadera' },
          { id: 'b', label: 'Caminar o cambiar de aire' },
          { id: 'c', label: 'Hablar con alguien seguro' },
        ],
      },
      {
        prompt: 'Ante una adivinanza, tú…',
        choices: [
          { id: 'a', label: 'Buscas el sentido oculto' },
          { id: 'b', label: 'Pruebas rápido, aunque rías' },
          { id: 'c', label: 'Pides una pista' },
        ],
      },
      {
        prompt: 'Lo que te hace quedarte en un sitio es…',
        choices: [
          { id: 'a', label: 'Un lugar calmo para dejar cosas' },
          { id: 'b', label: 'Un juego corto e ingenioso' },
          { id: 'c', label: 'Una voz que responde de verdad' },
        ],
      },
    ],
    portraits: {
      a: { title: 'Pluma clara', text: 'Avanzas nombrando las cosas. El diario es tu mejor terreno de juego.' },
      b: { title: 'Chispa', text: 'Pruebas, te mueves y aligeras. Una pausa corta suele reponerte.' },
      c: { title: 'Vínculo vivo', text: 'Te sitúas mejor con una presencia. Una escucha breve te devuelve al centro.' },
    },
  },
  de: {
    eyebrow: 'Spiel-Ecke',
    title: 'Rätsel & Spiegel des Tages',
    lead: 'Ein kurzes Spiel zum Bleiben, Lächeln und Erkennen. Hier gibt es keine Bewertung.',
    disclaimer: 'Ein Spiegelspiel, keine Diagnose. Für echtes Zuhören bleiben Assistent und Tagebuch da.',
    riddleTitle: 'Sanfte Rätsel',
    reveal: 'Antwort zeigen',
    hide: 'Verbergen',
    quizTitle: 'Minuten-Quiz',
    next: 'Nächste Frage',
    resultTitle: 'Dein spielerisches Porträt',
    again: 'Nochmal spielen',
    keep: 'Private Notiz behalten',
    kept: 'Notiz behalten. Offline wandert sie bei der nächsten Verbindung ins Tagebuch.',
    riddles: [
      { id: 'mask', prompt: 'Ich falle, sobald du die Wahrheit sagst. Wer bin ich?', answer: 'Die Maske.' },
      { id: 'rest', prompt: 'Ich bin keine Flucht, und doch wirst du klarer. Wer bin ich?', answer: 'Eine Pause.' },
      { id: 'word', prompt: 'Je mehr man mich nennt, desto leichter werde ich. Wer bin ich?', answer: 'Ein Gefühl.' },
    ],
    questions: [
      {
        prompt: 'Wenn der Tag schwer ist, beginnst du eher mit…',
        choices: [
          { id: 'a', label: 'einem wahren Satz' },
          { id: 'b', label: 'Gehen oder Luftwechsel' },
          { id: 'c', label: 'einem sicheren Gespräch' },
        ],
      },
      {
        prompt: 'Vor einem Rätsel…',
        choices: [
          { id: 'a', label: 'suchst du den verborgenen Sinn' },
          { id: 'b', label: 'raten du schnell, auch mit Lachen' },
          { id: 'c', label: 'bittest du um einen Hinweis' },
        ],
      },
      {
        prompt: 'Du bleibst auf einer Seite, weil…',
        choices: [
          { id: 'a', label: 'es einen ruhigen Ablageort gibt' },
          { id: 'b', label: 'ein kurzes, kluges Spiel wartet' },
          { id: 'c', label: 'eine Stimme wirklich antwortet' },
        ],
      },
    ],
    portraits: {
      a: { title: 'Klare Feder', text: 'Du kommst voran, indem du Dinge benennst. Das Tagebuch ist dein fairstes Spielfeld.' },
      b: { title: 'Funke', text: 'Du probierst, bewegst dich und machst leichter. Eine kurze Pause bringt dich oft zurück.' },
      c: { title: 'Lebendige Verbindung', text: 'Mit einer Gegenwart findest du besser zu dir. Kurzes Zuhören reicht oft.' },
    },
  },
  zh: {
    eyebrow: '休闲角',
    title: '谜语与今日镜子',
    lead: '一个小游戏，让人愿意留下来、微笑，并认出自己。这里不是评估。',
    disclaimer: '这是镜子游戏，不是诊断。若需要真正的倾听，助手和日记都在。',
    riddleTitle: '轻柔谜语',
    reveal: '看答案',
    hide: '收起',
    quizTitle: '一分钟小测',
    next: '下一题',
    resultTitle: '你的游戏画像',
    again: '再玩一次',
    keep: '留下一条私密笔记',
    kept: '笔记已留下。若目前离线，重新联网后会进入你的日记。',
    riddles: [
      { id: 'mask', prompt: '你一说真话，我就落下。我是谁？', answer: '面具。' },
      { id: 'rest', prompt: '我不是逃避，却让你更清楚。我是谁？', answer: '一次停顿。' },
      { id: 'word', prompt: '被叫出名字后，我就变轻。我是谁？', answer: '一种感受。' },
    ],
    questions: [
      {
        prompt: '一天变重时，你通常先…',
        choices: [
          { id: 'a', label: '写下真实的一句话' },
          { id: 'b', label: '走走或换换空气' },
          { id: 'c', label: '找一个安全的人说' },
        ],
      },
      {
        prompt: '面对谜语，你会…',
        choices: [
          { id: 'a', label: '寻找隐藏的意思' },
          { id: 'b', label: '先猜，笑了也没关系' },
          { id: 'c', label: '要一个提示' },
        ],
      },
      {
        prompt: '让你愿意留在一个网站上的是…',
        choices: [
          { id: 'a', label: '可以安放心事的安静处' },
          { id: 'b', label: '短而聪明的小游戏' },
          { id: 'c', label: '真正回应你的声音' },
        ],
      },
    ],
    portraits: {
      a: { title: '清楚的笔', text: '你靠命名事物往前走。日记是你最合适的游戏场。' },
      b: { title: '火花', text: '你试、你动、你把重量减轻。短暂停顿常常让你重新出发。' },
      c: { title: '活的连接', text: '有人在时，你更容易安顿。哪怕短暂的倾听，也能把你带回自己。' },
    },
  },
};

export function leisurePack(language: SupportedLanguage): LeisurePack {
  return packs[language] || packs.fr;
}
