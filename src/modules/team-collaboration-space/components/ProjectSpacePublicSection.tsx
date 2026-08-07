import { useMemo, useState } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { filterPublicSpaceSharedItems, usePublicSpaceSharedSnapshot } from '../hooks/usePublicSpaceSharedContent'
import { localizeProjectGroupName, localizeProjectSpaceItemName, tcsT } from '../i18n/strings'
import type { ProjectGroup, ProjectSpaceItem, TeamCollaborationSpaceItem } from '../types'
import { resolvePublishCreatedSpace } from '../utils/publishSpaceSync'
import { ProjectSpaceCreateCard } from './ProjectSpaceCreateCard'
import { PublicSpaceSharedPanel } from './PublicSpaceSharedPanel'
import { TeamCollaborationSpaceCard } from './TeamCollaborationSpaceCard'
import { TcsSectionHintIcon } from './TcsSectionHintIcon'

type PublicSpaceContentTab = 'projects' | 'shared'

type ProjectSpacePublicSectionProps = {
  locale: AppLocale
  memberId: string
  searchQuery: string
  sectionTitleId: string
  activeGroup: ProjectGroup
  visibleItems: ProjectSpaceItem[]
  gridItemCount: number
  showCreateCard: boolean
  spaces: TeamCollaborationSpaceItem[]
  allSpaces: TeamCollaborationSpaceItem[]
  localizeDescription: (space: TeamCollaborationSpaceItem) => string
  isProjectSpaceExpired: (spaceId: string) => boolean
  onOpenSpace: (spaceId: string) => void
  onCreateProject?: () => void
  onEditProject?: (space: TeamCollaborationSpaceItem) => void
  onMoveProject?: (space: TeamCollaborationSpaceItem) => void
  onDeleteProject?: (space: TeamCollaborationSpaceItem) => void
}

export function ProjectSpacePublicSection({
  locale,
  memberId,
  searchQuery,
  sectionTitleId,
  activeGroup,
  visibleItems,
  gridItemCount,
  showCreateCard,
  spaces,
  allSpaces,
  localizeDescription,
  isProjectSpaceExpired,
  onOpenSpace,
  onCreateProject,
  onEditProject,
  onMoveProject,
  onDeleteProject,
}: ProjectSpacePublicSectionProps) {
  const [publicSpaceTab, setPublicSpaceTab] = useState<PublicSpaceContentTab>('projects')
  const sharedSnapshot = usePublicSpaceSharedSnapshot(locale, memberId)

  const filteredAllPublicSharedItems = useMemo(
    () => filterPublicSpaceSharedItems(sharedSnapshot.all, searchQuery),
    [searchQuery, sharedSnapshot.all],
  )
  const filteredMyPublicSharedItems = useMemo(
    () => filterPublicSpaceSharedItems(sharedSnapshot.mine, searchQuery),
    [searchQuery, sharedSnapshot.mine],
  )

  const publicSharedTabLabel = tcsT(locale, 'projectSpaceMySharedTitle')
  const projectsTabLabel = `${localizeProjectGroupName(activeGroup, locale)} · ${visibleItems.length}`
  const publicProjectsTabHasContent = gridItemCount > 0 || filteredAllPublicSharedItems.length > 0

  return (
    <>
      <div className="tcs-section-head">
        <div className="tcs-section-title-row tcs-project-space-public-tabs-row">
          <div
            className="tcs-tasks-panel-tabs tcs-project-space-public-tabs"
            role="tablist"
            aria-label={tcsT(locale, 'projectSpacePublicTabsAria')}
          >
            <button
              type="button"
              role="tab"
              id="tcs-public-space-tab-projects"
              aria-selected={publicSpaceTab === 'projects'}
              aria-controls="tcs-public-space-panel-projects"
              className={`tcs-tasks-panel-tab${publicSpaceTab === 'projects' ? ' is-active' : ''}`}
              onClick={() => setPublicSpaceTab('projects')}
            >
              <span className="tcs-tasks-panel-tab-label">{projectsTabLabel}</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tcs-public-space-tab-shared"
              aria-selected={publicSpaceTab === 'shared'}
              aria-controls="tcs-public-space-panel-shared"
              className={`tcs-tasks-panel-tab${publicSpaceTab === 'shared' ? ' is-active' : ''}`}
              onClick={() => setPublicSpaceTab('shared')}
            >
              <span className="tcs-tasks-panel-tab-label">
                {publicSharedTabLabel} · {filteredMyPublicSharedItems.length}
              </span>
            </button>
          </div>
          {publicSpaceTab === 'projects' ? (
            <TcsSectionHintIcon
              hintId="tcs-project-space-section-hint"
              hint={tcsT(locale, 'projectSpaceSectionHint')}
              ariaLabel={tcsT(locale, 'projectSpaceSectionHintAria')}
            />
          ) : null}
        </div>
        <h2 id={sectionTitleId} className="sr-only">
          {publicSpaceTab === 'projects' ? projectsTabLabel : publicSharedTabLabel}
        </h2>
      </div>

      {publicSpaceTab === 'shared' ? (
        <div id="tcs-public-space-panel-shared" role="tabpanel" aria-labelledby="tcs-public-space-tab-shared">
          <PublicSpaceSharedPanel
            locale={locale}
            memberId={memberId}
            searchQuery={searchQuery}
            scope="mine"
            showHeader={false}
            embedded
            sharedItems={sharedSnapshot.mine}
          />
        </div>
      ) : (
        <div
          id="tcs-public-space-panel-projects"
          role="tabpanel"
          aria-labelledby="tcs-public-space-tab-projects"
          className="tcs-public-space-projects-panel"
        >
          {!publicProjectsTabHasContent ? (
            <div className="skills-empty tcs-project-space-empty">{tcsT(locale, 'projectSpaceEmptyGroup')}</div>
          ) : (
            <section className="agents-grid skills-cards-grid tcs-grid" aria-label={tcsT(locale, 'gridAriaLabel')}>
              {showCreateCard && onCreateProject ? (
                <ProjectSpaceCreateCard locale={locale} onCreate={onCreateProject} />
              ) : null}
              {visibleItems.map((item) => {
                if (!item.spaceId) return null
                const space =
                  spaces.find((entry) => entry.id === item.spaceId) ??
                  resolvePublishCreatedSpace(item.spaceId, spaces)
                if (!space) return null

                return (
                  <TeamCollaborationSpaceCard
                    key={item.id}
                    locale={locale}
                    item={space}
                    allSpaces={allSpaces}
                    name={localizeProjectSpaceItemName(item, locale)}
                    description={localizeDescription(space)}
                    memberCountLabel={tcsT(locale, 'publicSpaceMemberLabel')}
                    resourceCountLabel={tcsT(locale, 'resourceCount').replace('{count}', String(space.resourceCount))}
                    showExpiredBadge={isProjectSpaceExpired(item.spaceId)}
                    onOpen={() => onOpenSpace(space.id)}
                    onEdit={onEditProject}
                    onRequestMoveOut={onMoveProject}
                    onRequestDelete={onDeleteProject}
                  />
                )
              })}
              <PublicSpaceSharedPanel
                locale={locale}
                memberId={memberId}
                searchQuery={searchQuery}
                scope="all"
                showHeader={false}
                embedded
                inlineInGrid
                sharedItems={sharedSnapshot.all}
              />
            </section>
          )}
        </div>
      )}
    </>
  )
}
