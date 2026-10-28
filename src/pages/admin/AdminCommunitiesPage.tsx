import React, { useEffect, useState } from 'react';
import {
  appointCommunityManager,
  explainCommunityError,
  loadAdminCommunities,
  loadCommunityAudit,
  loadCommunityCategories,
  loadCommunityManagers,
  loadCommunityPolicy,
  loadCommunityReports,
  moderateCommunity,
  resolveCommunityReport,
  saveCommunityCategory,
  saveCommunityPolicy,
  setCommunityFlags,
  setManagerStatus,
  updateManagerPermissions,
  type AdminCommunityRow,
  type CommunityAuditRow,
  type CommunityCategory,
  type CommunityManagerRow,
  type CommunityReportRow,
} from '../../lib/communityApi';
import { statusLabel, tCommunity, tCommunityExtra } from '../../lib/communityI18n';
import {
  DEFAULT_MANAGER_PERMISSIONS,
  superAdminTransition,
  type CommunityStatus,
  type ManagerPermissions,
} from '../../lib/communityRules';
import { useApp } from '../../context/AppContext';

type Tab = 'queue' | 'all' | 'managers' | 'categories' | 'reports' | 'rules';

function managerPermissions(row: CommunityManagerRow): ManagerPermissions {
  return {
    canCreate: row.can_create,
    canEditOwn: row.can_edit_own,
    canSubmit: row.can_submit,
    canArchiveOwn: row.can_archive_own,
    canPublishDirectly: row.can_publish_directly,
    canModerateAll: row.can_moderate_all,
  };
}

