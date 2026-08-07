export type AccessMode = 'default' | 'open' | 'private' | 'shared' | 'copy'

export type AccessBadgeMode = AccessMode

export type Permission =
  | 'access.view'
  | 'access.list_resources'
  | 'resource.view'
  | 'resource.edit'
  | 'resource.create'
  | 'resource.delete'
  | 'resource.run'
  | 'resource.publish'
  | 'member.view'
  | 'member.invite'
  | 'member.remove'
  | 'member.edit_permission'
  | 'zone.view'
  | 'zone.create'
  | 'zone.edit'
  | 'zone.delete'
  | 'space.edit'
  | 'space.delete'

export type RolePreset =
  | 'observer'
  | 'collaborator'
  | 'space_admin'
  | 'no_access'
  | 'custom'

export type MemberAssignment = {
  memberId: string
  rolePreset: RolePreset
  permissions: Permission[]
  /** 项空间自定义角色 id（rolePreset 为 custom 时使用） */
  customRoleId?: string
}

export type OrgMember = {
  id: string
  nameZh: string
  nameEn: string
  email: string
  departmentZh: string
  departmentEn: string
  phone?: string
  supervisorId?: string
  employeeId?: string
  positionZh?: string
  positionEn?: string
  officeLocation?: string
  joinDate?: string
  staffUserId?: string
  notes?: string
}
