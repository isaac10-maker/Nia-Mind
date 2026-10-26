import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  Feather,
  FileText,
  HeartHandshake,
  History,
  KeyRound,
  Lock,
  LogOut,
  Moon,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Sun,
  Trash2,
  User,
  XCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../../components/ui/Modal';
import { InlineSlidingGuideBanner } from '../../components/ui/SlidingInstructionBubbles';
import {
  ALL_LISTENING_STATUSES,
  ALL_STORY_STATUSES,
  ListeningRequest,
  StoryRecord,
  StoryStatus,
  UserProfile,
} from '../../lib/types';
import { STORIES_SIGNATURE } from '../../lib/securityEngine';

function getStoryStatusBadgeClass(status: StoryStatus): string {
  switch (status) {
    case 'Publiée':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'Autorisée':
      return 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30';
    case 'Autorisation demandée':
      return 'bg-nia-orange/20 text-nia-orange-deep dark:text-nia-orange border-nia-orange';
    case 'En modération':
    case 'Envoyée':
      return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30';
    case 'Modification demandée':
      return 'bg-nia-bordeaux/15 text-nia-bordeaux dark:text-amber-200 border-nia-bordeaux/40';
    case 'Refusée':
    case 'Retirée':
      return 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30';
    default:
      return 'bg-nia-gray-light dark:bg-nia-border-dark text-nia-gray-dark dark:text-gray-300 border-transparent';
  }
}

