import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'

export const CREATE_DEPARTMENT_TYPE_OPTION_VALUE = '__create_department_type__'

export const BUILTIN_DEPARTMENT_TYPE_IDS = ['business', 'functional', 'project'] as const

export type BuiltinDepartmentTypeId = (typeof BUILTIN_DEPARTMENT_TYPE_IDS)[number]

export type CustomDepartmentType = {
  id: string
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
}

export type DepartmentTypeSelectOption = {
  value: string
  label: string
}

export type CreateDepartmentTypePayload = {
  nameZh: string
  nameEn: string
  descriptionZh: string
  descriptionEn: string
}

let customDepartmentTypes: CustomDepartmentType[] = []

export const DEFAULT_DEPARTMENT_TYPE_ID: BuiltinDepartmentTypeId = 'business'

export function resolveDepartmentTypeId(type: string | undefined | null): string {
  const trimmed = type?.trim()
  if (trimmed) return trimmed
  return DEFAULT_DEPARTMENT_TYPE_ID
}

export function getCustomDepartmentTypes(): CustomDepartmentType[] {
  return [...customDepartmentTypes]
}

export function addCustomDepartmentType(payload: CreateDepartmentTypePayload): string {
  const id = `dept-type-custom-${Date.now()}`
  customDepartmentTypes = [
    ...customDepartmentTypes,
    {
      id,
      nameZh: payload.nameZh,
      nameEn: payload.nameEn,
      descriptionZh: payload.descriptionZh,
      descriptionEn: payload.descriptionEn,
    },
  ]
  return id
}

export function localizeCustomDepartmentTypeName(
  type: CustomDepartmentType,
  locale: AppLocale,
): string {
  return locale === 'zh' ? type.nameZh : type.nameEn
}

export function getDepartmentTypeSelectOptions(locale: AppLocale): DepartmentTypeSelectOption[] {
  const builtinOptions = BUILTIN_DEPARTMENT_TYPE_IDS.map((id) => ({
    value: id,
    label: acT(locale, `departmentType_${id}` as 'departmentType_business'),
  }))

  const customOptions = customDepartmentTypes.map((type) => ({
    value: type.id,
    label: localizeCustomDepartmentTypeName(type, locale),
  }))

  return [...builtinOptions, ...customOptions]
}

export function isBuiltinDepartmentTypeId(value: string): boolean {
  return BUILTIN_DEPARTMENT_TYPE_IDS.includes(value as BuiltinDepartmentTypeId)
}
