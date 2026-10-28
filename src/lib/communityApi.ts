import { communityErrorMessage } from './communityI18n';
import type { CommunityPlatform, CommunityPolicy, ManagerPermissions } from './communityRules';
import type { LanguageCodeInput } from './i18nEngine';
import { supabase } from './supabase';

export interface CommunityAccess {
  authenticated: boolean;
  isSuperadmin: boolean;
  isManager: boolean;
  status: string;
  canCreate: boolean;
  canEditOwn: boolean;
  canSubmit: boolean;
  canArchiveOwn: boolean;
  canPublishDirectly: boolean;
  canModerateAll: boolean;
}

export interface CommunityCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  sort_order: number;
  color: string | null;
  is_active: boolean;
  is_sensitive: boolean;
}

export interface PublicCommunity {
  id: string;
  name: string;
  cover_url: string | null;
  short_description: string;
  long_description: string;
  platform: CommunityPlatform;
  destination_url: string;
  language: string;
  country_code: string | null;
  organizer_name: string | null;
  tags: string[];
  verified: boolean;
  is_sponsored: boolean;
  published_at: string | null;
  category_code: string;
  category_name: string;
  category_color: string | null;
  is_sensitive: boolean;
  secondary_categories: { code: string; name: string }[];
}

export interface ManagedCommunity extends PublicCommunity {
  primary_category_id: string;
  status: string;
  rejection_reason: string | null;
  responsible_ack: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityDraft {
  id?: string;
  name: string;
  cover_url: string;
  short_description: string;
  long_description: string;
  platform: CommunityPlatform;
  destination_url: string;
  primary_category_id: string;
  secondary_category_ids: string[];
  language: string;
  country_code: string;
  organizer_name: string;
  tags: string[];
  responsible_ack: boolean;
}

export interface CommunityManagerRow {
  user_id: string;
  email: string;
  status: string;
  can_create: boolean;
  can_edit_own: boolean;
  can_submit: boolean;
  can_archive_own: boolean;
  can_publish_directly: boolean;
  can_moderate_all: boolean;
  appointed_at: string;
  revoked_at: string | null;
}

export interface CommunityReportRow {
  id: string;
  community_id: string;
  community_name: string;
  reason: string;
  status: string;
  decision_note: string | null;
  created_at: string;
}

export interface CommunityAuditRow {
  id: string;
  action: string;
  target_type: string;
  target_id: string;
  summary: string;
  created_at: string;
}

export interface AdminCommunityRow {
  id: string;
  owner_id: string;
  name: string;
  platform: CommunityPlatform;
  destination_url: string;
  status: string;
  rejection_reason: string | null;
  verified: boolean;
  is_sponsored: boolean;
  short_description: string;
  language: string;
  updated_at: string;
  published_at: string | null;
  category_name: string;
}

const EMPTY_ACCESS: CommunityAccess = {
  authenticated: false,
  isSuperadmin: false,
  isManager: false,
  status: 'none',
  canCreate: false,
  canEditOwn: false,
  canSubmit: false,
  canArchiveOwn: false,
  canPublishDirectly: false,
  canModerateAll: false,
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function explainCommunityError(lang: LanguageCodeInput, error: { message?: string; details?: string } | null): string {
  return communityErrorMessage(lang, `${error?.message || ''} ${error?.details || ''}`);
}

async function callRpc<T>(name: string, args?: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
  if (!supabase) return { data: null, error: 'COMMUNITY_NOT_FOUND' };
  const { data, error } = await supabase.rpc(name, args);
  if (error) return { data: null, error: `${error.message} ${error.details || ''}` };
  return { data: data as T, error: null };
}

export function accessFromPayload(value: unknown): CommunityAccess {
  const row = asRecord(value);
  return {
    authenticated: row.authenticated === true,
    isSuperadmin: row.is_superadmin === true,
    isManager: row.is_manager === true,
    status: String(row.status || 'none'),
    canCreate: row.can_create === true,
    canEditOwn: row.can_edit_own === true,
    canSubmit: row.can_submit === true,
    canArchiveOwn: row.can_archive_own === true,
    canPublishDirectly: row.can_publish_directly === true,
    canModerateAll: row.can_moderate_all === true,
  };
}

export function permissionsPayload(permissions: ManagerPermissions): Record<string, boolean> {
  return {
    can_create: permissions.canCreate,
    can_edit_own: permissions.canEditOwn,
    can_submit: permissions.canSubmit,
    can_archive_own: permissions.canArchiveOwn,
    can_publish_directly: permissions.canPublishDirectly,
    can_moderate_all: permissions.canModerateAll,
  };
}

export async function loadCommunityAccess(): Promise<CommunityAccess> {
  const { data, error } = await callRpc<unknown>('my_community_access');
  if (error || !data) return EMPTY_ACCESS;
  return accessFromPayload(data);
}

export async function loadCommunityCategories(includeInactive = false): Promise<CommunityCategory[]> {
  const { data } = await callRpc<unknown>('list_community_categories', { p_include_inactive: includeInactive });
  return asArray<CommunityCategory>(data).map((item) => ({
    ...item,
    sort_order: Number(item.sort_order) || 0,
    is_active: item.is_active !== false,
    is_sensitive: item.is_sensitive === true,
  }));
}

export async function releaseDueCommunityPosts(): Promise<void> {
  await callRpc<number>('release_due_community_posts');
}

export async function loadPublishedCommunities(query: {
  search?: string;
  platform?: string;
  categoryId?: string;
  language?: string;
  sort?: 'new' | 'relevance';
  limit?: number;
  offset?: number;
}): Promise<{ rows: PublicCommunity[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_published_communities', {
    p_search: query.search || '',
    p_platform: query.platform || '',
    p_category: query.categoryId || null,
    p_language: query.language || '',
    p_sort: query.sort || 'new',
    p_limit: query.limit ?? 9,
    p_offset: query.offset ?? 0,
  });
  return { rows: asArray<PublicCommunity>(data), error };
}

export async function reportCommunity(id: string, reason: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('report_community', { p_id: id, p_reason: reason });
  return { id: data, error };
}

export async function saveCommunity(draft: CommunityDraft): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('save_community', {
    p_payload: {
      id: draft.id || null,
      name: draft.name,
      cover_url: draft.cover_url,
      short_description: draft.short_description,
      long_description: draft.long_description,
      platform: draft.platform,
      destination_url: draft.destination_url,
      primary_category_id: draft.primary_category_id,
      secondary_category_ids: draft.secondary_category_ids,
      language: draft.language,
      country_code: draft.country_code,
      organizer_name: draft.organizer_name,
      tags: draft.tags,
      responsible_ack: draft.responsible_ack,
    },
  });
  return { id: data, error };
}

