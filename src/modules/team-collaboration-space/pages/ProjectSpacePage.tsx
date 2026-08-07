import { useEffect, useMemo, useState } from 'react'

import { useLocale } from '../../../i18n/LocaleContext'
import { MineContentPanel } from '../components/MineContentPanel'
import { ProjectSpacePublicSection } from '../components/ProjectSpacePublicSection'
import { ProjectGroupDeleteModal } from '../components/ProjectGroupDeleteModal'
import { ProjectGroupFormModal } from '../components/ProjectGroupFormModal'
import { ProjectMoveOutModal } from '../components/ProjectMoveOutModal'
import { ProjectSpaceCreateCard } from '../components/ProjectSpaceCreateCard'
import { ProjectSpaceHeader } from '../components/ProjectSpaceHeader'
import { ProjectSpaceSidebar } from '../components/ProjectSpaceSidebar'
import { TeamCollaborationSpaceCard } from '../components/TeamCollaborationSpaceCard'
import { TeamCollaborationSpaceFormModal } from '../components/TeamCollaborationSpaceFormModal'
import { TcsSectionHintIcon } from '../components/TcsSectionHintIcon'
import { TcsSpaceDeleteModal } from '../components/TcsSpaceDeleteModal'
import { useTeamCollaborationSpaceStore } from '../context/TeamCollaborationSpaceContext'
import {
  countProjectsInGroup,
  getDefaultProjectGroupId,
} from '../data/projectSpaceSeed'
import { APPROVAL_TASKS_SEED } from '../data/approvalTasksSeed'
import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'
import { useProjectGroups } from '../hooks/useProjectGroups'
import { useProjectSpaceItems } from '../hooks/useProjectSpaceItems'
import {
  localizeProjectGroupName,
  localizeProjectSpaceItemName,
  tcsT,
} from '../i18n/strings'
import type { ProjectGroup, ProjectSpaceItem, SpaceFormDraft, TeamCollaborationSpaceItem } from '../types'
import { applyProjectGroupFormDraft, createProjectGroupFromDraft, filterGroupsForTaskApproval, isPublicProjectGroup, resolveProjectGroupId } from '../utils/projectGroups'
import {
  addProjectGroup,
  getProjectGroupsSnapshot,
  removeProjectGroup,
  updateProjectGroup,
} from '../utils/projectGroupsSync'
import { createProjectSpaceItemFromDraft } from '../utils/projectItems'
import {
  addProjectSpaceItem,
  patchProjectSpaceItem,
  removeProjectSpaceItems,
} from '../utils/projectSpaceItemsSync'
import { registerSpaceProjectGroup } from '../utils/resourceMoveTargets'
import { resolveCurrentMemberId, resolveCurrentRole } from '../utils/currentMember'
import { computeProjectSpacePendingCounts } from '../utils/taskVisibility'
import {
  listPendingRecruitJdReviewTasks,
  subscribeUserInitiatedRequestsSync,
} from '../utils/userInitiatedRequestsSync'

type ProjectSpacePageProps = {
  scope?: 'mine' | 'group'
  groupId?: string
}

