import type { SitePalette, SiteSettings } from './types';

export const DEFAULT_PALETTE: SitePalette = {
  primary: '#0F9F6E',
  primaryDeep: '#047857',
  secondary: '#7F1D3F',
  secondaryDark: '#57152D',
  accent: '#0F766E',
  headerFrom: '#047857',
  headerVia: '#0F9F6E',
  headerTo: '#7F1D3F',
  announceFrom: '#57152D',
  announceVia: '#7F1D3F',
  announceTo: '#047857',
  bgLight: '#F3FBF6',
  cardLight: '#FFFFFF',
  borderLight: '#D5E7DC',
  textPrimary: '#1F2937',
  textSecondary: '#5C6D64',
  bgDark: '#0E1512',
  surfaceDark: '#17211C',
  borderDark: '#2C3B34',
  textDark: '#F4FBF7',
  success: '#059669',
  danger: '#E11D48',
  info: '#0284C7',
  publicPrimary: '#0F9F6E',
  personalPrimary: '#0F9F6E',
  assistantPrimary: '#0F9F6E',
  adminPrimary: '#0F9F6E',
};

export const DEFAULT_THEME_PRESET = 'Symbiose Nia-Mind (Vert & Bordeaux)';

const OLD_ORANGE = '#f97316';

export interface PaletteField {
  key: keyof SitePalette;
  label: string;
  hint: string;
}

export interface PaletteSection {
  id: string;
  label: string;
  detail: string;
  fields: PaletteField[];
}

export const PALETTE_SECTIONS: PaletteSection[] = [
  {
    id: 'marque',
    label: 'Marque',
    detail: 'La couleur principale verte mène le site. Le bordeaux reste la couleur secondaire.',
    fields: [
      { key: 'primary', label: 'Couleur principale', hint: 'Boutons, liens actifs, puces et dégradés de marque.' },
      { key: 'primaryDeep', label: 'Principale profonde', hint: 'États appuyés, départs de dégradé et contrastes.' },
      { key: 'secondary', label: 'Secondaire bordeaux', hint: 'Titres d’accent, bascules et identité Nia-Mind.' },
      { key: 'secondaryDark', label: 'Bordeaux foncé', hint: 'Contrastes forts et badge des annonces.' },
      { key: 'accent', label: 'Accent', hint: 'Informations, survols légers et détails de la puce.' },
    ],
  },
  {
    id: 'header',
    label: 'En-tête & annonces',
    detail: 'Bandeau du logo et barre « Conseils & Motivation du Jour ».',
    fields: [
      { key: 'headerFrom', label: 'En-tête — départ', hint: 'Gauche du bandeau logo, onglets et espace.' },
      { key: 'headerVia', label: 'En-tête — milieu', hint: 'Centre du bandeau principal.' },
      { key: 'headerTo', label: 'En-tête — arrivée', hint: 'Droite du bandeau, en bordeaux par défaut.' },
      { key: 'announceFrom', label: 'Annonces — départ', hint: 'Badge « Conseils & Motivation du Jour ».' },
      { key: 'announceVia', label: 'Annonces — milieu', hint: 'Fond du téléscripteur.' },
      { key: 'announceTo', label: 'Annonces — arrivée', hint: 'Fin du dégradé de l’annonce.' },
    ],
  },
  {
    id: 'light',
    label: 'Arrière-plans clairs',
    detail: 'Pages, cartes et bordures du mode clair.',
    fields: [
      { key: 'bgLight', label: 'Fond de page', hint: 'Arrière-plan général en mode clair.' },
      { key: 'cardLight', label: 'Cartes', hint: 'Panneaux, modales et bulles claires.' },
      { key: 'borderLight', label: 'Bordures', hint: 'Séparations des cartes et formulaires.' },
    ],
  },
  {
    id: 'dark',
    label: 'Arrière-plans sombres',
    detail: 'Pages, surfaces et bordures du mode sombre.',
    fields: [
      { key: 'bgDark', label: 'Fond sombre', hint: 'Arrière-plan général en mode sombre.' },
      { key: 'surfaceDark', label: 'Surface sombre', hint: 'Cartes et panneaux du mode sombre.' },
      { key: 'borderDark', label: 'Bordure sombre', hint: 'Séparations en mode sombre.' },
    ],
  },
  {
    id: 'text',
    label: 'Textes',
    detail: 'Lisibilité des titres, textes courants et mode sombre.',
    fields: [
      { key: 'textPrimary', label: 'Texte principal', hint: 'Titres et textes du mode clair.' },
      { key: 'textSecondary', label: 'Texte secondaire', hint: 'Légendes, aides et métadonnées.' },
      { key: 'textDark', label: 'Texte clair', hint: 'Texte principal du mode sombre.' },
    ],
  },
  {
    id: 'public',
    label: 'Espace public',
    detail: 'Accueil, ressources, conseils, histoires et à propos.',
    fields: [
      { key: 'publicPrimary', label: 'Principale de l’espace public', hint: 'Boutons et accents des onglets publics.' },
    ],
  },
  {
    id: 'personal',
    label: 'Espace personnel',
    detail: 'Tableau de bord, journal, bien-être, profil et confidentialité.',
    fields: [
      { key: 'personalPrimary', label: 'Principale de l’espace personnel', hint: 'Navigation et actions de Mon espace.' },
    ],
  },
  {
    id: 'assistant',
    label: 'Assistant',
    detail: 'Bulles envoyées, boutons et accents de la discussion.',
    fields: [
      { key: 'assistantPrimary', label: 'Principale de l’assistant', hint: 'Bulle de l’utilisateur et bouton Envoyer.' },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    detail: 'Console SuperAdmin, onglets et actions de gouvernance.',
    fields: [
      { key: 'adminPrimary', label: 'Principale de l’administration', hint: 'Navigation active et boutons de la console.' },
    ],
  },
  {
    id: 'states',
    label: 'États',
    detail: 'Succès, alerte et information, communs à toutes les sections.',
    fields: [
      { key: 'success', label: 'Succès', hint: 'Relais humain, validations et états positifs.' },
      { key: 'danger', label: 'Alerte', hint: 'Suppressions, détresse et blocages.' },
      { key: 'info', label: 'Information', hint: 'Repères calmes et pastilles d’info.' },
    ],
  },
];

export function normalizeHex(value: string, fallback: string): string {
  const raw = (value || '').trim();
  const withHash = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9a-fA-F]{6}$/.test(withHash)) return withHash.toUpperCase();
  if (/^#[0-9a-fA-F]{3}$/.test(withHash)) {
    const [r, g, b] = withHash.slice(1).split('');
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }
  return fallback.toUpperCase();
}

