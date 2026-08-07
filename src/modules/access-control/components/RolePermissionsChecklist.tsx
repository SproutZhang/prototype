import type { AppLocale } from '../../../i18n/homeStrings'
import {
  ACCESS_CONTROL_SUBNAV_SECTION_ID,
  NAV_SECTION_ID,
  ROLE_PERMISSION_CATALOG,
  catalogItemLabel,
  catalogSectionTitle,
  getCatalogGrantItemConfigurationHintKey,
  isAccessControlSubnavSectionEnabled,
  isCatalogGrantItemConfigurable,
  isNavSectionConfigurationEnabled,
  isProjectSpaceNestedChildGrant,
  isProjectSpaceParentGrant,
} from '../data/rolePermissionsCatalog'
import { acT } from '../i18n/strings'

type RolePermissionsChecklistProps = {
  locale: AppLocale
  grantedIds: ReadonlySet<string>
  onToggle: (itemId: string) => void
  onToggleSection: (sectionId: string, itemIds: string[]) => void
  className?: string
}

export function RolePermissionsChecklist({
  locale,
  grantedIds,
  onToggle,
  onToggleSection,
  className = 'ac-permissions-drawer-body',
}: RolePermissionsChecklistProps) {
  const navSectionConfigurationEnabled = isNavSectionConfigurationEnabled(grantedIds)
  const accessControlSubnavEnabled = isAccessControlSubnavSectionEnabled(grantedIds)

  return (
    <div className={className}>
      {ROLE_PERMISSION_CATALOG.map((sectionDef) => {
        const sectionItemIds = sectionDef.items.map((item) => item.id)
        const configurableSectionItemIds = sectionItemIds.filter((itemId) =>
          isCatalogGrantItemConfigurable(grantedIds, itemId),
        )
        const allSelected =
          configurableSectionItemIds.length > 0 &&
          configurableSectionItemIds.every((id) => grantedIds.has(id))
        const isNavSection = sectionDef.id === NAV_SECTION_ID
        const isAccessControlSubnavSection = sectionDef.id === ACCESS_CONTROL_SUBNAV_SECTION_ID
        const sectionDisabled =
          (isNavSection && !navSectionConfigurationEnabled) ||
          (isAccessControlSubnavSection && !accessControlSubnavEnabled)
        const sectionHintKey = sectionDisabled
          ? isNavSection
            ? 'rolePermissionsNavMenuRequired'
            : 'rolePermissionsAccessControlNavRequired'
          : null

        return (
          <section
            key={sectionDef.id}
            className={`ac-permissions-drawer-section${sectionDisabled ? ' ac-permissions-drawer-section--disabled' : ''}`}
            aria-disabled={sectionDisabled || undefined}
          >
            <div className="ac-permissions-drawer-section-head">
              <h3 className="ac-permissions-drawer-section-title">
                {catalogSectionTitle(locale, sectionDef)}
              </h3>
              <button
                type="button"
                className="ac-permissions-drawer-section-select-all"
                disabled={sectionDisabled || configurableSectionItemIds.length === 0}
                onClick={() => onToggleSection(sectionDef.id, sectionItemIds)}
              >
                {allSelected
                  ? acT(locale, 'rolePermissionsDeselectAll')
                  : acT(locale, 'rolePermissionsSelectAll')}
              </button>
            </div>
            {sectionHintKey ? (
              <p className="ac-permissions-drawer-section-hint">{acT(locale, sectionHintKey)}</p>
            ) : null}
            <ul className="ac-permissions-drawer-grid">
              {sectionDef.items.map((item) => {
                const checked = grantedIds.has(item.id)
                const label = catalogItemLabel(locale, item)
                const itemDisabled = !isCatalogGrantItemConfigurable(grantedIds, item.id)
                const itemHintKey = itemDisabled
                  ? getCatalogGrantItemConfigurationHintKey(item.id)
                  : null
                const isNestedChild = isProjectSpaceNestedChildGrant(item.id)
                const isParentGrant = isProjectSpaceParentGrant(item.id)
                const gridItemClassName = isParentGrant
                  ? 'ac-permissions-drawer-grid-item--parent'
                  : isNestedChild
                    ? 'ac-permissions-drawer-grid-item--nested'
                    : undefined

                return (
                  <li key={item.id} className={gridItemClassName}>
                    <label
                      className={`ac-permissions-drawer-item${checked ? ' ac-permissions-drawer-item--checked' : ''}${itemDisabled ? ' ac-permissions-drawer-item--disabled' : ''}${isNestedChild ? ' ac-permissions-drawer-item--nested' : ''}`}
                      title={itemHintKey ? acT(locale, itemHintKey) : undefined}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={itemDisabled}
                        onChange={() => {
                          if (itemDisabled) return
                          onToggle(item.id)
                        }}
                        aria-label={label}
                      />
                      <span>{label}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
