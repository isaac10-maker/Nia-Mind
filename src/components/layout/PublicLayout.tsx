import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowRight,
  HeartHandshake,
  Lock,
  Menu,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { RoleSwitcherBar } from './RoleSwitcherBar';
import { useApp } from '../../context/AppContext';
import { OFFICIAL_SLOGAN, STORIES_SIGNATURE } from '../../lib/securityEngine';

const PUBLIC_NAV_ITEMS = [
  { label: 'Accueil', to: '/' },
  { label: 'Nos ressources', to: '/ressources' },
  { label: 'Conseils', to: '/conseils' },
  { label: 'Histoires', to: '/histoires' },
  { label: 'À propos', to: '/a-propos' },
];

export const PublicLayout: React.FC = () => {
  const { currentUser, openConsentModal, openDailyTipModal } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-nia-text-dark">
      <RoleSwitcherBar />

      {/* En-tête public officiel */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-nia-bg-light/90 dark:bg-nia-bg-dark/90 border-b border-nia-gray-light dark:border-nia-border-dark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <BrandLogo showSlogan size="md" />

          {/* Navigation ordinateur */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Navigation principale">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange'
                      : 'text-nia-gray-dark dark:text-gray-300 hover:text-nia-orange dark:hover:text-nia-orange hover:bg-nia-gray-light/40 dark:hover:bg-nia-surface-dark'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Boutons d'action En-tête */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/connexion"
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-nia-gray-dark dark:text-gray-200 hover:text-nia-orange border border-transparent hover:border-nia-gray-light dark:hover:border-nia-border-dark transition-colors"
            >
              Connexion
            </Link>
            <Link
              to={currentUser ? '/espace/tableau-de-bord' : '/inscription'}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-bold shadow-nia-soft hover:shadow-nia-glow transition-all"
            >
              <span>Commencer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-white hover:bg-nia-gray-light/50 dark:hover:bg-nia-surface-dark"
            aria-expanded={mobileMenuOpen}
            aria-label="Ouvrir ou fermer le menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile Compact et Accessible au toucher */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-nia-gray-light dark:border-nia-border-dark bg-white dark:bg-nia-surface-dark px-4 pt-3 pb-6 space-y-2 animate-nia-page">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-xl text-base font-semibold ${
                    isActive
                      ? 'bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/40 dark:hover:bg-nia-border-dark/40'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="pt-3 border-t border-nia-gray-light dark:border-nia-border-dark grid grid-cols-2 gap-3">
              <Link
                to="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 rounded-xl border border-nia-gray-light dark:border-nia-border-dark font-semibold text-sm text-nia-gray-dark dark:text-white"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm"
              >
                Créer un compte
              </Link>
            </div>
            {currentUser && (
              <Link
                to="/espace/tableau-de-bord"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-3 rounded-xl bg-nia-bordeaux text-white font-semibold text-sm"
              >
                Accéder à mon espace personnel ({currentUser.displayName})
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Contenu de la page */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Pied de page complet Nia-Mind */}
      <footer className="bg-white dark:bg-nia-surface-dark border-t border-nia-gray-light dark:border-nia-border-dark mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-4">
              <BrandLogo showSlogan size="md" />
              <p className="text-sm text-nia-gray-mid dark:text-gray-400 leading-relaxed">
                Nia-Mind est un espace numérique d’écoute, de réflexion, de bien-être et d’expression personnelle où chacun peut parler avec sincérité, écrire ses pensées et raconter son histoire sans être obligé de jouer un rôle.
              </p>
              <p className="text-xs font-bold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                « {OFFICIAL_SLOGAN} »
              </p>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-nia-gray-dark dark:text-white mb-4">
                Navigation publique
              </h3>
              <ul className="space-y-2.5 text-sm text-nia-gray-mid dark:text-gray-400">
                <li>
                  <Link to="/" className="hover:text-nia-orange transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link to="/ressources" className="hover:text-nia-orange transition-colors">
                    Nos ressources d’aide vérifiées
                  </Link>
                </li>
                <li>
                  <Link to="/conseils" className="hover:text-nia-orange transition-colors">
                    Conseils & Réflexions
                  </Link>
                </li>
                <li>
                  <Link to="/histoires" className="hover:text-nia-orange transition-colors">
                    Histoires — {STORIES_SIGNATURE}
                  </Link>
                </li>
                <li>
                  <Link to="/a-propos" className="hover:text-nia-orange transition-colors">
                    À propos de Nia-Mind
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-nia-gray-dark dark:text-white mb-4">
                Espace personnel & Sécurité
              </h3>
              <ul className="space-y-2.5 text-sm text-nia-gray-mid dark:text-gray-400">
                <li>
                  <Link to="/espace/tableau-de-bord" className="hover:text-nia-orange transition-colors">
                    Tableau de bord personnel
                  </Link>
                </li>
                <li>
                  <Link to="/espace/assistant" className="hover:text-nia-orange transition-colors">
                    Assistant Nia-Mind (IA réflexive)
                  </Link>
                </li>
                <li>
                  <Link to="/espace/ecoute" className="hover:text-nia-orange transition-colors">
                    Demander une écoute humaine
                  </Link>
                </li>
                <li>
                  <Link to="/espace/journal" className="hover:text-nia-orange transition-colors">
                    Journal strictement privé
                  </Link>
                </li>
                <li>
                  <Link to="/espace/confidentialite" className="hover:text-nia-orange transition-colors">
                    Confidentialité, RLS & RGPD
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-nia-gray-dark dark:text-white">
                Éthique & Urgences
              </h3>
              <div className="p-4 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-nia-bordeaux dark:text-amber-300">
                  <PhoneCall className="w-4 h-4 text-nia-orange" />
                  En cas de détresse immédiate
                </div>
                <p className="text-xs text-nia-gray-mid dark:text-gray-400 leading-relaxed">
                  Nia-Mind n’est pas un service médical d’urgence. Au Burkina Faso : composez le <strong>18</strong> / <strong>112</strong> ou le <strong>3535</strong>. En France : <strong>3114</strong>.
                </p>
                <Link
                  to="/ressources"
                  className="inline-flex items-center gap-1 text-xs font-bold text-nia-orange hover:text-nia-orange-deep"
                >
                  Voir tous les numéros vérifiés par pays
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openDailyTipModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange hover:bg-nia-orange/25 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Conseil du jour
                </button>
                <button
                  type="button"
                  onClick={openConsentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-nia-gray-light/60 dark:bg-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Gérer mes consentements
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-nia-gray-light dark:border-nia-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-nia-gray-mid dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nia-orange" />
              <span>
                © {new Date().getFullYear()} Nia-Mind — « {OFFICIAL_SLOGAN} ». Protection des données par Row Level Security (RLS).
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/connexion" className="hover:text-nia-orange">
                Connexion
              </Link>
              <Link to="/inscription" className="hover:text-nia-orange">
                Créer un compte
              </Link>
              <Link to="/admin/vue-ensemble" className="hover:text-nia-orange flex items-center gap-1">
                <HeartHandshake className="w-3.5 h-3.5" />
                Espace Équipe & Admin
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
