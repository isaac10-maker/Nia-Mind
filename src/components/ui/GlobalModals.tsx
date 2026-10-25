import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle2, ShieldCheck, Sparkles, X } from 'lucide-react';
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
        subtitle={`Lecture : ${featuredDailyTip.readingTimeMin} min • Nia-Mind « Le vrai sans le masque »`}
        accent="orange"
        footer={
          <>
            <button
              type="button"
              onClick={() => closeDailyTipModal(true)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/40 dark:hover:bg-nia-border-dark/50 text-sm font-medium transition-colors"
            >
              Fermer et mémoriser pour aujourd’hui
            </button>
            <button
              type="button"
              onClick={() => {
                closeDailyTipModal(true);
                navigate('/espace/journal');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-semibold shadow-sm transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Répondre dans mon journal privé
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-base font-medium text-nia-gray-dark dark:text-white">
            {featuredDailyTip.summary}
          </p>
          <p className="text-nia-gray-mid dark:text-gray-300">
            {featuredDailyTip.content}
          </p>
          <div className="p-4 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border-l-4 border-nia-bordeaux">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              Question de réflexion personnelle
            </div>
            <p className="font-medium text-nia-gray-dark dark:text-gray-100">
              « {featuredDailyTip.reflectionQuestion} »
            </p>
          </div>
        </div>
      </Modal>

      {/* 2. Modale transparente de gestion des consentements (sans dark pattern) */}
      <Modal
        isOpen={isConsentModalOpen}
        onClose={closeConsentModal}
        badgeText="Transparence & Vie Privée"
        title="Vos choix de confidentialité et de consentement"
        subtitle="Aucun choix trompeur : distinguez clairement le contrat de service des traitements facultatifs."
        accent="bordeaux"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setOptAnalytics(false);
                setOptWellness(false);
                if (currentUser) {
                  updateCurrentUserProfile({
                    optionalAnalyticsConsent: false,
                    optionalWellnessInsightsConsent: false,
                  });
                }
                closeConsentModal();
              }}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-gray-200 hover:bg-nia-gray-light/40 text-sm font-medium"
            >
              Tout refuser (facultatif)
            </button>
            <button
              type="button"
              onClick={handleSaveConsent}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-sm font-semibold"
            >
              <CheckCircle2 className="w-4 h-4" />
              Enregistrer mes choix
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-nia-gray-light/40 dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-nia-gray-dark dark:text-white">
                1. Socle contractuel et sécurité (Obligatoire)
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Actif ({currentUser?.acceptedTermsVersion || 'v2.4 — Octobre 2026'})
              </span>
            </div>
            <p className="mt-1 text-xs text-nia-gray-mid dark:text-gray-400">
              Authentification, isolation RLS de votre journal et de vos histoires privées, et fonctionnement technique de votre compte.
            </p>
          </div>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark cursor-pointer hover:border-nia-orange/50 transition-colors">
            <input
              type="checkbox"
              checked={optWellness}
              onChange={(e) => setOptWellness(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-nia-orange focus:ring-nia-orange"
            />
            <div>
              <span className="font-semibold text-nia-gray-dark dark:text-white block">
                2. Synthèses personnelles de progression bien-être (Facultatif)
              </span>
              <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                Calcul local de vos courbes d’évolution (humeur, stress, sommeil) sur 7 et 30 jours.
              </span>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark cursor-pointer hover:border-nia-orange/50 transition-colors">
            <input
              type="checkbox"
              checked={optAnalytics}
              onChange={(e) => setOptAnalytics(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-nia-orange focus:ring-nia-orange"
            />
            <div>
              <span className="font-semibold text-nia-gray-dark dark:text-white block">
                3. Statistiques techniques anonymisées de performance (Facultatif)
              </span>
              <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                Mesure technique du temps de chargement des pages, sans aucun contenu personnel ni traceur publicitaire.
              </span>
            </div>
          </label>

          <div className="flex items-center gap-2 text-xs text-nia-bordeaux dark:text-amber-300 font-medium">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Vous pouvez modifier ou révoquer ces choix à tout moment dans « Confidentialité et paramètres ».
          </div>
        </div>
      </Modal>

      {/* 3. Notifications Toast accessibles en bas à droite */}
      <div
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-nia-modal rounded-2xl p-4 shadow-xl border flex items-start justify-between gap-3 ${
              t.tone === 'orange'
                ? 'bg-white dark:bg-nia-surface-dark border-nia-orange/50 text-nia-gray-dark dark:text-white'
                : t.tone === 'bordeaux'
                ? 'bg-nia-bordeaux-dark text-white border-nia-bordeaux'
                : 'bg-white dark:bg-nia-surface-dark border-nia-gray-light dark:border-nia-border-dark text-nia-gray-dark dark:text-white'
            }`}
          >
            <div>
              <p className="text-sm font-bold">{t.title}</p>
              <p className="text-xs mt-0.5 opacity-90">{t.message}</p>
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="p-1 rounded-lg opacity-70 hover:opacity-100"
              aria-label="Fermer la notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
};
