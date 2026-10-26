import React, { useState } from 'react';
import { Link, Navigate, NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Archive,
  ClipboardList,
  Crown,
  FileCheck2,
  FileClock,
  Globe,
  HeartHandshake,
  LifeBuoy,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react';
import { RoleSwitcherBar, SUPERADMIN_EMAIL } from './RoleSwitcherBar';
import { AmbientBackground } from '../ui/AmbientBackground';
import { useApp } from '../../context/AppContext';

const ADMIN_NAV_ITEMS = [
  { label: 'Vue d’ensemble', to: '/admin/vue-ensemble', icon: Activity },
  { label: 'Utilisateurs', to: '/admin/utilisateurs', icon: Users },
  { label: 'Demandes d’écoute', to: '/admin/ecoute', icon: HeartHandshake },
  { label: 'Histoires reçues', to: '/admin/histoires-recues', icon: FileClock },
  { label: 'Histoires publiées', to: '/admin/histoires-publiees', icon: FileCheck2 },
  { label: 'Conseils et contenus', to: '/admin/conseils', icon: Sparkles },
  { label: 'Questionnaires', to: '/admin/questionnaires', icon: ClipboardList },
  { label: 'Ressources d’aide', to: '/admin/ressources', icon: LifeBuoy },
  { label: 'Paramètres', to: '/admin/parametres', icon: Settings },
  { label: 'Journaux d’audit', to: '/admin/audit', icon: Archive },
];

export const AdminLayout: React.FC = () => {
  const { currentUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  // La console Admin n'est visible et accessible QUE par le Superadmin (isaacamegan10@gmail.com)
  if (!isSuperAdmin) {
    return <Navigate to={currentUser ? '/espace/tableau-de-bord' : '/connexion'} replace />;
  }

  return (
    <div className="relative min-h-screen flex flex-col text-nia-gray-dark dark:text-nia-text-dark">
      <AmbientBackground />
      <RoleSwitcherBar
        onToggleMobileMenu={() => setMobileOpen((o) => !o)}
        mobileMenuOpen={mobileOpen}
      />

      {mobileOpen && (
        <div className="lg:hidden relative z-30 nia-glass-card border-b border-nia-orange/25 px-3 py-3 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-extrabold ${
                    isActive
                      ? 'bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-orange/15'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      {/* Cadrage plein écran sans marge perdue dans les angles */}
      <div className="relative z-10 flex-1 flex w-full min-w-0">
        <aside className="hidden lg:flex lg:w-64 xl:w-72 shrink-0 flex-col border-r border-nia-orange/25 dark:border-nia-border-dark nia-glass-card p-4 justify-between">
          <div className="space-y-5">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-nia-bordeaux-dark via-nia-bordeaux to-nia-orange-deep text-white shadow-md">
              <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-200">
                <Crown className="w-4 h-4 text-nia-orange" />
                Superadmin • Accès Intégral
              </div>
              <p className="text-sm font-extrabold mt-1">{currentUser?.displayName}</p>
              <p className="text-[11px] text-amber-100/90 truncate">{currentUser?.email}</p>
              <p className="text-[11px] text-white/80 mt-2 pt-2 border-t border-white/15">
                Règle d’or : aucune histoire n’est publiable sans le consentement explicite de l’auteur sur la version courante.
              </p>
            </div>

            <nav className="space-y-1" aria-label="Navigation administration">
              {ADMIN_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-extrabold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                          : 'text-nia-gray-dark dark:text-gray-300 hover:bg-nia-orange/15 hover:text-nia-orange'
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

          <div className="pt-4 border-t border-nia-orange/20 dark:border-nia-border-dark space-y-2">
            <Link
              to="/espace/tableau-de-bord"
              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold text-nia-gray-mid dark:text-gray-200 hover:text-nia-orange"
            >
              Aller à mon espace personnel
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-2xl text-xs font-extrabold text-nia-gray-mid dark:text-gray-200 hover:text-nia-orange"
            >
              <Globe className="w-4 h-4" />
              Retour à l’accueil
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 overflow-x-hidden p-3 sm:p-5 lg:p-6 animate-nia-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
