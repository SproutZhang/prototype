import { useEffect, useMemo, useRef, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { RestoreIcon, ViewIcon } from '../../access-control/components/RowActionIcons'
import { ProjectSpaceHeader } from '../components/ProjectSpaceHeader'
import { ProjectSpaceSidebar } from '../components/ProjectSpaceSidebar'
import { SectionIterationBumpBadge } from '../components/SectionIterationBumpBadge'
import { SectionIterationRollbackConfirmModal } from '../components/SectionIterationRollbackConfirmModal'
import { TcsSectionHintIcon } from '../components/TcsSectionHintIcon'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import {
  sectionTypeLabel,
  tcsT,
} from '../i18n/strings'
import type { ChangelogSortKey, SectionIterationRecord, SectionIterationSummary } from '../types/sectionIteration'
import {
  buildSectionIterationSummaries,
  formatChangelogDate,
  getAllSectionIterationRecords,
  getPreviousSectionIterationRecord,
  localizeSectionName,
  readChangelogSortKey,
  sortSectionIterationSummaries,
  writeChangelogSortKey,
} from '../utils/sectionIterationSync'
import {
  rollbackSectionIterationRecord,
  SECTION_ITERATION_CHANGED_EVENT,
} from '../utils/appendSectionIterationRecord'

const SORT_OPTIONS: ChangelogSortKey[] = ['name', 'publishedAt', 'version', 'bumpLevel']

const SORT_LABEL_KEY: Record<
  ChangelogSortKey,
  'changelogSortName' | 'changelogSortPublishedAt' | 'changelogSortVersion' | 'changelogSortBumpLevel'
> = {
  name: 'changelogSortName',
  publishedAt: 'changelogSortPublishedAt',
  version: 'changelogSortVersion',
  bumpLevel: 'changelogSortBumpLevel',
}

export function ProjectSpaceChangelogPage() {
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
  const [sortKey, setSortKey] = useState<ChangelogSortKey>(() => readChangelogSortKey())
  const [refreshEpoch, setRefreshEpoch] = useState(0)
  const [rollbackTarget, setRollbackTarget] = useState<SectionIterationRecord | null>(null)
  const [restoreToast, setRestoreToast] = useState<{ title: string; sub?: string } | null>(null)
  const restoreToastTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    const onChange = () => setRefreshEpoch((value) => value + 1)
    window.addEventListener(SECTION_ITERATION_CHANGED_EVENT, onChange)
    return () => window.removeEventListener(SECTION_ITERATION_CHANGED_EVENT, onChange)
  }, [])

  useEffect(() => {
    if (!canProjectSpaceViewChangelog) {
      tcs.navigate({ view: 'project-space', scope: 'mine' })
    }
  }, [canProjectSpaceViewChangelog, tcs])

  const summaries = useMemo(() => {
    const records = getAllSectionIterationRecords()
    const built = buildSectionIterationSummaries(records)
    return sortSectionIterationSummaries(built, sortKey, locale)
  }, [sortKey, locale, refreshEpoch])

  if (!canProjectSpaceViewChangelog) {
    return null
  }

  const handleSortChange = (next: ChangelogSortKey) => {
    setSortKey(next)
    writeChangelogSortKey(next)
  }

  const showRestoreToast = (title: string, sub?: string) => {
    setRestoreToast({ title, sub: sub?.trim() || undefined })
    if (restoreToastTimerRef.current) window.clearTimeout(restoreToastTimerRef.current)
    restoreToastTimerRef.current = window.setTimeout(() => {
      restoreToastTimerRef.current = undefined
      setRestoreToast(null)
    }, 3200)
  }

  const canRestoreSummary = (summary: SectionIterationSummary) =>
    canProjectSpaceRestoreChangelog &&
    summary.recordCount > 1 &&
    getPreviousSectionIterationRecord(summary.sectionType, summary.sectionId) != null

  const handleRestoreSummary = (summary: SectionIterationSummary) => {
    const previous = getPreviousSectionIterationRecord(summary.sectionType, summary.sectionId)
    if (previous) setRollbackTarget(previous)
  }

  const confirmRollback = () => {
    if (!rollbackTarget) return
    const rolled = rollbackSectionIterationRecord(rollbackTarget.id)
    if (!rolled) return
    setRollbackTarget(null)
    showRestoreToast(
      tcsT(locale, 'resourceIterationRollbackSuccessTitle'),
      tcsT(locale, 'resourceIterationRollbackSuccessSub').replace('{version}', rolled.versionLabel),
    )
  }

  const changelogSection = (
    <section className="tcs-section tcs-project-space-section" aria-labelledby="tcs-changelog-title">
            <div className="tcs-section-head tcs-changelog-section-head">
              <div className="tcs-section-title-row">
                <h2 id="tcs-changelog-title" className="tcs-section-title">
                  {tcsT(locale, 'changelogPageTitle')}
                </h2>
                <TcsSectionHintIcon
                  hintId="tcs-changelog-hint"
                  hint={tcsT(locale, 'changelogPageHint')}
                  ariaLabel={tcsT(locale, 'changelogPageHintAria')}
                />
              </div>
              <div className="tcs-changelog-toolbar">
                <label className="tcs-changelog-sort">
                  <span className="tcs-changelog-sort-label">{tcsT(locale, 'changelogSortLabel')}</span>
                  <select
                    className="tcs-changelog-sort-select"
                    value={sortKey}
                    onChange={(event) => handleSortChange(event.target.value as ChangelogSortKey)}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {tcsT(locale, SORT_LABEL_KEY[option])}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {summaries.length === 0 ? (
              <div className="skills-empty tcs-changelog-empty">{tcsT(locale, 'changelogEmpty')}</div>
            ) : (
              <div className="tcs-changelog-table-wrap">
                <table className="tcs-changelog-table">
                  <thead>
                    <tr>
                      <th scope="col">{tcsT(locale, 'changelogColName')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColType')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColVersion')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColBump')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColPublisher')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColPublishedAt')}</th>
                      <th scope="col">{tcsT(locale, 'changelogColAction')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summaries.map((summary) => (
                      <tr key={`${summary.sectionType}:${summary.sectionId}`}>
                        <td className="tcs-changelog-table-name">{localizeSectionName(summary, locale)}</td>
                        <td>{sectionTypeLabel(locale, summary.sectionType)}</td>
                        <td>
                          <span className="tcs-changelog-version-tag">{summary.currentVersionLabel}</span>
                        </td>
                        <td>
                          <SectionIterationBumpBadge
                            locale={locale}
                            bump={summary.lastBump}
                            requiresMigration={summary.requiresMigration}
                          />
                        </td>
                        <td>{summary.lastPublisherName}</td>
                        <td>{formatChangelogDate(summary.lastPublishedAt, locale)}</td>
                        <td>
                          <div className="tcs-changelog-table-actions">
                            <button
                              type="button"
                              className="ac-row-icon-btn"
                              aria-label={tcsT(locale, 'changelogViewDetail')}
                              title={tcsT(locale, 'changelogViewDetail')}
                              onClick={() => {
                                tcs.navigate({
                                  view: 'project-space-changelog-detail',
                                  sectionType: summary.sectionType,
                                  sectionId: summary.sectionId,
                                })
                              }}
                            >
                              <ViewIcon />
                            </button>
                            {canRestoreSummary(summary) ? (
                              <button
                                type="button"
                                className="ac-row-icon-btn"
                                aria-label={tcsT(locale, 'changelogRestore')}
                                title={tcsT(locale, 'changelogRestore')}
                                onClick={() => handleRestoreSummary(summary)}
                              >
                                <RestoreIcon />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
  )

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcsT(locale, 'projectSpaceNavChangelog')}>
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
              if (tab === 'changelog') return
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

          {changelogSection}
        </div>
      </div>

      {rollbackTarget ? (
        <SectionIterationRollbackConfirmModal
          locale={locale}
          record={rollbackTarget}
          onCancel={() => setRollbackTarget(null)}
          onConfirm={confirmRollback}
        />
      ) : null}

      {restoreToast ? (
        <div className="agents-publish-success-toast tcs-success-toast" role="status" aria-live="polite">
          <span className="agents-publish-success-toast__icon" aria-hidden="true">
            ✓
          </span>
          <div className="agents-publish-success-toast__text">
            <strong className="agents-publish-success-toast__title">{restoreToast.title}</strong>
            {restoreToast.sub ? (
              <span className="agents-publish-success-toast__sub">{restoreToast.sub}</span>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  )
}
