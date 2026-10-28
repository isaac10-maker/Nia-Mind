import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CommunityCard } from '../../components/communities/CommunityCard';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import {
  archiveOwnCommunity,
  explainCommunityError,
  loadCommunityAccess,
  loadCommunityAudit,
  loadCommunityCategories,
  loadModerationQueue,
  loadMyCommunities,
  moderateCommunity,
  saveCommunity,
  submitCommunity,
  type CommunityAccess,
  type CommunityAuditRow,
  type CommunityCategory,
  type CommunityDraft,
  type ManagedCommunity,
  type AdminCommunityRow,
} from '../../lib/communityApi';
import {
  displayCategoryName,
  platformLabel,
  statusLabel,
  tCommunity,
  tCommunityExtra,
} from '../../lib/communityI18n';
import {
  COMMUNITY_LANGUAGES,
  COMMUNITY_PLATFORMS,
  containsUnsafeText,
  isAllowedDestination,
  isSafeCoverUrl,
  isSafeHttpsUrl,
  platformFromCommunityLink,
  sensitiveCategoryNeedsAck,
  statusAfterSubmit,
  type CommunityPlatform,
  type CommunityPolicy,
} from '../../lib/communityRules';

const EMPTY_DRAFT: CommunityDraft = {
  name: '',
  cover_url: '',
  short_description: '',
  long_description: '',
  platform: 'whatsapp_group',
  destination_url: '',
  primary_category_id: '',
  secondary_category_ids: [],
  language: 'fr',
  country_code: '',
  organizer_name: '',
  tags: [],
  responsible_ack: false,
};

function draftFromListing(item: ManagedCommunity): CommunityDraft {
  return {
    id: item.id,
    name: item.name,
    cover_url: item.cover_url || '',
    short_description: item.short_description,
    long_description: item.long_description,
    platform: item.platform,
    destination_url: item.destination_url,
    primary_category_id: item.primary_category_id,
    secondary_category_ids: [],
    language: item.language,
    country_code: item.country_code || '',
    organizer_name: item.organizer_name || '',
    tags: item.tags || [],
    responsible_ack: item.responsible_ack,
  };
}

function canAct(access: CommunityAccess | null, key: keyof CommunityAccess): boolean {
  if (!access) return false;
  if (access.isSuperadmin) return true;
  return access.isManager && access.status === 'active' && access[key] === true;
}

