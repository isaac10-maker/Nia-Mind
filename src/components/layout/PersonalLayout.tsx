import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Activity,
  BookMarked,
  Bot,
  Feather,
  Globe,
  HeartHandshake,
  LayoutDashboard,
  Lock,
  LogOut,
  Menu,
  ShieldAlert,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { RoleSwitcherBar } from './RoleSwitcherBar';
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
  const { currentUser, switchDemoUser, logout } = useApp();
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col bg-nia-bg-light dark:bg-nia-bg-dark">
        <RoleSwitcherBar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark p-8 text-center shadow-nia-soft space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-nia-orange/15 text-nia-orange mx-auto flex items-center justify-center">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-nia-gray-dark dark:text-white">
              Session requise pour accéder à l’espace personnel
            </h1>
            <p className="text-sm text-nia-gray-mid dark:text-gray-400">
              Vos données (journal, suivi bien-être, conversations IA et histoires en cours) sont protégées. Connectez-vous ou activez un profil de démonstration ci-dessous.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/connexion"
                className="px-4 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold"
              >
                Se connecter
              </Link>
              <button
                type="button"
                onClick={() => switchDemoUser('user-a')}
                className="px-4 py-2.5 rounded-xl border border-nia-bordeaux text-nia-bordeaux dark:text-amber-300 text-sm font-semibold hover:bg-nia-bordeaux/10"
              >
                Activer Amina (Utilisateur A)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-nia-text-dark">
      <RoleSwitcherBar />

      {/* Barre supérieure mobile de l'espace personnel */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white/95 dark:bg-nia-surface-dark/95 backdrop-blur border-b border-nia-gray-light dark:border-nia-border-dark">
        <BrandLogo size="sm" />
        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-nia-gray-light dark:border-nia-border-dark"
          >
            Site public
          </Link>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen((o) => !o)}
            className="p-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark"
            aria-label="Menu de l'espace personnel"
          >
            {mobileDrawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Tiroir mobile de navigation personnelle */}
      {mobileDrawerOpen && (
        <div className="lg:hidden bg-white dark:bg-nia-surface-dark border-b border-nia-gray-light dark:border-nia-border-dark px-4 py-4 space-y-1.5 animate-nia-page">
          {PERSONAL_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-nia-orange text-white shadow-sm'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/50 dark:hover:bg-nia-border-dark/40'
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

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Barre latérale claire sur ordinateur */}
        <aside className="hidden lg:flex lg:w-72 shrink-0 flex-col border-r border-nia-gray-light dark:border-nia-border-dark bg-white/80 dark:bg-nia-surface-dark/80 p-5 justify-between">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <BrandLogo showSlogan size="md" />
            </div>

            {/* Carte d'identité utilisateur connecté */}
            <div className="p-3.5 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-nia-orange to-nia-bordeaux text-white font-bold flex items-center justify-center">
                  {currentUser.displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-nia-gray-dark dark:text-white truncate">
                    {currentUser.displayName}
                  </p>
                  <p className="text-xs text-nia-gray-mid dark:text-gray-400 truncate">
                    Plume : {currentUser.publicPseudonym}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 pt-2.5 border-t border-nia-gray-light dark:border-nia-border-dark flex items-center justify-between text-[11px] text-nia-bordeaux dark:text-amber-300 font-semibold">
                <span>Espace chiffré & isolé (RLS)</span>
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-nia-orange text-white shadow-nia-soft'
                          : 'text-nia-gray-dark dark:text-gray-300 hover:bg-nia-orange/10 hover:text-nia-orange-deep dark:hover:text-nia-orange'
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

          <div className="pt-6 border-t border-nia-gray-light dark:border-nia-border-dark space-y-2">
            <Link
              to="/"
              className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-nia-gray-mid dark:text-gray-400 hover:text-nia-orange transition-colors"
            >
              <Globe className="w-4 h-4" />
              Retour au site public
            </Link>
            {currentUser.role === 'admin' && (
              <Link
                to="/admin/vue-ensemble"
                className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 hover:bg-nia-bordeaux/25 transition-colors"
              >
                Console d’administration
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors"
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
    </div>
  );
};
