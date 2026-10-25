import React, { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { PublicLayout } from './components/layout/PublicLayout';
import { PersonalLayout } from './components/layout/PersonalLayout';
import { AdminLayout } from './components/layout/AdminLayout';
import { GlobalModals } from './components/ui/GlobalModals';
import { HomePage } from './pages/public/HomePage';
import {
  AboutPage,
  AuthPage,
  PublicStoriesPage,
  PublicTipsPage,
  ResourcesPage,
} from './pages/public/PublicPages';
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

const ScrollToTopOnRoute: React.FC = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pathname]);
  return null;
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTopOnRoute />
        <GlobalModals />
        <Routes>
          {/* 1. SITE PUBLIC (7 entrées officielles) */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/ressources" element={<ResourcesPage />} />
            <Route path="/conseils" element={<PublicTipsPage />} />
            <Route path="/histoires" element={<PublicStoriesPage />} />
            <Route path="/a-propos" element={<AboutPage />} />
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
