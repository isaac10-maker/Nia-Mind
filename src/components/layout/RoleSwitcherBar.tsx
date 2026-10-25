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

/**
 * Contrôles compacts Langue (sigles FR, EN, ES, DE, ZH uniquement) + Thème sombre/clair
 * placés conjointement juste en dessous du logo et du slogan dans le header.
 */
export const HeaderLangAndThemeControls: React.FC = () => {
  const { theme, toggleTheme, currentLanguage, setCurrentLanguage } = useApp();

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 pt-1">
      {/* Bouton de traduction : uniquement les sigles (FR, EN, ES, DE, ZH) au visuel */}
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 hover:bg-black/40 border border-white/25 text-white transition-colors"
        title="Sélecteur de langue"
      >
        <Globe className="w-3 h-3 text-sky-200 shrink-0" />
        <select
          aria-label="Sélecteur de langue"
          data-no-translate="true"
          value={currentLanguage}
          onChange={(e) => setCurrentLanguage(e.target.value as SupportedLanguage)}
          className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer pr-0.5 uppercase tracking-wider"
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

      {/* Bouton de thème sombre / clair conjoint juste à côté du bouton de langue */}
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 text-[11px] font-extrabold text-white transition-colors"
        aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="w-3 h-3 text-amber-300 shrink-0" />
            <span>{tUi(currentLanguage, 'lightMode')}</span>
          </>
        ) : (
          <>
            <Moon className="w-3 h-3 text-amber-200 shrink-0" />
            <span>{tUi(currentLanguage, 'darkMode')}</span>
          </>
        )}
      </button>
    </div>
  );
};

/**
 * Bandeau d'annonce style Télévision (TV Ticker) placé sous le header :
 * - À gauche : badge fixe « Conseils & Motivation du Jour » (z-10)
 * - À droite : le texte de l'annonce (détaché du titre) défile de droite à gauche
 *   et disparaît proprement en dessous du badge gauche comme une annonce télévisée.
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

  // On détache le titre ("Nouveau Conseil & Motivation du jour") pour ne faire défiler que l'annonce
  const rawAnnouncementBody = activeNotification
    ? activeNotification.message
    : featuredDailyTip?.summary ||
      'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger. Tu n’as pas besoin de tout résoudre ce soir pour mériter du repos.';

  const translatedAnnouncement = translateMessageForViewer(
    rawAnnouncementBody,
    currentLanguage
  );
  const tickerBadgeLabel = translatePlatformText(
    'Conseils & Motivation du Jour',
    currentLanguage
  );
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
      <div className="max-w-7xl mx-auto flex items-stretch">
        {/* Coin gauche fixe (style bandeau TV) : l'annonce défilante disparaît en dessous */}
        <button
          type="button"
          onClick={openDailyTipModal}
          className="relative z-10 shrink-0 inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 bg-nia-bordeaux-dark hover:bg-black/60 text-amber-200 hover:text-white text-[10px] sm:text-xs font-extrabold uppercase tracking-wider border-r border-amber-300/30 shadow-[10px_0_18px_rgba(0,0,0,0.55)] transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-nia-orange shrink-0" />
          <span>{tickerBadgeLabel}</span>
        </button>

        {/* Piste de défilement (z-0) qui glisse et disparaît sous le badge gauche */}
        <div className="relative z-0 flex-1 overflow-hidden flex items-center py-1.5 pl-3">
          <div className="animate-nia-rtl-scroll text-xs font-semibold text-amber-50/95">
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
 * Sur les pages publiques, `PublicLayout` intègre directement le Header Orange unifié
 * et le bandeau d'annonce TV.
 */
export const RoleSwitcherBar: React.FC = () => {
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
        className={`relative z-30 bg-gradient-to-r from-nia-orange-deep via-nia-orange to-nia-bordeaux text-white shadow-md transition-all duration-300 ${
          isAuthPage ? 'blur-md opacity-35 pointer-events-none select-none' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Gauche : Logo + Slogan juste en dessous + Sigles Langue & Thème sombre conjoints */}
          <div className="flex flex-col items-start">
            <BrandLogo variant="header-orange" showSlogan={true} size="sm" />
            <HeaderLangAndThemeControls />
          </div>

          {/* Droite épurée : uniquement le bouton avec le pseudo (+ Superadmin si autorisé) */}
          <div className="flex flex-wrap items-center gap-2">
            {isSuperAdmin && !location.pathname.startsWith('/admin') && (
              <Link
                to="/admin/vue-ensemble"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 text-white text-xs font-extrabold shadow-sm transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Superadmin</span>
              </Link>
            )}

            {currentUser && (
              <Link
                to="/espace/tableau-de-bord"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-nia-bordeaux-dark/90 hover:bg-nia-bordeaux-dark border border-white/20 text-white text-xs font-extrabold shadow-sm transition-all"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-none">
                  {tUi(currentLanguage, 'mySpace')} (@{currentUser.publicPseudonym || currentUser.displayName})
                </span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </Link>
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
