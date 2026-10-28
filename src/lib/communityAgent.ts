export type PosterKind = 'proverb' | 'advice' | 'motivation' | 'none';

export function canReadCommunityRoom(isMember: boolean, canManage: boolean): boolean {
  return isMember || canManage;
}

export function canPostInCommunity(discussionOpen: boolean, isMember: boolean, canManage: boolean): boolean {
  if (canManage) return true;
  return discussionOpen && isMember;
}

export function inviteGrantsManagerRights(): boolean {
  return false;
}

export function scheduledPostIsDue(publishAt: string, now: Date): boolean {
  const time = new Date(publishAt).getTime();
  return Number.isFinite(time) && time <= now.getTime();
}

export function isSafePosterSvg(svg: string): boolean {
  const value = svg || '';
  return value.startsWith('<svg xmlns="http://www.w3.org/2000/svg"')
    && !/<script|onload|javascript:|foreignObject/i.test(value);
}

export function composeCommunityWelcome(language: string, name: string, when: Date): string {
  const stamp = `${when.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  const label = (name || 'cette communauté').slice(0, 80);
  if (language === 'en') {
    return `Hello. The welcome agent is publishing the message planned for ${stamp} in ${label}. This space is not the external group, and it does not replace a qualified professional.`;
  }
  if (language === 'es') {
    return `Hola. El agente de acogida publica el mensaje previsto para ${stamp} en ${label}. Este espacio no es el grupo externo y no sustituye a un profesional cualificado.`;
  }
  if (language === 'de') {
    return `Guten Tag. Der Empfangsagent veröffentlicht die für ${stamp} vorgesehene Nachricht in ${label}. Dieser Raum ist nicht die externe Gruppe und ersetzt keine Fachperson.`;
  }
  if (language === 'zh') {
    return `你好。接待助手正在发布预定于 ${stamp} 的消息，属于「${label}」。这里不是外部群组，也不能代替合格的专业人士。`;
  }
  return `Bonjour. L’agent d’accueil publie le message prévu pour ${stamp} dans ${label}. Cet espace n’est pas le groupe externe et ne remplace pas un professionnel qualifié.`;
}

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function composeCommunityPoster(text: string, kind: PosterKind): string {
  const title = kind === 'proverb' ? 'Proverbe' : kind === 'advice' ? 'Conseil' : kind === 'motivation' ? 'Motivation' : 'Message';
  const clean = (text || '').trim().slice(0, 160);
  let y = 280;
  let rest = clean;
  let lines = '';
  while (rest.length > 0 && y < 900) {
    lines += `<text x="96" y="${y}" fill="#16352B" font-size="40" font-family="Georgia,serif">${escapeXml(rest.slice(0, 34))}</text>`;
    rest = rest.slice(34);
    y += 58;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><rect width="1080" height="1080" fill="#0F9F6E"/><rect x="54" y="54" width="972" height="972" rx="42" fill="#FFFDF8"/><text x="96" y="170" fill="#7F1D3F" font-size="40" font-family="Georgia,serif">${escapeXml(title)}</text>${lines}<text x="96" y="980" fill="#0F9F6E" font-size="28" font-family="Georgia,serif">Nia-Mind · Écouter • Comprendre • Avancer</text></svg>`;
}
