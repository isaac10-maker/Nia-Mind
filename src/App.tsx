import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { emailConfirmLanding } from './lib/supabase';
import { recordPageView } from './lib/platformControls';
import { PublicLayout } from './components/layout/PublicLayout';
import { PersonalLayout } from './components/layout/PersonalLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { GlobalModals } from './components/ui/GlobalModals';
import { PlatformAutoTranslator } from './components/ui/PlatformAutoTranslator';
import { HomePage } from './pages/public/HomePage';
import {
  AboutPage,
  AuthPage,
  PublicStoriesPage,
  PublicTipsPage,
  ResourcesPage,
} from './pages/public/PublicPages';
import { LeisurePage } from './pages/public/LeisurePage';
import { CommunitiesPage } from './pages/public/CommunitiesPage';
import { CommunityInvitePage, CommunityRoomPage } from './pages/public/CommunityRoomPage';
import { ManageCommunitiesPage } from './pages/public/ManageCommunitiesPage';
import {
  AssistantPage,
  PersonalDashboardPage,
} from './pages/personal/DashboardAndAssistant';
import { JournalPage, WellnessPage } from './pages/personal/WellnessAndJournal';
import {
  ListeningRequestPage,
  PersonalDailyTipsPage,
  PersonalStoriesPage,
  ProfileAndPrivacyPage,
} from './pages/personal/StoriesListeningAndProfile';
import {
  AdminAuditLogsPage,
  AdminListeningPage,
  AdminOverviewPage,
  AdminPublishedStoriesPage,
  AdminQuestionnairesPage,
  AdminResourcesPage,
  AdminSettingsPage,
  AdminStoriesModerationPage,
  AdminTipsPage,
  AdminUsersPage,
} from './pages/admin/AdminPages';
import { AdminColorsPage } from './pages/admin/AdminColorsPage';
import { AdminCommunitiesPage } from './pages/admin/AdminCommunitiesPage';

const ScrollToTopOnRoute: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

const PublicTrafficBeacon: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    void recordPageView(pathname);
  }, [pathname]);
  return null;
};

const CopyAndSelectionGuard: React.FC = () => {
  const { siteSettings } = useApp();

  useEffect(() => {
    if (!siteSettings.copyProtectionEnabled) return;

    const isEditableElement = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        target.isContentEditable ||
        Boolean(target.closest('input, textarea, [contenteditable="true"]'))
      );
    };

    const handleBlockCopyOrSelect = (e: Event) => {
      if (!isEditableElement(e.target)) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', handleBlockCopyOrSelect);
    document.addEventListener('cut', handleBlockCopyOrSelect);
    document.addEventListener('selectstart', handleBlockCopyOrSelect);
    document.addEventListener('dragstart', handleBlockCopyOrSelect);

    return () => {
      document.removeEventListener('copy', handleBlockCopyOrSelect);
      document.removeEventListener('cut', handleBlockCopyOrSelect);
      document.removeEventListener('selectstart', handleBlockCopyOrSelect);
      document.removeEventListener('dragstart', handleBlockCopyOrSelect);
    };
  }, [siteSettings.copyProtectionEnabled]);

  return null;
};

const EmailConfirmHomeGate: React.FC = () => {
  const { authReady, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!emailConfirmLanding || !authReady || !currentUser) return;
    if (location.pathname !== '/') {
      navigate('/', { replace: true });
    }
  }, [authReady, currentUser, location.pathname, navigate]);

  return null;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <CopyAndSelectionGuard />
      <BrowserRouter>
        <EmailConfirmHomeGate />
        <ScrollToTopOnRoute />
        <PublicTrafficBeacon />
        <PlatformAutoTranslator />
        <GlobalModals />
        <Routes>
          {/* 1. NAVIGATION PRINCIPALE */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/ressources" element={<ResourcesPage />} />
            <Route path="/conseils" element={<PublicTipsPage />} />
            <Route path="/histoires" element={<PublicStoriesPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
            <Route path="/loisir" element={<LeisurePage />} />
            <Route path="/communautes" element={<CommunitiesPage />} />
            <Route path="/communautes/rejoindre/:token" element={<CommunityInvitePage />} />
            <Route path="/communautes/espace/:id" element={<CommunityRoomPage />} />
            <Route path="/gerer" element={<ManageCommunitiesPage />} />
            <Route path="/connexion" element={<AuthPage mode="login" />} />
            <Route path="/inscription" element={<AuthPage mode="register" />} />
          </Route>

          {/* 2. ESPACE PERSONNEL (9 onglets officiels) */}
          <Route path="/espace" element={<PersonalLayout />}>
            <Route index element={<Navigate to="/espace/tableau-de-bord" replace />} />
            <Route path="tableau-de-bord" element={<PersonalDashboardPage />} />
            <Route path="assistant" element={<AssistantPage />} />
            <Route path="ecoute" element={<ListeningRequestPage />} />
            <Route path="bien-etre" element={<WellnessPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="conseils-du-jour" element={<PersonalDailyTipsPage />} />
            <Route path="histoires" element={<PersonalStoriesPage />} />
            <Route path="profil" element={<ProfileAndPrivacyPage section="profile" />} />
            <Route path="confidentialite" element={<ProfileAndPrivacyPage section="privacy" />} />
          </Route>

          {/* 3. ESPACE ADMINISTRATEUR (10 onglets officiels + contrôle de rôle serveur) */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/vue-ensemble" replace />} />
            <Route path="vue-ensemble" element={<AdminOverviewPage />} />
            <Route path="utilisateurs" element={<AdminUsersPage />} />
            <Route path="ecoute" element={<AdminListeningPage />} />
            <Route path="histoires-recues" element={<AdminStoriesModerationPage />} />
            <Route path="histoires-publiees" element={<AdminPublishedStoriesPage />} />
            <Route path="conseils" element={<AdminTipsPage />} />
            <Route path="questionnaires" element={<AdminQuestionnairesPage />} />
            <Route path="ressources" element={<AdminResourcesPage />} />
            <Route path="couleurs" element={<AdminColorsPage />} />
            <Route path="communautes" element={<AdminCommunitiesPage />} />
            <Route path="parametres" element={<AdminSettingsPage />} />
            <Route path="audit" element={<AdminAuditLogsPage />} />
          </Route>

          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;
