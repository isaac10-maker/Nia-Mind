import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { communityErrorMessage, tCommunity, tCommunityExtra } from '../src/lib/communityI18n';
import {
  COMMUNITY_STATUSES,
  DEFAULT_MANAGER_PERMISSIONS,
  canAppointManager,
  containsUnsafeText,
  communityLinkFamily,
  communityLinkKind,
  isAllowedDestination,
  platformFromCommunityLink,
  managerCannotSelfPromote,
  sensitiveCategoryNeedsAck,
  standardUserCanMutate,
  statusAfterMajorEdit,
  statusAfterSubmit,
  superAdminTransition,
  visitorCanSeeCommunity,
} from '../src/lib/communityRules';
import {
  canPostInCommunity,
  canReadCommunityRoom,
  composeCommunityPoster,
  inviteGrantsManagerRights,
  isSafePosterSvg,
  scheduledPostIsDue,
} from '../src/lib/communityAgent';
import { sanitizeInternalRedirect } from '../src/lib/securityEngine';

const sql = readFileSync('supabase/migrations/20261028100000_communities_and_managers.sql', 'utf8');
const api = readFileSync('src/lib/communityApi.ts', 'utf8');
const app = readFileSync('src/App.tsx', 'utf8');
const traffic = readFileSync('src/lib/platformControls.ts', 'utf8');

const policyOn = { requireApproval: true, revalidateOnMajorEdit: true, extraHosts: [] };
const policyOff = { requireApproval: false, revalidateOnMajorEdit: false, extraHosts: ['t.me'] };

