import { useMemo, useState, type ChangeEvent } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  addCustomDepartmentType,
  CREATE_DEPARTMENT_TYPE_OPTION_VALUE,
  getDepartmentTypeSelectOptions,
} from '../data/departmentTypeCatalog'
import { CreateDepartmentTypeModal } from './CreateDepartmentTypeModal'

type DepartmentTypeSelectFieldProps = {
  locale: AppLocale
  selectId: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function DepartmentTypeSelectField({
  locale,
  selectId,
  value,
  onChange,
  disabled = false,
}: DepartmentTypeSelectFieldProps) {
  const [catalogRevision, setCatalogRevision] = useState(0)
  const [createTypeOpen, setCreateTypeOpen] = useState(false)

  const departmentTypeOptions = useMemo(() => {
    const options = getDepartmentTypeSelectOptions(locale)
    if (value && !options.some((option) => option.value === value)) {
      return [...options, { value, label: value }]
    }
    return options
  }, [locale, catalogRevision, value])

  const handleSelectChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextValue = event.target.value
    if (nextValue === CREATE_DEPARTMENT_TYPE_OPTION_VALUE) {
      setCreateTypeOpen(true)
      return
    }
    onChange(nextValue)
  }

  return (
    <>
      <select
        id={selectId}
        className={`ac-dept-edit-select${disabled ? ' ac-dept-edit-input--readonly' : ''}`}
        value={value}
        disabled={disabled}
        onChange={handleSelectChange}
      >
        {!disabled ? (
          <option value="">{acT(locale, 'formSelectPlaceholder')}</option>
        ) : null}
        {departmentTypeOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
        {!disabled ? (
        <option value={CREATE_DEPARTMENT_TYPE_OPTION_VALUE} className="ac-dept-type-create-option">
          {acT(locale, 'departmentTypeCreateAction')}
        </option>
        ) : null}
      </select>

      <CreateDepartmentTypeModal
        locale={locale}
        open={createTypeOpen}
        onClose={() => setCreateTypeOpen(false)}
        onSave={(payload) => {
          const id = addCustomDepartmentType(payload)
          setCatalogRevision((revision) => revision + 1)
          onChange(id)
          setCreateTypeOpen(false)
        }}
      />
    </>
  )
}
