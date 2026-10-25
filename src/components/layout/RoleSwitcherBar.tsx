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
  } = useApp();
  const location = useLocation();

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  return (
    <div className="relative z-30 bg-gradient-to-r from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white/95 text-xs border-b border-white/15 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-200 tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
            « Le vrai sans le masque »
          </span>
          <span className="hidden sm:inline text-white/40">•</span>
          {currentUser ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-white font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              {isSuperAdmin ? 'Superadmin :' : 'Espace de'} {currentUser.displayName}
            </span>
          ) : (
            <Link
              to="/connexion"
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/25 hover:bg-black/40 text-amber-100 font-semibold transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-nia-orange" />
              Mode Visiteur • Se connecter pour utiliser les outils
            </Link>
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
  );
};