export function hexToChannels(hex: string): string {
  const safe = normalizeHex(hex, '#0F9F6E').slice(1);
  const n = Number.parseInt(safe, 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

export function shadeHex(hex: string, amount: number): string {
  const [r, g, b] = hexToChannels(hex).split(' ').map(Number);
  const next = [r, g, b].map((channel) =>
    Math.max(0, Math.min(255, Math.round(channel * (1 - amount))))
  );
  return `#${next.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

export function mergePalette(partial?: Partial<SitePalette> | null): SitePalette {
  const next = { ...DEFAULT_PALETTE };
  if (!partial) return next;
  (Object.keys(DEFAULT_PALETTE) as Array<keyof SitePalette>).forEach((key) => {
    if (typeof partial[key] === 'string') {
      next[key] = normalizeHex(partial[key] as string, DEFAULT_PALETTE[key]);
    }
  });
  return next;
}

export function patchPalette(
  current: SitePalette,
  key: keyof SitePalette,
  value: string
): SitePalette {
  const next: SitePalette = {
    ...current,
    [key]: normalizeHex(value, current[key]),
  };
  if (key === 'primary') {
    const old = current.primary.toUpperCase();
    const oldDeep = current.primaryDeep.toUpperCase();
    const shaded = shadeHex(old, 0.18);
    if (oldDeep === shaded || oldDeep === old) next.primaryDeep = shadeHex(next.primary, 0.18);
    (['headerVia', 'publicPrimary', 'personalPrimary', 'assistantPrimary', 'adminPrimary'] as const).forEach(
      (dependent) => {
        if (current[dependent].toUpperCase() === old) next[dependent] = next.primary;
      }
    );
    if (current.headerFrom.toUpperCase() === oldDeep) next.headerFrom = next.primaryDeep;
    if (current.announceTo.toUpperCase() === oldDeep) next.announceTo = next.primaryDeep;
  }
  if (key === 'secondary') {
    const old = current.secondary.toUpperCase();
    const oldDark = current.secondaryDark.toUpperCase();
    if (oldDark === shadeHex(old, 0.28) || oldDark === old) next.secondaryDark = shadeHex(next.secondary, 0.28);
    if (current.headerTo.toUpperCase() === old) next.headerTo = next.secondary;
    if (current.announceVia.toUpperCase() === old) next.announceVia = next.secondary;
    if (current.announceFrom.toUpperCase() === oldDark) next.announceFrom = next.secondaryDark;
  }
  return next;
}

export function withBrandColors(
  current: SitePalette,
  patch: { primary?: string; secondary?: string; accent?: string }
): SitePalette {
  const primary = normalizeHex(patch.primary || current.primary, current.primary);
  const secondary = normalizeHex(patch.secondary || current.secondary, current.secondary);
  const accent = normalizeHex(patch.accent || current.accent, current.accent);
  const primaryDeep = shadeHex(primary, 0.18);
  const secondaryDark = shadeHex(secondary, 0.28);
  return {
    ...current,
    primary,
    primaryDeep,
    secondary,
    secondaryDark,
    accent,
    headerFrom: primaryDeep,
    headerVia: primary,
    headerTo: secondary,
    announceFrom: secondaryDark,
    announceVia: secondary,
    announceTo: primaryDeep,
    publicPrimary: primary,
    personalPrimary: primary,
    assistantPrimary: primary,
    adminPrimary: primary,
  };
}

export function migrateSiteSettings(raw: SiteSettings): SiteSettings {
  const hasPalette = Boolean(raw.palette);
  const base = hasPalette
    ? mergePalette(raw.palette)
    : withBrandColors(DEFAULT_PALETTE, {
        primary: raw.primaryColor || DEFAULT_PALETTE.primary,
        secondary: raw.secondaryColor || DEFAULT_PALETTE.secondary,
        accent: raw.accentColor || DEFAULT_PALETTE.accent,
      });
  const storedPrimary = (raw.primaryColor || base.primary).toLowerCase();
  const oldDefault =
    storedPrimary === OLD_ORANGE &&
    (!raw.themePreset || raw.themePreset.includes('Orange'));
  const nextPalette = oldDefault
    ? withBrandColors(base, {
        primary: DEFAULT_PALETTE.primary,
        secondary: base.secondary || DEFAULT_PALETTE.secondary,
        accent: (raw.accentColor || '').toLowerCase() === '#0ea5e9' ? DEFAULT_PALETTE.accent : base.accent,
      })
    : base;

  return {
    ...raw,
    primaryColor: nextPalette.primary,
    secondaryColor: nextPalette.secondary,
    accentColor: nextPalette.accent,
    themePreset: oldDefault ? DEFAULT_THEME_PRESET : raw.themePreset || DEFAULT_THEME_PRESET,
    palette: nextPalette,
    registrationOpen: raw.registrationOpen !== false,
    storySubmissionsOpen: raw.storySubmissionsOpen !== false,
    listeningOpen: raw.listeningOpen !== false,
    publicStoriesVisible: raw.publicStoriesVisible !== false,
    announcementVisible: raw.announcementVisible !== false,
    maintenanceMode: raw.maintenanceMode === true,
    copyProtectionEnabled: raw.copyProtectionEnabled !== false,
    aiAutopilotTipsEnabled: raw.aiAutopilotTipsEnabled !== false,
  };
}

const VARIABLE_MAP: Record<keyof SitePalette, [hexVar: string, rgbVar: string]> = {
  primary: ['--nia-orange', '--nia-orange-rgb'],
  primaryDeep: ['--nia-orange-deep', '--nia-orange-deep-rgb'],
  secondary: ['--nia-bordeaux', '--nia-bordeaux-rgb'],
  secondaryDark: ['--nia-bordeaux-dark', '--nia-bordeaux-dark-rgb'],
  accent: ['--nia-accent', '--nia-accent-rgb'],
  headerFrom: ['--nia-header-from', '--nia-header-from-rgb'],
  headerVia: ['--nia-header-via', '--nia-header-via-rgb'],
  headerTo: ['--nia-header-to', '--nia-header-to-rgb'],
  announceFrom: ['--nia-announce-from', '--nia-announce-from-rgb'],
  announceVia: ['--nia-announce-via', '--nia-announce-via-rgb'],
  announceTo: ['--nia-announce-to', '--nia-announce-to-rgb'],
  bgLight: ['--nia-bg-light', '--nia-bg-light-rgb'],
  cardLight: ['--nia-white', '--nia-card-rgb'],
  borderLight: ['--nia-gray-light', '--nia-border-light-rgb'],
  textPrimary: ['--nia-gray-dark', '--nia-text-primary-rgb'],
  textSecondary: ['--nia-gray-mid', '--nia-text-secondary-rgb'],
  bgDark: ['--nia-bg-dark', '--nia-bg-dark-rgb'],
  surfaceDark: ['--nia-surface-dark', '--nia-surface-dark-rgb'],
  borderDark: ['--nia-border-dark', '--nia-border-dark-rgb'],
  textDark: ['--nia-text-dark', '--nia-text-dark-rgb'],
  success: ['--nia-success', '--nia-success-rgb'],
  danger: ['--nia-danger', '--nia-danger-rgb'],
  info: ['--nia-info', '--nia-info-rgb'],
  publicPrimary: ['--nia-public-primary', '--nia-public-primary-rgb'],
  personalPrimary: ['--nia-personal-primary', '--nia-personal-primary-rgb'],
  assistantPrimary: ['--nia-assistant-primary', '--nia-assistant-primary-rgb'],
  adminPrimary: ['--nia-admin-primary', '--nia-admin-primary-rgb'],
};

export function applySitePalette(palette: SitePalette): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  (Object.keys(VARIABLE_MAP) as Array<keyof SitePalette>).forEach((key) => {
    const [hexVar, rgbVar] = VARIABLE_MAP[key];
    const hex = normalizeHex(palette[key], DEFAULT_PALETTE[key]);
    root.style.setProperty(hexVar, hex);
    root.style.setProperty(rgbVar, hexToChannels(hex));
  });
}
