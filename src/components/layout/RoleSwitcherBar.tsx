import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Moon, Shield, Sparkles, Sun, UserCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RoleSwitcherBar: React.FC = () => {
  const {
    currentUser,
    switchDemoUser,
    theme,
    toggleTheme,
    openDailyTipModal,
    openConsentModal,
  } = useApp();
  const location = useLocation();

  return (
    <div className="bg-nia-bordeaux-dark text-white/95 text-xs border-b border-nia-bordeaux/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 font-semibold text-amber-200">
            <Shield className="w-3.5 h-3.5 text-nia-orange" />
            Profil actif (Test RLS & Rôles) :
          </span>
          <div className="inline-flex flex-wrap items-center gap-1 bg-black/25 p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => switchDemoUser('user-a')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                currentUser?.id === 'user-a'
                  ? 'bg-nia-orange text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Utilisateur A (Amina)
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('user-b')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                currentUser?.id === 'user-b'
                  ? 'bg-nia-orange text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Utilisateur B (Lucas)
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser('admin-1')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                currentUser?.id === 'admin-1'
                  ? 'bg-nia-orange text-white shadow-sm'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              Admin (Soraïa)
            </button>
            <button
              type="button"
              onClick={() => switchDemoUser(null)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                currentUser === null
                  ? 'bg-white/25 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              Visiteur
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={openDailyTipModal}
            className="inline-flex items-center gap-1 text-amber-200 hover:text-white font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-nia-orange" />
            <span>Conseil du jour</span>
          </button>

          <button
            type="button"
            onClick={openConsentModal}
            className="hidden sm:inline-flex items-center gap-1 text-white/80 hover:text-white transition-colors"
          >
            <span>Consentements</span>
          </button>

          {!location.pathname.startsWith('/espace') && currentUser && (
            <Link
              to="/espace/tableau-de-bord"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-nia-orange" />
              Mon espace
            </Link>
          )}

          {currentUser?.role === 'admin' && !location.pathname.startsWith('/admin') && (
            <Link
              to="/admin/vue-ensemble"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-nia-orange hover:bg-nia-orange-deep text-white font-semibold transition-colors"
            >
              Administration
            </Link>
          )}

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label={theme === 'dark' ? 'Passer au thème clair' : 'Passer au thème sombre'}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-nia-orange" />
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
