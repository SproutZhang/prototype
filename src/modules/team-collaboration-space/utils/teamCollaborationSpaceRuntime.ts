import type { TeamCollaborationSpaceItem } from '../types'
import { mergePublishCreatedSpaces } from './publishSpaceSync'

type SpacesUpdater = (current: TeamCollaborationSpaceItem[]) => TeamCollaborationSpaceItem[]

let applySpacesUpdate: ((updater: SpacesUpdater) => void) | null = null

export function registerTeamSpacesUpdater(apply: (updater: SpacesUpdater) => void): () => void {
  applySpacesUpdate = apply
  return () => {
    if (applySpacesUpdate === apply) applySpacesUpdate = null
  }
}

/** 发布流程创建空间后，立即同步到已挂载的 TeamCollaborationSpaceProvider */
export function syncPublishCreatedSpacesToTeamStore(): void {
  applySpacesUpdate?.((current) => mergePublishCreatedSpaces(current))
}
