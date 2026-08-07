import { useEffect, useMemo, useState, type FormEvent } from 'react'



import type { AppLocale } from '../../../i18n/homeStrings'

import { buildInitialZoneMembersForAccessMode } from '../utils/memberInit'

import {

  ACCESS_MODE_OPTIONS,

  accessModeHintForSubSpace,

  accessModeLabel,

  localizeZoneName,

  tcsT,

} from '../i18n/strings'

import type { CollaborationZone, SpaceAccessMode, TeamCollaborationSpaceItem, ZoneFormDraft } from '../types'



type TcsZoneFormModalProps = {

  locale: AppLocale

  open: boolean

  spaceId: string

  parentSpace: TeamCollaborationSpaceItem

  editingZone: CollaborationZone | null

  siblingZones: CollaborationZone[]

  onClose: () => void

  onSubmit: (spaceId: string, draft: ZoneFormDraft) => void

}



export function TcsZoneFormModal({

  locale,

  open,

  spaceId,

  parentSpace,

  editingZone,

  siblingZones,

  onClose,

  onSubmit,

}: TcsZoneFormModalProps) {

  const [name, setName] = useState('')

  const [description, setDescription] = useState('')

  const [accessMode, setAccessMode] = useState<SpaceAccessMode>('default')

  const [copyFromZoneId, setCopyFromZoneId] = useState('')



  const copyCandidates = useMemo(

    () => siblingZones.filter((zone) => zone.id !== editingZone?.id),

    [siblingZones, editingZone?.id],

  )



  useEffect(() => {

    if (!open) return

    if (editingZone) {

      setName(localizeZoneName(editingZone, locale))

      setDescription(locale === 'zh' ? editingZone.descriptionZh : editingZone.descriptionEn)

      setAccessMode(editingZone.accessMode ?? 'default')

      setCopyFromZoneId(editingZone.copyFromZoneId ?? copyCandidates[0]?.id ?? '')

      return

    }

    setName('')

    setDescription('')

    setAccessMode('default')

    setCopyFromZoneId(copyCandidates[0]?.id ?? '')

  }, [open, editingZone, locale, copyCandidates])



  const previewMemberCount = useMemo(() => {

    const copySource =

      accessMode === 'copy' && copyFromZoneId

        ? siblingZones.find((zone) => zone.id === copyFromZoneId) ?? null

        : null

    return buildInitialZoneMembersForAccessMode(accessMode, parentSpace, copySource).length

  }, [accessMode, copyFromZoneId, parentSpace, siblingZones])



  if (!open) return null



  const handleSubmit = (event: FormEvent) => {

    event.preventDefault()

    if (!name.trim()) return

    if (accessMode === 'copy' && !copyFromZoneId) return

    onSubmit(spaceId, {

      name: name.trim(),

      description: description.trim(),

      accessMode,

      copyFromZoneId: accessMode === 'copy' ? copyFromZoneId : null,

    })

  }



  return (

    <div className="tcs-modal-overlay" role="presentation" onClick={onClose}>

      <div

        className="tcs-modal tcs-modal--form"

        role="dialog"

        aria-modal="true"

        onClick={(e) => e.stopPropagation()}

      >

        <h2 className="tcs-modal-title">

          {tcsT(locale, editingZone ? 'modalEditSubSpaceTitle' : 'modalCreateSubSpaceTitle')}

        </h2>

        <form className="tcs-modal-form" onSubmit={handleSubmit}>

          <label className="tcs-field">

            <span>{tcsT(locale, 'formName')}</span>

            <input value={name} required onChange={(e) => setName(e.target.value)} />

          </label>

          <label className="tcs-field">

            <span>{tcsT(locale, 'formDescription')}</span>

            <textarea value={description} rows={3} onChange={(e) => setDescription(e.target.value)} />

          </label>



          <fieldset className="tcs-access-mode-fieldset">

            <legend>{tcsT(locale, 'formAccessMode')}</legend>

            <div className="tcs-access-mode-list">

              {ACCESS_MODE_OPTIONS.map((mode) => (

                <label key={mode} className="tcs-access-mode-option">

                  <input

                    type="radio"

                    name="tcs-zone-access-mode"

                    value={mode}

                    checked={accessMode === mode}

                    onChange={() => setAccessMode(mode)}

                  />

                  <span className="tcs-access-mode-option-body">

                    <span className="tcs-access-mode-option-title">{accessModeLabel(locale, mode)}</span>

                    <span className="tcs-access-mode-option-hint">

                      {accessModeHintForSubSpace(locale, mode)}

                    </span>

                  </span>

                </label>

              ))}

            </div>

          </fieldset>



          {accessMode === 'copy' ? (

            <label className="tcs-field">

              <span>{tcsT(locale, 'formCopyFromZone')}</span>

              <select

                value={copyFromZoneId}

                required

                onChange={(event) => setCopyFromZoneId(event.target.value)}

              >

                {copyCandidates.length === 0 ? (

                  <option value="">{tcsT(locale, 'formCopyFromZonePlaceholder')}</option>

                ) : (

                  copyCandidates.map((zone) => (

                    <option key={zone.id} value={zone.id}>

                      {localizeZoneName(zone, locale)}

                    </option>

                  ))

                )}

              </select>

            </label>

          ) : null}



          {!editingZone?.permissionsCustomized ? (

            <p className="tcs-modal-hint">

              {tcsT(locale, 'memberCount').replace('{count}', String(previewMemberCount))}

            </p>

          ) : null}



          <div className="tcs-modal-actions">

            <button type="button" className="tcs-btn tcs-btn--secondary" onClick={onClose}>

              {tcsT(locale, 'formCancel')}

            </button>

            <button type="submit" className="agents-btn agents-btn-primary">

              {tcsT(locale, editingZone ? 'formSave' : 'formCreate')}

            </button>

          </div>

        </form>

      </div>

    </div>

  )

}


