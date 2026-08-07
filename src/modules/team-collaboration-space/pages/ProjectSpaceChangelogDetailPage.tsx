import { useEffect, useMemo, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { ProjectSpaceHeader } from '../components/ProjectSpaceHeader'
import { ProjectSpaceSidebar } from '../components/ProjectSpaceSidebar'
import { SectionIterationBumpBadge } from '../components/SectionIterationBumpBadge'
import { SectionIterationRollbackConfirmModal } from '../components/SectionIterationRollbackConfirmModal'
import { SectionIterationTimeline } from '../components/SectionIterationTimeline'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import {
  sectionTypeLabel,
  tcsT,
} from '../i18n/strings'
import type { SectionIterationRecord, SectionType } from '../types/sectionIteration'
import { getSectionIterationRecords, localizeSectionName } from '../utils/sectionIterationSync'
import {
  rollbackSectionIterationRecord,
  SECTION_ITERATION_CHANGED_EVENT,
} from '../utils/appendSectionIterationRecord'

type ProjectSpaceChangelogDetailPageProps = {
  sectionType: SectionType
  sectionId: string
}

export function ProjectSpaceChangelogDetailPage({
  sectionType,
  sectionId,
}: ProjectSpaceChangelogDetailPageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const {
    canViewProjectSpaceMineAndGroups,
    canViewProjectTasks,
    canShowProjectTasksNav,
    canManageCustomRoles,
    canProjectSpaceViewChangelog,
    canProjectSpaceRestoreChangelog,
  } = useTeamCollaborationCapabilities()

  const [refreshEpoch, setRefreshEpoch] = useState(0)
  const [rollbackTarget, setRollbackTarget] = useState<SectionIterationRecord | null>(null)

  const records = useMemo(
    () => getSectionIterationRecords(sectionType, sectionId),
    [sectionType, sectionId, refreshEpoch],
  )

  useEffect(() => {
    const onChange = () => setRefreshEpoch((value) => value + 1)
    window.addEventListener(SECTION_ITERATION_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(SECTION_ITERATION_CHANGED_EVENT, onChange)
  }, [])

  const currentRecord = records.find((record) => record.isCurrent) ?? records[0]

  useEffect(() => {
    if (!canProjectSpaceViewChangelog) {
      tcs.navigate({ view: 'project-space', scope: 'mine' })
    }
  }, [canProjectSpaceViewChangelog, tcs])

  useEffect(() => {
    if (canProjectSpaceViewChangelog && records.length === 0) {
      tcs.navigate({ view: 'project-space-changelog' })
    }
  }, [canProjectSpaceViewChangelog, records.length, tcs])

  if (!canProjectSpaceViewChangelog || !currentRecord) {
    return null
  }

  const sectionName = localizeSectionName(currentRecord, locale)

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={sectionName}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <ProjectSpaceHeader locale={locale} searchQuery="" onSearchQueryChange={() => {}} />

        <div className="tcs-project-space-body">
          <ProjectSpaceSidebar
            locale={locale}
            groups={[]}
            activeGroupId=""
            activeNavTab="changelog"
            showChangelogNav={canProjectSpaceViewChangelog}
            showRolesNav={canManageCustomRoles}
            showTasksNav={canShowProjectTasksNav}
            showMineNav={canViewProjectSpaceMineAndGroups}
            groupCounts={{}}
            onNavTabChange={(tab) => {
              if (tab === 'changelog') {
                tcs.navigate({ view: 'project-space-changelog' })
                return
              }
              if (tab === 'roles') {
                tcs.navigate({ view: 'project-space-roles' })
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

          <section className="tcs-section tcs-project-space-section" aria-labelledby="tcs-changelog-detail-title">
            <div className="tcs-changelog-detail-head">
              <button
                type="button"
                className="tcs-changelog-back-btn"
                onClick={() => tcs.navigate({ view: 'project-space-changelog' })}
              >
                ← {tcsT(locale, 'changelogDetailBack')}
              </button>

              <div className="tcs-changelog-detail-title-row">
                <div>
                  <p className="tcs-changelog-detail-type">{sectionTypeLabel(locale, sectionType)}</p>
                  <h2 id="tcs-changelog-detail-title" className="tcs-section-title">
                    {sectionName}
                  </h2>
                  <p className="tcs-changelog-detail-meta">
                    {tcsT(locale, 'changelogRecordCount').replace('{count}', String(records.length))}
                  </p>
                </div>
                <div className="tcs-changelog-detail-current">
                  <span className="tcs-changelog-version-tag tcs-changelog-version-tag--large">
                    {currentRecord.versionLabel}
                  </span>
                  <SectionIterationBumpBadge
                    locale={locale}
                    bump={currentRecord.bump}
                    requiresMigration={currentRecord.requiresMigration}
                  />
                  {currentRecord.isCurrent ? (
                    <span className="tcs-changelog-current-badge">{tcsT(locale, 'changelogCurrentBadge')}</span>
                  ) : null}
                </div>
              </div>
            </div>

            <SectionIterationTimeline
              locale={locale}
              records={records}
              rollbackable={canProjectSpaceRestoreChangelog}
              onRollback={setRollbackTarget}
            />
          </section>
        </div>
      </div>

      {rollbackTarget ? (
        <SectionIterationRollbackConfirmModal
          locale={locale}
          record={rollbackTarget}
          onCancel={() => setRollbackTarget(null)}
          onConfirm={() => {
            const rolled = rollbackSectionIterationRecord(rollbackTarget.id)
            if (!rolled) return
            setRollbackTarget(null)
            setRefreshEpoch((value) => value + 1)
          }}
        />
      ) : null}
    </section>
  )
}