// ============================================================================
// 1. ONGLET HISTOIRES PERSONNEL (/espace/histoires) — Parcours complet 8 étapes
// ============================================================================
export const PersonalStoriesPage: React.FC = () => {
  const {
    currentUser,
    userStories,
    publicStories,
    saveOrSubmitStory,
    deleteStoryRecord,
    authorRespondToPublicationRequest,
    authorWithdrawStory,
  } = useApp();

  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [category, setCategory] = useState('Authenticité & Relations');
  const [title, setTitle] = useState('');
  const [pseudonym, setPseudonym] = useState(currentUser?.publicPseudonym || 'Anonyme');
  const [content, setContent] = useState('');

  const [storyForConsentModal, setStoryForConsentModal] = useState<StoryRecord | null>(null);
  const [refusalNote, setRefusalNote] = useState('');
  const [storyForWithdrawModal, setStoryForWithdrawModal] = useState<StoryRecord | null>(null);

  const handleSaveOrSubmit = (submitToModeration: boolean) => {
    if (!content.trim()) return;
    saveOrSubmitStory({
      id: editingId,
      category,
      title,
      publicPseudonym: pseudonym || 'Anonyme',
      originalContent: content,
      submitToModeration,
    });
    setEditingId(undefined);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-8">
      <InlineSlidingGuideBanner
        slides={[
          {
            badge: 'Instructions Histoires • Défilement automatique (1/3)',
            title: 'Étape 1 : Rédigez en brouillon sous pseudonyme',
            detail:
              'Choisissez votre catégorie et votre pseudonyme (« Anonyme », « Plume Libre »…), puis sauvegardez en brouillon privé ou soumettez à la modération.',
          },
          {
            badge: 'Instructions Histoires • Défilement automatique (2/3)',
            title: 'Étape 2 : Examen et anonymisation bienveillante',
            detail:
              'L’équipe vérifie qu’aucun détail ne permet de vous identifier et vous soumet la version prête pour accord.',
          },
          {
            badge: 'Instructions Histoires • Défilement automatique (3/3)',
            title: 'Étape 3 : Rien n’est publié sans votre « Oui » explicite',
            detail:
              'Vous gardez le contrôle à 100 % : vous pouvez approuver la version finale, la refuser ou retirer votre histoire à tout moment.',
          },
        ]}
      />

      {/* En-tête Histoires : Anonymat & Franchise */}
      <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
            <Feather className="w-4 h-4 text-nia-orange" />
            Histoires — Anonymat, Modération & Consentement Explicite
          </span>
          <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white">
            « {STORIES_SIGNATURE} »
          </h1>
          <p className="text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300">
            Une histoire soumise reste strictement privée jusqu’à ce que vous ayez examiné la version proposée et donné votre autorisation explicite de publication.
          </p>
        </div>
        <Link
          to="/histoires"
          className="shrink-0 px-4 py-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-bold"
        >
          Bibliothèque publique ({publicStories.length}) →
        </Link>
      </div>

      {/* Référentiel des 10 statuts officiels */}
      <div className="p-4 rounded-2xl bg-nia-bg-light dark:bg-nia-surface-dark/60 border border-nia-gray-light dark:border-nia-border-dark space-y-2">
        <p className="text-xs font-bold uppercase tracking-wider text-nia-gray-mid dark:text-gray-400">
          Cycle de vie et statuts de protection d’une histoire :
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ALL_STORY_STATUSES.map((st) => (
            <span
              key={st}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStoryStatusBadgeClass(
                st
              )}`}
            >
              {st}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulaire étapes 1 à 5 : Rédiger, Catégorie, Titre facultatif, Pseudonyme, Brouillon ou Soumission */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
              {editingId ? 'Modifier mon histoire' : '1. Rédiger et soumettre une histoire'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(undefined);
                  setTitle('');
                  setContent('');
                }}
                className="text-xs font-bold text-nia-orange"
              >
                Nouveau récit
              </button>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              2. Choisir une catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            >
              <option value="Authenticité & Relations">Authenticité & Relations</option>
              <option value="Parcours & Résilience">Parcours & Résilience</option>
              <option value="Famille & Attentes">Famille & Attentes</option>
              <option value="Travail & Sens">Travail & Sens</option>
              <option value="Écoute & Solitude">Écoute & Solitude</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              3. Titre (facultatif)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex. : Le jour où j’ai osé parler vrai…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              4. Pseudonyme public (ou Anonyme)
            </label>
            <input
              type="text"
              value={pseudonym}
              onChange={(e) => setPseudonym(e.target.value)}
              placeholder="Anonyme"
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Récit personnel
            </label>
            <textarea
              rows={6}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Raconte ton histoire avec sincérité, sans jouer de rôle…"
              className="w-full p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm leading-relaxed"
            />
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              disabled={!content.trim()}
              onClick={() => handleSaveOrSubmit(false)}
              className="flex-1 py-2.5 px-4 rounded-xl border border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange text-xs font-bold disabled:opacity-40"
            >
              5a. Enregistrer un brouillon
            </button>
            <button
              type="button"
              disabled={!content.trim()}
              onClick={() => handleSaveOrSubmit(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold disabled:opacity-40"
            >
              5b. Soumettre à l’administration
            </button>
          </div>
        </div>

        {/* Étapes 6, 7 et 8 : Suivi du statut, examen de la version proposée et autorisation explicite */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
            6. Suivi de mes histoires, versions et autorisations ({userStories.length})
          </h2>

          {userStories.map((story) => (
            <div
              key={story.id}
              className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getStoryStatusBadgeClass(
                      story.status
                    )}`}
                  >
                    Statut : {story.status}
                  </span>
                  <span className="text-xs text-nia-gray-mid dark:text-gray-400">
                    Version v{story.currentVersion} • {story.category}
                  </span>
                </div>
                <span className="text-xs font-semibold text-nia-bordeaux dark:text-amber-300">
                  Signature : {story.publicPseudonym}
                </span>
              </div>

              <h3 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                {story.title || 'Histoire sans titre'}
              </h3>

              {/* Comparaison entre version originale et version proposée pour publication */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark space-y-1">
                  <p className="font-bold text-nia-gray-mid dark:text-gray-400">
                    Votre texte original (Privé) :
                  </p>
                  <p className="text-nia-gray-dark dark:text-gray-200 leading-relaxed">
                    {story.originalContent}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-nia-orange/5 dark:bg-nia-bg-dark border border-nia-orange/30 space-y-1">
                  <p className="font-bold text-nia-orange-deep dark:text-nia-orange">
                    7. Version proposée pour publication (v{story.currentVersion}) :
                  </p>
                  <p className="text-nia-gray-dark dark:text-gray-200 leading-relaxed">
                    {story.proposedPublicContent}
                  </p>
                </div>
              </div>

              {story.moderationNote && (
                <div className="p-3.5 rounded-xl bg-nia-bordeaux/10 border border-nia-bordeaux/30 text-xs text-nia-bordeaux dark:text-amber-200">
                  <strong>Note de la modération :</strong> {story.moderationNote}
                </div>
              )}

              {/* Actions selon le statut : Examen et Autorisation explicite (Étape 8) */}
              <div className="pt-3 border-t border-nia-gray-light dark:border-nia-border-dark flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-nia-gray-mid dark:text-gray-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-nia-orange" />
                  {story.authorExplicitConsent &&
                  story.authorApprovedVersion === story.currentVersion ? (
                    <span className="text-emerald-700 dark:text-emerald-300 font-semibold">
                      Autorisation explicite accordée pour la v{story.currentVersion}
                    </span>
                  ) : (
                    <span>Aucune publication possible sans votre accord sur la v{story.currentVersion}</span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(story.status === 'Brouillon' || story.status === 'Modification demandée') && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(story.id);
                        setCategory(story.category);
                        setTitle(story.title);
                        setPseudonym(story.publicPseudonym);
                        setContent(story.originalContent);
                      }}
                      className="px-3.5 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold hover:border-nia-orange"
                    >
                      Reprendre / Modifier
                    </button>
                  )}

                  {story.status === 'Autorisation demandée' && (
                    <button
                      type="button"
                      onClick={() => setStoryForConsentModal(story)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      8. Examiner & Donner ou refuser mon autorisation
                    </button>
                  )}

                  {(story.status === 'Publiée' || story.status === 'Autorisée') && (
                    <button
                      type="button"
                      onClick={() => setStoryForWithdrawModal(story)}
                      className="px-3.5 py-2 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold hover:bg-rose-500/25"
                    >
                      Retirer / Dépublier mon histoire
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => deleteStoryRecord(story.id)}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold"
                    title="Supprimer définitivement ce récit"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>

              {/* Historique des décisions de l'histoire */}
              {story.decisionHistory.length > 0 && (
                <details className="text-xs text-nia-gray-mid dark:text-gray-400 pt-1">
                  <summary className="cursor-pointer font-semibold hover:text-nia-orange inline-flex items-center gap-1">
                    <History className="w-3.5 h-3.5" />
                    Historique des décisions ({story.decisionHistory.length})
                  </summary>
                  <ul className="mt-2 space-y-1.5 pl-4 border-l-2 border-nia-gray-light dark:border-nia-border-dark">
                    {story.decisionHistory.map((d) => (
                      <li key={d.id}>
                        <span className="font-bold text-nia-gray-dark dark:text-gray-200">
                          [{d.status} — v{d.version}]
                        </span>{' '}
                        ({d.actor}) : {d.note}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Modale Étape 8 : Autorisation explicite ou refus de publication par l'auteur */}
      {storyForConsentModal && (
        <Modal
          isOpen={Boolean(storyForConsentModal)}
          onClose={() => setStoryForConsentModal(null)}
          badgeText={`Autorisation explicite auteur • Version v${storyForConsentModal.currentVersion}`}
          title="Autorisez-vous la publication de cette version ?"
          subtitle="L’administrateur ne peut jamais publier une histoire sans votre accord explicite sur la version exacte ci-dessous."
          accent="orange"
          maxWidthClass="max-w-2xl"
          footer={
            <>
              <button
                type="button"
                onClick={() => {
                  authorRespondToPublicationRequest(
                    storyForConsentModal.id,
                    false,
                    refusalNote || 'Je souhaite modifier ou garder cette version privée.'
                  );
                  setStoryForConsentModal(null);
                  setRefusalNote('');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                <XCircle className="w-4 h-4" />
                Refuser cette version
              </button>
              <button
                type="button"
                onClick={() => {
                  authorRespondToPublicationRequest(storyForConsentModal.id, true);
                  setStoryForConsentModal(null);
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold shadow-sm"
              >
                <CheckCircle2 className="w-4 h-4" />
                Donner mon autorisation explicite pour publier la v{storyForConsentModal.currentVersion}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark">
                <p className="font-bold text-nia-gray-mid mb-1">Votre texte initial :</p>
                <p>{storyForConsentModal.originalContent}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-nia-orange/10 border border-nia-orange">
                <p className="font-bold text-nia-orange-deep dark:text-nia-orange mb-1">
                  Version proposée à la publication (v{storyForConsentModal.currentVersion}) :
                </p>
                <p>{storyForConsentModal.proposedPublicContent}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Remarque éventuelle en cas de refus ou de demande d’ajustement
              </label>
              <input
                type="text"
                value={refusalNote}
                onChange={(e) => setRefusalNote(e.target.value)}
                placeholder="Facultatif : précisez ce que vous souhaitez ajuster…"
                className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modale de retrait / dépublication */}
      {storyForWithdrawModal && (
        <Modal
          isOpen={Boolean(storyForWithdrawModal)}
          onClose={() => setStoryForWithdrawModal(null)}
          badgeText="Droit de retrait immédiat"
          title="Retirer cette histoire de la bibliothèque publique ?"
          subtitle="Votre histoire passera immédiatement au statut « Retirée » et ne sera plus visible du public."
          accent="bordeaux"
          footer={
            <>
              <button
                type="button"
                onClick={() => setStoryForWithdrawModal(null)}
                className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  authorWithdrawStory(storyForWithdrawModal.id);
                  setStoryForWithdrawModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Confirmer le retrait immédiat
              </button>
            </>
          }
        >
          <p>
            Vous conservez à tout moment le contrôle sur votre récit{' '}
            <strong>« {storyForWithdrawModal.title} »</strong>.
          </p>
        </Modal>
      )}
    </div>
  );
};

// ============================================================================
// 2. DEMANDER UNE ÉCOUTE HUMAINE (/espace/ecoute) — 5 statuts officiels
// ============================================================================
export const ListeningRequestPage: React.FC = () => {
  const {
    userListeningRequests,
    createListeningRequest,
    deleteListeningRequest,
    clearListeningRequests,
  } = useApp();

  const [topic, setTopic] = useState('');
  const [preferredMode, setPreferredMode] =
    useState<ListeningRequest['preferredMode']>('Échange écrit asynchrone');
  const [preferredSlot, setPreferredSlot] = useState('En fin de journée (18h - 20h)');
  const [message, setMessage] = useState('');
  const [justSubmittedId, setJustSubmittedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() || !message.trim()) return;
    const created = createListeningRequest({
      topic,
      preferredMode,
      preferredSlot,
      message,
    });
    setJustSubmittedId(created.id);
    setTopic('');
    setMessage('');
  };

  return (
    <div className="space-y-8">
      {/* Mention transparente sur la disponibilité */}
      <div className="p-5 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-bordeaux/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-nia-bordeaux dark:text-amber-300">
            <HeartHandshake className="w-4 h-4 text-nia-orange" />
            Écoute Humaine Confidentielle
          </span>
          <h1 className="text-2xl font-extrabold text-nia-gray-dark dark:text-white">
            Demander un échange avec un écoutant de l’équipe
          </h1>
          <p className="text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300">
            <strong>Information importante :</strong> Ce service d’écoute humaine fonctionne de manière planifiée et asynchrone ; il ne promet pas une réponse immédiate 24h/24. En cas d’urgence vitale, consultez immédiatement nos ressources d’aide vérifiées.
          </p>
        </div>
        <Link
          to="/ressources"
          className="shrink-0 px-4 py-2.5 rounded-xl bg-nia-bordeaux text-white text-xs font-bold"
        >
          Numéros d’urgence vérifiés
        </Link>
      </div>

      {/* Confirmation d'envoi */}
      {justSubmittedId && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-between gap-3 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              Confirmation d’envoi : votre demande ({justSubmittedId}) a bien été enregistrée au statut « Envoyée ». Elle n’est accessible qu’à vous et aux membres habilités de l’équipe.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setJustSubmittedId(null)}
            className="underline font-bold"
          >
            Fermer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Formulaire privé de demande d'écoute */}
        <form
          onSubmit={handleSubmit}
          className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
        >
          <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
            Nouvelle demande privée d’écoute
          </h2>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Sujet principal
            </label>
            <input
              type="text"
              required
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex. : Besoin de faire le point sur une période de solitude…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Modalité souhaitée
            </label>
            <select
              value={preferredMode}
              onChange={(e) =>
                setPreferredMode(e.target.value as ListeningRequest['preferredMode'])
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            >
              <option value="Échange écrit asynchrone">Échange écrit asynchrone</option>
              <option value="Entretien audio planifié">Entretien audio planifié</option>
              <option value="Message confidentiel guidé">Message confidentiel guidé</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Disponibilité indicative
            </label>
            <input
              type="text"
              value={preferredSlot}
              onChange={(e) => setPreferredSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Votre message confidentiel
            </label>
            <textarea
              rows={5}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Exprimez-vous librement…"
              className="w-full p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm inline-flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer ma demande d’écoute
          </button>
        </form>

        {/* Écran de suivi des demandes */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
              Suivi de mes demandes ({userListeningRequests.length})
            </h2>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              {userListeningRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => clearListeningRequests()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 font-bold"
                  title="Vider et nettoyer toutes mes demandes d'écoute"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider mes demandes</span>
                </button>
              )}
              {ALL_LISTENING_STATUSES.map((st) => (
                <span
                  key={st}
                  className="px-2 py-0.5 rounded-md bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark"
                >
                  {st}
                </span>
              ))}
            </div>
          </div>

          {userListeningRequests.length === 0 && (
            <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-dashed border-nia-gray-light dark:border-nia-border-dark text-center text-xs text-nia-gray-mid">
              Aucune demande d’écoute enregistrée. Vous pouvez rédiger un message confidentiel à gauche à tout moment.
            </div>
          )}

          {userListeningRequests.map((req) => (
            <div
              key={req.id}
              className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  Statut : {req.status}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-nia-gray-mid flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(req.createdAt).toLocaleDateString('fr-FR')} • {req.preferredMode}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteListeningRequest(req.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-bold"
                    title="Supprimer ce message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer</span>
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-nia-gray-dark dark:text-white">
                  {req.topic}
                </h3>
                <p className="text-xs text-nia-gray-mid dark:text-gray-300 mt-1 whitespace-pre-line">
                  {req.message}
                </p>
              </div>

              {req.listenerReply && (
                <div className="p-4 rounded-xl bg-nia-bordeaux/10 border-l-4 border-nia-bordeaux space-y-1">
                  <p className="text-xs font-bold text-nia-bordeaux dark:text-amber-300">
                    Réponse de {req.assignedListener || 'l’équipe d’écoute Nia-Mind'} :
                  </p>
                  <p className="text-xs sm:text-sm text-nia-gray-dark dark:text-gray-100 leading-relaxed">
                    {req.listenerReply}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. CONSEILS DU JOUR (/espace/conseils-du-jour)
// ============================================================================
export const PersonalDailyTipsPage: React.FC = () => {
  const { dailyTips, featuredDailyTip, openDailyTipModal } = useApp();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-100">
            Conseil du jour en vedette • {featuredDailyTip.category}
          </span>
          <h1 className="text-2xl font-extrabold">{featuredDailyTip.title}</h1>
          <p className="text-sm text-white/90">{featuredDailyTip.summary}</p>
        </div>
        <button
          type="button"
          onClick={openDailyTipModal}
          className="shrink-0 px-4 py-2.5 rounded-xl bg-white text-nia-bordeaux font-bold text-xs shadow-sm"
        >
          Ouvrir la modale Conseil du jour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {dailyTips.map((tip) => (
          <div
            key={tip.id}
            className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-0.5 rounded-full font-bold bg-nia-orange/15 text-nia-orange-deep dark:text-nia-orange">
                  {tip.category}
                </span>
                <span className="text-nia-gray-mid">{tip.readingTimeMin} min</span>
              </div>
              <h2 className="text-lg font-bold text-nia-gray-dark dark:text-white">
                {tip.title}
              </h2>
              <p className="text-xs sm:text-sm text-nia-gray-mid dark:text-gray-300 leading-relaxed">
                {tip.content}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border-l-4 border-nia-bordeaux flex items-center justify-between gap-3">
              <span className="text-xs font-medium">« {tip.reflectionQuestion} »</span>
              <button
                type="button"
                onClick={() => navigate('/espace/journal')}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-nia-orange text-white text-xs font-bold"
              >
                Journal →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PROFILE_INTEREST_OPTIONS = [
  'Parler sans masque à l’Assistant réflexif',
  'Apaiser mon stress & améliorer mon sommeil',
  'Écrire librement dans mon journal intime',
  'Lire ou partager une histoire anonyme',
  'Demander une écoute humaine bienveillante',
  'Recevoir le conseil de réflexion du jour',
];

const PROFILE_LIFE_MOMENT_OPTIONS = [
  'Pression au travail ou dans mes études',
  'Questionnements sur mes relations ou ma famille',
  'Sentiment de solitude (« seul(e) au milieu des autres »)',
  'Fatigue mentale et besoin de lâcher prise',
  'Envie de mieux me connaître à mon rythme',
];

// ============================================================================
// 4. PROFIL & CONFIDENTIALITÉ (/espace/profil & /espace/confidentialite)
// ============================================================================
export const ProfileAndPrivacyPage: React.FC<{ section: 'profile' | 'privacy' }> = ({
  section,
}) => {
  const {
    currentUser,
    updateCurrentUserProfile,
    theme,
    setTheme,
    reducedMotion,
    setReducedMotion,
    userSessions,
    revokeSession,
    userPrivacyRequests,
    createPrivacyRequest,
    userJournalEntries,
    userMoodEntries,
    userStories,
    logout,
    pushToast,
  } = useApp();

  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [pseudonym, setPseudonym] = useState(currentUser?.publicPseudonym || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [countryCode, setCountryCode] = useState<UserProfile['countryCode']>(
    currentUser?.countryCode || 'BF'
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    currentUser?.notificationsEnabled ?? true
  );
  const [dailyTipModalEnabled, setDailyTipModalEnabled] = useState<boolean>(
    currentUser?.dailyTipModalEnabled ?? true
  );
  const [newPassword, setNewPassword] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');

  // Questionnaires « Dites-nous-en plus sur vous » intégrés dans Profil & Paramètres
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    currentUser?.interests || []
  );
  const [selectedMoment, setSelectedMoment] = useState<string>('');
  const [freeNote, setFreeNote] = useState<string>('');

  const toggleInterest = (item: string) => {
    setSelectedInterests((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenPseudo = pseudonym.trim() || displayName.trim() || 'PlumeSincere';
    updateCurrentUserProfile({
      displayName: chosenPseudo,
      publicPseudonym: chosenPseudo,
      fullName: displayName.trim() || currentUser?.fullName || chosenPseudo,
      bio,
      countryCode,
      notificationsEnabled,
      dailyTipModalEnabled,
      interests: selectedInterests,
    });
  };

  const handleSaveOnboardingQuestionnaire = () => {
    const mergedBio = [
      bio.trim(),
      selectedMoment ? `Moment actuel : ${selectedMoment}` : '',
      freeNote.trim() ? `Souhait : ${freeNote.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' • ');
    setBio(mergedBio || bio);
    updateCurrentUserProfile({
      interests: selectedInterests,
      bio: mergedBio || bio,
    });
    pushToast(
      'Questionnaire enregistré',
      'Vos centres d’intérêt et repères personnels ont été sauvegardés dans votre profil.',
      'orange'
    );
  };

  const handleExportUserData = () => {
    createPrivacyRequest('data_export', 'Export JSON immédiat déclenché par l’utilisateur.');
    const exportPayload = {
      exportedAt: new Date().toISOString(),
      platform: 'Nia-Mind — Le vrai sans le masque',
      profile: currentUser,
      journalEntries: userJournalEntries,
      moodEntries: userMoodEntries,
      stories: userStories,
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nia-mind-mes-donnees-${currentUser?.id || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-nia-orange">
            {section === 'profile' ? <User className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            {section === 'profile' ? 'Mon Profil & Préférences' : 'Confidentialité, Consentements & RGPD'}
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-nia-gray-dark dark:text-white mt-1">
            {section === 'profile'
              ? 'Gérer mon identité et mon confort de lecture'
              : 'Contrôler mes données, sessions et consentements'}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            to="/espace/profil"
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              section === 'profile'
                ? 'bg-nia-orange text-white'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark'
            }`}
          >
            Mon profil
          </Link>
          <Link
            to="/espace/confidentialite"
            className={`px-4 py-2 rounded-xl text-xs font-bold ${
              section === 'privacy'
                ? 'bg-nia-orange text-white'
                : 'bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark'
            }`}
          >
            Confidentialité et paramètres
          </Link>
        </div>
      </div>

      {/* Formulaire Profil, Thème & Préférences */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form
          onSubmit={handleSaveProfile}
          className="lg:col-span-6 p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4"
        >
          <h2 className="text-base font-bold text-nia-gray-dark dark:text-white">
            Informations de profil & Préférences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Pseudonyme affiché sur le site
              </label>
              <input
                type="text"
                value={pseudonym}
                onChange={(e) => setPseudonym(e.target.value)}
                placeholder="Ex. : PlumeSincere"
                className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1">
                Nom complet (confidentiel • Admin seul)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Strictement masqué au public"
                className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Pays de référence (pour les numéros d’aide vérifiés)
            </label>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value as UserProfile['countryCode'])}
              className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            >
              <option value="BF">Burkina Faso (BF)</option>
              <option value="FR">France (FR)</option>
              <option value="SN">Sénégal (SN)</option>
              <option value="CI">Côte d’Ivoire (CI)</option>
              <option value="BE">Belgique (BE)</option>
              <option value="CA">Canada (CA)</option>
              <option value="INT">International</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1">
              Intention personnelle / Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-sm"
            />
          </div>

          {/* Sélecteur d'aperçu Mode Clair / Mode Sombre (sans code ni nom numérique) et Accessibilité */}
          <div className="pt-2 border-t border-nia-gray-light dark:border-nia-border-dark space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider">
              Aperçu du site — Mode clair & Mode sombre
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                  theme === 'light'
                    ? 'bg-nia-orange text-white border-nia-orange shadow-sm'
                    : 'border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange'
                }`}
              >
                <div className="w-full h-7 rounded-lg bg-amber-50 border border-amber-200/80 flex items-center justify-center gap-1.5 px-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span className="w-8 h-1.5 rounded-full bg-orange-400/70" />
                </div>
                <span>Mode clair</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                  theme === 'dark'
                    ? 'bg-nia-orange text-white border-nia-orange shadow-sm'
                    : 'border-nia-gray-light dark:border-nia-border-dark hover:border-nia-orange'
                }`}
              >
                <div className="w-full h-7 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-center gap-1.5 px-2">
                  <Moon className="w-3.5 h-3.5 text-amber-300" />
                  <span className="w-8 h-1.5 rounded-full bg-rose-400/70" />
                </div>
                <span>Mode sombre</span>
              </button>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark text-xs font-semibold cursor-pointer">
              <span>Réduire les animations et effets glitch (Accessibilité)</span>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="h-4 w-4 rounded text-nia-orange"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark text-xs font-semibold cursor-pointer">
              <span>Notifications de suivi (écoute humaine & modération)</span>
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-nia-orange"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark text-xs font-semibold cursor-pointer">
              <span>Afficher le Conseil du jour à l’ouverture</span>
              <input
                type="checkbox"
                checked={dailyTipModalEnabled}
                onChange={(e) => setDailyTipModalEnabled(e.target.checked)}
                className="h-4 w-4 rounded text-nia-orange"
              />
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white font-bold text-sm"
          >
            Enregistrer mes préférences
          </button>
        </form>

        {/* Colonne Confidentialité, Consentements, Sessions, Mot de passe, RGPD */}
        <div className="lg:col-span-6 space-y-6">
          {/* Distinction Conditions Contractuelles vs Consentements Facultatifs */}
          <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-nia-orange" />
              Conditions acceptées & Consentements facultatifs
            </h2>

            <div className="p-3.5 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>1. Conditions contractuelles acceptées</span>
                <span className="text-emerald-700 dark:text-emerald-300">
                  {currentUser?.acceptedTermsVersion}
                </span>
              </div>
              <p className="text-nia-gray-mid dark:text-gray-400">
                Acceptées le{' '}
                {currentUser?.acceptedTermsAt
                  ? new Date(currentUser.acceptedTermsAt).toLocaleDateString('fr-FR')
                  : '01/10/2026'}{' '}
                — Socle requis pour l’hébergement sécurisé de votre compte.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="flex items-center justify-between p-3 rounded-xl border border-nia-gray-light dark:border-nia-border-dark cursor-pointer">
                <div>
                  <p className="font-bold">Consentement facultatif : Courbes bien-être</p>
                  <p className="text-nia-gray-mid"> Synthèse graphique locale sur 7 et 30 jours</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentUser?.optionalWellnessInsightsConsent)}
                  onChange={(e) =>
                    updateCurrentUserProfile({
                      optionalWellnessInsightsConsent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded text-nia-orange"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-xl border border-nia-gray-light dark:border-nia-border-dark cursor-pointer">
                <div>
                  <p className="font-bold">Consentement facultatif : Mesures techniques anonymes</p>
                  <p className="text-nia-gray-mid">Aucun contenu personnel ni pistage publicitaire</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(currentUser?.optionalAnalyticsConsent)}
                  onChange={(e) =>
                    updateCurrentUserProfile({
                      optionalAnalyticsConsent: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded text-nia-orange"
                />
              </label>
            </div>
          </div>

          {/* Sessions actives & Mot de passe */}
          <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-nia-bordeaux dark:text-amber-300" />
              Sessions actives & Mot de passe
            </h2>

            <div className="space-y-2">
              {userSessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-3 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <p className="font-bold">{sess.deviceLabel}</p>
                    <p className="text-nia-gray-mid">
                      {sess.locationLabel} • {sess.lastActiveAt}
                    </p>
                  </div>
                  {sess.isCurrent ? (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                      Session actuelle
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => revokeSession(sess.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 font-bold"
                    >
                      Révoquer
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-nia-gray-light dark:border-nia-border-dark flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nouveau mot de passe (min. 10 caractères)…"
                className="flex-1 px-3 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (newPassword.length < 6) {
                    pushToast('Mot de passe trop court', 'Choisissez au moins 8 caractères.', 'bordeaux');
                    return;
                  }
                  setNewPassword('');
                  pushToast('Mot de passe mis à jour', 'Votre mot de passe a été modifié.', 'orange');
                }}
                className="px-3.5 py-2 rounded-xl bg-nia-bordeaux text-white text-xs font-bold inline-flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Modifier
              </button>
            </div>
          </div>

          {/* Demandes d'accès aux données, Export JSON, Suppression et Déconnexion */}
          <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border border-nia-gray-light dark:border-nia-border-dark space-y-4">
            <h2 className="text-base font-bold text-nia-gray-dark dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-nia-orange" />
              Droits d’accès, d’export et de suppression (RGPD)
            </h2>

            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportUserData}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-bold"
              >
                <Download className="w-4 h-4" />
                Télécharger toutes mes données (JSON)
              </button>
              <button
                type="button"
                onClick={() =>
                  createPrivacyRequest(
                    'data_access',
                    'Demande de copie certifiée des traitements de données.'
                  )
                }
                className="px-4 py-2.5 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold hover:border-nia-orange"
              >
                Demander un rapport d’accès
              </button>
              <button
                type="button"
                onClick={() => setDeleteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 text-xs font-bold"
              >
                <Trash2 className="w-4 h-4" />
                Demander la suppression du compte
              </button>
            </div>

            {userPrivacyRequests.length > 0 && (
              <div className="space-y-1.5 pt-2 text-xs">
                <p className="font-bold text-nia-gray-mid">Historique de vos demandes RGPD :</p>
                {userPrivacyRequests.map((pr) => (
                  <div
                    key={pr.id}
                    className="p-2.5 rounded-lg bg-nia-bg-light dark:bg-nia-bg-dark flex items-center justify-between"
                  >
                    <span>
                      {pr.requestType} — {pr.reason}
                    </span>
                    <span className="font-bold text-nia-orange">{pr.status}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-3 border-t border-nia-gray-light dark:border-nia-border-dark flex justify-end">
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                Se déconnecter de cette session
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          QUESTIONNAIRE DE PERSONNALISATION : « DITES-NOUS-EN PLUS SUR VOUS »
          (Déplacé depuis l'inscription vers Mon profil & Confidentialité et paramètres)
          ==================================================================== */}
      <div className="p-6 rounded-2xl bg-white dark:bg-nia-surface-dark border-2 border-nia-orange/35 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-nia-gray-light dark:border-nia-border-dark pb-3">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-nia-orange">
              <Sparkles className="w-4 h-4" />
              Facultatif • Personnalisation Douce
            </span>
            <h2 className="text-lg font-extrabold text-nia-gray-dark dark:text-white mt-0.5">
              Dites-nous-en plus sur vous
            </h2>
            <p className="text-xs text-nia-gray-mid dark:text-gray-400">
              Il n’y a pas de bonne ou de mauvaise réponse. Adaptez votre espace à vos besoins du moment.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSaveOnboardingQuestionnaire}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-nia-orange to-nia-bordeaux text-white text-xs font-extrabold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Enregistrer mes centres d’intérêt</span>
          </button>
        </div>

        {/* Question 1 : Centres d'intérêt */}
        <div className="space-y-2.5">
          <p className="text-sm font-black text-nia-gray-dark dark:text-white">
            1. Qu’est-ce qui vous attire le plus sur Nia-Mind ? (Plusieurs choix possibles)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {PROFILE_INTEREST_OPTIONS.map((opt) => {
              const checked = selectedInterests.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleInterest(opt)}
                  className={`nia-tactile-opt text-left p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center gap-2.5 ${
                    checked
                      ? 'bg-gradient-to-r from-nia-bordeaux to-nia-orange text-white border-nia-orange'
                      : 'bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-gray-200 border-nia-bordeaux/30'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 ${
                      checked ? 'bg-white text-nia-bordeaux border-white' : 'border-nia-orange'
                    }`}
                  >
                    {checked ? '✓' : ''}
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 2 : Ce que vous traversez */}
        <div className="space-y-2.5">
          <p className="text-sm font-black text-nia-gray-dark dark:text-white">
            2. Quel sujet résonne le plus avec votre quotidien actuel ?
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROFILE_LIFE_MOMENT_OPTIONS.map((moment) => {
              const active = selectedMoment === moment;
              return (
                <button
                  key={moment}
                  type="button"
                  onClick={() => setSelectedMoment(moment)}
                  className={`nia-tactile-opt w-full text-left p-3 rounded-2xl border-2 text-xs font-extrabold flex items-center gap-2.5 ${
                    active
                      ? 'bg-nia-orange text-white border-nia-bordeaux'
                      : 'bg-nia-bg-light dark:bg-nia-bg-dark text-nia-gray-dark dark:text-gray-200 border-nia-orange/30'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      active ? 'bg-white border-white' : 'border-nia-bordeaux'
                    }`}
                  />
                  <span>{moment}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question 3 : Un mot libre facultatif */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="block text-xs font-extrabold uppercase tracking-wider mb-1">
              3. Un mot ou un souhait pour votre espace ? (Facultatif)
            </label>
            <input
              type="text"
              value={freeNote}
              onChange={(e) => setFreeNote(e.target.value)}
              placeholder="Ex. : Prendre 10 minutes chaque soir pour souffler…"
              className="w-full px-4 py-2.5 rounded-2xl bg-nia-bg-light dark:bg-nia-bg-dark border-2 border-nia-orange/35 text-xs font-semibold"
            />
          </div>
          <button
            type="button"
            onClick={handleSaveOnboardingQuestionnaire}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-nia-orange hover:bg-nia-orange-deep text-white text-xs font-extrabold"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Enregistrer mes réponses</span>
          </button>
        </div>
      </div>

      {/* Modale de confirmation de demande de suppression de compte */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        badgeText="Droit à l’effacement"
        title="Confirmer la demande de suppression de votre compte ?"
        subtitle="Conformément à notre politique de confidentialité, votre journal privé, vos bilans et vos conversations seront supprimés."
        accent="bordeaux"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-nia-gray-light dark:border-nia-border-dark text-xs font-bold"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={() => {
                createPrivacyRequest(
                  'account_deletion',
                  deleteReason || 'Demande d’effacement complet par l’utilisateur.'
                );
                setDeleteModalOpen(false);
                setDeleteReason('');
              }}
              className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
            >
              Confirmer la demande de suppression
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs">
            Souhaitez-vous préciser un motif (facultatif) avant l’enregistrement de votre demande d’effacement ?
          </p>
          <input
            type="text"
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            placeholder="Motif facultatif…"
            className="w-full px-3.5 py-2 rounded-xl bg-nia-bg-light dark:bg-nia-bg-dark border border-nia-gray-light dark:border-nia-border-dark text-xs"
          />
        </div>
      </Modal>
    </div>
  );
};
