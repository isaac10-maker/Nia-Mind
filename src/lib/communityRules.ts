export const COMMUNITY_STATUSES = [
  'draft',
  'pending',
  'published',
  'rejected',
  'suspended',
  'archived',
] as const;

export type CommunityStatus = (typeof COMMUNITY_STATUSES)[number];

export const COMMUNITY_PLATFORMS = [
  'whatsapp_group',
  'whatsapp_channel',
  'facebook_page',
  'facebook_group',
  'other',
] as const;

export type CommunityPlatform = (typeof COMMUNITY_PLATFORMS)[number];

export const COMMUNITY_LANGUAGES = ['fr', 'en', 'es', 'de', 'zh'] as const;

export interface ManagerPermissions {
  canCreate: boolean;
  canEditOwn: boolean;
  canSubmit: boolean;
  canArchiveOwn: boolean;
  canPublishDirectly: boolean;
  canModerateAll: boolean;
}

export interface CommunityPolicy {
  requireApproval: boolean;
  revalidateOnMajorEdit: boolean;
  extraHosts: string[];
}

export const DEFAULT_MANAGER_PERMISSIONS: ManagerPermissions = {
  canCreate: true,
  canEditOwn: true,
  canSubmit: true,
  canArchiveOwn: false,
  canPublishDirectly: false,
  canModerateAll: false,
};

const SOCIAL_HOSTS = [
  'chat.whatsapp.com',
  'whatsapp.com',
  'www.whatsapp.com',
  'wa.me',
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'fb.com',
  'fb.me',
  'm.me',
  'instagram.com',
  'www.instagram.com',
  'threads.net',
  'www.threads.net',
];

const WHATSAPP_HOSTS = ['chat.whatsapp.com', 'whatsapp.com', 'www.whatsapp.com', 'wa.me'];
const FACEBOOK_HOSTS = ['facebook.com', 'www.facebook.com', 'm.facebook.com', 'fb.com', 'fb.me', 'm.me'];

export function visitorCanSeeCommunity(status: string): boolean {
  return status === 'published';
}

export function standardUserCanMutate(): boolean {
  return false;
}

export function hostOf(raw: string): string | null {
  const match = raw.trim().match(/^https:\/\/([^\/:?#]+)/i);
  return match ? match[1].toLowerCase() : null;
}

export function isSafeHttpsUrl(raw: string): boolean {
  const value = (raw || '').trim();
  if (!value || value.length > 500) return false;
  if (!/^https:\/\//i.test(value)) return false;
  if (/javascript\s*:|data\s*:|vbscript\s*:|file\s*:/i.test(value)) return false;
  if (/^https:\/\/[^/]*@/i.test(value)) return false;
  return Boolean(hostOf(value));
}

export function isAllowedDestination(
  raw: string,
  platform: CommunityPlatform,
  extraHosts: string[] = []
): boolean {
  if (!isSafeHttpsUrl(raw)) return false;
  const host = hostOf(raw);
  if (!host) return false;
  const extras = extraHosts.map((item) => item.toLowerCase());
  if (platform === 'whatsapp_group' || platform === 'whatsapp_channel') {
    return WHATSAPP_HOSTS.includes(host);
  }
  if (platform === 'facebook_page' || platform === 'facebook_group') {
    return FACEBOOK_HOSTS.includes(host);
  }
  return SOCIAL_HOSTS.includes(host) || extras.includes(host);
}

export function isSafeCoverUrl(raw: string): boolean {
  if (!raw.trim()) return true;
  return isSafeHttpsUrl(raw);
}

export function containsUnsafeText(value: string): boolean {
  return /<\s*\/?\s*(script|iframe|object|embed|svg|math|style)\b|javascript\s*:|vbscript\s*:|data\s*:\s*text\/html/i.test(
    value
  );
}

export function canAppointManager(actorIsSuperAdmin: boolean, targetAccountExists: boolean): boolean {
  return actorIsSuperAdmin && targetAccountExists;
}

export function managerIsOperable(status: string): boolean {
  return status === 'active';
}

export function canManagerTouch(
  permissions: ManagerPermissions,
  status: string,
  action: 'create' | 'edit' | 'submit' | 'archive'
): boolean {
  if (!managerIsOperable(status)) return false;
  if (action === 'create') return permissions.canCreate;
  if (action === 'edit') return permissions.canEditOwn;
  if (action === 'submit') return permissions.canSubmit;
  return permissions.canArchiveOwn;
}

export function statusAfterSubmit(
  permissions: ManagerPermissions,
  policy: CommunityPolicy,
  managerStatus = 'active'
): 'pending' | 'published' | null {
  if (!permissions.canSubmit || !managerIsOperable(managerStatus)) return null;
  if (permissions.canPublishDirectly || !policy.requireApproval) return 'published';
  return 'pending';
}

export function statusAfterMajorEdit(
  current: CommunityStatus,
  permissions: ManagerPermissions,
  policy: CommunityPolicy
): CommunityStatus {
  if (current !== 'published') return current === 'rejected' ? 'draft' : current;
  if (!policy.revalidateOnMajorEdit) return 'published';
  if (permissions.canPublishDirectly) return 'published';
  return 'pending';
}

export function superAdminTransition(
  from: CommunityStatus,
  to: CommunityStatus
): boolean {
  if (from === to) return true;
  const allowed: Record<CommunityStatus, CommunityStatus[]> = {
    draft: ['pending', 'archived'],
    pending: ['published', 'rejected', 'suspended', 'archived'],
    published: ['suspended', 'archived', 'pending'],
    rejected: ['pending', 'archived', 'draft'],
    suspended: ['published', 'archived', 'pending'],
    archived: ['draft', 'pending'],
  };
  return allowed[from].includes(to);
}

export function managerCannotSelfPromote(): boolean {
  return true;
}

export function sensitiveCategoryNeedsAck(isSensitive: boolean, acknowledged: boolean): boolean {
  return isSensitive && !acknowledged;
}
