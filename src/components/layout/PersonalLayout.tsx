import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookMarked,
  Bot,
  Crown,
  Feather,
  Globe,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { RoleSwitcherBar, SUPERADMIN_EMAIL } from './RoleSwitcherBar';
import { AmbientBackground } from '../ui/AmbientBackground';
import { FloatingInstructionPopup } from '../ui/SlidingInstructionBubbles';
import { useApp } from '../../context/AppContext';

const PERSONAL_NAV_ITEMS = [
  { label: 'Tableau de bord', to: '/espace/tableau-de-bord', icon: LayoutDashboard },
  { label: 'Assistant Nia-Mind', to: '/espace/assistant', icon: Bot },
  { label: 'Demander une écoute humaine', to: '/espace/ecoute', icon: HeartHandshake },
  { label: 'Mon bien-être', to: '/espace/bien-etre', icon: Activity },
  { label: 'Mon journal', to: '/espace/journal', icon: BookMarked },
  { label: 'Conseils du jour', to: '/espace/conseils-du-jour', icon: Sparkles },
  { label: 'Histoires', to: '/espace/histoires', icon: Feather },
  { label: 'Mon profil', to: '/espace/profil', icon: User },
  { label: 'Confidentialité et paramètres', to: '/espace/confidentialite', icon: Lock },
];

export const PersonalLayout: React.FC = () => {
  const { currentUser, logout } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <div className="relative min-h-screen flex flex-col text-nia-gray-dark dark:text-nia-text-dark">
      <AmbientBackground />
      <RoleSwitcherBar />

      {/* Barre supérieure mobile de l'espace personnel */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 nia-glass-card border-b border-nia-orange/25 dark:border-nia-border-dark">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-2.5 py-1.5 rounded-full text-xs font-bold border border-nia-orange/35"
          >
            Site public
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((o) => !o)}
            className="p-2 rounded-xl border border-nia-orange/35"
            aria-label="Menu de l'espace personnel"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Tiroir mobile de navigation personnelle */}
      {mobileDrawerOpen && (
        <div className="lg:hidden relative z-30 nia-glass-card border-b border-nia-orange/25 px-4 py-4 space-y-1.5 animate-nia-page">
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
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      <div className="relative z-10 flex-1 flex max-w-7xl w-full mx-auto">
        {/* Barre latérale translucide sur ordinateur */}
        <aside className="hidden lg:flex lg:w-72 shrink-0 flex-col border-r border-nia-orange/20 dark:border-nia-border-dark nia-glass-card p-5 justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <BrandLogo showSlogan size="md" />
            </div>

            {/* Carte d'identité utilisateur connecté */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-nia-orange/15 to-nia-bordeaux/15 border border-nia-orange/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nia-orange to-nia-bordeaux text-white font-extrabold flex items-center justify-center shadow-sm">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-nia-gray-dark dark:text-white truncate">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-nia-gray-mid dark:text-gray-300 truncate">
                    Plume : {currentUser.publicPseudonym}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-nia-orange/20 flex items-center justify-between text-[11px] text-nia-bordeaux dark:text-amber-300 font-bold">
                <span>Espace personnel confidentiel</span>
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
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>

          <div className="pt-6 border-t border-nia-orange/20 dark:border-nia-border-dark space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl text-xs font-bold text-nia-gray-mid dark:text-gray-300 hover:text-nia-orange transition-colors"
            >
              <Globe className="w-4 h-4" />
              Retour au site public
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
              Déconnexion
            </button>
          </div>
        </aside>

        {/* Contenu principal de l'onglet personnel */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 animate-nia-page">
          <Outlet />
        </main>
      </div>

      <FloatingInstructionPopup />
    </div>
  );
};
