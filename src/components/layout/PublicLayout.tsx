import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowRight,
  Crown,
  Lock,
  Menu,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BrandLogo } from '../ui/BrandLogo';
import { NeuralChipIcon } from '../ui/NeuralChipIcon';
import {
  BanNoticeModal,
  HeaderLangAndThemeControls,
  SUPERADMIN_EMAIL,
  TvAnnouncementTicker,
  UserSpaceCompactButton,
} from './RoleSwitcherBar';
import { AmbientBackground } from '../ui/AmbientBackground';
import { OfflineBanner } from '../ui/OfflineBanner';
import { PlatformMaintenanceBanner } from '../ui/PlatformMaintenanceBanner';
import { FloatingInstructionPopup } from '../ui/SlidingInstructionBubbles';
import { useApp } from '../../context/AppContext';
import { tUi } from '../../lib/i18nEngine';
import { tCommunity } from '../../lib/communityI18n';
import { STORIES_SIGNATURE } from '../../lib/securityEngine';

export const PublicLayout: React.FC = () => {
  const { currentUser, currentLanguage, openConsentModal, openDailyTipModal } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const PUBLIC_NAV_ITEMS = [
    { label: tUi(currentLanguage, 'navHome'), to: '/', group: tUi(currentLanguage, 'navGroupDiscover') },
    { label: tUi(currentLanguage, 'navTips'), to: '/conseils', group: tUi(currentLanguage, 'navGroupRead') },
    { label: tUi(currentLanguage, 'navStories'), to: '/histoires', group: tUi(currentLanguage, 'navGroupRead') },
    { label: tUi(currentLanguage, 'navResources'), to: '/ressources', group: tUi(currentLanguage, 'navGroupRead') },
    { label: tUi(currentLanguage, 'navCommunities'), to: '/communautes', group: tUi(currentLanguage, 'navGroupDiscover') },
    { label: tUi(currentLanguage, 'navLeisure'), to: '/loisir', group: tUi(currentLanguage, 'navGroupPlay') },
    { label: tUi(currentLanguage, 'navAbout'), to: '/a-propos', group: tUi(currentLanguage, 'navGroupAccount') },
  ];

  const isAuthRoute =
    location.pathname === '/connexion' || location.pathname === '/inscription';
  const isLoginRoute = location.pathname === '/connexion';

  const isSuperAdmin =
    Boolean(currentUser) &&
    currentUser?.role === 'admin' &&
    currentUser?.email.toLowerCase() === SUPERADMIN_EMAIL;

  return (
    <div data-nia-zone="public" className="relative min-h-screen flex flex-col text-nia-gray-dark dark:text-nia-text-dark">
      <AmbientBackground />
      <BanNoticeModal />

      {/* En-tête Orange unifié en haut (cadrage plein écran sans marge perdue dans les angles) + Bandeau d'annonce TV en dessous */}
      <header className="nia-header-bar sticky top-0 z-50 w-full text-white shadow-lg border-b border-white/15">
        <div className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-start gap-x-2 gap-y-1 px-2 py-1.5 sm:px-4">
          {/* Gauche : Logo Nia-Mind + Slogan en dessous + Sigles Langue (FR, EN, ES, DE, ZH) & Icône Lune/Soleil seule */}
          <div className="relative z-50 flex min-w-0 max-w-full flex-col items-start">
            <BrandLogo showSlogan={true} size="sm" />
            <div
              className={`transition-all duration-300 ${
                isAuthRoute ? 'blur-[6px] opacity-25 pointer-events-none select-none' : ''
              }`}
            >
              <HeaderLangAndThemeControls />
            </div>
          </div>

          {/* Droite aérée : Superadmin + bouton sur 2 lignes « Mon espace / (@Pseudo) » */}
          <div className="relative z-50 flex items-center justify-end gap-1.5 sm:gap-2">
            {!isAuthRoute && isSuperAdmin && (
              <Link
                to="/admin/vue-ensemble"
                className="hidden sm:inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-black/30 hover:bg-black/45 border border-white/25 text-white text-[11px] sm:text-xs font-extrabold shadow-sm transition-colors"
              >
                <Crown className="w-3.5 h-3.5 text-amber-300" />
                <span>Superadmin</span>
              </Link>
            )}

            {currentUser ? (
              <UserSpaceCompactButton />
            ) : isAuthRoute ? (
              <Link
                to={isLoginRoute ? '/inscription' : '/connexion'}
                className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-nia-bordeaux-dark hover:bg-black/60 border border-white/25 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all"
              >
                <span>
                  {isLoginRoute ? tUi(currentLanguage, 'register') : tUi(currentLanguage, 'login')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/connexion"
                  className="hidden sm:inline-flex px-3 py-1.5 rounded-full text-xs sm:text-sm font-extrabold text-white hover:bg-white/15 border border-white/30 transition-colors"
                >
                  {tUi(currentLanguage, 'login')}
                </Link>
                <Link
                  to="/inscription"
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-nia-bordeaux-dark hover:bg-black/60 border border-white/25 text-white text-xs sm:text-sm font-extrabold shadow-md transition-all"
                >
                  <span>{tUi(currentLanguage, 'register')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}

            {/* Bouton Menu Mobile (flouté sur les pages Auth) */}
            {!isAuthRoute && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/30 bg-black/20 text-white hover:bg-black/35 xl:hidden"
                aria-expanded={mobileMenuOpen}
                aria-label="Ouvrir ou fermer le menu de navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <nav
          className={`mx-auto hidden w-full max-w-7xl flex-wrap items-center justify-center gap-1.5 px-3 pb-2 transition-all duration-300 xl:flex ${
            isAuthRoute ? 'blur-[6px] opacity-25 pointer-events-none select-none' : ''
          }`}
          aria-label="Navigation principale"
        >
          {PUBLIC_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `rounded-full px-3 py-1.5 text-sm font-extrabold transition-all ${
                  item.to === '/loisir'
                    ? isActive
                      ? 'bg-amber-100 text-[#7F1D3F] shadow-md'
                      : 'bg-[#0F9F6E] text-white shadow-sm'
                    : isActive
                      ? 'bg-white text-nia-bordeaux shadow-md'
                      : 'text-white/95 hover:bg-white/15 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <Link
            to={currentUser ? '/espace/assistant' : '/inscription?from=assistant'}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-black/25 px-3 py-1.5 text-sm font-extrabold text-white shadow-sm transition-all hover:bg-black/40"
          >
            <NeuralChipIcon className="h-4 w-4 shrink-0" />
            <span>{tUi(currentLanguage, 'navAssistant')}</span>
          </Link>
        </nav>

        {/* Bandeau d'annonce TV sous le header :
            "Conseils &" / "Motivation du Jour" sur 2 lignes dans le coin gauche + annonce défilant et disparaissant en dessous */}
        <TvAnnouncementTicker blurred={isAuthRoute} />
        <PlatformMaintenanceBanner />
        {!isAuthRoute && <OfflineBanner />}

        {/* Menu Mobile Compact et Accessible au toucher */}
        {mobileMenuOpen && (
          <div className="max-h-[70vh] space-y-2 overflow-y-auto border-t border-white/20 bg-nia-bordeaux-dark/95 px-4 pb-6 pt-3 text-white backdrop-blur-md animate-nia-page xl:hidden">
            {PUBLIC_NAV_ITEMS.map((item, index) => {
              const showGroup = index === 0 || item.group !== PUBLIC_NAV_ITEMS[index - 1].group;
              return (
                <div key={item.to}>
                  {showGroup && (
                    <p className="px-4 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-amber-200/80">
                      {item.group}
                    </p>
                  )}
                  <NavLink
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-2xl text-base font-extrabold ${
                        isActive
                          ? 'bg-white text-nia-bordeaux'
                          : 'text-white/90 hover:bg-white/15'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                </div>
              );
            })}
            <Link
              to={currentUser ? '/espace/assistant' : '/inscription?from=assistant'}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-extrabold text-amber-200 bg-black/30 border border-white/20"
            >
              <NeuralChipIcon className="w-5 h-5 shrink-0" />
              <span>{tUi(currentLanguage, 'navAssistant')}</span>
            </Link>
            {isSuperAdmin && (
              <Link
                to="/admin/vue-ensemble"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl text-base font-extrabold text-amber-300 bg-black/40 border border-amber-300/30"
              >
                <Crown className="w-5 h-5 shrink-0" />
                <span>Superadmin</span>
              </Link>
            )}
            {!currentUser && (
              <div className="pt-3 border-t border-white/15 grid grid-cols-2 gap-3">
                <Link
                  to="/connexion"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-3 rounded-2xl border border-white/30 font-extrabold text-sm text-white"
                >
                  Connexion
                </Link>
                <Link
                  to="/inscription"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-3 rounded-2xl bg-nia-orange text-white font-extrabold text-sm"
                >
                  S’inscrire
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Contenu de la page : si /connexion ou /inscription est ouvert, le site reste en arrière-plan flouté derrière la carte */}
      <main className="relative z-10 flex-1 pb-16 sm:pb-0">
        {isAuthRoute ? (
          <div className="relative min-h-[calc(100vh-5rem)]">
            {/* Arrière-plan du site flouté */}
            <div
              aria-hidden="true"
              className="fixed inset-0 top-24 z-0 bg-[#F3FBF6] dark:bg-[#0E1512] pointer-events-none"
            />
            {/* Fenêtre Connexion / Inscription au premier plan */}
            <div className="relative z-20">
              <Outlet />
            </div>
          </div>
        ) : (
          <Outlet />
        )}
      </main>

      {/* Sur la page d'accueil (/), le bouton (?) et le défilement sont déjà dans la charte implantée */}
      {location.pathname !== '/' && <FloatingInstructionPopup />}

      {/* Pied de page complet Nia-Mind (flouté en arrière-plan si /connexion ou /inscription est ouvert) */}
      <footer
        className={`relative z-10 nia-glass-card border-t border-nia-orange/25 dark:border-nia-border-dark mt-16 transition-all ${
          isAuthRoute ? 'blur-md opacity-30 pointer-events-none select-none' : ''
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            <div className="space-y-4">
              <BrandLogo showSlogan size="md" />
              <p className="text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                Nia-Mind est un espace numérique d’écoute, de réflexion, de bien-être et d’expression personnelle où chacun peut parler avec sincérité, écrire ses pensées et raconter son histoire sans être obligé de jouer un rôle.
              </p>
              <p className="text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
                Écouter • Comprendre • Avancer
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
                  <Link to="/communautes" className="hover:text-nia-orange transition-colors">
                    {tCommunity(currentLanguage, 'nav')}
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
                © {new Date().getFullYear()} Nia-Mind — Confidentialité & Protection intégrale de vos écrits.
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
