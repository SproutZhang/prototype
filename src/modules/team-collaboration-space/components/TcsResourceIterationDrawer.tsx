import { getScenarioDisplayName } from '../../../i18n/scenarioStrings'
import type { AppLocale } from '../../../i18n/homeStrings'
import { SectionIterationRestoreDrawer } from './SectionIterationRestoreDrawer'
import type { TcsResourceCatalogItem } from '../types'
import type { SectionIterationRecord } from '../types/sectionIteration'
import { resolveResourceIterationSection } from '../utils/resourceIterationLookup'

type TcsResourceIterationDrawerProps = {
  open: boolean
  locale: AppLocale
  item: TcsResourceCatalogItem | null
  onClose: () => void
  onRollbackSuccess?: (record: SectionIterationRecord) => void
}

export function TcsResourceIterationDrawer({
  open,
  locale,
  item,
  onClose,
  onRollbackSuccess,
}: TcsResourceIterationDrawerProps) {
  if (!item) return null

  const { sectionType, sectionId } = resolveResourceIterationSection(item)

  return (
    <SectionIterationRestoreDrawer
      open={open}
      locale={locale}
      sectionType={sectionType}
      sectionId={sectionId}
      resourceItem={item}
      resourceName={getScenarioDisplayName(item.id, locale)}
      onClose={onClose}
      onRollbackSuccess={onRollbackSuccess}
    />
  )
}
