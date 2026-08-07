import { useEffect, useId, useMemo, useState } from 'react'

import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import {
  localizeDepartmentName,
  type OrgDepartmentRow,
} from '../data/departmentsSeed'
import type { DepartmentFormSavePayload } from '../hooks/useDepartmentsSectionController'

type DepartmentFormModalProps = {
  locale: AppLocale
  open: boolean
  mode: 'add' | 'edit'
  department?: OrgDepartmentRow | null
  departments: OrgDepartmentRow[]
  onClose: () => void
  onSave: (payload: DepartmentFormSavePayload) => void
}

export function DepartmentFormModal({
  locale,
  open,
  mode,
  department = null,
  departments,
  onClose,
  onSave,
}: DepartmentFormModalProps) {
  const titleId = useId()
  const [nameZh, setNameZh] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [descriptionZh, setDescriptionZh] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [parentId, setParentId] = useState<string>('')

  const parentOptions = useMemo(() => {
    const excludeId = mode === 'edit' && department ? department.id : null
    return departments.filter((item) => item.id !== excludeId)
  }, [departments, department, mode])

  useEffect(() => {
    if (!open) return
    if (mode === 'add') {
      setNameZh('')
      setNameEn('')
      setDescriptionZh('')
      setDescriptionEn('')
      setParentId('')
      return
    }
    if (!department) return
    setNameZh(department.nameZh)
    setNameEn(department.nameEn)
    setDescriptionZh(department.descriptionZh)
    setDescriptionEn(department.descriptionEn)
    setParentId(department.parentId ?? '')
  }, [open, mode, department?.id])

  if (!open) return null
  if (mode === 'edit' && !department) return null

  const titleKey = mode === 'add' ? 'departmentAddTitle' : 'departmentEditTitle'

  const handleSave = () => {
    const fallbackZh = mode === 'add' ? acT(locale, 'departmentDefaultName') : department!.nameZh
    const fallbackEn = mode === 'add' ? acT(locale, 'departmentDefaultName') : department!.nameEn
    onSave({
      nameZh: nameZh.trim() || fallbackZh,
      nameEn: nameEn.trim() || fallbackEn,
      descriptionZh: descriptionZh.trim(),
      descriptionEn: descriptionEn.trim(),
      parentId: parentId || null,
    })
  }

  return (
    <div className="ac-modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="ac-modal ac-modal--form"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="ac-modal-title">{acT(locale, titleKey)}</h2>
        <div className="ac-modal-body ac-modal-body--form">
          <label className="ac-form-field">
            <span className="ac-form-label">{acT(locale, 'departmentFieldNameZh')}</span>
            <input
              type="text"
              className="ac-form-input"
              value={nameZh}
              onChange={(event) => setNameZh(event.target.value)}
            />
          </label>
          <label className="ac-form-field">
            <span className="ac-form-label">{acT(locale, 'departmentFieldNameEn')}</span>
            <input
              type="text"
              className="ac-form-input"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
            />
          </label>
          <label className="ac-form-field">
            <span className="ac-form-label">{acT(locale, 'departmentFieldDescription')}</span>
            <textarea
              className="ac-form-input ac-form-textarea"
              rows={3}
              value={locale === 'zh' ? descriptionZh : descriptionEn}
              onChange={(event) => {
                if (locale === 'zh') setDescriptionZh(event.target.value)
                else setDescriptionEn(event.target.value)
              }}
            />
          </label>
          <label className="ac-form-field">
            <span className="ac-form-label">{acT(locale, 'departmentFieldParent')}</span>
            <select
              className="ac-form-input"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">{acT(locale, 'departmentFieldParentPlaceholder')}</option>
              {parentOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {localizeDepartmentName(item, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="ac-modal-actions">
          <button type="button" className="ac-btn ac-btn--secondary" onClick={onClose}>
            {acT(locale, 'formCancel')}
          </button>
          <button type="button" className="agents-btn" onClick={handleSave}>
            {acT(locale, 'formSave')}
          </button>
        </div>
      </div>
    </div>
  )
}

export function AddDepartmentModal(
  props: Omit<DepartmentFormModalProps, 'mode' | 'department'>,
) {
  return <DepartmentFormModal mode="add" department={null} {...props} />
}
