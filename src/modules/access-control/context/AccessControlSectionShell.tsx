import type { ReactNode } from 'react'

import { accessControlSectionTitle } from '../i18n/strings'
import type { AccessControlSection } from '../utils/routing'
import type { AppLocale } from '../../../i18n/homeStrings'

type AccessControlSectionShellProps = {
  section: AccessControlSection
  locale: AppLocale
  sideDrawerOpen: boolean
  workspaceEditDrawerOpen?: boolean
  sideDrawer?: ReactNode
  children: ReactNode
}

export function AccessControlSectionShell({
  section,
  locale,
  sideDrawerOpen,
  workspaceEditDrawerOpen = false,
  sideDrawer,
  children,
}: AccessControlSectionShellProps) {
  return (
    <section
      className="agents-page experience-entry-page skills-page ac-page"
      aria-label={accessControlSectionTitle(locale, section)}
    >
      <div
        className={`ac-page-shell${sideDrawerOpen ? ' ac-page-shell--role-drawer-open' : ''}${workspaceEditDrawerOpen ? ' ac-page-shell--workspace-edit-drawer-open' : ''}`}
      >
        {sideDrawer}
        <div className="agents-page-main experience-entry-page-main skills-page-main ac-page-main ac-page-shell-main">
          {children}
        </div>
      </div>
    </section>
  )
}
