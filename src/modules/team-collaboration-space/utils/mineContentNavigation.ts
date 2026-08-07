import type { UserContentSourceModule } from '../types/userContent'

export const MINE_CONTENT_NAV_EVENT = 'mine-content-navigate'

export type MineContentNavAction = 'edit' | 'duplicate'

export type MineContentNavDetail = {
  action: MineContentNavAction
  contentKey: string
  module: UserContentSourceModule
}

export function requestMineContentAction(detail: MineContentNavDetail): void {
  const path =
    detail.module === 'scenario-config'
      ? '/scenarios'
      : detail.module === 'skills'
        ? '/skills'
        : detail.module === 'tools'
          ? '/tools'
          : '/agents'
  if (window.location.pathname !== path) {
    window.history.pushState(null, '', path)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
  window.dispatchEvent(
    new CustomEvent<MineContentNavDetail>(MINE_CONTENT_NAV_EVENT, {
      detail,
    }),
  )
}

export function requestMineContentEdit(contentKey: string, module: UserContentSourceModule): void {
  requestMineContentAction({ action: 'edit', contentKey, module })
}

export function requestMineContentDuplicate(contentKey: string, module: UserContentSourceModule): void {
  requestMineContentAction({ action: 'duplicate', contentKey, module })
}