export const AdminCommunitiesPage: React.FC = () => {
  const { currentLanguage } = useApp();
  const [tab, setTab] = useState<Tab>('queue');
  const [rows, setRows] = useState<AdminCommunityRow[]>([]);
  const [managers, setManagers] = useState<CommunityManagerRow[]>([]);
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [reports, setReports] = useState<CommunityReportRow[]>([]);
  const [audit, setAudit] = useState<CommunityAuditRow[]>([]);
  const [email, setEmail] = useState('');
  const [permissions, setPermissions] = useState<ManagerPermissions>(DEFAULT_MANAGER_PERMISSIONS);
  const [note, setNote] = useState('');
  const [reason, setReason] = useState('');
  const [policyText, setPolicyText] = useState({ requireApproval: true, revalidateOnMajorEdit: true, hosts: '' });
  const [categoryDraft, setCategoryDraft] = useState({
    name: '',
    description: '',
    sort_order: 12,
    is_active: true,
    is_sensitive: false,
    color: '#0F9F6E',
  });

  const reload = async () => {
    const [all, people, cats, signals, history, policy] = await Promise.all([
      loadAdminCommunities(''),
      loadCommunityManagers(),
      loadCommunityCategories(true),
      loadCommunityReports(),
      loadCommunityAudit(false),
      loadCommunityPolicy(),
    ]);
    setRows(all.rows);
    setManagers(people.rows);
    setCategories(cats);
    setReports(signals.rows);
    setAudit(history.rows);
    if (policy.policy) {
      setPolicyText({
        requireApproval: policy.policy.requireApproval,
        revalidateOnMajorEdit: policy.policy.revalidateOnMajorEdit,
        hosts: policy.policy.extraHosts.join(', '),
      });
    }
  };

  useEffect(() => {
    void reload();
  }, []);

  const run = (work: Promise<string | null>, success: string) => {
    void work.then(async (error) => {
      setNote(error ? explainCommunityError(currentLanguage, { message: error }) : success);
      await reload();
    });
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'queue', label: tCommunity(currentLanguage, 'tabQueue') },
    { id: 'all', label: tCommunity(currentLanguage, 'tabAll') },
    { id: 'managers', label: tCommunity(currentLanguage, 'tabManagers') },
    { id: 'categories', label: tCommunity(currentLanguage, 'tabCategories') },
    { id: 'reports', label: tCommunity(currentLanguage, 'tabReports') },
    { id: 'rules', label: tCommunity(currentLanguage, 'tabRules') },
  ];
  const visibleRows = tab === 'queue' ? rows.filter((item) => item.status === 'pending') : rows;

  return (
    <div className="mx-auto max-w-6xl space-y-5 overflow-x-hidden">
      <header>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{tCommunity(currentLanguage, 'adminTitle')}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-nia-gray-mid">{tCommunity(currentLanguage, 'adminLead')}</p>
        <p className="mt-2 text-xs font-bold text-[#7F1D3F]">{tCommunityExtra(currentLanguage, 'directHint')}</p>
      </header>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-extrabold ${tab === item.id ? 'bg-[#0F9F6E] text-white' : 'bg-black/5'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {note ? <p className="rounded-2xl bg-[#0F9F6E]/10 p-3 text-sm font-bold">{note}</p> : null}

      {tab === 'queue' || tab === 'all' ? (
        <div className="space-y-3">
          {visibleRows.map((item) => (
            <article key={item.id} className="rounded-3xl border border-black/10 bg-white/80 p-4 dark:bg-black/20">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-extrabold">{item.name}</h2>
                  <p className="text-xs font-bold text-[#7F1D3F]">
                    {statusLabel(currentLanguage, item.status)} · {item.category_name} · {item.platform}
                  </p>
                </div>
                <a href={item.destination_url} target="_blank" rel="noopener noreferrer" className="text-xs font-extrabold text-[#0F9F6E]">
                  {tCommunity(currentLanguage, 'join')}
                </a>
              </div>
              <p className="mt-2 text-sm">{item.short_description}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {superAdminTransition(item.status as CommunityStatus, 'published') && item.status !== 'published' ? (
                  <button type="button" className="rounded-full bg-[#0F9F6E] px-3 py-1.5 text-xs font-extrabold text-white" onClick={() => run(moderateCommunity(item.id, 'published', reason), tCommunity(currentLanguage, 'approve'))}>
                    {tCommunity(currentLanguage, 'approve')}
                  </button>
                ) : null}
                {superAdminTransition(item.status as CommunityStatus, 'rejected') ? (
                  <button type="button" className="rounded-full bg-[#7F1D3F] px-3 py-1.5 text-xs font-extrabold text-white" onClick={() => run(moderateCommunity(item.id, 'rejected', reason), tCommunity(currentLanguage, 'reject'))}>
                    {tCommunity(currentLanguage, 'reject')}
                  </button>
                ) : null}
                {superAdminTransition(item.status as CommunityStatus, 'suspended') ? (
                  <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(moderateCommunity(item.id, 'suspended', reason), tCommunity(currentLanguage, 'hide'))}>
                    {tCommunity(currentLanguage, 'hide')}
                  </button>
                ) : null}
                {superAdminTransition(item.status as CommunityStatus, 'archived') ? (
                  <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(moderateCommunity(item.id, 'archived', reason), tCommunityExtra(currentLanguage, 'archive'))}>
                    {tCommunityExtra(currentLanguage, 'archive')}
                  </button>
                ) : null}
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(setCommunityFlags(item.id, !item.verified, item.is_sponsored), item.verified ? tCommunity(currentLanguage, 'unverify') : tCommunity(currentLanguage, 'verify'))}>
                  {item.verified ? tCommunity(currentLanguage, 'unverify') : tCommunity(currentLanguage, 'verify')}
                </button>
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(setCommunityFlags(item.id, item.verified, !item.is_sponsored), item.is_sponsored ? tCommunity(currentLanguage, 'unsponsor') : tCommunity(currentLanguage, 'sponsor'))}>
                  {item.is_sponsored ? tCommunity(currentLanguage, 'unsponsor') : tCommunity(currentLanguage, 'sponsor')}
                </button>
              </div>
            </article>
          ))}
          {visibleRows.length === 0 ? <p className="text-sm">{tCommunityExtra(currentLanguage, 'queueEmpty')}</p> : null}
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'reason')}
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-2xl border p-3 text-sm font-medium" />
          </label>
        </div>
      ) : null}

      {tab === 'managers' ? (
        <div className="space-y-4">
          <form
            className="space-y-3 rounded-3xl border p-4"
            onSubmit={(event) => {
              event.preventDefault();
              void appointCommunityManager(email, permissions).then((result) => {
                setNote(result.error ? explainCommunityError(currentLanguage, { message: result.error }) : tCommunityExtra(currentLanguage, 'appointed'));
                if (!result.error) setEmail('');
                void reload();
              });
            }}
          >
            <label className="block text-xs font-extrabold">
              {tCommunity(currentLanguage, 'appointEmail')}
              <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
            </label>
            {(Object.keys(permissions) as (keyof ManagerPermissions)[]).map((key) => (
              <label key={key} className="flex items-center gap-2 text-xs font-bold">
                <input
                  type="checkbox"
                  checked={permissions[key]}
                  onChange={(event) => setPermissions({ ...permissions, [key]: event.target.checked })}
                />
                {key}
              </label>
            ))}
            <p className="text-xs leading-relaxed text-nia-gray-mid">{tCommunity(currentLanguage, 'needAppointment')}</p>
            <button type="submit" className="rounded-full bg-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-white">{tCommunity(currentLanguage, 'appointBtn')}</button>
          </form>
          {managers.length === 0 ? <p className="text-sm">{tCommunityExtra(currentLanguage, 'managersEmpty')}</p> : null}
          {managers.map((manager) => (
            <article key={manager.user_id} className="rounded-3xl border p-4">
              <p className="font-extrabold">{manager.email}</p>
              <p className="text-xs font-bold uppercase text-[#7F1D3F]">{manager.status}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(setManagerStatus(manager.user_id, 'suspended'), tCommunity(currentLanguage, 'suspend'))}>{tCommunity(currentLanguage, 'suspend')}</button>
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(setManagerStatus(manager.user_id, 'revoked'), tCommunity(currentLanguage, 'revoke'))}>{tCommunity(currentLanguage, 'revoke')}</button>
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(setManagerStatus(manager.user_id, 'active'), tCommunity(currentLanguage, 'restore'))}>{tCommunity(currentLanguage, 'restore')}</button>
              </div>
              <div className="mt-3 grid gap-1 sm:grid-cols-2">
                {(Object.keys(managerPermissions(manager)) as (keyof ManagerPermissions)[]).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={managerPermissions(manager)[key]}
                      onChange={(event) => {
                        const next = { ...managerPermissions(manager), [key]: event.target.checked };
                        run(updateManagerPermissions(manager.user_id, next), tCommunity(currentLanguage, 'saveRules'));
                      }}
                    />
                    {key}
                  </label>
                ))}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'categories' ? (
        <div className="space-y-3">
          <form
            className="grid gap-2 rounded-3xl border p-4 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault();
              run(saveCommunityCategory(categoryDraft), tCommunityExtra(currentLanguage, 'saveCategory'));
            }}
          >
            <input required placeholder={tCommunity(currentLanguage, 'categoryName')} value={categoryDraft.name} onChange={(event) => setCategoryDraft({ ...categoryDraft, name: event.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
            <input placeholder={tCommunity(currentLanguage, 'categoryDesc')} value={categoryDraft.description} onChange={(event) => setCategoryDraft({ ...categoryDraft, description: event.target.value })} className="rounded-xl border px-3 py-2 text-sm" />
            <label className="text-xs font-extrabold">
              {tCommunityExtra(currentLanguage, 'order')}
              <input type="number" value={categoryDraft.sort_order} onChange={(event) => setCategoryDraft({ ...categoryDraft, sort_order: Number(event.target.value) })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
            </label>
            <label className="flex items-center gap-2 text-xs font-extrabold">
              <input type="checkbox" checked={categoryDraft.is_sensitive} onChange={(event) => setCategoryDraft({ ...categoryDraft, is_sensitive: event.target.checked })} />
              {tCommunityExtra(currentLanguage, 'sensitive')}
            </label>
            <button type="submit" className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white">{tCommunity(currentLanguage, 'addCategory')}</button>
          </form>
          {categories.map((category) => (
            <form
              key={category.id}
              className="grid gap-2 rounded-2xl border p-3 sm:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                run(saveCommunityCategory({
                  id: category.id,
                  code: category.code,
                  name: String(data.get('name') || category.name),
                  description: String(data.get('description') || ''),
                  sort_order: Number(data.get('sort_order') || category.sort_order),
                  is_active: data.get('is_active') === 'on',
                  is_sensitive: data.get('is_sensitive') === 'on',
                  color: category.color,
                  icon: category.icon,
                }), tCommunityExtra(currentLanguage, 'saveCategory'));
              }}
            >
              <input name="name" defaultValue={category.name} className="rounded-xl border px-3 py-2 text-sm" />
              <input name="description" defaultValue={category.description} className="rounded-xl border px-3 py-2 text-sm" />
              <input name="sort_order" type="number" defaultValue={category.sort_order} className="rounded-xl border px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-xs font-bold">
                <input name="is_active" type="checkbox" defaultChecked={category.is_active} />
                {tCommunity(currentLanguage, 'categoryActive')}
              </label>
              <label className="flex items-center gap-2 text-xs font-bold">
                <input name="is_sensitive" type="checkbox" defaultChecked={category.is_sensitive} />
                {tCommunityExtra(currentLanguage, 'sensitive')}
              </label>
              <button type="submit" className="rounded-full bg-[#0F9F6E] px-3 py-1.5 text-xs font-extrabold text-white">{tCommunityExtra(currentLanguage, 'saveCategory')}</button>
            </form>
          ))}
        </div>
      ) : null}

      {tab === 'reports' ? (
        <div className="space-y-3">
          {reports.length === 0 ? <p className="text-sm">{tCommunityExtra(currentLanguage, 'reportsEmpty')}</p> : null}
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border p-4">
              <p className="font-extrabold">{report.community_name}</p>
              <p className="text-xs font-bold uppercase text-[#7F1D3F]">{report.status}</p>
              <p className="mt-2 text-sm">{report.reason}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(resolveCommunityReport(report.id, 'dismissed', reason), tCommunityExtra(currentLanguage, 'dismiss'))}>{tCommunityExtra(currentLanguage, 'dismiss')}</button>
                <button type="button" className="rounded-full bg-[#7F1D3F] px-3 py-1.5 text-xs font-extrabold text-white" onClick={() => run(resolveCommunityReport(report.id, 'actioned', reason), tCommunityExtra(currentLanguage, 'actioned'))}>{tCommunityExtra(currentLanguage, 'actioned')}</button>
                <button type="button" className="rounded-full border px-3 py-1.5 text-xs font-extrabold" onClick={() => run(moderateCommunity(report.community_id, 'suspended', reason || report.reason), tCommunity(currentLanguage, 'hide'))}>{tCommunity(currentLanguage, 'hide')}</button>
              </div>
            </article>
          ))}
          <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="w-full rounded-2xl border p-3 text-sm" placeholder={tCommunity(currentLanguage, 'reason')} />
        </div>
      ) : null}

      {tab === 'rules' ? (
        <form
          className="space-y-3 rounded-3xl border p-4"
          onSubmit={(event) => {
            event.preventDefault();
            run(saveCommunityPolicy({
              requireApproval: policyText.requireApproval,
              revalidateOnMajorEdit: policyText.revalidateOnMajorEdit,
              extraHosts: policyText.hosts.split(',').map((item) => item.trim()).filter(Boolean),
            }), tCommunityExtra(currentLanguage, 'savedRules'));
          }}
        >
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={policyText.requireApproval} onChange={(event) => setPolicyText({ ...policyText, requireApproval: event.target.checked })} />
            {tCommunity(currentLanguage, 'requireApproval')}
          </label>
          <label className="flex items-center gap-2 text-sm font-bold">
            <input type="checkbox" checked={policyText.revalidateOnMajorEdit} onChange={(event) => setPolicyText({ ...policyText, revalidateOnMajorEdit: event.target.checked })} />
            {tCommunity(currentLanguage, 'revalidate')}
          </label>
          <label className="block text-xs font-extrabold">
            {tCommunity(currentLanguage, 'extraHosts')}
            <input value={policyText.hosts} onChange={(event) => setPolicyText({ ...policyText, hosts: event.target.value })} className="mt-1 w-full rounded-xl border px-3 py-2 text-sm font-medium" />
          </label>
          <p className="text-xs leading-relaxed text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'hostsHint')}</p>
          <p className="text-xs leading-relaxed text-nia-gray-mid">{tCommunityExtra(currentLanguage, 'policyHint')}</p>
          <button type="submit" className="rounded-full bg-[#0F9F6E] px-4 py-2 text-xs font-extrabold text-white">{tCommunity(currentLanguage, 'saveRules')}</button>
          <ul className="space-y-1 text-xs">
            {audit.slice(0, 8).map((item) => (
              <li key={item.id}>{item.action} — {item.summary}</li>
            ))}
          </ul>
        </form>
      ) : null}
    </div>
  );
};
