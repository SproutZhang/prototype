import type { CSSProperties } from 'react'

import type { AppLocale } from '../../../i18n/homeStrings'
import { appMarketProductLineLabel } from '../i18n/strings'
import type { AppMarketBrandIcon, AppMarketItem } from './types'

/** Agent 模板卡片标签固定为 Agent / Manager Agent，不因「使用模板」变为已安装 */
const MANAGER_AGENT_TEMPLATE_IDS = new Set([
  'onboarding-starter-pack',
  'sales-manager-onboard',
  'employee-self-onboard',
])

function agentTemplateCardTag(item: AppMarketItem): string {
  return MANAGER_AGENT_TEMPLATE_IDS.has(item.id) ? 'Manager Agent' : 'Agent'
}

export type AppMarketCardRow = {
  id: string
  name: string
  desc: string
  meta: string
  tag: string
  iconStyle: CSSProperties
  brandIcon?: AppMarketBrandIcon
}

export function mapAppMarketItemToCard(
  item: AppMarketItem,
  locale: AppLocale,
  options?: { installed?: boolean },
): AppMarketCardRow {
  const name = locale === 'zh' ? item.nameZh : item.nameEn
  const desc = locale === 'zh' ? item.descriptionZh : item.descriptionEn
  const badge =
    item.badge === 'featured'
      ? locale === 'zh'
        ? '精选'
        : 'Featured'
      : item.badge === 'new'
        ? locale === 'zh'
          ? '上新'
          : 'New'
        : null

  return {
    id: item.id,
    name,
    desc,
    meta: badge ? `${item.installs} · ${badge}` : item.installs,
    tag:
      item.productLine === 'agent-templates'
        ? agentTemplateCardTag(item)
        : item.productLine === 'scenario-templates'
          ? locale === 'zh'
            ? '场景'
            : 'Scenario'
          : item.productLine === 'skills'
            ? locale === 'zh'
              ? '技能'
              : 'Skill'
            : options?.installed
              ? locale === 'zh'
                ? '已安装'
                : 'Installed'
              : appMarketProductLineLabel(locale, item.productLine),
    iconStyle: {
      '--agent-icon-from': item.iconFrom,
      '--agent-icon-via': item.iconFrom,
      '--agent-icon-to': item.iconTo,
      '--agent-icon-shadow': 'rgba(91, 124, 255, 0.24)',
    } as CSSProperties,
    brandIcon: item.brandIcon,
  }
}

export function mapAppMarketItemsToCards(
  items: AppMarketItem[],
  locale: AppLocale,
  isInstalled?: (id: string) => boolean,
): AppMarketCardRow[] {
  return items.map((item) =>
    mapAppMarketItemToCard(item, locale, { installed: isInstalled?.(item.id) }),
  )
}
