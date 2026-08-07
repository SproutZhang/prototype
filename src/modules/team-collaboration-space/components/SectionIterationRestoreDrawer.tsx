import { useEffect, useId, useState } from 'react'



import type { AppLocale } from '../../../i18n/homeStrings'

import { useTeamCollaborationCapabilities } from '../hooks/useTeamCollaborationCapabilities'

import { tcsT } from '../i18n/strings'

import type { TcsResourceCatalogItem } from '../types'

import type { SectionIterationRecord, SectionType } from '../types/sectionIteration'

import {

  rollbackSectionIterationRecord,

  SECTION_ITERATION_CHANGED_EVENT,

} from '../utils/appendSectionIterationRecord'

import { getResourceIterationRecords } from '../utils/resourceIterationLookup'

import { getSectionIterationRecords } from '../utils/sectionIterationSync'

import { SectionIterationRollbackConfirmModal } from './SectionIterationRollbackConfirmModal'

import { SectionIterationTimeline } from './SectionIterationTimeline'



type SectionIterationRestoreDrawerProps = {

  open: boolean

  locale: AppLocale

  sectionType: SectionType

  sectionId: string

  resourceName: string

  resourceItem?: TcsResourceCatalogItem

  onClose: () => void

  onRollbackSuccess?: (record: SectionIterationRecord) => void

}



export function SectionIterationRestoreDrawer({

  open,

  locale,

  sectionType,

  sectionId,

  resourceItem,

  onClose,

  onRollbackSuccess,

}: SectionIterationRestoreDrawerProps) {

  const headingId = useId()

  const { canProjectSpaceRestoreChangelog } = useTeamCollaborationCapabilities()

  const [records, setRecords] = useState<SectionIterationRecord[]>([])

  const [rollbackTarget, setRollbackTarget] = useState<SectionIterationRecord | null>(null)



  const loadRecords = () =>
    resourceItem
      ? getResourceIterationRecords(resourceItem, locale)
      : getSectionIterationRecords(sectionType, sectionId)

  useEffect(() => {

    if (!open) return

    setRecords(loadRecords())

    setRollbackTarget(null)

  }, [open, sectionType, sectionId, resourceItem, locale])



  useEffect(() => {

    if (!open) return

    const refresh = () => setRecords(loadRecords())

    window.addEventListener(SECTION_ITERATION_CHANGED_EVENT, refresh)

    return () => window.removeEventListener(SECTION_ITERATION_CHANGED_EVENT, refresh)

  }, [open, sectionType, sectionId, resourceItem, locale])



  useEffect(() => {

    if (!open) return

    const onKey = (event: KeyboardEvent) => {

      if (event.key === 'Escape' && !rollbackTarget) onClose()

    }

    window.addEventListener('keydown', onKey)

    return () => window.removeEventListener('keydown', onKey)

  }, [open, onClose, rollbackTarget])



  if (!open) return null



  const confirmRollback = () => {

    if (!rollbackTarget) return

    const rolled = rollbackSectionIterationRecord(rollbackTarget.id)

    if (!rolled) return

    setRecords(loadRecords())

    setRollbackTarget(null)

    onRollbackSuccess?.(rolled)

  }



  return (

    <>

      <aside

        className="scenario-collect-drawer scenario-publish-version-drawer"

        aria-labelledby={headingId}

      >

        <div className="scenario-collect-drawer-header">

          <h2 id={headingId} className="scenario-collect-drawer-title">

            {tcsT(locale, 'resourceIterationDrawerTitle')}

          </h2>

          <button

            type="button"

            className="scenario-collect-drawer-close"

            aria-label={tcsT(locale, 'formCancel')}

            onClick={onClose}

          >

            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">

              <path

                d="M18 6L6 18M6 6l12 12"

                fill="none"

                stroke="currentColor"

                strokeWidth="2"

                strokeLinecap="round"

              />

            </svg>

          </button>

        </div>

        <div className="scenario-collect-drawer-body">

          <SectionIterationTimeline

            locale={locale}

            records={records}

            variant="publish-drawer"

            rollbackable={canProjectSpaceRestoreChangelog}

            onRollback={setRollbackTarget}

          />

        </div>

      </aside>



      {rollbackTarget ? (

        <SectionIterationRollbackConfirmModal

          locale={locale}

          record={rollbackTarget}

          onCancel={() => setRollbackTarget(null)}

          onConfirm={confirmRollback}

        />

      ) : null}

    </>

  )

}


