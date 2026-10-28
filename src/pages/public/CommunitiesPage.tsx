import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { CommunityCard } from '../../components/communities/CommunityCard';
import { Modal } from '../../components/ui/Modal';
import { useApp } from '../../context/AppContext';
import {
  explainCommunityError,
  loadCommunityCategories,
  loadPublishedCommunities,
  reportCommunity,
  type CommunityCategory,
  type PublicCommunity,
} from '../../lib/communityApi';
import {
  displayCategoryName,
  platformLabel,
  tCommunity,
} from '../../lib/communityI18n';
import { COMMUNITY_LANGUAGES, COMMUNITY_PLATFORMS } from '../../lib/communityRules';
import { OFFICIAL_SLOGAN } from '../../lib/securityEngine';

const PAGE_SIZE = 9;

export const CommunitiesPage: React.FC = () => {
  const { currentLanguage, currentUser } = useApp();
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [rows, setRows] = useState<PublicCommunity[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [platform, setPlatform] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('');
  const [sort, setSort] = useState<'new' | 'relevance'>('new');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportTarget, setReportTarget] = useState<PublicCommunity | null>(null);
  const [reason, setReason] = useState('');
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    void loadCommunityCategories(false).then(setCategories);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOffset(0);
      setSearch(searchInput.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void loadPublishedCommunities({
      search,
      platform,
      categoryId,
      language,
      sort,
      limit: PAGE_SIZE,
      offset,
    }).then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(explainCommunityError(currentLanguage, { message: result.error }));
        setRows([]);
        setHasMore(false);
      } else {
        setError('');
        setRows((current) => (offset === 0 ? result.rows : [...current, ...result.rows]));
        setHasMore(result.rows.length === PAGE_SIZE);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [search, platform, categoryId, language, sort, offset, currentLanguage]);

  const proposeTo = currentUser ? '/gerer' : '/connexion?redirect=/gerer';

  return (
    <div className="mx-auto max-w-7xl space-y-8 overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-[2rem] border border-[#0F9F6E]/20 bg-gradient-to-br from-white via-[#F3FBF6] to-[#F8E8EE] p-6 shadow-sm dark:border-white/10 dark:from-[#13201B] dark:via-[#101815] dark:to-[#2A1520] sm:p-8">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#0F9F6E]">{tCommunity(currentLanguage, 'kicker')}</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-extrabold leading-tight text-nia-gray-dark dark:text-white sm:text-4xl">
          {tCommunity(currentLanguage, 'title')}
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-nia-gray-mid dark:text-gray-200 sm:text-base">
          {tCommunity(currentLanguage, 'lead')}
        </p>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-[#7F1D3F] dark:text-rose-200">
          {OFFICIAL_SLOGAN} · Écouter • Comprendre • Avancer
        </p>
        <p className="mt-3 max-w-3xl text-xs leading-relaxed text-nia-gray-mid dark:text-gray-300">
          {tCommunity(currentLanguage, 'noMemberCount')}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to={proposeTo}
            className="inline-flex items-center gap-2 rounded-full bg-[#7F1D3F] px-4 py-2 text-sm font-extrabold text-white"
          >
            <Users className="h-4 w-4" />
            {tCommunity(currentLanguage, 'propose')}
          </Link>
          {currentUser ? (
            <Link
              to="/gerer"
              className="inline-flex items-center rounded-full border border-[#0F9F6E]/40 px-4 py-2 text-sm font-extrabold text-[#0F6E4C]"
            >
              {tCommunity(currentLanguage, 'manageTitle')}
            </Link>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 rounded-3xl border border-black/5 bg-white/80 p-4 dark:border-white/10 dark:bg-black/20 md:grid-cols-2 xl:grid-cols-5">
        <label className="xl:col-span-2">
          <span className="sr-only">{tCommunity(currentLanguage, 'search')}</span>
          <span className="flex items-center gap-2 rounded-2xl border border-[#0F9F6E]/25 px-3 py-2">
            <Search className="h-4 w-4 text-[#0F9F6E]" />
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={tCommunity(currentLanguage, 'search')}
              className="w-full bg-transparent text-sm outline-none"
            />
          </span>
        </label>
        <select
          aria-label={tCommunity(currentLanguage, 'allCategories')}
          value={categoryId}
          onChange={(event) => {
            setOffset(0);
            setCategoryId(event.target.value);
          }}
          className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm dark:bg-[#13201B]"
        >
          <option value="">{tCommunity(currentLanguage, 'allCategories')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {displayCategoryName(currentLanguage, category.code, category.name)}
            </option>
          ))}
        </select>
        <select
          aria-label={tCommunity(currentLanguage, 'allPlatforms')}
          value={platform}
          onChange={(event) => {
            setOffset(0);
            setPlatform(event.target.value);
          }}
          className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm dark:bg-[#13201B]"
        >
          <option value="">{tCommunity(currentLanguage, 'allPlatforms')}</option>
          {COMMUNITY_PLATFORMS.map((item) => (
            <option key={item} value={item}>
              {platformLabel(currentLanguage, item)}
            </option>
          ))}
        </select>
        <select
          aria-label={tCommunity(currentLanguage, 'allLanguages')}
          value={language}
          onChange={(event) => {
            setOffset(0);
            setLanguage(event.target.value);
          }}
          className="rounded-2xl border border-black/10 bg-white px-3 py-2 text-sm dark:bg-[#13201B]"
        >
          <option value="">{tCommunity(currentLanguage, 'allLanguages')}</option>
          {COMMUNITY_LANGUAGES.map((item) => (
            <option key={item} value={item}>
              {item.toUpperCase()}
            </option>
          ))}
        </select>
        <div className="flex gap-2 md:col-span-2 xl:col-span-5">
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setSort('new');
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${sort === 'new' ? 'bg-[#0F9F6E] text-white' : 'bg-black/5'}`}
          >
            {tCommunity(currentLanguage, 'sortNew')}
          </button>
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setSort('relevance');
            }}
            className={`rounded-full px-3 py-1.5 text-xs font-extrabold ${sort === 'relevance' ? 'bg-[#7F1D3F] text-white' : 'bg-black/5'}`}
          >
            {tCommunity(currentLanguage, 'sortRelevant')}
          </button>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-[#7F1D3F]/10 p-4 text-sm font-bold text-[#7F1D3F]">{error}</p> : null}
      {loading && rows.length === 0 ? <p className="text-sm font-bold">{tCommunity(currentLanguage, 'loading')}</p> : null}
      {!loading && rows.length === 0 && !error ? (
        <div className="rounded-3xl border border-dashed border-[#0F9F6E]/40 p-8 text-center">
          <p className="text-lg font-extrabold">{tCommunity(currentLanguage, 'empty')}</p>
          <p className="mt-2 text-sm text-nia-gray-mid">{tCommunity(currentLanguage, 'emptyHint')}</p>
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((item) => (
          <CommunityCard
            key={item.id}
            item={item}
            lang={currentLanguage}
            onReport={() => {
              setReportTarget(item);
              setReason('');
              setReportNote('');
            }}
          />
        ))}
      </div>
      {hasMore ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
            className="rounded-full border border-[#0F9F6E]/40 px-5 py-2 text-sm font-extrabold text-[#0F6E4C]"
          >
            {tCommunity(currentLanguage, 'loadMore')}
          </button>
        </div>
      ) : null}

      <Modal
        isOpen={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        title={tCommunity(currentLanguage, 'reportTitle')}
        subtitle={reportTarget?.name}
        accent="bordeaux"
        footer={
          <>
            <button type="button" onClick={() => setReportTarget(null)} className="rounded-full px-4 py-2 text-xs font-extrabold">
              {tCommunity(currentLanguage, 'reportClose')}
            </button>
            <button
              type="button"
              className="rounded-full bg-[#7F1D3F] px-4 py-2 text-xs font-extrabold text-white"
              onClick={() => {
                if (!reportTarget) return;
                void reportCommunity(reportTarget.id, reason).then((result) => {
                  setReportNote(
                    result.error
                      ? explainCommunityError(currentLanguage, { message: result.error })
                      : tCommunity(currentLanguage, 'reportSent')
                  );
                  if (!result.error) setReason('');
                });
              }}
            >
              {tCommunity(currentLanguage, 'reportSend')}
            </button>
          </>
        }
      >
        <p>{tCommunity(currentLanguage, 'reportHint')}</p>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-black/10 bg-white p-3 text-sm dark:bg-[#13201B]"
        />
        {reportNote ? <p className="text-sm font-bold">{reportNote}</p> : null}
      </Modal>
    </div>
  );
};
