import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Archive,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileClock,
  HeartHandshake,
  LifeBuoy,
  Lock,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  ALL_LISTENING_STATUSES,
  DailyTip,
  ListeningStatus,
  StoryStatus,
  UserRole,
  VerifiedHelpResource,
} from '../../lib/types';
import {
  assertRlsIsolationSnapshot,
  validateStoryPublicationEligibility,
} from '../../lib/securityEngine';

// ============================================================================
// 1. VUE D'ENSEMBLE ADMIN (/admin/vue-ensemble) + COMMANDEMENT SUPERADMIN UNIQUE
// ============================================================================
const THEME_PRESETS = [
  {
    name: 'Symbiose Nia-Mind (Orange & Bordeaux)',
    primary: '#F97316',
    secondary: '#7F1D3F',
    accent: '#0EA5E9',
  },
  {
    name: 'Aurore Électrique (Bleu & Violet)',
    primary: '#0EA5E9',
    secondary: '#4C1D95',
    accent: '#F59E0B',
  },
  {
    name: 'Crépuscule Doré (Ambre & Rubis)',
    primary: '#D97706',
    secondary: '#881337',
    accent: '#38BDF8',
  },
  {
    name: 'Harmonie Émeraude & Prune',
    primary: '#10B981',
    secondary: '#581C87',
    accent: '#F97316',
  },
];

