import type { SpaceFormDraft, SpaceKind, TeamCollaborationSpaceItem } from '../types'
import { buildMembersForSpaceDraft, resolveInvitedMemberAssignments } from './memberInit'

const ACCENT_PALETTE = ['#6366f1', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6']

function nowLabel(): { updatedAtLabelZh: string; updatedAtLabelEn: string } {
  return { updatedAtLabelZh: '刚刚更新', updatedAtLabelEn: 'Updated just now' }
}

export function createTeamSpaceFromDraft(
  draft: SpaceFormDraft,
  allSpaces: TeamCollaborationSpaceItem[],
  existing?: TeamCollaborationSpaceItem,
  spaceKind: SpaceKind = 'team',
  spaceId?: string,
): TeamCollaborationSpaceItem {
  const copySource =
    draft.accessMode === 'copy' && draft.copyFromSpaceId
      ? allSpaces.find((space) => space.id === draft.copyFromSpaceId) ?? null
      : null
  const updated = nowLabel()
  const kind = existing?.kind ?? spaceKind
  const kindCount = allSpaces.filter((space) => space.kind === kind).length

  const invitedAssignments = resolveInvitedMemberAssignments(draft)

  return {
    id: spaceId ?? existing?.id ?? `tcs-${kind}-${Date.now()}`,
    kind,
    nameZh: draft.name,
    nameEn: draft.name,
    descriptionZh: draft.description,
    descriptionEn: draft.description,
    updatedAtLabelZh: updated.updatedAtLabelZh,
    updatedAtLabelEn: updated.updatedAtLabelEn,
    accent:
      existing?.accent ??
      (kind === 'shared' ? '#10b981' : ACCENT_PALETTE[kindCount % ACCENT_PALETTE.length] ?? '#6366f1'),
    accessMode: kind === 'personal' && !existing ? undefined : draft.accessMode,
    copyFromSpaceId:
      kind === 'personal' && !existing
        ? null
        : draft.accessMode === 'copy'
          ? draft.copyFromSpaceId ?? null
          : null,
    permissionsCustomized:
      existing?.permissionsCustomized ??
      (kind !== 'personal' &&
        ((invitedAssignments?.length ?? 0) > 0 || (draft.excludedMemberIds?.length ?? 0) > 0)),
    members:
      existing?.members ??
      (kind === 'personal' ? [] : buildMembersForSpaceDraft(draft.accessMode, copySource, draft)),
    zones: existing?.zones ?? [],
    resourceIds: existing?.resourceIds ?? [],
    resourceCount: existing?.resourceCount ?? 0,
    deadlineStart: 'deadlineStart' in draft ? (draft.deadlineStart ?? null) : (existing?.deadlineStart ?? null),
    deadlineEnd: 'deadlineEnd' in draft ? (draft.deadlineEnd ?? null) : (existing?.deadlineEnd ?? null),
  }
}