export const ManageCommunitiesPage: React.FC = () => {
  const { currentLanguage, currentUser, authReady } = useApp();
  const [access, setAccess] = useState<CommunityAccess | null>(null);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [rows, setRows] = useState<ManagedCommunity[]>([]);
  const [queue, setQueue] = useState<AdminCommunityRow[]>([]);
  const [audit, setAudit] = useState<CommunityAuditRow[]>([]);
  const [draft, setDraft] = useState<CommunityDraft>(EMPTY_DRAFT);
  const [tagText, setTagText] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [rejectId, setRejectId] = useState('');
  const [rejectNote, setRejectNote] = useState('');

  const policy: CommunityPolicy = { requireApproval: true, revalidateOnMajorEdit: true, extraHosts: [] };
  const activeCategories = categories.filter((item) => item.is_active);
  const selectedCategory = categories.find((item) => item.id === draft.primary_category_id);

  const reload = async () => {
    const nextAccess = await loadCommunityAccess();
    setAccess(nextAccess);
    if (!nextAccess.authenticated) return;
    const [nextCategories, mine, history] = await Promise.all([
      loadCommunityCategories(nextAccess.isSuperadmin),
      loadMyCommunities(),
      loadCommunityAudit(true),
    ]);
    setCategories(nextCategories);
    setRows(mine.rows);
    setAudit(history.rows);
    if (nextAccess.isSuperadmin || nextAccess.canModerateAll) {
      const pending = await loadModerationQueue();
      setQueue(pending.rows);
    }
    if (!draft.primary_category_id && nextCategories[0]) {
      setDraft((current) => ({ ...current, primary_category_id: current.primary_category_id || nextCategories[0].id }));
    }
  };

  useEffect(() => {
    if (!authReady) return;
    void reload();
  }, [authReady, currentUser?.id]);

  const stats = useMemo(() => {
    return {
      managed: rows.length,
      published: rows.filter((item) => item.status === 'published').length,
      pending: rows.filter((item) => item.status === 'pending').length,
      rejected: rows.filter((item) => item.status === 'rejected').length,
      archived: rows.filter((item) => item.status === 'archived').length,
    };
  }, [rows]);

  const preparedDraft = (): CommunityDraft => ({
    ...draft,
    tags: tagText.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 8),
  });

  const validate = (value: CommunityDraft): string => {
    if (value.name.trim().length < 2) return tCommunity(currentLanguage, 'name');
    const destinationOk = value.platform === 'other'
      ? isSafeHttpsUrl(value.destination_url)
      : isAllowedDestination(value.destination_url, value.platform);
    if (!destinationOk) return tCommunityExtra(currentLanguage, 'invalidUrl');
    if (!isSafeCoverUrl(value.cover_url)) return tCommunityExtra(currentLanguage, 'invalidUrl');
    if (containsUnsafeText(`${value.name} ${value.short_description} ${value.long_description}`)) {
      return tCommunityExtra(currentLanguage, 'unsafeText');
    }
    if (sensitiveCategoryNeedsAck(Boolean(selectedCategory?.is_sensitive), value.responsible_ack)) {
      return tCommunityExtra(currentLanguage, 'sensitiveRequired');
    }
    return '';
  };

  const onSave = async () => {
    const value = preparedDraft();
    const problem = validate(value);
    if (problem) {
      setNote(problem);
      return;
    }
    setBusy(true);
    const result = await saveCommunity(value);
    setBusy(false);
    setNote(result.error ? explainCommunityError(currentLanguage, { message: result.error }) : tCommunity(currentLanguage, 'saved'));
    if (result.id) setDraft((current) => ({ ...current, id: result.id || current.id }));
    await reload();
  };

  const onSubmit = async () => {
    const value = preparedDraft();
    const problem = validate(value);
    if (problem) {
      setNote(problem);
      return;
    }
    setBusy(true);
    const saved = await saveCommunity(value);
    if (saved.error || !saved.id) {
      setBusy(false);
      setNote(explainCommunityError(currentLanguage, { message: saved.error || '' }));
      return;
    }
    const submitted = await submitCommunity(saved.id);
    setBusy(false);
    if (submitted.error) {
      setNote(explainCommunityError(currentLanguage, { message: submitted.error }));
    } else if (submitted.status === 'published') {
      setNote(tCommunity(currentLanguage, 'publishedDirect'));
    } else {
      setNote(tCommunity(currentLanguage, 'submitted'));
    }
    await reload();
  };

  if (!authReady || !access) {
    return <div className="mx-auto max-w-5xl px-4 py-16 text-sm font-bold">{tCommunity(currentLanguage, 'loading')}</div>;
  }

  if (!currentUser || !access.authenticated) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-extrabold">{tCommunity(currentLanguage, 'manageTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed">{tCommunity(currentLanguage, 'needAccount')}</p>
        <Link to="/connexion?redirect=/gerer" className="mt-5 inline-flex rounded-full bg-[#0F9F6E] px-4 py-2 text-sm font-extrabold text-white">
          {tCommunityExtra(currentLanguage, 'loginCta')}
        </Link>
      </section>
    );
  }

  if (!access.isSuperadmin && !access.isManager && access.status === 'none') {
    return (
      <section className="mx-auto max-w-3xl px-4 py-16">
        <Link to="/communautes" className="text-xs font-extrabold text-[#0F9F6E]">{tCommunityExtra(currentLanguage, 'back')}</Link>
        <h1 className="mt-3 text-3xl font-extrabold">{tCommunity(currentLanguage, 'manageTitle')}</h1>
        <p className="mt-3 text-sm leading-relaxed">{tCommunity(currentLanguage, 'needAppointment')}</p>
      </section>
    );
  }

  const locked = !access.isSuperadmin && access.status !== 'active';
  const nextStatus = statusAfterSubmit(
    {
      canCreate: canAct(access, 'canCreate'),
      canEditOwn: canAct(access, 'canEditOwn'),
      canSubmit: canAct(access, 'canSubmit'),
      canArchiveOwn: canAct(access, 'canArchiveOwn'),
      canPublishDirectly: canAct(access, 'canPublishDirectly'),
      canModerateAll: canAct(access, 'canModerateAll'),
    },
    policy,
    locked ? access.status : 'active'
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6 overflow-x-hidden px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/communautes" className="text-xs font-extrabold text-[#0F9F6E]">{tCommunityExtra(currentLanguage, 'back')}</Link>
          <h1 className="mt-2 text-3xl font-extrabold">{tCommunity(currentLanguage, 'manageTitle')}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-nia-gray-mid">{tCommunity(currentLanguage, 'manageLead')}</p>
          <p className="mt-2 text-xs font-bold text-[#7F1D3F]">{access.isSuperadmin ? tCommunityExtra(currentLanguage, 'directHint') : tCommunityExtra(currentLanguage, 'ownOnly')}</p>
        </div>
      </div>
      {locked ? (
        <p className="rounded-2xl bg-[#7F1D3F]/10 p-4 text-sm font-bold text-[#7F1D3F]">
          {access.status === 'revoked' ? tCommunity(currentLanguage, 'revoked') : tCommunity(currentLanguage, 'suspended')}
        </p>
      ) : null}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          [tCommunity(currentLanguage, 'statsManaged'), stats.managed],
          [tCommunity(currentLanguage, 'statsPublished'), stats.published],
          [tCommunity(currentLanguage, 'statsPending'), stats.pending],
          [tCommunity(currentLanguage, 'statsRejected'), stats.rejected],
          [tCommunity(currentLanguage, 'statsArchived'), stats.archived],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-[#0F9F6E]/20 bg-white/80 p-3 dark:bg-black/20">
            <p className="text-[11px] font-extrabold uppercase tracking-wide text-nia-gray-mid">{label}</p>
            <p className="text-2xl font-extrabold text-[#0F9F6E]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-2">
          <button
            type="button"
            disabled={locked || !canAct(access, 'canCreate')}
            onClick={() => {
              setDraft({ ...EMPTY_DRAFT, primary_category_id: activeCategories[0]?.id || '' });
              setTagText('');
            }}
            className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
          >
            {tCommunity(currentLanguage, 'newCard')}
          </button>
          {rows.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setDraft(draftFromListing(item));
                setTagText((item.tags || []).join(', '));
              }}
              className="block w-full rounded-2xl border border-black/10 bg-white/80 p-3 text-left dark:bg-black/20"
            >
              <span className="block font-extrabold">{item.name}</span>
              <span className="text-xs font-bold text-[#7F1D3F]">{statusLabel(currentLanguage, item.status)}</span>
              <Link to={`/communautes/espace/${item.id}`} className="mt-1 block text-xs font-extrabold text-[#0F9F6E]" onClick={(event) => event.stopPropagation()}>
                {tCommunityExtra(currentLanguage, 'openRoom')}
              </Link>
              {item.rejection_reason ? (
                <span className="mt-1 block text-xs leading-relaxed">
                  {tCommunityExtra(currentLanguage, 'rejectionLabel')} : {item.rejection_reason}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        <form
          className="space-y-3 rounded-3xl border border-[#0F9F6E]/20 bg-white/85 p-4 dark:bg-[#13201B]"
          onSubmit={(event) => {
            event.preventDefault();
            void onSave();
          }}
        >
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'name')}
            <input value={draft.name} maxLength={80} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'cover')}
            <input value={draft.cover_url} onChange={(event) => setDraft({ ...draft, cover_url: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'short')}
            <textarea value={draft.short_description} maxLength={180} rows={2} onChange={(event) => setDraft({ ...draft, short_description: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'long')}
            <textarea value={draft.long_description} maxLength={2000} rows={5} onChange={(event) => setDraft({ ...draft, long_description: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-extrabold">
              {tCommunity(currentLanguage, 'platform')}
              <select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as CommunityPlatform })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium">
                {COMMUNITY_PLATFORMS.map((item) => <option key={item} value={item}>{platformLabel(currentLanguage, item)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-extrabold">
              {tCommunity(currentLanguage, 'language')}
              <select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium">
                {COMMUNITY_LANGUAGES.map((item) => <option key={item} value={item}>{item.toUpperCase()}</option>)}
              </select>
            </label>
          </div>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'link')}
            <input
              value={draft.destination_url}
              placeholder="https://chat.whatsapp.com/… ou https://facebook.com/…"
              onChange={(event) => {
                const destination_url = event.target.value;
                const detected = platformFromCommunityLink(destination_url);
                setDraft({ ...draft, destination_url, platform: detected || draft.platform });
              }}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium"
            />
            <span className="mt-1 block font-medium text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'linkHint')}</span>
          </label>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'category')}
            <select value={draft.primary_category_id} onChange={(event) => setDraft({ ...draft, primary_category_id: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium">
              {activeCategories.map((item) => (
                <option key={item.id} value={item.id}>{displayCategoryName(currentLanguage, item.code, item.name)}</option>
              ))}
            </select>
          </label>
          <fieldset className="space-y-1">
            <legend className="text-xs font-extrabold">{tCommunity(currentLanguage, 'secondary')}</legend>
            {activeCategories.filter((item) => item.id !== draft.primary_category_id).map((item) => (
              <label key={item.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={draft.secondary_category_ids.includes(item.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...draft.secondary_category_ids, item.id]
                      : draft.secondary_category_ids.filter((id) => id !== item.id);
                    setDraft({ ...draft, secondary_category_ids: next });
                  }}
                />
                {displayCategoryName(currentLanguage, item.code, item.name)}
              </label>
            ))}
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-extrabold">
              {tCommunity(currentLanguage, 'country')}
              <input value={draft.country_code} maxLength={8} onChange={(event) => setDraft({ ...draft, country_code: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
            </label>
            <label className="block text-xs font-extrabold">
              {tCommunity(currentLanguage, 'organizer')}
              <input value={draft.organizer_name} maxLength={80} onChange={(event) => setDraft({ ...draft, organizer_name: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
            </label>
          </div>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'tags')}
            <input value={tagText} onChange={(event) => setTagText(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          {selectedCategory?.is_sensitive ? (
            <label className="flex items-start gap-2 text-xs leading-relaxed">
              <input type="checkbox" checked={draft.responsible_ack} onChange={(event) => setDraft({ ...draft, responsible_ack: event.target.checked })} />
              {tCommunity(currentLanguage, 'ack')}
            </label>
          ) : null}
          <p className="text-xs text-nia-gray-mid">{tCommunity(currentLanguage, 'noMemberCount')}</p>
          {note ? <p className="text-sm font-bold">{note}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={busy || locked || !canAct(access, 'canEditOwn')} className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40">
              {busy ? tCommunityExtra(currentLanguage, 'working') : tCommunity(currentLanguage, 'draft')}
            </button>
            <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-full border px-4 py-2 text-xs font-extrabold">
              {tCommunity(currentLanguage, 'preview')}
            </button>
            <button
              type="button"
              disabled={busy || locked || !canAct(access, 'canSubmit') || !draft.id && !canAct(access, 'canCreate')}
              onClick={() => void onSubmit()}
              className="rounded-full bg-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-white disabled:opacity-40"
            >
              {nextStatus === 'published' ? tCommunity(currentLanguage, 'directPublish') : tCommunity(currentLanguage, 'submit')}
            </button>
            {draft.id ? (
              <button
                type="button"
                disabled={locked || !canAct(access, 'canArchiveOwn')}
                onClick={() => {
                  void archiveOwnCommunity(draft.id || '').then((error) => {
                    setNote(error ? explainCommunityError(currentLanguage, { message: error }) : tCommunityExtra(currentLanguage, 'archive'));
                    void reload();
                  });
                }}
                className="rounded-full border border-[#7F1D3F]/40 px-4 py-2 text-xs font-extrabold text-[#7F1D3F] disabled:opacity-40"
              >
                {tCommunityExtra(currentLanguage, 'archive')}
              </button>
            ) : null}
          </div>
          {!canAct(access, 'canPublishDirectly') ? <p className="text-xs leading-relaxed text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'policyHint')}</p> : null}
        </form>
      </div>

      {(access.isSuperadmin || access.canModerateAll) && (
        <section className="space-y-3">
          <h2 className="text-xl font-extrabold">{tCommunity(currentLanguage, 'tabQueue')}</h2>
          {queue.length === 0 ? <p className="text-sm">{tCommunityExtra(currentLanguage, 'queueEmpty')}</p> : null}
          {queue.map((item) => (
            <article key={item.id} className="rounded-2xl border p-3">
              <p className="font-extrabold">{item.name}</p>
              <p className="text-xs">{item.short_description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rounded-full bg-[#0F9F6E] px-3 py-1.5 text-xs font-extrabold text-white" onClick={() => void moderateCommunity(item.id, 'published', '').then(() => reload())}>
                  {tCommunity(currentLanguage, 'approve')}
                </button>
                <button type="button" className="rounded-full bg-[#7F1D3F] px-3 py-1.5 text-xs font-extrabold text-white" onClick={() => setRejectId(item.id)}>
                  {tCommunity(currentLanguage, 'reject')}
                </button>
              </div>
            </article>
          ))}
          {rejectId ? (
            <div className="space-y-2 rounded-2xl bg-[#7F1D3F]/10 p-3">
              <textarea value={rejectNote} onChange={(event) => setRejectNote(event.target.value)} rows={3} className="w-full rounded-xl border p-2 text-sm" placeholder={tCommunity(currentLanguage, 'reason')} />
              <button
                type="button"
                className="rounded-full bg-[#7F1D3F] px-3 py-1.5 text-xs font-extrabold text-white"
                onClick={() => {
                  void moderateCommunity(rejectId, 'rejected', rejectNote).then((error) => {
                    setNote(error ? explainCommunityError(currentLanguage, { message: error }) : tCommunity(currentLanguage, 'reject'));
                    setRejectId('');
                    setRejectNote('');
                    void reload();
                  });
                }}
              >
                {tCommunity(currentLanguage, 'reject')}
              </button>
            </div>
          ) : null}
        </section>
      )}

      <section>
        <h2 className="text-xl font-extrabold">{tCommunityExtra(currentLanguage, 'history')}</h2>
        {audit.length === 0 ? <p className="mt-2 text-sm">{tCommunityExtra(currentLanguage, 'auditEmpty')}</p> : null}
        <ul className="mt-2 space-y-2">
          {audit.map((item) => (
            <li key={item.id} className="rounded-2xl border px-3 py-2 text-xs">
              <span className="font-extrabold">{item.action}</span> — {item.summary}
            </li>
          ))}
        </ul>
      </section>

      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={tCommunityExtra(currentLanguage, 'previewTitle')}
        accent="bordeaux"
        maxWidthClass="max-w-xl"
      >
        <CommunityCard
          preview
          lang={currentLanguage}
          item={{
            id: draft.id || 'preview',
            name: draft.name || tCommunity(currentLanguage, 'name'),
            cover_url: isSafeCoverUrl(draft.cover_url) ? draft.cover_url || null : null,
            short_description: draft.short_description,
            long_description: draft.long_description,
            platform: draft.platform,
            destination_url: draft.destination_url,
            language: draft.language,
            country_code: draft.country_code || null,
            organizer_name: draft.organizer_name || null,
            tags: tagText.split(',').map((item) => item.trim()).filter(Boolean),
            verified: false,
            is_sponsored: false,
            published_at: null,
            category_code: selectedCategory?.code || 'other',
            category_name: selectedCategory?.name || '',
            category_color: selectedCategory?.color || null,
            is_sensitive: Boolean(selectedCategory?.is_sensitive),
            secondary_categories: [],
          }}
        />
      </Modal>
    </div>
  );
};
