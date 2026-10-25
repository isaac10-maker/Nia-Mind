import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Ban, Cookie, Crown, Globe, Moon, Sparkles, Sun, UserCheck, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  LANGUAGE_META,
  SupportedLanguage,
  translateMessageForViewer,
  tUi,
} from '../../lib/i18nEngine';

export const SUPERADMIN_EMAIL = 'isaacamegan10@gmail.com';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentUser,
    theme,
    toggleTheme,
    currentLanguage,
    setCurrentLanguage,
    openDailyTipModal,
    openConsentModal,
    siteNotifications,
    featuredDailyTip,
    activeBanNotice,
    dismissBanNotice,
  } = useApp();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/connexion' || location.pathname === '/inscription';

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  const activeNotification = siteNotifications.find((n) => n.isActive);
  const rawDailyMessageText = activeNotification
    ? `${activeNotification.title} — ${activeNotification.message}`
    : `${featuredDailyTip?.title || 'Conseil du jour'} — ${
        featuredDailyTip?.summary ||
        'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger.'
      }`;

  const dailyMessageText = translateMessageForViewer(rawDailyMessageText, currentLanguage);

  return (
    <>
      <div
        className={`relative z-30 transition-all duration-300 ${
          isAuthPage ? 'blur-md opacity-35 pointer-events-none select-none' : ''
        }`}
      >
        {/* Bandeau compact "Motivation & Conseils" avec message du jour défilant de la droite vers la gauche à vitesse réduite sous le titre */}
        <div className="bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white border-b border-white/15">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={openDailyTipModal}
                className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-200 hover:text-white transition-colors shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 text-nia-orange shrink-0" />
                <span>{tUi(currentLanguage, 'motivationBanner')}</span>
              </button>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 text-[11px]">
                {currentUser && (
                  <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {isSuperAdmin ? 'Superadmin :' : 'Pseudo :'} @{currentUser.publicPseudonym || currentUser.displayName}
                  </span>
                )}

                {/* Sélecteur de langue personnel en coin (FR / EN / ES / DE / ZH) isolé par utilisateur */}
                <div
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/30 border border-white/20 text-white"
                  title="Langue d’affichage personnelle (traduction automatique des échanges)"
                >
                  <Globe className="w-3 h-3 text-sky-300 shrink-0" />
                  <select
                    aria-label="Sélecteur de langue"
                    value={currentLanguage}
                    onChange={(e) => setCurrentLanguage(e.target.value as SupportedLanguage)}
                    className="bg-transparent text-[11px] font-extrabold text-white focus:outline-none cursor-pointer pr-1"
                  >
                    {(Object.keys(LANGUAGE_META) as SupportedLanguage[]).map((langKey) => (
                      <option
                        key={langKey}
                        value={langKey}
                        className="bg-slate-900 text-white font-semibold"
                      >
                        {LANGUAGE_META[langKey].short} — {LANGUAGE_META[langKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={openConsentModal}
                  className="inline-flex items-center gap-1 text-white/85 hover:text-white font-medium transition-colors"
                >
                  <Cookie className="w-3 h-3 text-amber-200" />
                  <span className="hidden lg:inline">{tUi(currentLanguage, 'navPrivacy')}</span>
                </button>

                {!location.pathname.startsWith('/espace') && currentUser && (
                  <Link
                    to="/espace/tableau-de-bord"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition-colors"
                  >
                    <UserCheck className="w-3 h-3 text-amber-300" />
                    <span>{tUi(currentLanguage, 'mySpace')}</span>
                  </Link>
                )}

                {isSuperAdmin && !location.pathname.startsWith('/admin') && (
                  <Link
                    to="/admin/vue-ensemble"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-nia-orange hover:bg-nia-orange-deep text-white font-extrabold shadow-sm transition-colors"
                  >
                    <Crown className="w-3 h-3" />
                    <span>Superadmin</span>
                  </Link>
                )}

                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/25 hover:bg-black/40 text-white font-semibold transition-colors"
                  aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-3 h-3 text-amber-300" />
                      <span className="hidden sm:inline">{tUi(currentLanguage, 'lightMode')}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3 h-3 text-amber-200" />
                      <span className="hidden sm:inline">{tUi(currentLanguage, 'darkMode')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Message du jour défilant de la droite vers la gauche à vitesse réduite sous le titre "Motivation & Conseils" */}
            <div className="relative w-full overflow-hidden border-t border-white/10 pt-1">
              <div className="animate-nia-rtl-scroll text-xs font-semibold text-amber-100/95">
                ✺ {dailyMessageText} &nbsp;&nbsp;•&nbsp;&nbsp; Écouter • Comprendre • Avancer — clique sur « {tUi(currentLanguage, 'motivationBanner')} » pour lire l’exercice complet du jour.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notification officielle de Bannissement avec motif transmis à l'utilisateur */}
      {activeBanNotice && (
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
      )}
    </>
  );
};
