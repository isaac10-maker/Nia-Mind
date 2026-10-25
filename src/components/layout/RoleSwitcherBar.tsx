import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Cookie, Crown, Moon, Sparkles, Sun, UserCheck, X } from 'lucide-react';
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
  } = useApp();
  const location = useLocation();
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);

  const isAuthPage =
    location.pathname === '/connexion' || location.pathname === '/inscription';

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  const activeNotification = siteNotifications.find(
    (n) => n.isActive && !dismissedNotifIds.includes(n.id)
  );

  return (
    <div
      className={`relative z-30 transition-all duration-300 ${
        isAuthPage ? 'blur-md opacity-35 pointer-events-none select-none' : ''
      }`}
    >
      {/* Barre supérieure Nia-Mind (sans statut "Site public") */}
      <div className="bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white/95 text-xs border-b border-white/15 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-200 tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
              « Le vrai sans le masque »
            </span>
            {currentUser && (
              <>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {isSuperAdmin ? 'Superadmin :' : 'Espace de'} {currentUser.displayName}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={openDailyTipModal}
              className="inline-flex items-center gap-1 text-amber-200 hover:text-white font-bold transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
              <span>Conseil du jour</span>
            </button>

            <button
              type="button"
              onClick={openConsentModal}
              className="inline-flex items-center gap-1 text-white/85 hover:text-white font-medium transition-colors"
            >
              <Cookie className="w-3.5 h-3.5 text-amber-200" />
              <span className="hidden sm:inline">Confidentialité & Cookies</span>
            </button>

            {!location.pathname.startsWith('/espace') && currentUser && (
              <Link
                to="/espace/tableau-de-bord"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-white font-bold transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-amber-300" />
                Mon espace
              </Link>
            )}

            {/* Bouton Administration visible UNIQUEMENT pour le Superadmin isaacamegan10@gmail.com */}
            {isSuperAdmin && !location.pathname.startsWith('/admin') && (
              <Link
                to="/admin/vue-ensemble"
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-nia-orange hover:bg-nia-orange-deep text-white font-extrabold shadow-sm transition-colors"
              >
                <Crown className="w-3.5 h-3.5" />
                Superadmin
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/25 hover:bg-black/40 text-white font-semibold transition-colors"
              aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-300" />
                  <span className="hidden md:inline">Clair</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-200" />
                  <span className="hidden md:inline">Sombre</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bandeau de Notification Push actif (publié par SuperAdmin ou le relais IA) */}
      {activeNotification && !isAuthPage && (
        <div className="bg-gradient-to-r from-sky-900/90 via-nia-bordeaux/95 to-nia-orange-deep/90 text-white text-xs border-b border-white/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-1.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-extrabold uppercase tracking-wider text-amber-200 shrink-0">
                <Bell className="w-3 h-3 text-nia-orange animate-bounce" />
                {activeNotification.generatedByAi ? 'Push IA • Motivation' : activeNotification.category}
              </span>
              <p className="truncate font-semibold">
                <strong className="font-extrabold text-amber-100">{activeNotification.title} :</strong>{' '}
                {activeNotification.message}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {activeNotification.actionUrl && (
                <Link
                  to={activeNotification.actionUrl}
                  className="px-2.5 py-0.5 rounded-full bg-white/20 hover:bg-white/30 font-extrabold text-[11px]"
                >
                  Découvrir →
                </Link>
              )}
              <button
                type="button"
                onClick={() =>
                  setDismissedNotifIds((prev) => [...prev, activeNotification.id])
                }
                aria-label="Fermer la notification"
                className="p-1 rounded-full hover:bg-white/20"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
