import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  Activity,
  Archive,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileClock,
  Globe,
  HeartHandshake,
  LifeBuoy,
  Lock,
  Menu,
  Settings,
  ShieldAlert,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { RoleSwitcherBar } from './RoleSwitcherBar';
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
  const { currentUser, switchDemoUser } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Contrôle de rôle strict : si l'utilisateur n'est pas 'admin', accès refusé
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-nia-bg-light dark:bg-nia-bg-dark">
        <RoleSwitcherBar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-bordeaux/40 p-8 text-center shadow-xl space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300 mx-auto flex items-center justify-center">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-300">
              <Lock className="w-3.5 h-3.5" />
              Protection Rôle Serveur (403 — Accès Refusé)
            </span>
            <h1 className="text-2xl font-bold text-nia-gray-dark dark:text-white">
              Espace réservé à l’administration Nia-Mind
            </h1>
            <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
              Votre compte actuel (<strong>{currentUser?.displayName || 'Visiteur'}</strong>, rôle{' '}
              <code>{currentUser?.role || 'anonymous'}</code>) ne dispose pas de la permission serveur{' '}
              <code>public.is_admin()</code>. Un utilisateur standard ne peut jamais s’attribuer lui-même le rôle administrateur.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => switchDemoUser('admin-1')}
                className="px-5 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold shadow-sm transition-colors"
              >
                Basculer sur le compte Admin (Soraïa) pour tester
              </button>
              <Link
                to="/espace/tableau-de-bord"
                className="px-4 py-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-sm font-semibold text-nia-gray-dark dark:text-gray-200"
              >
                Retour à mon espace personnel
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-nia-text-dark">
      <RoleSwitcherBar />

      {/* En-tête mobile Admin */}
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white dark:bg-nia-surface-dark border-b border-nia-gray-light dark:border-nia-border-dark">
        <BrandLogo size="sm" />
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          className="p-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark"
          aria-label="Menu administration"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {mobileOpen && (
        <div className="lg:hidden bg-white dark:bg-nia-surface-dark border-b border-nia-gray-light dark:border-nia-border-dark px-4 py-3 space-y-1">
          {ADMIN_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold ${
                    isActive
                      ? 'bg-nia-bordeaux text-white'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/50'
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

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <aside className="hidden lg:flex lg:w-72 shrink-0 flex-col border-r border-nia-gray-light dark:border-nia-border-dark bg-white dark:bg-nia-surface-dark p-5 justify-between">
          <div className="space-y-6">
            <BrandLogo showSlogan size="md" />

            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-nia-bordeaux-dark to-nia-bordeaux text-white">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
                <CheckCircle2 className="w-4 h-4 text-nia-orange" />
                Administration Vérifiée
              </div>
              <p className="text-sm font-bold mt-1">{currentUser.displayName}</p>
              <p className="text-[11px] text-white/80 mt-0.5">
                Règle d’or active : aucune histoire n’est publiable sans le consentement explicite de l’auteur sur la version courante.
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
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? 'bg-nia-orange text-white shadow-sm'
                          : 'text-nia-gray-dark dark:text-gray-300 hover:bg-nia-orange/10 hover:text-nia-orange'
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

          <div className="pt-4 border-t border-nia-gray-light dark:border-nia-border-dark space-y-2">
            <Link
              to="/espace/tableau-de-bord"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-nia-gray-mid dark:text-gray-300 hover:text-nia-orange"
            >
              Aller à l’espace personnel
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-nia-gray-mid dark:text-gray-300 hover:text-nia-orange"
            >
              <Globe className="w-4 h-4" />
              Retour au site public
            </Link>
          </div>
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 animate-nia-page">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