export async function submitCommunity(id: string): Promise<{ status: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('submit_community', { p_id: id });
  return { status: data, error };
}

export async function archiveOwnCommunity(id: string): Promise<string | null> {
  const { error } = await callRpc<void>('archive_own_community', { p_id: id });
  return error;
}

export async function loadMyCommunities(): Promise<{ rows: ManagedCommunity[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_my_communities');
  return { rows: asArray<ManagedCommunity>(data), error };
}

export async function loadModerationQueue(): Promise<{ rows: AdminCommunityRow[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_moderation_queue');
  return { rows: asArray<AdminCommunityRow>(data), error };
}

export async function loadAdminCommunities(status = ''): Promise<{ rows: AdminCommunityRow[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_communities_for_admin', { p_status: status });
  return { rows: asArray<AdminCommunityRow>(data), error };
}

export async function moderateCommunity(id: string, status: string, note: string): Promise<string | null> {
  const { error } = await callRpc<void>('moderate_community', { p_id: id, p_status: status, p_note: note });
  return error;
}

export async function setCommunityFlags(id: string, verified: boolean, sponsored: boolean): Promise<string | null> {
  const { error } = await callRpc<void>('set_community_flags', {
    p_id: id,
    p_verified: verified,
    p_sponsored: sponsored,
  });
  return error;
}

export async function appointCommunityManager(email: string, permissions: ManagerPermissions): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('appoint_community_manager', {
    p_email: email,
    p_permissions: permissionsPayload(permissions),
  });
  return { id: data, error };
}

export async function setManagerStatus(userId: string, status: 'active' | 'suspended' | 'revoked'): Promise<string | null> {
  const { error } = await callRpc<void>('set_community_manager_status', { p_user_id: userId, p_status: status });
  return error;
}

export async function updateManagerPermissions(userId: string, permissions: ManagerPermissions): Promise<string | null> {
  const { error } = await callRpc<void>('update_community_manager_permissions', {
    p_user_id: userId,
    p_permissions: permissionsPayload(permissions),
  });
  return error;
}

export async function loadCommunityManagers(): Promise<{ rows: CommunityManagerRow[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_community_managers');
  return { rows: asArray<CommunityManagerRow>(data), error };
}

export async function saveCommunityCategory(payload: Partial<CommunityCategory> & { name: string }): Promise<string | null> {
  const { error } = await callRpc<string>('upsert_community_category', {
    p_payload: {
      id: payload.id || null,
      code: payload.code || null,
      name: payload.name,
      description: payload.description || '',
      icon: payload.icon || 'users',
      sort_order: payload.sort_order ?? 100,
      color: payload.color || null,
      is_active: payload.is_active !== false,
      is_sensitive: payload.is_sensitive === true,
    },
  });
  return error;
}

export async function loadCommunityPolicy(): Promise<{ policy: CommunityPolicy | null; error: string | null }> {
  const { data, error } = await callRpc<unknown>('get_community_policy');
  if (error || !data) return { policy: null, error };
  const row = asRecord(data);
  return {
    policy: {
      requireApproval: row.require_approval !== false,
      revalidateOnMajorEdit: row.revalidate_on_major_edit !== false,
      extraHosts: asArray<string>(row.extra_hosts),
    },
    error: null,
  };
}

export async function saveCommunityPolicy(policy: CommunityPolicy): Promise<string | null> {
  const { error } = await callRpc<void>('set_community_policy', {
    p_require_approval: policy.requireApproval,
    p_revalidate: policy.revalidateOnMajorEdit,
    p_extra_hosts: policy.extraHosts,
  });
  return error;
}

export async function loadCommunityReports(): Promise<{ rows: CommunityReportRow[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_community_reports');
  return { rows: asArray<CommunityReportRow>(data), error };
}

export async function resolveCommunityReport(id: string, status: string, note: string): Promise<string | null> {
  const { error } = await callRpc<void>('resolve_community_report', { p_id: id, p_status: status, p_note: note });
  return error;
}

export interface CommunityRoom {
  id: string;
  name: string;
  status: string;
  language: string;
  discussion_open: boolean;
  can_manage: boolean;
  can_post: boolean;
  is_member: boolean;
  participants: number;
  messages: Array<{ id: string; body: string; kind: string; status: string; image_svg: string | null; created_at: string }>;
  scheduled: Array<{ id: string; body: string; poster_kind: string; publish_at: string; status: string }>;
  invites: Array<{ id: string; token: string; expires_at: string; max_uses: number; use_count: number; revoked: boolean }>;
}

export async function loadCommunityRoom(id: string): Promise<{ room: CommunityRoom | null; error: string | null }> {
  const { data, error } = await callRpc<unknown>('get_community_room', { p_id: id });
  if (error || !data) return { room: null, error };
  const row = asRecord(data);
  return {
    room: {
      id: String(row.id || id),
      name: String(row.name || ''),
      status: String(row.status || ''),
      language: String(row.language || 'fr'),
      discussion_open: row.discussion_open === true,
      can_manage: row.can_manage === true,
      can_post: row.can_post === true,
      is_member: row.is_member === true,
      participants: Number(row.participants) || 0,
      messages: asArray(row.messages),
      scheduled: asArray(row.scheduled),
      invites: asArray(row.invites),
    },
    error: null,
  };
}

export async function setCommunityDiscussion(id: string, open: boolean): Promise<string | null> {
  const { error } = await callRpc<void>('set_community_discussion', { p_id: id, p_open: open });
  return error;
}

export async function createCommunityInvite(id: string, hours = 72, maxUses = 40): Promise<{ token: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('create_community_invite', { p_id: id, p_hours: hours, p_max_uses: maxUses });
  return { token: data, error };
}

export async function revokeCommunityInvite(id: string): Promise<string | null> {
  const { error } = await callRpc<void>('revoke_community_invite', { p_invite: id });
  return error;
}

export async function acceptCommunityInvite(token: string): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('accept_community_invite', { p_token: token });
  return { id: data, error };
}

export async function postCommunityMessage(id: string, body: string): Promise<string | null> {
  const { error } = await callRpc<string>('post_community_message', { p_id: id, p_body: body });
  return error;
}

export async function hideCommunityMessage(id: string, hide: boolean): Promise<string | null> {
  const { error } = await callRpc<void>('hide_community_message', { p_message: id, p_hide: hide });
  return error;
}

export async function scheduleCommunityPost(id: string, body: string, publishAt: string, kind: string): Promise<string | null> {
  const { error } = await callRpc<string>('schedule_community_post', {
    p_id: id,
    p_body: body,
    p_publish_at: publishAt,
    p_kind: kind,
  });
  return error;
}

export async function generateCommunityPoster(id: string, text: string, kind: string): Promise<{ svg: string | null; error: string | null }> {
  const { data, error } = await callRpc<string>('generate_community_poster', { p_id: id, p_text: text, p_kind: kind });
  return { svg: data, error };
}

export async function loadCommunityAudit(mine: boolean): Promise<{ rows: CommunityAuditRow[]; error: string | null }> {
  const { data, error } = await callRpc<unknown>('list_community_audit', { p_mine: mine });
  return { rows: asArray<CommunityAuditRow>(data), error };
}
