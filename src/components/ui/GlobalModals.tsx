import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, Cookie, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from './Modal';

export const GlobalModals: React.FC = () => {
  const {
    isDailyTipModalOpen,
    closeDailyTipModal,
    featuredDailyTip,
    isConsentModalOpen,
    closeConsentModal,
    currentUser,
    updateCurrentUserProfile,
    toasts,
    dismissToast,
  } = useApp();

  const navigate = useNavigate();
  const [optCookies, setOptCookies] = useState<boolean>(true);
  const [optWellness, setOptWellness] = useState<boolean>(
    currentUser?.optionalWellnessInsightsConsent ?? true
  );
  const [optAnalytics, setOptAnalytics] = useState<boolean>(
    currentUser?.optionalAnalyticsConsent ?? false
  );

  const handleSaveConsent = () => {
    if (currentUser) {
      updateCurrentUserProfile({
        optionalWellnessInsightsConsent: optWellness,
        optionalAnalyticsConsent: optAnalytics,
      });
    }
    try {
      localStorage.setItem('nia_mind_cookies_accepted_v1', optCookies ? 'true' : 'essential');
    } catch {
      // Ignore storage error
    }
    closeConsentModal();
  };

  return (
    <>
      {/* 1. Modale Conseil du Jour */}
      <Modal
        isOpen={isDailyTipModalOpen}
        onClose={() => closeDailyTipModal(true)}
        badgeText={`Conseil du jour • ${featuredDailyTip.category}`}
        title={featuredDailyTip.title}
        subtitle={`Lecture : ${featuredDailyTip.readingTimeMin} min • Motivation & Conseils Nia-Mind`}
        accent="orange"
        footer={
          <>
            <button
              type="button"
              onClick={() => closeDailyTipModal(true)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/40 dark:hover:bg-nia-border-dark/50 text-xs sm:text-sm font-bold transition-colors"
            >
              Fermer pour aujourd’hui
            </button>
            <button
              type="button"
              onClick={() => {
                closeDailyTipModal(true);
                navigate(currentUser ? '/espace/journal' : '/connexion');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs sm:text-sm font-bold shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              {currentUser ? 'Répondre dans mon journal privé' : 'Se connecter pour noter'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-base font-bold text-nia-gray-dark dark:text-white">
            {featuredDailyTip.summary}
          </p>
          <p className="text-nia-gray-mid dark:text-gray-300">
            {featuredDailyTip.content}
          </p>
          <div className="p-4 rounded-2xl bg-gradient-to-r from-nia-orange/15 to-nia-bordeaux/15 border-l-4 border-nia-bordeaux">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Question de réflexion personnelle
            </div>
            <p className="font-semibold text-nia-gray-dark dark:text-gray-100">
              « {featuredDailyTip.reflectionQuestion} »
            </p>
          </div>
        </div>
      </Modal>

      {/* 2. Modale Politique de Confidentialité & Cookies */}
      <Modal
        isOpen={isConsentModalOpen}
        onClose={closeConsentModal}
        badgeText="Confidentialité & Cookies"
        title="Politique de confidentialité & préférences de cookies"
        subtitle="Vos pensées vous appartiennent. Gérez vos choix en toute transparence."
        accent="bordeaux"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setOptAnalytics(false);
                setOptWellness(false);
                setOptCookies(false);
                if (currentUser) {
                  updateCurrentUserProfile({
                    optionalAnalyticsConsent: false,
                    optionalWellnessInsightsConsent: false,
                  });
                }
                closeConsentModal();
              }}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/40 text-xs sm:text-sm font-bold"
            >
              Cookies essentiels uniquement
            </button>
            <button
              type="button"
              onClick={handleSaveConsent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs sm:text-sm font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Accepter & enregistrer
            </button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div className="p-3.5 rounded-2xl bg-nia-orange/10 dark:bg-nia-bg-dark border border-nia-orange/25 dark:border-nia-border-dark">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-nia-gray-dark dark:text-white text-xs sm:text-sm">
                1. Confidentialité & Sécurité du compte (Essentiel)
              </span>
              <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                Toujours actif
              </span>
            </div>
            <p className="mt-1 text-xs text-nia-gray-mid dark:text-gray-400">
              Protection stricte de votre session, de votre journal intime et de vos histoires privées. Aucune donnée personnelle n’est jamais vendue ni partagée.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-nia-orange/25 dark:border-nia-border-dark cursor-pointer hover:border-nia-orange transition-colors">
            <input
              type="checkbox"
              checked={optCookies}
              onChange={(e) => setOptCookies(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-nia-orange focus:ring-nia-orange"
            />
            <div>
              <span className="font-bold text-nia-gray-dark dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                <Cookie className="w-3.5 h-3.5 text-nia-orange" />
                2. Réception des cookies de confort & mémorisation
              </span>
              <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                Mémorise votre thème (clair/sombre), la fréquence du conseil du jour et vos préférences d’affichage.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-nia-orange/25 dark:border-nia-border-dark cursor-pointer hover:border-nia-orange transition-colors">
            <input
              type="checkbox"
              checked={optWellness}
              onChange={(e) => setOptWellness(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-nia-orange focus:ring-nia-orange"
            />
            <div>
              <span className="font-bold text-nia-gray-dark dark:text-white text-xs sm:text-sm block">
                3. Synthèses personnelles de progression bien-être (Facultatif)
              </span>
              <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                Calcul de vos courbes d’évolution (humeur, stress, sommeil) sur 7 et 30 jours dans votre espace privé.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-nia-orange/25 dark:border-nia-border-dark cursor-pointer hover:border-nia-orange transition-colors">
            <input
              type="checkbox"
              checked={optAnalytics}
              onChange={(e) => setOptAnalytics(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-nia-orange focus:ring-nia-orange"
            />
            <div>
              <span className="font-bold text-nia-gray-dark dark:text-white text-xs sm:text-sm block">
                4. Amélioration anonyme de l’expérience (Facultatif)
              </span>
              <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                Mesure anonyme de la fluidité des pages, sans aucun traceur publicitaire.
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2 text-xs text-nia-bordeaux dark:text-amber-300 font-semibold pt-1">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Modifiable à tout moment depuis le bouton « Confidentialité & Cookies ».
          </div>
        </div>
      </Modal>

      {/* 3. Notifications Toast accessibles avec bouton croix */}
      <div
        className="fixed top-16 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-nia-modal rounded-2xl p-4 shadow-xl border-2 flex items-start justify-between gap-3 ${
              t.tone === 'orange'
                ? 'nia-glass-card border-nia-orange text-nia-gray-dark dark:text-white'
                : t.tone === 'bordeaux'
                ? 'bg-nia-bordeaux-dark text-white border-nia-orange/50'
                : 'nia-glass-card border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-white'
            }`}
          >
            <div>
              <p className="text-sm font-extrabold">{t.title}</p>
              <p className="text-xs mt-0.5 opacity-90">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-black/10 hover:bg-black/20 dark:bg-white/10 dark:hover:bg-white/25 transition-colors shrink-0"
              aria-label="Fermer la notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
