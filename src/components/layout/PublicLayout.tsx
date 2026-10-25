import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Crown,
  Lock,
  Menu,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { RoleSwitcherBar, SUPERADMIN_EMAIL } from './RoleSwitcherBar';
import { AmbientBackground } from '../ui/AmbientBackground';
import { FloatingInstructionPopup } from '../ui/SlidingInstructionBubbles';
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

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  return (
    <div className="relative min-h-screen flex flex-col text-nia-gray-dark dark:text-nia-text-dark">
      <AmbientBackground />
      <RoleSwitcherBar />

      {/* En-tête public officiel translucide en symbiose Orange & Bordeaux */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-gradient-to-r from-[#FFF5EE]/85 via-[#FDF0F4]/85 to-[#FFF5EE]/85 dark:from-[#111318]/90 dark:via-[#1F121B]/90 dark:to-[#111318]/90 border-b border-nia-orange/25 dark:border-nia-border-dark shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <BrandLogo showSlogan size="md" />

          {/* Navigation ordinateur */}
          <nav className="hidden lg:flex items-center gap-1.5" aria-label="Navigation principale">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `px-4 py-2 rounded-full text-sm font-extrabold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white shadow-sm'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:text-nia-orange dark:hover:text-nia-orange hover:bg-nia-orange/10'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {/* Onglet Assistance & Espace (redirige vers /inscription si Visiteur) */}
            <Link
              to={currentUser ? '/espace/assistant' : '/inscription?from=assistant'}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-extrabold bg-nia-bordeaux/12 dark:bg-nia-bordeaux/30 text-nia-bordeaux dark:text-amber-200 hover:bg-nia-bordeaux hover:text-white transition-all border border-nia-bordeaux/25"
            >
              <Bot className="w-4 h-4 text-nia-orange" />
              <span>Assistance & Espace</span>
            </Link>
          </nav>

          {/* Boutons d'action En-tête */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <Link
                to="/espace/tableau-de-bord"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux hover:from-nia-orange-deep hover:to-nia-bordeaux-dark text-white text-sm font-extrabold shadow-nia-soft transition-all"
              >
                <span>Mon espace ({currentUser.displayName})</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="px-4 py-2.5 rounded-full text-sm font-extrabold text-nia-gray-dark dark:text-gray-200 hover:text-nia-orange border border-nia-orange/30 hover:border-nia-orange transition-colors"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux hover:from-nia-orange-deep hover:to-nia-bordeaux-dark text-white text-sm font-extrabold shadow-nia-soft transition-all"
                >
                  <span>S’inscrire</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Bouton Menu Mobile */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="lg:hidden p-2.5 rounded-2xl border border-nia-orange/35 dark:border-nia-border-dark text-nia-gray-dark dark:text-white hover:bg-nia-orange/15"
            aria-expanded={mobileMenuOpen}
            aria-label="Ouvrir ou fermer le menu de navigation"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Menu Mobile Compact et Accessible au toucher */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-nia-orange/25 dark:border-nia-border-dark nia-glass-card px-4 pt-3 pb-6 space-y-2 animate-nia-page">
            {PUBLIC_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-4 py-3 rounded-2xl text-base font-extrabold ${
                    isActive
                      ? 'bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white'
                      : 'text-nia-gray-dark dark:text-gray-200 hover:bg-nia-orange/15'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <Link
              to={currentUser ? '/espace/assistant' : '/inscription?from=assistant'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-extrabold text-nia-bordeaux dark:text-amber-300 bg-nia-bordeaux/10"
            >
              <Bot className="w-5 h-5 text-nia-orange" />
              <span>Utiliser l’Assistance & Mon Espace</span>
            </Link>
            <div className="pt-3 border-t border-nia-orange/20 dark:border-nia-border-dark grid grid-cols-2 gap-3">
              <Link
                to="/connexion"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 rounded-2xl border border-nia-orange/40 font-extrabold text-sm text-nia-gray-dark dark:text-white"
              >
                Connexion
              </Link>
              <Link
                to="/inscription"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-3 rounded-2xl bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white font-extrabold text-sm"
              >
                S’inscrire
              </Link>
            </div>
            {currentUser && (
              <Link
                to="/espace/tableau-de-bord"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-3 rounded-2xl bg-nia-bordeaux text-white font-extrabold text-sm"
              >
                Accéder à mon espace personnel ({currentUser.displayName})
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Contenu de la page */}
      <main className="relative z-10 flex-1">
        <Outlet />
      </main>

      {/* Bulle flottante d'instructions glissante avec bouton croix */}
      <FloatingInstructionPopup />

      {/* Pied de page complet Nia-Mind */}
      <footer className="relative z-10 nia-glass-card border-t border-nia-orange/25 dark:border-nia-border-dark mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-4">
              <BrandLogo showSlogan size="md" />
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                Nia-Mind est un espace numérique d’écoute, de réflexion, de bien-être et d’expression personnelle où chacun peut parler avec sincérité, écrire ses pensées et raconter son histoire sans être obligé de jouer un rôle.
              </p>
              <p className="text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                « {OFFICIAL_SLOGAN} »
              </p>
            </div>

            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-white mb-4">
                Navigation publique
              </h3>
              <ul className="space-y-2.5 text-sm text-nia-gray-mid dark:text-gray-300">
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
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-white mb-4">
                Outils & Espace Personnel
              </h3>
              <ul className="space-y-2.5 text-sm text-nia-gray-mid dark:text-gray-300">
                <li>
                  <Link
                    to={currentUser ? '/espace/tableau-de-bord' : '/inscription'}
                    className="hover:text-nia-orange transition-colors"
                  >
                    Tableau de bord personnel
                  </Link>
                </li>
                <li>
                  <Link
                    to={currentUser ? '/espace/assistant' : '/inscription?from=assistant'}
                    className="hover:text-nia-orange transition-colors"
                  >
                    Assistant Nia-Mind (Réflexion sincère)
                  </Link>
                </li>
                <li>
                  <Link
                    to={currentUser ? '/espace/ecoute' : '/inscription?from=ecoute'}
                    className="hover:text-nia-orange transition-colors"
                  >
                    Demander une écoute humaine
                  </Link>
                </li>
                <li>
                  <Link
                    to={currentUser ? '/espace/journal' : '/inscription?from=journal'}
                    className="hover:text-nia-orange transition-colors"
                  >
                    Journal strictement privé
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={openConsentModal}
                    className="hover:text-nia-orange transition-colors text-left"
                  >
                    Politique de confidentialité & Cookies
                  </button>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-nia-gray-dark dark:text-white">
                Éthique & Urgences
              </h3>
              <div className="p-4 rounded-2xl bg-gradient-to-br from-nia-orange/15 to-nia-bordeaux/15 border border-nia-orange/30 space-y-2">
                <div className="flex items-center gap-2 text-xs font-extrabold text-nia-bordeaux dark:text-amber-300">
                  <PhoneCall className="w-4 h-4 text-nia-orange" />
                  En cas de détresse immédiate
                </div>
                <p className="text-xs text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                  Nia-Mind n’est pas un service médical d’urgence. Au Burkina Faso : composez le <strong>18</strong> / <strong>112</strong> ou le <strong>3535</strong>. En France : <strong>3114</strong>.
                </p>
                <Link
                  to="/ressources"
                  className="inline-flex items-center gap-1 text-xs font-extrabold text-nia-orange hover:text-nia-orange-deep"
                >
                  Voir tous les numéros vérifiés par pays
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openDailyTipModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-nia-orange/20 text-nia-orange-deep dark:text-nia-orange hover:bg-nia-orange/30 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Conseil du jour
                </button>
                <button
                  type="button"
                  onClick={openConsentModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-200 hover:bg-nia-bordeaux/25 transition-colors"
                >
                  <Lock className="w-3.5 h-3.5" />
                  Cookies & Confidentialité
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-6 border-t border-nia-orange/20 dark:border-nia-border-dark flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-nia-gray-mid dark:text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nia-orange" />
              <span>
                © {new Date().getFullYear()} Nia-Mind — « {OFFICIAL_SLOGAN} ». Confidentialité & Protection intégrale de vos écrits.
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/connexion" className="hover:text-nia-orange font-semibold">
                Connexion
              </Link>
              <Link to="/inscription" className="hover:text-nia-orange font-semibold">
                S’inscrire
              </Link>
              {isSuperAdmin && (
                <Link
                  to="/admin/vue-ensemble"
                  className="hover:text-nia-orange font-extrabold flex items-center gap-1 text-nia-bordeaux dark:text-amber-300"
                >
                  <Crown className="w-3.5 h-3.5 text-nia-orange" />
                  Console Superadmin
                </Link>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
