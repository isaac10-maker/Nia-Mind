import type { SupportedLanguage } from './i18nEngine';
import { supabase } from './supabase';
import type { SiteSettings } from './types';

export const PUBLIC_TRAFFIC_PATHS = [
  '/',
  '/conseils',
  '/histoires',
  '/ressources',
  '/loisir',
  '/a-propos',
  '/communautes',
  '/connexion',
  '/inscription',
] as const;

export type PublicTrafficPath = (typeof PUBLIC_TRAFFIC_PATHS)[number];

export interface TrafficRow {
  day: string;
  path: string;
  views: number;
}

type SharedControls = Pick<
  SiteSettings,
  | 'registrationOpen'
  | 'storySubmissionsOpen'
  | 'listeningOpen'
  | 'publicStoriesVisible'
  | 'announcementVisible'
  | 'maintenanceMode'
  | 'copyProtectionEnabled'
  | 'aiAutopilotTipsEnabled'
>;

const NOTICE: Record<string, Record<SupportedLanguage, string>> = {
  maintenance: {
    fr: 'Nia-Mind est en maintenance légère. La lecture publique reste ouverte, certaines actions peuvent être suspendues.',
    en: 'Nia-Mind is in light maintenance. Public reading stays open; some actions may be paused.',
    es: 'Nia-Mind está en un mantenimiento ligero. La lectura pública sigue abierta; algunas acciones pueden estar en pausa.',
    de: 'Nia-Mind ist in leichter Wartung. Öffentliches Lesen bleibt möglich; einzelne Aktionen können pausieren.',
    zh: 'Nia-Mind 正在进行轻度维护。公开阅读仍然开放，部分操作可能暂停。',
  },
  registrationClosed: {
    fr: 'Les inscriptions sont fermées pour le moment. La connexion des comptes existants reste ouverte.',
    en: 'Registration is closed for now. Existing accounts can still sign in.',
    es: 'El registro está cerrado por ahora. Las cuentas existentes pueden iniciar sesión.',
    de: 'Neue Registrierungen sind vorübergehend geschlossen. Bestehende Konten können sich anmelden.',
    zh: '目前暂停注册。已有账户仍可登录。',
  },
  storiesHidden: {
    fr: 'Les histoires publiques sont masquées par l’administration. Aucun récit n’est affiché.',
    en: 'Public stories are hidden by the administration. No story is shown.',
    es: 'Las historias públicas están ocultas por la administración. No se muestra ningún relato.',
    de: 'Öffentliche Geschichten sind von der Verwaltung ausgeblendet. Es wird keine Geschichte angezeigt.',
    zh: '公开故事已被管理端隐藏。此处不显示任何故事。',
  },
  listeningClosed: {
    fr: 'Les nouvelles demandes d’écoute humaine sont suspendues. Les demandes déjà envoyées restent suivies.',
    en: 'New human-listening requests are paused. Requests already sent are still followed.',
    es: 'Las nuevas solicitudes de escucha humana están en pausa. Las ya enviadas siguen en seguimiento.',
    de: 'Neue Anfragen für menschliches Zuhören sind pausiert. Bereits gesendete Anfragen werden weiter betreut.',
    zh: '新的人工倾听请求已暂停。已提交的请求仍会继续跟进。',
  },
  storySubmitClosed: {
    fr: 'L’envoi de nouvelles histoires à la publication est suspendu. Les brouillons privés restent possibles.',
    en: 'Sending new stories for publication is paused. Private drafts are still possible.',
    es: 'El envío de nuevas historias para publicación está en pausa. Los borradores privados siguen posibles.',
    de: 'Das Einreichen neuer Geschichten zur Veröffentlichung ist pausiert. Private Entwürfe bleiben möglich.',
    zh: '新故事的发表提交已暂停。私人草稿仍然可以保存。',
  },
};

export function platformNotice(lang: SupportedLanguage, key: keyof typeof NOTICE): string {
  return NOTICE[key][lang] || NOTICE[key].fr;
}

export function normalizeTrafficPath(pathname: string): PublicTrafficPath | null {
  const path = (pathname || '/').split('?')[0].replace(/\/+$/, '') || '/';
  return (PUBLIC_TRAFFIC_PATHS as readonly string[]).includes(path)
    ? (path as PublicTrafficPath)
    : null;
}

function controlsFromRow(row: Record<string, unknown>): SharedControls {
  return {
    registrationOpen: row.registration_open !== false,
    storySubmissionsOpen: row.story_submissions_open !== false,
    listeningOpen: row.listening_open !== false,
    publicStoriesVisible: row.public_stories_visible !== false,
    announcementVisible: row.announcement_visible !== false,
    maintenanceMode: row.maintenance_mode === true,
    copyProtectionEnabled: row.copy_protection_enabled !== false,
    aiAutopilotTipsEnabled: row.ai_autopilot_tips_enabled !== false,
  };
}

export async function loadPlatformControls(): Promise<SharedControls | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from('platform_controls').select('*').eq('id', 1).maybeSingle();
  if (error || !data) return null;
  return controlsFromRow(data as Record<string, unknown>);
}

export async function savePlatformControls(next: SharedControls): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: 'La base n’est pas joignable.' };
  const { error } = await supabase
    .from('platform_controls')
    .update({
      registration_open: next.registrationOpen,
      story_submissions_open: next.storySubmissionsOpen,
      listening_open: next.listeningOpen,
      public_stories_visible: next.publicStoriesVisible,
      announcement_visible: next.announcementVisible,
      maintenance_mode: next.maintenanceMode,
      copy_protection_enabled: next.copyProtectionEnabled,
      ai_autopilot_tips_enabled: next.aiAutopilotTipsEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);
  if (error) return { ok: false, error: 'Le réglage n’a pas pu être enregistré pour toute la plateforme.' };
  return { ok: true };
}

export function sharedControlsOf(settings: SiteSettings): SharedControls {
  return {
    registrationOpen: settings.registrationOpen !== false,
    storySubmissionsOpen: settings.storySubmissionsOpen !== false,
    listeningOpen: settings.listeningOpen !== false,
    publicStoriesVisible: settings.publicStoriesVisible !== false,
    announcementVisible: settings.announcementVisible !== false,
    maintenanceMode: settings.maintenanceMode === true,
    copyProtectionEnabled: settings.copyProtectionEnabled !== false,
    aiAutopilotTipsEnabled: settings.aiAutopilotTipsEnabled !== false,
  };
}

export async function recordPageView(pathname: string): Promise<void> {
  const path = normalizeTrafficPath(pathname);
  if (!path || !supabase) return;
  const key = `nia-traffic-${path}-${new Date().toISOString().slice(0, 10)}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
  } catch {
    // Le compteur peut quand même être tenté une fois.
  }
  try {
    await supabase.rpc('record_page_view', { p_path: path });
  } catch {
    // Le trafic ne doit jamais bloquer la navigation.
  }
}

export async function loadTraffic(days = 14): Promise<TrafficRow[]> {
  if (!supabase) return [];
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - (days - 1));
  const { data, error } = await supabase
    .from('site_traffic_daily')
    .select('day,path,views')
    .gte('day', since.toISOString().slice(0, 10))
    .order('day', { ascending: false });
  if (error || !Array.isArray(data)) return [];
  return data.map((row) => ({
    day: String(row.day).slice(0, 10),
    path: String(row.path),
    views: Number(row.views) || 0,
  }));
}