describe('Communautés — permissions, workflow, and public safety', () => {
  it('shows visitors only a published listing', () => {
    expect(COMMUNITY_STATUSES.filter(visitorCanSeeCommunity)).toEqual(['published']);
    expect(standardUserCanMutate()).toBe(false);
  });

  it('rejects dangerous links and accepts only the intended hosts', () => {
    expect(isAllowedDestination('javascript:alert(1)', 'other')).toBe(false);
    expect(isAllowedDestination('data:text/html,hi', 'facebook_page')).toBe(false);
    expect(isAllowedDestination('https://evil.example/group', 'whatsapp_group')).toBe(false);
    expect(isAllowedDestination('https://user@chat.whatsapp.com/abc', 'whatsapp_group')).toBe(false);
    expect(isAllowedDestination('https://chat.whatsapp.com/abc', 'whatsapp_group')).toBe(true);
    expect(isAllowedDestination('https://wa.me/22600000000', 'whatsapp_group')).toBe(true);
    expect(isAllowedDestination('https://whatsapp.com/channel/0029', 'whatsapp_channel')).toBe(true);
    expect(isAllowedDestination('https://facebook.com/groups/1', 'facebook_group')).toBe(true);
    expect(isAllowedDestination('https://www.instagram.com/nia.mind', 'other')).toBe(true);
    expect(isAllowedDestination('https://m.me/niamind', 'other')).toBe(true);
    expect(isAllowedDestination('https://www.threads.net/@nia', 'other')).toBe(true);
    expect(isAllowedDestination('https://l.facebook.com/l.php?u=https://evil.example', 'facebook_page')).toBe(false);
    expect(communityLinkFamily('https://api.whatsapp.com/send?phone=22600000000')).toBe('whatsapp');
    expect(communityLinkFamily('https://www.facebook.com/groups/ecoute')).toBe('meta');
    expect(communityLinkKind('https://www.facebook.com/groups/ecoute')).toBe('facebook_group');
    expect(communityLinkKind('https://whatsapp.com/channel/0029')).toBe('whatsapp_channel');
    expect(platformFromCommunityLink('https://instagram.com/nia')).toBe('other');
    expect(platformFromCommunityLink('https://chat.whatsapp.com/AbCd')).toBe('whatsapp_group');
    expect(isAllowedDestination('https://t.me/nia', 'other', ['t.me'])).toBe(true);
    expect(isAllowedDestination('https://t.me/nia', 'whatsapp_group', ['t.me'])).toBe(false);
    expect(containsUnsafeText('<script>alert(1)</script>')).toBe(true);
  });

  it('appoints only an existing account and never lets a manager self-promote', () => {
    expect(canAppointManager(true, true)).toBe(true);
    expect(canAppointManager(true, false)).toBe(false);
    expect(canAppointManager(false, true)).toBe(false);
    expect(managerCannotSelfPromote()).toBe(true);
  });

  it('keeps publication behind review unless a real permission or policy allows it', () => {
    expect(statusAfterSubmit(DEFAULT_MANAGER_PERMISSIONS, policyOn)).toBe('pending');
    expect(statusAfterSubmit(DEFAULT_MANAGER_PERMISSIONS, policyOn, 'suspended')).toBe(null);
    expect(statusAfterSubmit({ ...DEFAULT_MANAGER_PERMISSIONS, canPublishDirectly: true }, policyOn)).toBe('published');
    expect(statusAfterSubmit(DEFAULT_MANAGER_PERMISSIONS, policyOff)).toBe('published');
    expect(statusAfterSubmit({ ...DEFAULT_MANAGER_PERMISSIONS, canSubmit: false }, policyOff)).toBe(null);
    expect(statusAfterMajorEdit('published', DEFAULT_MANAGER_PERMISSIONS, policyOn)).toBe('pending');
    expect(statusAfterMajorEdit('published', { ...DEFAULT_MANAGER_PERMISSIONS, canPublishDirectly: true }, policyOn)).toBe('published');
    expect(statusAfterMajorEdit('rejected', DEFAULT_MANAGER_PERMISSIONS, policyOn)).toBe('draft');
    expect(superAdminTransition('pending', 'published')).toBe(true);
    expect(superAdminTransition('draft', 'published')).toBe(false);
    expect(sensitiveCategoryNeedsAck(true, false)).toBe(true);
    expect(sensitiveCategoryNeedsAck(true, true)).toBe(false);
  });

  it('locks the database behind RLS, revoked grants, and admin-only appointment', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('force row level security');
    expect(sql).not.toContain('disable row level security');
    expect(sql).toContain('revoke all on table public.communities from public, anon, authenticated');
    const rooms = readFileSync(new URL('../supabase/migrations/20261028150000_community_rooms_invites.sql', import.meta.url), 'utf8');
    expect(rooms).toContain('revoke all on function public.create_community_invite(uuid, integer, integer) from public, anon');
    expect(rooms).toContain('revoke all on function public.accept_community_invite(text) from public, anon');
    expect(rooms).toContain('grant execute on function public.get_community_room(uuid) to authenticated');
    expect(rooms).not.toContain('gen_random_bytes');
    expect(rooms).toContain('discussion_open boolean not null default false');
    expect(sql).toContain('using (false)');
    expect(sql).toContain("raise exception 'COMMUNITY_USER_NOT_FOUND'");
    expect(sql).toContain('email_confirmed_at is not null');
    expect(sql).toContain("if not public.is_admin() then raise exception 'COMMUNITY_FORBIDDEN'; end if;");
    expect(sql).not.toMatch(/insert into auth\.users/i);
    expect(sql).not.toMatch(/journal_entries|questionnaire|listening_requests|mood_entries/i);
    expect(sql).toContain('javascript\\s*:');
    expect(sql).toContain("'/communautes'");
  });

  it('does not expose a secret or a direct table write in the client', () => {
    expect(api).not.toContain('service_role');
    expect(api).not.toContain('.from(');
    expect(api).toContain("callRpc<string>('save_community'");
    expect(app).toContain('path="/communautes"');
    expect(app).toContain('path="/gerer"');
    expect(app).toContain('path="communautes"');
    expect(canReadCommunityRoom(false, false)).toBe(false);
    expect(canReadCommunityRoom(true, false)).toBe(true);
    expect(canPostInCommunity(false, true, false)).toBe(false);
    expect(canPostInCommunity(true, true, false)).toBe(true);
    expect(canPostInCommunity(false, false, true)).toBe(true);
    expect(inviteGrantsManagerRights()).toBe(false);
    expect(scheduledPostIsDue('2020-01-01T00:00:00Z', new Date('2026-01-01T00:00:00Z'))).toBe(true);
    expect(scheduledPostIsDue('2099-01-01T00:00:00Z', new Date('2026-01-01T00:00:00Z'))).toBe(false);
    const poster = composeCommunityPoster('<script>alert(1)</script>', 'proverb');
    expect(isSafePosterSvg(poster)).toBe(true);
    expect(poster).not.toContain('<script>');
    expect(sanitizeInternalRedirect('/communautes/rejoindre/0123456789abcdef0123456789abcdef')).toBe('/communautes/rejoindre/0123456789abcdef0123456789abcdef');
    expect(sanitizeInternalRedirect('/gerer')).toBe('/gerer');
    expect(sanitizeInternalRedirect('https://evil.example')).toBe('/espace/tableau-de-bord');
    expect(traffic).toContain("'/communautes'");
  });

  it('translates the new directory in every active language', () => {
    const languages = ['fr', 'en', 'es', 'de', 'zh'] as const;
    const seen = new Set(languages.map((lang) => tCommunity(lang, 'nav')));
    expect(seen.size).toBe(5);
    expect(tCommunity('zh-CN', 'join')).toBe(tCommunity('zh', 'join'));
    expect(tCommunityExtra('de', 'invalidUrl')).toContain('javascript:');
    expect(communityErrorMessage('es', 'COMMUNITY_USER_NOT_FOUND')).toMatch(/cuenta/i);
    expect(communityErrorMessage('fr', 'COMMUNITY_FORBIDDEN')).toMatch(/refus/i);
  });
});
