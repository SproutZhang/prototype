export type UserContentKind = 'agent' | 'scenario'

export type UserContentAcquiredVia = 'created' | 'referenced' | 'template'

export type UserContentLifecycleStatus = 'draft' | 'published' | 'frozen'

export type UserContentSourceModule = 'agent-library' | 'scenario-config' | 'skills' | 'tools'

export type UserContentPublishedTarget = {
  groupId?: string
  spaceId: string
  publishedAt: string
  publisherMemberId: string
}

export type UserContentItem = {
  id: string
  contentKey: string
  ownerMemberId: string
  acquiredVia: UserContentAcquiredVia
  lifecycleStatus: UserContentLifecycleStatus
  displayName: string
  desc: string
  meta: string
  tag: string
  category?: 'medical' | 'finance' | 'tech' | 'accounting'
  creatorLabel?: string
  creatorVariant?: 'default' | 'template'
  scopes: UserContentSourceModule[]
  hasUnpublishedChanges?: boolean
  publishedTargets: UserContentPublishedTarget[]
  updatedAt: string
  createdAt: string
}

export type SyncUserContentAgentInput = {
  agent: {
    name: string
    desc: string
    meta: string
    label?: string
    createdBy?: string
    provenance?: 'manual' | 'app-market-template'
  }
  memberId: string
  scope: UserContentSourceModule
  lifecycleStatus: UserContentLifecycleStatus
  hasUnpublishedChanges?: boolean
  publishedTargets?: UserContentPublishedTarget[]
}
