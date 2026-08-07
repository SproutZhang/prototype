export type SharedOnboardingTriggerKind = 'chat' | 'scheduled' | 'form'

export type WorkspaceOnboardingTriggerSelection = 'manual' | 'scheduled' | 'form'

export function mapWorkspaceTriggerToSharedOnboardingTrigger(
  kind: WorkspaceOnboardingTriggerSelection | null | undefined,
): SharedOnboardingTriggerKind {
  if (kind === 'scheduled') return 'scheduled'
  if (kind === 'form') return 'form'
  return 'chat'
}
