import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookMarked,
  Crown,
  Feather,
  Globe,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  LogOut,
  Sparkles,
  User,
} from 'lucide-react';
import { NeuralChipIcon } from '../ui/NeuralChipIcon';
import { RoleSwitcherBar, SUPERADMIN_EMAIL } from './RoleSwitcherBar';
import { AmbientBackground } from '../ui/AmbientBackground';
import { FloatingInstructionPopup } from '../ui/SlidingInstructionBubbles';
import { useApp } from '../../context/AppContext';
import { tUi } from '../../lib/i18nEngine';

export const PersonalLayout: React.FC = () => {
  const { currentUser, authReady, currentLanguage, logout } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const PERSONAL_NAV_ITEMS = [
    { label: tUi(currentLanguage, 'navDashboard'), to: '/espace/tableau-de-bord', icon: LayoutDashboard },
    { label: tUi(currentLanguage, 'navAssistant'), to: '/espace/assistant', icon: NeuralChipIcon },
    { label: tUi(currentLanguage, 'navListening'), to: '/espace/ecoute', icon: HeartHandshake },
    { label: tUi(currentLanguage, 'navWellness'), to: '/espace/bien-etre', icon: Activity },
    { label: tUi(currentLanguage, 'navJournal'), to: '/espace/journal', icon: BookMarked },
    { label: tUi(currentLanguage, 'navTips'), to: '/espace/conseils-du-jour', icon: Sparkles },
    { label: tUi(currentLanguage, 'navStories'), to: '/espace/histoires', icon: Feather },
    { label: tUi(currentLanguage, 'navProfile'), to: '/espace/profil', icon: User },
    { label: tUi(currentLanguage, 'navPrivacy'), to: '/espace/confidentialite', icon: Lock },
  ];

  if (!authReady) {
    return <div className="min-h-screen bg-[#F3FBF6]" aria-busy="true" aria-label="Session en cours" />;
  }

  // En mode visiteur, toute tentative d'entrer dans un onglet personnel ou d'utiliser l'assistance redirige vers l'inscription/connexion
  if (!currentUser) {
    return (
      <Navigate
        to={`/inscription?redirect=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }

  const isSuperAdmin =
    currentUser.role === 'admin' &&
    currentUser.email.toLowerCase() === SUPERADMIN_EMAIL;

  const displayedPseudo = currentUser.publicPseudonym || currentUser.displayName || 'Plume';

  return (
    <div data-nia-zone="personal" className="relative min-h-screen flex flex-col text-nia-gray-dark dark:text-nia-text-dark">
      <AmbientBackground />
      <RoleSwitcherBar
        onToggleMobileMenu={() => setMobileDrawerOpen((o) => !o)}
        mobileMenuOpen={mobileDrawerOpen}
      />

      {/* Tiroir mobile de navigation personnelle */}
      {mobileDrawerOpen && (
        <div className="lg:hidden relative z-30 nia-glass-card border-b border-nia-orange/25 px-3 py-3 space-y-1.5 animate-nia-page">
          {PERSONAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-extrabold ${
                    isActive
                      ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-orange/15'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Cadrage plein écran sans marge perdue dans les angles */}
      <div className="relative z-10 flex-1 flex w-full min-w-0">
        {/* Barre latérale translucide sur ordinateur (sans second logo Nia-Mind sous le bandeau) */}
        <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col border-r border-nia-orange/20 dark:border-nia-border-dark nia-glass-card p-4 justify-between">
          <div className="space-y-5">
            {/* Carte d'identité utilisateur connecté (affichage strictement limité au pseudonyme) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-nia-orange/15 to-nia-bordeaux/15 border border-nia-orange/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nia-orange to-nia-bordeaux text-white font-extrabold flex items-center justify-center shadow-sm shrink-0">
                  {displayedPseudo.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p
                    data-no-translate="true"
                    className="text-sm font-extrabold text-nia-gray-dark dark:text-white truncate"
                  >
                    @{displayedPseudo}
                  </p>
                  <p className="text-xs text-nia-gray-mid dark:text-gray-300 truncate">
                    Pseudonyme protégé
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-nia-orange/20 flex items-center justify-between text-[11px] text-nia-bordeaux dark:text-amber-300 font-bold">
                <span>Espace confidentiel</span>
                <span>Pays : {currentUser.countryCode}</span>
              </div>
            </div>

            {/* Navigation des 9 onglets de l'espace personnel */}
            <nav className="space-y-1" aria-label="Navigation de l'espace personnel">
              {PERSONAL_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-extrabold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-nia-soft'
                          : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-orange/15 hover:text-nia-orange-deep dark:hover:text-nia-orange'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="pt-5 border-t border-nia-orange/20 dark:border-nia-border-dark space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-nia-gray-mid dark:text-gray-300 hover:text-nia-orange transition-colors"
            >
              <Globe className="w-4 h-4" />
              {tUi(currentLanguage, 'navHome')}
            </Link>
            {isSuperAdmin && (
              <Link
                to="/admin/vue-ensemble"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white shadow-sm transition-all"
              >
                <Crown className="w-4 h-4" />
                Console Superadmin
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-extrabold text-rose-600 dark:text-rose-400 hover:bg-rose-500/15 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              {tUi(currentLanguage, 'logout')}
            </button>
          </div>
        </aside>

        {/* Contenu principal de l'onglet personnel (cadré sans marge perdue) */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-3 sm:p-5 lg:p-6 animate-nia-page">
          <Outlet />
        </main>
      </div>

      {/* Bulle flottante d'instructions ("?" fermé par défaut) */}
      <FloatingInstructionPopup />
    </div>
  );
};