export function ProjectSpacePage({ scope = 'mine', groupId }: ProjectSpacePageProps) {
  const { locale } = useLocale()
  const tcs = useTeamCollaborationSpaceStore()
  const {
    canViewProjectSpaceMineAndGroups,
    canViewProjectTasks,
    canShowProjectTasksNav,
    canProjectSpaceCreateSpace,
    canProjectSpaceEditProjects,
    canProjectSpaceConfigureAccess,
    canProjectSpaceManageGroup,
    canProjectSpacePublishContent,
    isAdmin,
    canManageCustomRoles,
    canProjectSpaceViewChangelog,
  } = useTeamCollaborationCapabilities()
  const [searchQuery, setSearchQuery] = useState('')
  const groups = useProjectGroups()
  const projectItems = useProjectSpaceItems()
  const taskFilterGroups = useMemo(() => filterGroupsForTaskApproval(groups), [groups])
  const role = resolveCurrentRole()
  const memberId = resolveCurrentMemberId()
  const [pendingRecruitJdCount, setPendingRecruitJdCount] = useState(
    () => listPendingRecruitJdReviewTasks().length,
  )

  useEffect(() => {
    setPendingRecruitJdCount(listPendingRecruitJdReviewTasks().length)
    return subscribeUserInitiatedRequestsSync(() => {
      setPendingRecruitJdCount(listPendingRecruitJdReviewTasks().length)
    })
  }, [])
  const [editingGroup, setEditingGroup] = useState<ProjectGroup | null>(null)
  const [groupFormOpen, setGroupFormOpen] = useState(false)
  const [deletingGroup, setDeletingGroup] = useState<ProjectGroup | null>(null)
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editingProjectSpace, setEditingProjectSpace] = useState<TeamCollaborationSpaceItem | null>(null)
  const [deletingSpace, setDeletingSpace] = useState<TeamCollaborationSpaceItem | null>(null)
  const [movingProject, setMovingProject] = useState<{
    projectItem: ProjectSpaceItem
    space: TeamCollaborationSpaceItem
  } | null>(null)

  useEffect(() => {
    if (!canViewProjectSpaceMineAndGroups) {
      if (canShowProjectTasksNav) {
        tcs.navigate({ view: 'project-space-tasks', tasksScope: 'inbox' })
      } else if (canManageCustomRoles) {
        tcs.navigate({ view: 'project-space-roles' })
      } else if (canProjectSpaceViewChangelog) {
        tcs.navigate({ view: 'project-space-changelog' })
      }
      return
    }
    const normalizedGroupId = resolveProjectGroupId(groupId, groups)
    if (scope === 'group' && groupId && normalizedGroupId !== groupId) {
      tcs.navigate({ view: 'project-space', scope: 'group', groupId: normalizedGroupId })
      return
    }
    if (scope === 'group' && !groupId) {
      tcs.navigate({ view: 'project-space', scope: 'group', groupId: getDefaultProjectGroupId() })
    }
  }, [
    canManageCustomRoles,
    canProjectSpaceViewChangelog,
    canShowProjectTasksNav,
    canViewProjectSpaceMineAndGroups,
    groupId,
    groups,
    scope,
    tcs,
  ])

  const isMineView = scope === 'mine'

  const resolvedGroupId = resolveProjectGroupId(groupId, groups)
  const activeGroup = groups.find((group) => group.id === resolvedGroupId) ?? groups[0]
  const activeGroupIsPublic = !isMineView && activeGroup != null && isPublicProjectGroup(activeGroup)

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const group of groups) {
      counts[group.id] = countProjectsInGroup(group.id, projectItems)
    }
    return counts
  }, [groups, projectItems])

  const pendingCounts = useMemo(
    () =>
      computeProjectSpacePendingCounts(
        APPROVAL_TASKS_SEED,
        taskFilterGroups.map((group) => group.id),
        role,
        memberId,
        pendingRecruitJdCount,
      ),
    [memberId, pendingRecruitJdCount, role, taskFilterGroups],
  )
  const pendingTaskCount = pendingCounts.total
  const tasksGroupPendingCounts = pendingCounts.byGroup

  const visibleItems = useMemo(() => {
    if (isMineView) return []
    const query = searchQuery.trim().toLowerCase()
    let items = projectItems.filter((item) => item.groupId === activeGroup?.id)

    if (query) {
      items = items.filter((item) => {
        const name = localizeProjectSpaceItemName(item, locale).toLowerCase()
        return name.includes(query)
      })
    }

    return items
  }, [activeGroup?.id, isMineView, locale, projectItems, searchQuery])

  const showCreateCard = canProjectSpaceCreateSpace
  const gridItemCount = visibleItems.length + (showCreateCard ? 1 : 0)

  const editingProjectItem = useMemo(
    () =>
      editingProjectSpace
        ? projectItems.find((item) => item.spaceId === editingProjectSpace.id) ?? null
        : null,
    [editingProjectSpace, projectItems],
  )

  const moveProjectTargets = useMemo(() => {
    if (!movingProject) return []
    return groups
      .filter((group) => group.id !== movingProject.projectItem.groupId)
      .map((group) => ({
        id: group.id,
        name: localizeProjectGroupName(group, locale),
      }))
  }, [groups, locale, movingProject])

  const openMoveProject = (space: TeamCollaborationSpaceItem) => {
    const projectItem = projectItems.find((item) => item.spaceId === space.id)
    if (!projectItem) return
    setMovingProject({ projectItem, space })
  }

  const confirmMoveProject = (targetGroupId: string) => {
    if (!movingProject) return
    patchProjectSpaceItem((item) => item.id === movingProject.projectItem.id, { groupId: targetGroupId })
    setMovingProject(null)
  }

  const sectionTitleId = 'tcs-project-space-group-title'
  const sectionTitle = isMineView
    ? tcsT(locale, 'projectSpaceMineTitle')
    : `${localizeProjectGroupName(activeGroup!, locale)} · ${visibleItems.length}`

  const openCreateProject = () => {
    setEditingProjectSpace(null)
    setProjectFormOpen(true)
  }

  const openEditProject = (item: TeamCollaborationSpaceItem) => {
    setEditingProjectSpace(item)
    setProjectFormOpen(true)
  }

  const closeProjectForm = () => {
    setProjectFormOpen(false)
    setEditingProjectSpace(null)
  }

  const handleProjectFormSubmit = (draft: SpaceFormDraft) => {
    const inPublicGroup = activeGroupIsPublic
    const normalizedDraft: SpaceFormDraft = inPublicGroup
      ? {
          ...draft,
          invitedMemberIds: undefined,
          invitedMemberPreset: undefined,
          accessMode: isAdmin ? draft.accessMode : 'shared',
        }
      : draft

    if (editingProjectSpace) {
      const spaceId = tcs.submitForm(normalizedDraft, { editSpaceId: editingProjectSpace.id })
      if (!spaceId) return
      patchProjectSpaceItem((item) => item.spaceId === spaceId, {
        nameZh: normalizedDraft.name,
        nameEn: normalizedDraft.name,
        deadlineStart: normalizedDraft.deadlineStart ?? null,
        deadlineEnd: normalizedDraft.deadlineEnd ?? null,
      })
      closeProjectForm()
      return
    }

    const targetGroupId = activeGroup?.id ?? resolvedGroupId
    const spaceId = tcs.submitForm(normalizedDraft, { kind: 'team', forceKind: true })
    if (!spaceId) return

    const groupItemCount = projectItems.filter((item) => item.groupId === targetGroupId).length
    const created = createProjectSpaceItemFromDraft(normalizedDraft, targetGroupId, spaceId, groupItemCount)
    registerSpaceProjectGroup(spaceId, targetGroupId)
    addProjectSpaceItem(created)
    closeProjectForm()
  }

  const openEditGroup = (group: ProjectGroup) => {
    setEditingGroup(group)
    setGroupFormOpen(true)
  }

  const openCreateGroup = () => {
    setEditingGroup(null)
    setGroupFormOpen(true)
  }

  const closeGroupForm = () => {
    setGroupFormOpen(false)
    setEditingGroup(null)
  }

  const confirmDeleteGroup = () => {
    if (!deletingGroup) return
    const deletedId = deletingGroup.id
    removeProjectGroup(deletedId)
    removeProjectSpaceItems((item) => item.groupId === deletedId)
    if (deletedId === resolvedGroupId) {
      const remaining = getProjectGroupsSnapshot()
      const nextGroupId = remaining[0]?.id ?? getDefaultProjectGroupId()
      tcs.navigate({ view: 'project-space', scope: 'group', groupId: nextGroupId })
    }
    setDeletingGroup(null)
  }

  const getGroupCapabilities = (group: ProjectGroup) => {
    if (isPublicProjectGroup(group)) {
      return {
        canEdit: isAdmin,
        canDelete: false,
        editMenuLabelKey: 'projectSpaceGroupMenuAccess' as const,
      }
    }
    return {
      canEdit: canProjectSpaceManageGroup,
      canDelete: canProjectSpaceManageGroup,
      editMenuLabelKey: 'cardMenuEdit' as const,
    }
  }

  const editingGroupIsPublic = editingGroup != null && isPublicProjectGroup(editingGroup)

  if (!canViewProjectSpaceMineAndGroups) {
    return null
  }

  return (
    <section className="agents-page experience-entry-page skills-page tcs-page" aria-label={tcsT(locale, 'projectSpaceTitle')}>
      <div className="agents-page-main experience-entry-page-main skills-page-main tcs-page-main">
        <ProjectSpaceHeader
          locale={locale}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        <div className="tcs-project-space-body">
          <ProjectSpaceSidebar
            locale={locale}
            groups={groups}
            activeGroupId={activeGroup?.id ?? getDefaultProjectGroupId()}
            activeNavTab="mine"
            projectSpaceViewMode={isMineView ? 'mine' : 'group'}
            groupCounts={groupCounts}
            pendingTaskCount={pendingTaskCount}
            tasksGroupPendingCounts={tasksGroupPendingCounts}
            onNavTabChange={(tab) => {
              if (tab === 'roles') {
                tcs.navigate({ view: 'project-space-roles' })
                return
              }
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
            onGroupSelect={(nextGroupId) => {
              tcs.navigate({ view: 'project-space', scope: 'group', groupId: nextGroupId })
            }}
            onEditGroup={openEditGroup}
            onDeleteGroup={setDeletingGroup}
            onCreateGroup={canProjectSpaceManageGroup ? openCreateGroup : undefined}
            getGroupCapabilities={getGroupCapabilities}
            showRolesNav={canManageCustomRoles}
            showChangelogNav={canProjectSpaceViewChangelog}
            showTasksNav={canShowProjectTasksNav}
            showMineNav={canViewProjectSpaceMineAndGroups}
          />

          <section className="tcs-section tcs-project-space-section" aria-labelledby={sectionTitleId}>
            {!isMineView && activeGroupIsPublic && activeGroup ? (
              <ProjectSpacePublicSection
                locale={locale}
                memberId={memberId}
                searchQuery={searchQuery}
                sectionTitleId={sectionTitleId}
                activeGroup={activeGroup}
                visibleItems={visibleItems}
                gridItemCount={gridItemCount}
                showCreateCard={showCreateCard}
                spaces={tcs.spaces}
                allSpaces={tcs.spaces}
                localizeDescription={tcs.localizeDescription}
                isProjectSpaceExpired={tcs.isProjectSpaceExpired}
                onOpenSpace={(spaceId) => tcs.navigate({ view: 'space', spaceId })}
                onCreateProject={canProjectSpaceCreateSpace ? openCreateProject : undefined}
                onEditProject={canProjectSpaceEditProjects ? openEditProject : undefined}
                onMoveProject={canProjectSpaceEditProjects ? openMoveProject : undefined}
                onDeleteProject={canProjectSpaceEditProjects ? setDeletingSpace : undefined}
              />
            ) : (
              <>
                <div className="tcs-section-head">
                  <div className="tcs-section-title-row">
                    <h2 id={sectionTitleId} className="tcs-section-title">
                      {sectionTitle}
                    </h2>
                    {!isMineView ? (
                      <TcsSectionHintIcon
                        hintId="tcs-project-space-section-hint"
                        hint={tcsT(locale, 'projectSpaceSectionHint')}
                        ariaLabel={tcsT(locale, 'projectSpaceSectionHintAria')}
                      />
                    ) : null}
                  </div>
                </div>

                {isMineView ? (
                  <MineContentPanel
                    locale={locale}
                    memberId={memberId}
                    searchQuery={searchQuery}
                    activeProjectGroupId={activeGroup?.id ?? resolvedGroupId}
                    canManage={canProjectSpaceEditProjects || canProjectSpacePublishContent}
                    canPublishContent={canProjectSpacePublishContent}
                  />
                ) : gridItemCount === 0 ? (
                  <div className="skills-empty tcs-project-space-empty">{tcsT(locale, 'projectSpaceEmptyGroup')}</div>
                ) : (
                  <section className="agents-grid skills-cards-grid tcs-grid" aria-label={tcsT(locale, 'gridAriaLabel')}>
                    {showCreateCard ? <ProjectSpaceCreateCard locale={locale} onCreate={openCreateProject} /> : null}
                    {visibleItems.map((item) => {
                      if (!item.spaceId) return null
                      const space = tcs.getSpace(item.spaceId)
                      if (!space) return null

                      return (
                        <TeamCollaborationSpaceCard
                          key={item.id}
                          locale={locale}
                          item={space}
                          allSpaces={tcs.spaces}
                          name={localizeProjectSpaceItemName(item, locale)}
                          description={tcs.localizeDescription(space)}
                          memberCountLabel={tcsT(locale, 'memberCount').replace('{count}', String(space.members.length))}
                          resourceCountLabel={tcsT(locale, 'resourceCount').replace('{count}', String(space.resourceCount))}
                          showExpiredBadge={item.spaceId != null && tcs.isProjectSpaceExpired(item.spaceId)}
                          onOpen={() => tcs.navigate({ view: 'space', spaceId: space.id })}
                          onEdit={canProjectSpaceEditProjects ? openEditProject : undefined}
                          onRequestMoveOut={canProjectSpaceEditProjects ? openMoveProject : undefined}
                          onRequestDelete={canProjectSpaceEditProjects ? setDeletingSpace : undefined}
                        />
                      )
                    })}
                  </section>
                )}
              </>
            )}
          </section>
        </div>
      </div>

      <ProjectGroupDeleteModal
        locale={locale}
        open={deletingGroup != null}
        group={deletingGroup}
        projectCount={deletingGroup ? (groupCounts[deletingGroup.id] ?? 0) : 0}
        onClose={() => setDeletingGroup(null)}
        onConfirm={confirmDeleteGroup}
      />

      <ProjectGroupFormModal
        locale={locale}
        open={groupFormOpen}
        editingGroup={editingGroup}
        copySourceOptions={tcs.copySourceOptions}
        orgMembers={tcs.orgMembers}
        showAccessSettings={editingGroupIsPublic ? isAdmin : canProjectSpaceConfigureAccess}
        accessSettingsOnly={editingGroupIsPublic}
        hideInviteMembers={editingGroupIsPublic}
        excludeSharedAccessMode={!editingGroup}
        onClose={closeGroupForm}
        onSubmit={(draft) => {
          if (editingGroup) {
            const current = groups.find((group) => group.id === editingGroup.id)
            if (!current) {
              closeGroupForm()
              return
            }
            let updated = applyProjectGroupFormDraft(current, draft, tcs.copySourceOptions)
            if (editingGroupIsPublic) {
              updated = {
                ...updated,
                nameZh: editingGroup.nameZh,
                nameEn: editingGroup.nameEn,
                isPublicSpace: true,
              }
            }
            updateProjectGroup(editingGroup.id, updated)
            closeGroupForm()
            return
          }
          const sortOrder = groups.reduce((max, group) => Math.max(max, group.sortOrder), -1) + 1
          const created = createProjectGroupFromDraft(draft, tcs.copySourceOptions, sortOrder)
          addProjectGroup(created)
          closeGroupForm()
          tcs.navigate({ view: 'project-space', scope: 'group', groupId: created.id })
        }}
      />

      <TeamCollaborationSpaceFormModal
        locale={locale}
        open={projectFormOpen}
        editingSpace={editingProjectSpace}
        formSpaceKind="team"
        createTitleKey="modalCreateProjectTitle"
        copySourceOptions={tcs.copySourceOptions}
        orgMembers={tcs.orgMembers}
        showAccessSettings={activeGroupIsPublic ? isAdmin : canProjectSpaceConfigureAccess}
        hideInviteMembers={activeGroupIsPublic}
        hideInviteMembersForSharedAccess
        showDeadlineField
        initialDeadlineStart={editingProjectItem?.deadlineStart}
        initialDeadlineEnd={editingProjectItem?.deadlineEnd}
        onClose={closeProjectForm}
        onSubmit={handleProjectFormSubmit}
      />

      <ProjectMoveOutModal
        locale={locale}
        open={movingProject != null}
        projectName={
          movingProject ? localizeProjectSpaceItemName(movingProject.projectItem, locale) : ''
        }
        targets={moveProjectTargets}
        onClose={() => setMovingProject(null)}
        onConfirm={confirmMoveProject}
      />

      <TcsSpaceDeleteModal
        locale={locale}
        open={deletingSpace != null}
        space={deletingSpace}
        onClose={() => setDeletingSpace(null)}
        onConfirm={() => {
          if (!deletingSpace) return
          const deletedSpaceId = deletingSpace.id
          tcs.deleteTeamSpace(deletedSpaceId)
          removeProjectSpaceItems((item) => item.spaceId === deletedSpaceId)
          setDeletingSpace(null)
        }}
      />
    </section>
  )
}
