import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cookie, Crown, Moon, Sparkles, Sun, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const SUPERADMIN_EMAIL = 'isaacamegan10@gmail.com';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentUser,
    theme,
    toggleTheme,
    openDailyTipModal,
    openConsentModal,
    siteNotifications,
    featuredDailyTip,
  } = useApp();
  const location = useLocation();

  const isAuthPage =
    location.pathname === '/connexion' || location.pathname === '/inscription';

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  const activeNotification = siteNotifications.find((n) => n.isActive);
  const dailyMessageText = activeNotification
    ? `${activeNotification.title} — ${activeNotification.message}`
    : `${featuredDailyTip?.title || 'Conseil du jour'} — ${
        featuredDailyTip?.summary ||
        'Prends 2 minutes aujourd’hui pour déposer ce qui te pèse sans te juger.'
      }`;

  return (
    <div
      className={`relative z-30 transition-all duration-300 ${
        isAuthPage ? 'blur-md opacity-35 pointer-events-none select-none' : ''
      }`}
    >
      {/* Bandeau compact "Motivation & Conseils" avec message du jour défilant de la droite vers la gauche à vitesse moyenne sous le titre */}
      <div className="bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white border-b border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={openDailyTipModal}
              className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-amber-200 hover:text-white transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-nia-orange shrink-0" />
              <span>Motivation & Conseils</span>
            </button>

            <div className="flex items-center gap-2.5 text-[11px]">
              {currentUser && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isSuperAdmin ? 'Superadmin :' : 'Espace de'} {currentUser.displayName}
                </span>
              )}

              <button
                type="button"
                onClick={openConsentModal}
                className="inline-flex items-center gap-1 text-white/85 hover:text-white font-medium transition-colors"
              >
                <Cookie className="w-3 h-3 text-amber-200" />
                <span className="hidden md:inline">Confidentialité</span>
              </button>

              {!location.pathname.startsWith('/espace') && currentUser && (
                <Link
                  to="/espace/tableau-de-bord"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition-colors"
                >
                  <UserCheck className="w-3 h-3 text-amber-300" />
                  <span>Mon espace</span>
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
                    <span className="hidden sm:inline">Clair</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3 h-3 text-amber-200" />
                    <span className="hidden sm:inline">Sombre</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Message du jour défilant de la droite vers la gauche à vitesse moyenne sous le titre "Motivation & Conseils" */}
          <div className="relative w-full overflow-hidden border-t border-white/10 pt-1">
            <div className="animate-nia-rtl-scroll text-xs font-semibold text-amber-100/95">
              ✺ {dailyMessageText} &nbsp;&nbsp;•&nbsp;&nbsp; Écouter • Comprendre • Avancer — clique sur « Motivation & Conseils » pour lire l’exercice complet du jour.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
