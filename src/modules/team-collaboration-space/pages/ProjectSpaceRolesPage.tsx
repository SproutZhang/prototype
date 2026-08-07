import { useEffect, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { ProjectSpaceHeader } from '../components/ProjectSpaceHeader'
import { ProjectSpaceRolesPanel } from '../components/ProjectSpaceRolesPanel'
import { ProjectSpaceSidebar } from '../components/ProjectSpaceSidebar'
import { TcsSectionHintIcon } from '../components/TcsSectionHintIcon'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { tcsT } from '../i18n/strings'

export function ProjectSpaceRolesPage() {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const {
    canViewProjectSpaceMineAndGroups,
    canViewProjectTasks,
    canShowProjectTasksNav,
    canProjectSpaceViewRoles,
    canProjectSpaceEditRoles,
    canProjectSpaceViewChangelog,
  } = useTeamCollaborationCapabilities()
  const [addRoleFormOpen, setAddRoleFormOpen] = useState(false)

  useEffect(() => {
    if (!canProjectSpaceViewRoles) {
      tcs.navigate({ view: 'project-space', scope: 'mine' })
    }
  }, [canProjectSpaceViewRoles, tcs])

  if (!canProjectSpaceViewRoles) {
    return null
  }

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcsT(locale, 'projectSpaceNavRoles')}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <ProjectSpaceHeader locale={locale} searchQuery="" onSearchQueryChange={() => {}} />

        <div className="tcs-project-space-body">
          <ProjectSpaceSidebar
            locale={locale}
            groups={[]}
            activeGroupId=""
            activeNavTab="roles"
            showRolesNav
            showChangelogNav={canProjectSpaceViewChangelog}
            showTasksNav={canShowProjectTasksNav}
            showMineNav={canViewProjectSpaceMineAndGroups}
            groupCounts={{}}
            onNavTabChange={(tab) => {
              if (tab === 'roles') return
              if (tab === 'changelog') {
                tcs.navigate({ view: 'project-space-changelog' })
                return
              }
              if (tab === 'tasks') {
                tcs.navigate({ view: 'project-space-tasks', tasksScope: 'inbox' })
                return
              }
              tcs.navigate({ view: 'project-space', scope: 'mine' })
            }}
            onGroupSelect={() => {}}
          />

          <section className="tcs-section tcs-project-space-section" aria-labelledby="tcs-project-space-roles-title">
            <div className="tcs-project-space-roles-page-toolbar">
              <div className="tcs-section-head tcs-project-space-roles-section-head">
                <div className="tcs-section-title-row">
                  <h2 id="tcs-project-space-roles-title" className="tcs-section-title">
                    {tcsT(locale, 'spaceRolesManageTitle')}
                  </h2>
                  <TcsSectionHintIcon
                    hintId="tcs-project-space-roles-hint"
                    hint={tcsT(locale, 'projectSpaceRolesHint')}
                    ariaLabel={tcsT(locale, 'projectSpaceRolesHintAria')}
                  />
                </div>
                <p className="tcs-space-roles-intro">{tcsT(locale, 'spaceRolesManageHint')}</p>
              </div>
              {canProjectSpaceEditRoles ? (
                <div className="tcs-project-space-roles-toolbar-actions">
                  <button
                    type="button"
                    className="agents-btn agents-btn-primary"
                    onClick={() => setAddRoleFormOpen(true)}
                  >
                    + {tcsT(locale, 'spaceRoleAdd')}
                  </button>
                </div>
              ) : null}
            </div>

            <ProjectSpaceRolesPanel
              locale={locale}
              customRoles={tcs.projectSpaceCustomRoles}
              builtinRolePermissions={tcs.projectSpaceBuiltinRolePermissions}
              onAddRole={tcs.addProjectSpaceCustomRole}
              onUpdateRole={tcs.updateProjectSpaceCustomRole}
              onUpdateBuiltinRolePermissions={tcs.updateProjectSpaceBuiltinRolePermissions}
              onRemoveRole={tcs.removeProjectSpaceCustomRole}
              canEditRole={canProjectSpaceEditRoles}
              addFormOpen={addRoleFormOpen}
              onAddFormOpenChange={setAddRoleFormOpen}
            />
          </section>
        </div>
      </div>
    </section>
  )
}