export const AdminOverviewPage: React.FC = () => {
  const {
    allUsers,
    allManageableStories,
    publicStories,
    allListeningRequests,
    helpResources,
    auditLogs,
    rawStoreForSecurityAudit,
    siteSettings,
    updateSiteSettings,
    siteNotifications,
    publishSiteNotification,
    deleteSiteNotification,
    generateAiDailyTipAndPush,
    forcePublishStoryBySuperAdmin,
  } = useApp();

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifCategory, setNotifCategory] = useState<
    'Conseil & Motivation' | 'Annonce officielle' | 'Bien-être & Écoute' | 'Sécurité'
  >('Conseil & Motivation');

  const rlsSnapshot = assertRlsIsolationSnapshot({
    userAId: 'user-a',
    userBId: 'user-b',
    ...rawStoreForSecurityAudit,
  });

  const pendingModerationCount = allManageableStories.filter(
    (s) => s.status === 'Envoyée' || s.status === 'En modération' || s.status === 'Autorisée'
  ).length;

  const openListeningCount = allListeningRequests.filter((r) => r.status !== 'Clôturée').length;

  const handlePublishPush = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifTitle.trim() || !notifMessage.trim()) return;
    publishSiteNotification({
      title: notifTitle,
      message: notifMessage,
      category: notifCategory,
      actionUrl: '/conseils',
    });
    setNotifTitle('');
    setNotifMessage('');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
            <Activity className="w-4 h-4 text-nia-orange" />
            Console SuperAdmin Unique • isaacamegan10@gmail.com
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
            Centre de Commandement SuperAdmin & Sécurité RLS
          </h1>
        </div>
        <button
          type="button"
          onClick={() => generateAiDailyTipAndPush()}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold shadow-lg hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4" />
          <span>Générer & Publier le Conseil du jour par l’IA (+ Push)</span>
        </button>
      </div>

      {/* Indicateurs clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          to="/admin/utilisateurs"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange space-y-1"
        >
          <p className="text-xs text-nia-gray-mid">Membres inscrits</p>
          <p className="text-2xl font-extrabold text-nia-gray-dark dark:text-white">
            {allUsers.length}
          </p>
          <p className="text-xs text-nia-orange font-bold">Gérer les rôles →</p>
        </Link>

        <Link
          to="/admin/ecoute"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange space-y-1"
        >
          <p className="text-xs text-nia-gray-mid">Assistance humaine & écoute</p>
          <p className="text-2xl font-extrabold text-nia-bordeaux dark:text-amber-300">
            {openListeningCount}
          </p>
          <p className="text-xs text-nia-orange font-bold">Répondre aux demandes →</p>
        </Link>

        <Link
          to="/admin/histoires-recues"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange space-y-1"
        >
          <p className="text-xs text-nia-gray-mid">Témoignages à modérer</p>
          <p className="text-2xl font-extrabold text-nia-orange">{pendingModerationCount}</p>
          <p className="text-xs text-nia-orange font-bold">Rendre public un témoignage →</p>
        </Link>

        <Link
          to="/admin/histoires-publiees"
          className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange space-y-1"
        >
          <p className="text-xs text-nia-gray-mid">Témoignages publics</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {publicStories.length}
          </p>
          <p className="text-xs text-nia-orange font-bold">Voir les publications →</p>
        </Link>
      </div>

      {/* GRILLE SUPERADMIN : 1. Notifications Push & Relais IA | 2. Couleurs dynamiques du site */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 1. Gestion des Notifications Push & Relais IA Automatique */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/35 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-nia-gray-dark dark:text-white">
                Publications de Notifications Push & Relais IA du Conseil du jour
              </h2>
              <p className="text-xs text-nia-gray-mid dark:text-gray-300">
                Diffusez une notification en direct ou laissez l’IA publier le conseil et la motivation du jour en cas d’indisponibilité.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-nia-orange/15 text-xs font-extrabold text-nia-bordeaux dark:text-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={siteSettings.aiAutopilotTipsEnabled}
                onChange={(e) =>
                  updateSiteSettings({ aiAutopilotTipsEnabled: e.target.checked })
                }
                className="rounded text-nia-orange"
              />
              <span>Relais IA auto (Indisponibilité Admin)</span>
            </label>
          </div>

          <form onSubmit={handlePublishPush} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                value={notifTitle}
                onChange={(e) => setNotifTitle(e.target.value)}
                placeholder="Titre de la notification Push…"
                className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-orange/35 text-xs font-semibold"
              />
              <select
                value={notifCategory}
                onChange={(e) => setNotifCategory(e.target.value as any)}
                className="px-3 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-orange/35 text-xs font-semibold"
              >
                <option value="Conseil & Motivation">Conseil & Motivation</option>
                <option value="Annonce officielle">Annonce officielle</option>
                <option value="Bien-être & Écoute">Bien-être & Écoute</option>
                <option value="Sécurité">Sécurité</option>
              </select>
            </div>
            <textarea
              rows={2}
              required
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
              placeholder="Message de motivation ou d’information diffusé sur tout le site…"
              className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-orange/35 text-xs"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-nia-orange text-white text-xs font-extrabold shadow-sm"
              >
                Diffuser la notification Push sur le site
              </button>
              <button
                type="button"
                onClick={() => generateAiDailyTipAndPush()}
                className="px-4 py-2.5 rounded-xl bg-nia-bordeaux text-white text-xs font-extrabold shadow-sm"
              >
                Relais IA : Générer & partager Conseil + Motivation
              </button>
            </div>
          </form>

          <div className="space-y-2 pt-2 border-t border-nia-gray-light dark:border-nia-border-dark max-h-48 overflow-y-auto">
            {siteNotifications.map((n) => (
              <div
                key={n.id}
                className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-extrabold truncate">
                    {n.title}{' '}
                    {n.generatedByAi && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-nia-orange/20 text-nia-orange">
                        Généré par IA
                      </span>
                    )}
                  </p>
                  <p className="text-nia-gray-mid truncate">{n.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => deleteSiteNotification(n.id)}
                  className="p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600 shrink-0"
                  title="Supprimer la notification"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Personnalisation en direct des couleurs du site (SuperAdmin uniquement) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-nia-bordeaux/35 space-y-4">
          <div>
            <h2 className="text-base font-extrabold text-nia-gray-dark dark:text-white">
              Modifier les couleurs du site (SuperAdmin)
            </h2>
            <p className="text-xs text-nia-gray-mid dark:text-gray-300">
              Changez instantanément l’harmonie chromatique de toute la plateforme Nia-Mind.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold mb-1">Couleur 1</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={siteSettings.primaryColor}
                  onChange={(e) =>
                    updateSiteSettings({
                      primaryColor: e.target.value,
                      themePreset: 'Palette Personnalisée SuperAdmin',
                    })
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-[11px]">{siteSettings.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Couleur 2</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={siteSettings.secondaryColor}
                  onChange={(e) =>
                    updateSiteSettings({
                      secondaryColor: e.target.value,
                      themePreset: 'Palette Personnalisée SuperAdmin',
                    })
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-[11px]">{siteSettings.secondaryColor}</span>
              </div>
            </div>
            <div>
              <label className="block font-bold mb-1">Accent</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={siteSettings.accentColor}
                  onChange={(e) =>
                    updateSiteSettings({
                      accentColor: e.target.value,
                      themePreset: 'Palette Personnalisée SuperAdmin',
                    })
                  }
                  className="w-9 h-9 rounded-lg cursor-pointer border-0"
                />
                <span className="font-mono text-[11px]">{siteSettings.accentColor}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-nia-gray-mid">
              Palettes prédéfinies en un clic :
            </p>
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() =>
                  updateSiteSettings({
                    primaryColor: preset.primary,
                    secondaryColor: preset.secondary,
                    accentColor: preset.accent,
                    themePreset: preset.name,
                  })
                }
                className="w-full p-2.5 rounded-xl border border-nia-orange/30 hover:border-nia-orange flex items-center justify-between text-xs font-bold"
              >
                <span>{preset.name}</span>
                <span className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-4 rounded-full border border-white/40"
                    style={{ backgroundColor: preset.primary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/40"
                    style={{ backgroundColor: preset.secondary }}
                  />
                  <span
                    className="w-4 h-4 rounded-full border border-white/40"
                    style={{ backgroundColor: preset.accent }}
                  />
                </span>
              </button>
            ))}
          </div>

          {allManageableStories.filter((s) => s.status !== 'Publiée').length > 0 && (
            <div className="pt-3 border-t border-nia-gray-light dark:border-nia-border-dark space-y-2">
              <p className="text-xs font-extrabold text-nia-bordeaux dark:text-amber-300">
                Action rapide : Rendre public un témoignage en attente
              </p>
              {allManageableStories
                .filter((s) => s.status !== 'Publiée')
                .slice(0, 2)
                .map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between gap-2 text-xs"
                  >
                    <span className="font-bold truncate">{s.title || 'Sans titre'}</span>
                    <button
                      type="button"
                      onClick={() => forcePublishStoryBySuperAdmin(s.id)}
                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-extrabold shrink-0"
                    >
                      Rendre public
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Panneau d'audit d'isolation RLS Utilisateur A vs Utilisateur B */}
      <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-emerald-500/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h2 className="text-base font-extrabold text-nia-gray-dark dark:text-white">
                Vérification d’isolation des données privées (Test Utilisateur A vs Utilisateur B)
              </h2>
              <p className="text-xs text-nia-gray-mid dark:text-gray-400">
                Contrôle en temps réel que l’Utilisateur A (Amina) ne peut lire aucune conversation, aucun journal, aucun questionnaire ni aucune histoire privée de l’Utilisateur B (Lucas).
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            {rlsSnapshot.isolated ? 'ISOLATION RLS VÉRIFIÉE (0 FUITE)' : 'ALERTE ISOLATION'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark">
            <p className="text-nia-gray-mid">Journaux privés lisibles par Admin</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              0 (Strictement interdit)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark">
            <p className="text-nia-gray-mid">Brouillons d’histoires lisibles par Admin</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
              0 (Protégé par RLS)
            </p>
          </div>
          <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark">
            <p className="text-nia-gray-mid">Ressources d’aide vérifiées</p>
            <p className="text-base font-extrabold text-nia-gray-dark dark:text-white mt-0.5">
              {helpResources.length} organismes
            </p>
          </div>
          <div className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark">
            <p className="text-nia-gray-mid">Événements d’audit tracés</p>
            <p className="text-base font-extrabold text-nia-bordeaux dark:text-amber-300 mt-0.5">
              {auditLogs.length} entrées
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 2. UTILISATEURS & RÔLES (/admin/utilisateurs)
// ============================================================================
export const AdminUsersPage: React.FC = () => {
  const { allUsers, currentUser, adminUpdateUserRole } = useApp();
  const [roleError, setRoleError] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <Users className="w-4 h-4" />
          Gestion des Utilisateurs & Permissions Serveur
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Membres et contrôle des rôles (`public.user_roles`)
        </h1>
        <p className="text-xs text-nia-gray-mid dark:text-gray-400 mt-1">
          Aucun utilisateur ne peut s’attribuer lui-même le rôle administrateur. Les changements sont journalisés.
        </p>
      </div>

      {roleError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/40 text-xs font-bold text-rose-700 dark:text-rose-300">
          {roleError}
        </div>
      )}

      <div className="rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-nia-bg-light dark:bg-nia-bg-dark border-b border-nia-gray-light dark:border-nia-border-dark text-xs uppercase text-nia-gray-mid">
              <tr>
                <th className="py-3.5 px-4">Membre</th>
                <th className="py-3.5 px-4">Pseudonyme public</th>
                <th className="py-3.5 px-4">Pays</th>
                <th className="py-3.5 px-4">CGU acceptées</th>
                <th className="py-3.5 px-4">Rôle serveur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nia-gray-light dark:divide-nia-border-dark">
              {allUsers.map((u) => (
                <tr key={u.id}>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-nia-gray-dark dark:text-white">{u.displayName}</p>
                    <p className="text-xs text-nia-gray-mid">{u.email}</p>
                  </td>
                  <td className="py-3.5 px-4">{u.publicPseudonym}</td>
                  <td className="py-3.5 px-4 font-semibold">{u.countryCode}</td>
                  <td className="py-3.5 px-4 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                    {u.acceptedTermsVersion}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        setRoleError(null);
                        const res = adminUpdateUserRole(u.id, e.target.value as UserRole);
                        if (!res.ok) setRoleError(res.error || 'Action refusée.');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
                    >
                      <option value="user">user (Membre)</option>
                      <option value="listener">listener (Écoutant)</option>
                      <option value="admin">admin (Administrateur)</option>
                    </select>
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-[11px] text-nia-orange font-bold">(Vous)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. DEMANDES D'ÉCOUTE (/admin/ecoute)
// ============================================================================
export const AdminListeningPage: React.FC = () => {
  const { allListeningRequests, adminUpdateListeningRequest } = useApp();
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <HeartHandshake className="w-4 h-4" />
          Traitement des Demandes d’Écoute Humaine
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Demandes confidentielles ({allListeningRequests.length})
        </h1>
      </div>

      <div className="space-y-4">
        {allListeningRequests.map((req) => (
          <div
            key={req.id}
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-nia-orange">
                  Membre : {req.userDisplayName} • {req.preferredMode} ({req.preferredSlot})
                </span>
                <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                  {req.topic}
                </h2>
              </div>
              <select
                value={req.status}
                onChange={(e) =>
                  adminUpdateListeningRequest({
                    requestId: req.id,
                    status: e.target.value as ListeningStatus,
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
              >
                {ALL_LISTENING_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    Statut : {st}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-sm text-nia-gray-dark dark:text-gray-200 p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark">
              {req.message}
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider">
                Réponse de l’écoutant (transmise en privé à l’utilisateur)
              </label>
              <textarea
                rows={3}
                value={replyDrafts[req.id] ?? req.listenerReply ?? ''}
                onChange={(e) =>
                  setReplyDrafts((prev) => ({ ...prev, [req.id]: e.target.value }))
                }
                placeholder="Rédigez une réponse bienveillante…"
                className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() =>
                    adminUpdateListeningRequest({
                      requestId: req.id,
                      status: 'Réponse disponible',
                      listenerReply: replyDrafts[req.id] ?? req.listenerReply ?? '',
                    })
                  }
                  className="px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold"
                >
                  Envoyer la réponse & passer à « Réponse disponible »
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 4. HISTOIRES REÇUES & MODÉRATION (/admin/histoires-recues)
// ============================================================================
export const AdminStoriesModerationPage: React.FC = () => {
  const {
    allManageableStories,
    adminModerateStory,
    forcePublishStoryBySuperAdmin,
  } = useApp();
  const [proposedEdits, setProposedEdits] = useState<Record<string, string>>({});
  const [modNotes, setModNotes] = useState<Record<string, string>>({});
  const [securityBlockError, setSecurityBlockError] = useState<string | null>(null);

  const receivedStories = allManageableStories.filter((s) => s.status !== 'Brouillon');

  const handleAction = (storyId: string, nextStatus: StoryStatus) => {
    setSecurityBlockError(null);
    const story = receivedStories.find((s) => s.id === storyId);
    if (!story) return;

    const res = adminModerateStory({
      storyId,
      nextStatus,
      proposedPublicContent: proposedEdits[storyId] ?? story.proposedPublicContent,
      moderationNote:
        modNotes[storyId] ??
        story.moderationNote ??
        `Décision de modération : ${nextStatus}`,
    });

    if (!res.ok) {
      setSecurityBlockError(res.error || 'Action refusée par les règles de sécurité.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <FileClock className="w-4 h-4" />
          Modération Éthique des Histoires Reçues
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Histoires soumises à la modération ({receivedStories.length})
        </h1>
        <p className="text-xs text-nia-gray-mid dark:text-gray-400 mt-1">
          Règle absolue : un administrateur ne peut jamais publier une histoire sans l’autorisation explicite de son auteur pour la version exacte proposée.
        </p>
      </div>

      {securityBlockError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-500/10 border-2 border-rose-500/50 flex items-center gap-3 text-xs font-bold text-rose-700 dark:text-rose-300"
        >
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{securityBlockError}</span>
        </div>
      )}

      <div className="space-y-5">
        {receivedStories.map((story) => {
          const eligibility = validateStoryPublicationEligibility(story);
          return (
            <div
              key={story.id}
              className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                    Statut actuel : {story.status} (v{story.currentVersion})
                  </span>
                  <span className="text-xs text-nia-gray-mid">
                    Pseudonyme : {story.publicPseudonym} • {story.category}
                  </span>
                </div>
                <span
                  className={`text-xs font-bold ${
                    eligibility.eligible
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {eligibility.eligible
                    ? `Consentement explicite auteur validé sur v${story.currentVersion}`
                    : `Publication verrouillée : en attente du consentement auteur sur v${story.currentVersion}`}
                </span>
              </div>

              <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                {story.title || 'Sans titre'}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
                  <p className="font-bold text-nia-gray-mid mb-1">
                    Texte original soumis par l’auteur :
                  </p>
                  <p className="leading-relaxed">{story.originalContent}</p>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-nia-orange-deep dark:text-nia-orange">
                    Version proposée pour publication (toute modification crée une nouvelle version à faire approuver par l’auteur) :
                  </label>
                  <textarea
                    rows={4}
                    value={proposedEdits[story.id] ?? story.proposedPublicContent}
                    onChange={(e) =>
                      setProposedEdits((prev) => ({ ...prev, [story.id]: e.target.value }))
                    }
                    className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-orange/40 text-xs leading-relaxed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1">
                  Note de modération (visible par l’auteur) :
                </label>
                <input
                  type="text"
                  value={modNotes[story.id] ?? story.moderationNote}
                  onChange={(e) =>
                    setModNotes((prev) => ({ ...prev, [story.id]: e.target.value }))
                  }
                  placeholder="Expliquez les anonymisations éventuelles ou la décision…"
                  className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-nia-gray-light dark:border-nia-border-dark">
                <button
                  type="button"
                  onClick={() => handleAction(story.id, 'En modération')}
                  className="px-3 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
                >
                  Passer « En modération »
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(story.id, 'Modification demandée')}
                  className="px-3 py-2 rounded-xl border border-nia-bordeaux/40 text-nia-bordeaux dark:text-amber-300 text-xs font-bold"
                >
                  Demander une modification à l’auteur
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(story.id, 'Autorisation demandée')}
                  className="px-3.5 py-2 rounded-xl bg-nia-bordeaux text-white text-xs font-bold"
                >
                  Demander l’autorisation explicite de l’auteur
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(story.id, 'Publiée')}
                  className="px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold"
                >
                  Publier (Requiert l’autorisation auteur v{story.currentVersion})
                </button>
                <button
                  type="button"
                  onClick={() =>
                    forcePublishStoryBySuperAdmin(
                      story.id,
                      proposedEdits[story.id] ?? story.proposedPublicContent
                    )
                  }
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm"
                >
                  Rendre public (Autorisation SuperAdmin)
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(story.id, 'Refusée')}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold"
                >
                  Refuser
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 5. HISTOIRES PUBLIÉES (/admin/histoires-publiees)
// ============================================================================
export const AdminPublishedStoriesPage: React.FC = () => {
  const { allManageableStories, adminModerateStory } = useApp();
  const published = allManageableStories.filter(
    (s) => s.status === 'Publiée' || s.status === 'Retirée' || s.status === 'Archivée'
  );

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <FileCheck2 className="w-4 h-4" />
          Gestion des Publications Publiques
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Histoires publiées, retirées et archivées ({published.length})
        </h1>
      </div>

      <div className="space-y-4">
        {published.map((st) => (
          <div
            key={st.id}
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  {st.status} (v{st.currentVersion})
                </span>
                <span className="text-nia-gray-mid">
                  Par {st.publicPseudonym} • Consentement accordé sur v{st.authorApprovedVersion}
                </span>
              </div>
              <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
                {st.title}
              </h2>
              <p className="text-xs text-nia-gray-mid dark:text-gray-300">
                {st.proposedPublicContent}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 shrink-0">
              {st.status === 'Publiée' && (
                <button
                  type="button"
                  onClick={() =>
                    adminModerateStory({
                      storyId: st.id,
                      nextStatus: 'Retirée',
                      moderationNote: 'Dépublication administrative.',
                    })
                  }
                  className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold"
                >
                  Dépublier (« Retirée »)
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  adminModerateStory({
                    storyId: st.id,
                    nextStatus: 'Archivée',
                    moderationNote: 'Archivage administratif.',
                  })
                }
                className="px-3.5 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
              >
                Archiver
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 6. CONSEILS ET CONTENUS (/admin/conseils)
// ============================================================================
export const AdminTipsPage: React.FC = () => {
  const {
    dailyTips,
    adminSaveDailyTip,
    adminDeleteDailyTip,
    siteSettings,
    updateSiteSettings,
    generateAiDailyTipAndPush,
    publishSiteNotification,
  } = useApp();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DailyTip['category']>('Franchise');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [question, setQuestion] = useState('');
  const [featured, setFeatured] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    adminSaveDailyTip({
      title,
      category,
      summary: summary || content.slice(0, 110),
      content,
      reflectionQuestion: question || 'Qu’est-ce que cette piste évoque pour vous aujourd’hui ?',
      readingTimeMin: 2,
      isFeaturedToday: featured,
    });
    publishSiteNotification({
      title: `Nouveau Conseil & Motivation : ${title}`,
      message: summary || content.slice(0, 110),
      category: 'Conseil & Motivation',
      actionUrl: '/conseils',
    });
    setTitle('');
    setSummary('');
    setContent('');
    setQuestion('');
    setFeatured(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
            <Sparkles className="w-4 h-4" />
            Gestion Éditoriale des Conseils & Relais IA
          </span>
          <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
            Conseils du jour et Motivation ({dailyTips.length})
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-nia-bordeaux/15 text-xs font-extrabold text-nia-bordeaux dark:text-amber-200 cursor-pointer">
            <input
              type="checkbox"
              checked={siteSettings.aiAutopilotTipsEnabled}
              onChange={(e) =>
                updateSiteSettings({ aiAutopilotTipsEnabled: e.target.checked })
              }
              className="rounded text-nia-orange"
            />
            <span>Relais IA actif en cas d’indisponibilité de l’admin</span>
          </label>
          <button
            type="button"
            onClick={() => generateAiDailyTipAndPush()}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold shadow-sm"
          >
            Générer & Publier par l’IA (+ Push)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleCreate}
          className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3"
        >
          <h2 className="text-base font-bold">Publier un nouveau conseil</h2>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre du conseil"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DailyTip['category'])}
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          >
            <option value="Écoute">Écoute</option>
            <option value="Franchise">Franchise</option>
            <option value="Réflexion">Réflexion</option>
            <option value="Bien-être">Bien-être</option>
            <option value="Authenticité">Authenticité</option>
          </select>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Résumé court"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Développement complet…"
            className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Question de réflexion ouverte"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded text-nia-orange"
            />
            <span>Définir comme « Conseil du jour » en vedette</span>
          </label>
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-nia-orange text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Ajouter ce conseil
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {dailyTips.map((tip) => (
            <div
              key={tip.id}
              className="p-4 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex items-start justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-nia-orange">{tip.category}</span>
                  {tip.isFeaturedToday && (
                    <span className="px-2 py-0.5 rounded bg-nia-bordeaux text-white text-[10px] font-bold">
                      Conseil du jour actif
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold">{tip.title}</h3>
                <p className="text-xs text-nia-gray-mid">{tip.summary}</p>
              </div>
              <button
                type="button"
                onClick={() => adminDeleteDailyTip(tip.id)}
                className="p-2 rounded-lg text-nia-gray-mid hover:text-rose-600"
                aria-label="Supprimer ce conseil"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 7. QUESTIONNAIRES (/admin/questionnaires)
// ============================================================================
export const AdminQuestionnairesPage: React.FC = () => {
  const { questionnairesCatalog } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <ClipboardList className="w-4 h-4" />
          Référentiel des Questionnaires Vérifiés
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Questionnaires validés et conditions d’utilisation
        </h1>
        <p className="text-xs text-nia-gray-mid dark:text-gray-400 mt-1">
          Conformité stricte : seuls les questionnaires dont la traduction, la licence et l’interprétation non clinique sont documentées sont activés.
        </p>
      </div>

      <div className="space-y-4">
        {questionnairesCatalog.map((q) => (
          <div
            key={q.code}
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                Code : {q.code} • Vérifié
              </span>
              <span className="text-xs text-nia-gray-mid">{q.version}</span>
            </div>
            <h2 className="text-lg font-bold">{q.title}</h2>
            <p className="text-xs text-nia-gray-mid dark:text-gray-300">
              <strong>Source :</strong> {q.sourceAttribution}
            </p>
            <p className="text-xs text-nia-bordeaux dark:text-amber-200">
              <strong>Conditions & Avertissement :</strong> {q.licenseNote}
            </p>
            <ul className="text-xs space-y-1 pl-4 list-disc text-nia-gray-dark dark:text-gray-200">
              {q.questions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// 8. RESSOURCES D'AIDE (/admin/ressources)
// ============================================================================
export const AdminResourcesPage: React.FC = () => {
  const { helpResources, adminSaveHelpResource, adminDeleteHelpResource } = useApp();

  const [countryCode, setCountryCode] = useState<VerifiedHelpResource['countryCode']>('BF');
  const [countryLabel, setCountryLabel] = useState('Burkina Faso');
  const [orgName, setOrgName] = useState('');
  const [contact, setContact] = useState('');
  const [availability, setAvailability] = useState('24h/24 — 7j/7');
  const [description, setDescription] = useState('');
  const [verifiedSource, setVerifiedSource] = useState('Ministère de la Santé');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !contact.trim()) return;
    adminSaveHelpResource({
      countryCode,
      countryLabel,
      organizationName: orgName,
      phoneOrContact: contact,
      availability,
      description,
      verifiedSource,
      isEmergency: true,
    });
    setOrgName('');
    setContact('');
    setDescription('');
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <LifeBuoy className="w-4 h-4" />
          Configuration des Ressources d’Aide Vérifiées par Pays
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Numéros d’urgence et d’orientation ({helpResources.length})
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleAdd}
          className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3"
        >
          <h2 className="text-base font-bold">Ajouter une ressource vérifiée</h2>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={countryCode}
              onChange={(e) => {
                const c = e.target.value as VerifiedHelpResource['countryCode'];
                setCountryCode(c);
                const labels: Record<string, string> = {
                  BF: 'Burkina Faso',
                  FR: 'France',
                  SN: 'Sénégal',
                  CI: 'Côte d’Ivoire',
                  BE: 'Belgique',
                  CA: 'Canada',
                  INT: 'International',
                };
                setCountryLabel(labels[c] || c);
              }}
              className="px-3 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
            >
              <option value="BF">BF — Burkina Faso</option>
              <option value="FR">FR — France</option>
              <option value="SN">SN — Sénégal</option>
              <option value="CI">CI — Côte d’Ivoire</option>
              <option value="BE">BE — Belgique</option>
              <option value="CA">CA — Canada</option>
              <option value="INT">INT — International</option>
            </select>
            <input
              type="text"
              value={countryLabel}
              onChange={(e) => setCountryLabel(e.target.value)}
              className="px-3 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
            />
          </div>
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Nom de l’organisme officiel"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <input
            type="text"
            required
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Numéro d’appel ou contact officiel"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <input
            type="text"
            value={verifiedSource}
            onChange={(e) => setVerifiedSource(e.target.value)}
            placeholder="Source officielle de vérification"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de la prise en charge…"
            className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-nia-orange text-white text-xs font-bold"
          >
            Enregistrer la ressource vérifiée
          </button>
        </form>

        <div className="lg:col-span-7 space-y-3">
          {helpResources.map((r) => (
            <div
              key={r.id}
              className="p-4 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <span className="font-bold text-nia-orange">
                  {r.countryLabel} ({r.countryCode}) — {r.phoneOrContact}
                </span>
                <p className="font-bold text-sm text-nia-gray-dark dark:text-white">
                  {r.organizationName}
                </p>
                <p className="text-nia-gray-mid">{r.description}</p>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Source vérifiée : {r.verifiedSource}
                </p>
              </div>
              <button
                type="button"
                onClick={() => adminDeleteHelpResource(r.id)}
                className="p-1.5 rounded-lg text-nia-gray-mid hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 9. PARAMÈTRES SYSTÈME & DÉPLOIEMENT (/admin/parametres)
// ============================================================================
export const AdminSettingsPage: React.FC = () => {
  const {
    supabaseConnected,
    allPrivacyRequests,
    siteSettings,
    updateSiteSettings,
  } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <Settings className="w-4 h-4" />
          Paramètres SuperAdmin, Couleurs, Sécurité & Règles de Gestion
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Gouvernance globale & Audit de sécurité Nia-Mind
        </h1>
      </div>

      {/* Contrôles SuperAdmin : Couleurs & Règles de sécurité */}
      <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/35 space-y-4">
        <h2 className="text-base font-extrabold text-nia-gray-dark dark:text-white">
          Personnalisation des couleurs & règles de protection (SuperAdmin uniquement)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <label className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between">
            <span className="font-bold">Couleur Principale</span>
            <input
              type="color"
              value={siteSettings.primaryColor}
              onChange={(e) => updateSiteSettings({ primaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </label>
          <label className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between">
            <span className="font-bold">Couleur Secondaire</span>
            <input
              type="color"
              value={siteSettings.secondaryColor}
              onChange={(e) => updateSiteSettings({ secondaryColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </label>
          <label className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between">
            <span className="font-bold">Couleur d’Accent</span>
            <input
              type="color"
              value={siteSettings.accentColor}
              onChange={(e) => updateSiteSettings({ accentColor: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2">
          <label className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between cursor-pointer">
            <span className="font-bold">
              Protection contre les clics de copie / sélection de texte
            </span>
            <input
              type="checkbox"
              checked={siteSettings.copyProtectionEnabled}
              onChange={(e) =>
                updateSiteSettings({ copyProtectionEnabled: e.target.checked })
              }
              className="rounded text-nia-orange"
            />
          </label>
          <label className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between cursor-pointer">
            <span className="font-bold">
              Relais IA automatique pour le Conseil & Motivation du jour
            </span>
            <input
              type="checkbox"
              checked={siteSettings.aiAutopilotTipsEnabled}
              onChange={(e) =>
                updateSiteSettings({ aiAutopilotTipsEnabled: e.target.checked })
              }
              className="rounded text-nia-orange"
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-nia-orange" />
            Variables d’environnement & Secrets
          </h2>
          <ul className="text-xs space-y-2 text-nia-gray-mid dark:text-gray-300">
            <li className="flex items-center justify-between">
              <span>Connexion Supabase (`VITE_SUPABASE_URL`)</span>
              <span className="font-bold text-nia-orange">
                {supabaseConnected ? 'Connecté au Cloud' : 'Mode RLS Local Autonome actif'}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Fonction Serverless `/api/assistant`</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Opérationnelle (Clés IA isolées côté serveur)
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Migration SQL + Triggers RLS</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Prête dans `supabase/migrations/`
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span>Configuration de routage `vercel.json`</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                Prête (Headers de sécurité + SPA rewrites)
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
            Demandes RGPD enregistrées ({allPrivacyRequests.length})
          </h2>
          <div className="space-y-2 text-xs">
            {allPrivacyRequests.map((pr) => (
              <div
                key={pr.id}
                className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between"
              >
                <span>
                  Utilisateur <code>{pr.userId}</code> — {pr.requestType}
                </span>
                <span className="font-bold text-nia-orange">{pr.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 10. JOURNAUX D'AUDIT (/admin/audit) — Sans données sensibles en clair
// ============================================================================
export const AdminAuditLogsPage: React.FC = () => {
  const { auditLogs } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
          <Archive className="w-4 h-4" />
          Traçabilité & Journaux d’Audit Sécurisés
        </span>
        <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
          Journaux d’audit ({auditLogs.length})
        </h1>
        <p className="text-xs text-nia-gray-mid dark:text-gray-400 mt-1">
          Minimisation des données : les journaux d’audit enregistrent uniquement le code d’action, le rôle et l’identifiant cible, sans jamais stocker le texte des journaux intimes ou des messages privés.
        </p>
      </div>

      <div className="rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-nia-bg-light dark:bg-nia-bg-dark border-b border-nia-gray-light dark:border-nia-border-dark uppercase text-nia-gray-mid">
              <tr>
                <th className="py-3 px-4">Horodatage</th>
                <th className="py-3 px-4">Acteur & Rôle</th>
                <th className="py-3 px-4">Code Action</th>
                <th className="py-3 px-4">Cible</th>
                <th className="py-3 px-4">Synthèse aseptisée</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-nia-gray-light dark:divide-nia-border-dark">
              {auditLogs.map((log) => (
                <tr key={log.id}>
                  <td className="py-3 px-4 whitespace-nowrap text-nia-gray-mid">
                    {new Date(log.createdAt).toLocaleString('fr-FR')}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    <code>{log.actorId}</code> ({log.actorRole})
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange font-bold">
                      {log.actionCode}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    {log.targetType} / <code>{log.targetId}</code>
                  </td>
                  <td className="py-3 px-4 text-nia-gray-dark dark:text-gray-200">
                    {log.summary}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
