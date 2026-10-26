import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Ban, Crown, Globe, Moon, Sparkles, Sun, X } from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { useApp } from '../../context/AppContext';
import {
  LANGUAGE_META,
  SupportedLanguage,
  translateMessageForViewer,
  translatePlatformText,
  tUi,
} from '../../lib/i18nEngine';

export const SUPERADMIN_EMAIL = 'isaacamegan10@gmail.com';

const TICKER_TWO_LINE_LABELS: Record<SupportedLanguage, { line1: string; line2: string }> = {
  fr: { line1: 'Conseils &', line2: 'Motivation du Jour' },
  en: { line1: 'Daily Advice &', line2: 'Motivation' },
  es: { line1: 'Consejos y', line2: 'Motivación del Día' },
  de: { line1: 'Tagesimpulse &', line2: 'Motivation' },
  zh: { line1: '今日建议 &', line2: '每日激励' },
};

/**
 * Contrôles compacts Langue (sigles FR, EN, ES, DE, ZH uniquement) + Icône Lune/Soleil seule
 * placés conjointement juste en dessous du logo et du slogan dans le header.
 */
export const HeaderLangAndThemeControls: React.FC = () => {
  const { theme, toggleTheme, currentLanguage, setCurrentLanguage } = useApp();

  return (
    <div className="inline-flex items-center gap-1.5 pt-0.5">
      {/* Bouton de traduction : uniquement les sigles (FR, EN, ES, DE, ZH) au visuel */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 text-white transition-colors"
        title="Sélecteur de langue"
      >
        <Globe className="w-3 h-3 text-sky-200 shrink-0" />
        <select
          aria-label="Sélecteur de langue"
          data-no-translate="true"
          value={currentLanguage}
          onChange={(e) => setCurrentLanguage(e.target.value as SupportedLanguage)}
          className="bg-transparent text-[10px] sm:text-[11px] font-extrabold text-white focus:outline-none cursor-pointer pr-0.5 uppercase tracking-wider"
        >
          {(Object.keys(LANGUAGE_META) as SupportedLanguage[]).map((langKey) => (
            <option
              key={langKey}
              value={langKey}
              className="bg-slate-900 text-white font-bold"
            >
              {LANGUAGE_META[langKey].short}
            </option>
          ))}
        </select>
      </div>

      {/* Bouton de bascule Sombre / Clair : uniquement l'icône Lune ou Soleil */}
      <button
        type="button"
        onClick={toggleTheme}
        title={theme === 'dark' ? tUi(currentLanguage, 'lightMode') : tUi(currentLanguage, 'darkMode')}
        aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
        className="w-6 h-6 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 flex items-center justify-center text-white transition-colors shrink-0"
      >
        {theme === 'dark' ? (
          <Sun className="w-3.5 h-3.5 text-amber-300" />
        ) : (
          <Moon className="w-3.5 h-3.5 text-amber-200" />
        )}
      </button>
    </div>
  );
};

/**
 * Bouton « Mon espace » avec retour à la ligne après « Mon espace » et « (@Pseudo) » en dessous.
 */
export const UserSpaceCompactButton: React.FC = () => {
  const { currentUser, currentLanguage } = useApp();
  if (!currentUser) return null;

  const pseudo = currentUser.publicPseudonym || currentUser.displayName;

  return (
    <Link
      to="/espace/tableau-de-bord"
      className="inline-flex items-center gap-2 px-3 py-1 rounded-2xl bg-nia-bordeaux-dark/90 hover:bg-nia-bordeaux-dark border border-white/25 text-white shadow-md transition-all"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
      <span className="flex flex-col items-start leading-[1.1] text-left">
        <span className="text-[11px] sm:text-xs font-extrabold">
          {tUi(currentLanguage, 'mySpace')}
        </span>
        <span
          data-no-translate="true"
          className="text-[9px] sm:text-[10px] font-bold text-amber-200 truncate max-w-[130px] sm:max-w-[160px]"
        >
          (@{pseudo})
        </span>
      </span>
      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-amber-200" />
    </Link>
  );
};

/**
 * Bandeau d'annonce style Télévision (TV Ticker) placé sous le header :
 * - À gauche : badge fixe sur 2 lignes « Conseils & » / « Motivation du Jour » avec taille de police réduite (z-10)
 * - À droite : le texte de l'annonce défile de droite à gauche et disparaît en dessous du badge gauche.
 */
export const TvAnnouncementTicker: React.FC<{ blurred?: boolean }> = ({
  blurred = false,
}) => {
  const {
    currentLanguage,
    openDailyTipModal,
    siteNotifications,
    featuredDailyTip,
  } = useApp();

  const activeNotification = siteNotifications.find((n) => n.isActive);

  const rawAnnouncementBody = activeNotification
    ? activeNotification.message
    : featuredDailyTip?.summary ||
      'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger. Tu n’as pas besoin de tout résoudre ce soir pour mériter du repos.';

  const translatedAnnouncement = translateMessageForViewer(
    rawAnnouncementBody,
    currentLanguage
  );
  const twoLineBadge =
    TICKER_TWO_LINE_LABELS[currentLanguage] || TICKER_TWO_LINE_LABELS.fr;
  const mottoLabel = translatePlatformText(
    'Écouter • Comprendre • Avancer',
    currentLanguage
  );

  return (
    <div
      className={`relative w-full bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white border-t border-white/15 overflow-hidden transition-all duration-300 ${
        blurred ? 'blur-[6px] opacity-25 pointer-events-none select-none' : ''
      }`}
    >
      <div className="w-full flex items-stretch">
        {/* Coin gauche fixe sur 2 lignes (police réduite) : l'annonce défilante disparaît en dessous */}
        <button
          type="button"
          onClick={openDailyTipModal}
          className="relative z-10 shrink-0 inline-flex items-center gap-1.5 pl-2.5 sm:pl-4 pr-2.5 sm:pr-3.5 py-1 bg-nia-bordeaux-dark hover:bg-black/65 text-amber-200 hover:text-white border-r border-amber-300/30 shadow-[10px_0_18px_rgba(0,0,0,0.55)] transition-colors text-left"
        >
          <Sparkles className="w-3 h-3 text-nia-orange shrink-0" />
          <span
            data-no-translate="true"
            className="flex flex-col leading-[1.1] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider"
          >
            <span>{twoLineBadge.line1}</span>
            <span className="text-white">{twoLineBadge.line2}</span>
          </span>
        </button>

        {/* Piste de défilement (z-0) qui glisse et disparaît sous le badge gauche */}
        <div className="relative z-0 flex-1 overflow-hidden flex items-center py-1 pl-3">
          <div className="animate-nia-rtl-scroll text-[11px] sm:text-xs font-semibold text-amber-50/95">
            ✺ {translatedAnnouncement} &nbsp;&nbsp;•&nbsp;&nbsp; {mottoLabel} — Nia-Mind
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Modale officielle d'alerte de bannissement.
 */
export const BanNoticeModal: React.FC = () => {
  const { activeBanNotice, dismissBanNotice, currentLanguage } = useApp();

  if (!activeBanNotice) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-rose-500 p-6 shadow-2xl">
        <button
          type="button"
          onClick={dismissBanNotice}
          aria-label="Fermer la notification de bannissement"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-300 flex items-center justify-center font-bold"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Ban className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Décision de Modération Nia-Mind
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Compte suspendu / banni (@{activeBanNotice.pseudo})
            </h3>
          </div>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
          Votre accès à l’espace membre a été suspendu par l’administrateur pour non-respect de la charte de bienveillance et de sécurité Nia-Mind.
        </p>
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 mb-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 dark:text-rose-300 mb-1">
            Motif officiel du bannissement :
          </p>
          <p className="text-xs font-bold text-slate-900 dark:text-white">
            « {translateMessageForViewer(activeBanNotice.reason, currentLanguage)} »
          </p>
        </div>
        <button
          type="button"
          onClick={dismissBanNotice}
          className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold transition-colors"
        >
          J’ai pris connaissance du motif
        </button>
      </div>
    </div>
  );
};

/**
 * Barre supérieure utilisée dans les espaces Personnel (/espace/*) et Admin (/admin/*).
 * Le logo Nia-Mind (anciennement situé sous le bandeau de conseils) est ramené ici
 * juste au-dessus des icônes de traduction et de lune/soleil, avec cadrage plein écran sans marge perdue.
 */
export const RoleSwitcherBar: React.FC<{
  onToggleMobileMenu?: () => void;
  mobileMenuOpen?: boolean;
}> = ({ onToggleMobileMenu, mobileMenuOpen }) => {
  const { currentUser, currentLanguage } = useApp();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/connexion' || location.pathname === '/inscription';

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  return (
    <>
      <div
        className={`sticky top-0 z-40 w-full bg-gradient-to-r from-nia-orange-deep via-nia-orange to-nia-bordeaux text-white shadow-md transition-all duration-300 ${
          isAuthPage ? 'blur-md opacity-35 pointer-events-none select-none' : ''
        }`}
      >
        <div className="w-full px-2.5 sm:px-4 py-1.5 flex items-center justify-between gap-2">
          {/* Gauche : Logo Nia-Mind ramené en haut + Slogan + Sigle Langue & Icône Lune/Soleil en dessous */}
          <div className="flex flex-col items-start min-w-0">
            <BrandLogo showSlogan={true} size="sm" />
            <HeaderLangAndThemeControls />
          </div>

          {/* Droite : Accueil, Superadmin et Mon espace / (@Pseudo) sur 2 lignes */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-full bg-black/25 hover:bg-black/40 border border-white/20 text-white text-xs font-extrabold transition-colors"
            >
              {tUi(currentLanguage, 'navHome')}
            </Link>

            {isSuperAdmin && !location.pathname.startsWith('/admin') && (
              <Link
                to="/admin/vue-ensemble"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 text-white text-[11px] sm:text-xs font-extrabold shadow-sm transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                <span>Superadmin</span>
              </Link>
            )}

            <UserSpaceCompactButton />

            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="lg:hidden p-2 rounded-xl bg-black/25 hover:bg-black/40 border border-white/25 text-white"
                aria-label="Ouvrir ou fermer le menu"
              >
                {mobileMenuOpen ? (
                  <span className="text-sm font-black px-1">✕</span>
                ) : (
                  <span className="text-sm font-black px-1">☰</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Bandeau d'annonce TV sous le header */}
        <TvAnnouncementTicker />
      </div>

      <BanNoticeModal />
    </>
  );
};
