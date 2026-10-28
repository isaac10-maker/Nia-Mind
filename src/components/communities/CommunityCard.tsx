import React from 'react';
import { BadgeCheck, ExternalLink, Flag, ShieldAlert } from 'lucide-react';
import {
  displayCategoryName,
  linkKindLabel,
  tCommunity,
  tCommunityExtra,
} from '../../lib/communityI18n';
import type { PublicCommunity } from '../../lib/communityApi';
import { communityLinkFamily, communityLinkKind, hostOf, isSafeHttpsUrl } from '../../lib/communityRules';
import type { LanguageCodeInput } from '../../lib/i18nEngine';

const LANGUAGE_SHORT: Record<string, string> = {
  fr: 'FR',
  en: 'EN',
  es: 'ES',
  de: 'DE',
  zh: 'ZH',
};

function safeColor(value: string | null | undefined): string {
  return value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#0F9F6E';
}

export const CommunityCard: React.FC<{
  item: PublicCommunity;
  lang: LanguageCodeInput;
  onReport?: () => void;
  preview?: boolean;
}> = ({ item, lang, onReport, preview }) => {
  const family = communityLinkFamily(item.destination_url);
  const kind = communityLinkKind(item.destination_url);
  const href = family && isSafeHttpsUrl(item.destination_url) ? item.destination_url : '';
  const accent = family === 'whatsapp' ? '#0F9F6E' : family === 'meta' ? '#7F1D3F' : safeColor(item.category_color);
  const joinLabel = family === 'whatsapp'
    ? tCommunityExtra(lang, 'openWhatsapp')
    : family === 'meta'
      ? tCommunityExtra(lang, 'openMeta')
      : tCommunity(lang, 'join');
  return (
    <article className="min-w-0 overflow-hidden rounded-3xl border border-[#0F9F6E]/20 bg-white/90 shadow-sm dark:border-white/10 dark:bg-[#13201B]">
      <div className="relative h-36 overflow-hidden" style={{ background: `linear-gradient(135deg, ${accent}, #7F1D3F)` }}>
        {item.cover_url && /^https:\/\//i.test(item.cover_url) ? (
          <img
            src={item.cover_url}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-1.5 p-3">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-extrabold text-[#7F1D3F]">
            {linkKindLabel(lang, kind)}
          </span>
          <span className="rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-extrabold text-white">
            {LANGUAGE_SHORT[item.language] || item.language}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="min-w-0 text-lg font-extrabold leading-snug text-nia-gray-dark dark:text-white">{item.name}</h3>
          {item.verified ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#0F9F6E]/15 px-2 py-1 text-[11px] font-extrabold text-[#0F6E4C]">
              <BadgeCheck className="h-3.5 w-3.5" />
              {tCommunity(lang, 'verified')}
            </span>
          ) : null}
        </div>
        <p className="text-xs font-bold uppercase tracking-wide text-[#7F1D3F] dark:text-rose-200">
          {displayCategoryName(lang, item.category_code, item.category_name)}
          {item.country_code ? ` · ${item.country_code}` : ''}
        </p>
        <p className="text-sm leading-relaxed text-nia-gray-mid dark:text-gray-200">{item.short_description}</p>
        {item.long_description ? (
          <details className="text-sm text-nia-gray-dark dark:text-gray-100">
            <summary className="cursor-pointer font-bold text-[#0F9F6E]">{tCommunity(lang, 'preview')}</summary>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{item.long_description}</p>
          </details>
        ) : null}
        {item.organizer_name ? (
          <p className="text-xs font-semibold text-nia-gray-mid dark:text-gray-300">{item.organizer_name}</p>
        ) : null}
        {item.tags?.length ? (
          <ul className="flex flex-wrap gap-1.5">
            {item.tags.map((tag) => (
              <li key={tag} className="rounded-full bg-[#0F9F6E]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F6E4C]">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
        {item.secondary_categories?.length ? (
          <p className="text-[11px] text-nia-gray-mid dark:text-gray-300">
            {item.secondary_categories.map((category) => displayCategoryName(lang, category.code, category.name)).join(' · ')}
          </p>
        ) : null}
        {item.is_sponsored ? (
          <p className="text-[11px] font-extrabold uppercase tracking-wide text-[#7F1D3F]">{tCommunity(lang, 'sponsored')}</p>
        ) : null}
        {item.is_sensitive ? (
          <p className="flex gap-2 rounded-2xl bg-[#7F1D3F]/10 p-3 text-xs leading-relaxed text-[#7F1D3F] dark:text-rose-100">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{tCommunity(lang, 'disclaimer')}</span>
          </p>
        ) : null}
        <p className="text-[11px] leading-relaxed text-nia-gray-mid dark:text-gray-400">{tCommunity(lang, 'notCertified')}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          {preview || !href ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-black/10 px-4 py-2 text-xs font-extrabold text-nia-gray-mid">
              <ExternalLink className="h-3.5 w-3.5" />
              {preview ? tCommunityExtra(lang, 'notPublic') : joinLabel}
            </span>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold text-white shadow-sm ${family === 'meta' ? 'bg-[#7F1D3F]' : 'bg-[#0F9F6E]'}`}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {joinLabel}
            </a>
          )}
          {onReport ? (
            <button
              type="button"
              onClick={onReport}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#7F1D3F]/30 px-4 py-2 text-xs font-extrabold text-[#7F1D3F]"
            >
              <Flag className="h-3.5 w-3.5" />
              {tCommunity(lang, 'report')}
            </button>
          ) : null}
        </div>
        <p className="text-[11px] text-nia-gray-mid dark:text-gray-400">
          {tCommunity(lang, 'openExternal')}
          {hostOf(item.destination_url) ? ` · ${hostOf(item.destination_url)}` : ''}
        </p>
      </div>
    </article>
  );
};
