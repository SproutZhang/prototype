import type { CSSProperties, ReactNode } from 'react'

import { PlanBlueprintToolIcon } from '../components/shared/WfBlueprintStepsBlock'
import type { ToolDirectoryItem, ToolIconTone, ToolIntegrationApp } from '../data/tools-directory'

const TOOL_INTEGRATION_LABEL: Record<ToolIntegrationApp, string> = {
  gmail: 'Gmail',
  slack: 'Slack',
  excel: 'Excel',
  notion: 'Notion',
  teams: 'Teams',
  googleSheets: 'Google Sheets',
}

export function getToolIntegrationLabel(integration: ToolIntegrationApp): string {
  return TOOL_INTEGRATION_LABEL[integration]
}

export function getToolDirectoryBrandLabel(item: ToolDirectoryItem): string | null {
  const firstIntegration = item.integrations[0]
  return firstIntegration ? TOOL_INTEGRATION_LABEL[firstIntegration] : null
}

export function getToolDirectoryCardIconStyle(tone: ToolIconTone): CSSProperties {
  const paletteMap: Record<ToolIconTone, { from: string; via: string; to: string; shadow: string }> = {
    violet: {
      from: '#7f7cff',
      via: '#8b5cf6',
      to: '#ff9a62',
      shadow: 'rgba(124, 92, 255, 0.28)',
    },
    sky: {
      from: '#5ea8ff',
      via: '#5b7cff',
      to: '#7b61ff',
      shadow: 'rgba(91, 124, 255, 0.24)',
    },
    amber: {
      from: '#ffd36a',
      via: '#ffab5b',
      to: '#ff7b72',
      shadow: 'rgba(255, 171, 91, 0.26)',
    },
    emerald: {
      from: '#62d6a5',
      via: '#33c0b8',
      to: '#3f8cff',
      shadow: 'rgba(51, 192, 184, 0.24)',
    },
    rose: {
      from: '#ff8cb7',
      via: '#ff7d95',
      to: '#9a6bff',
      shadow: 'rgba(255, 125, 149, 0.25)',
    },
    indigo: {
      from: '#7ad7ff',
      via: '#4ca9ff',
      to: '#7c73ff',
      shadow: 'rgba(76, 169, 255, 0.24)',
    },
    cyan: {
      from: '#19c7c7',
      via: '#2d9bf0',
      to: '#6d6bff',
      shadow: 'rgba(45, 155, 240, 0.24)',
    },
    orange: {
      from: '#ffb86c',
      via: '#ff8f70',
      to: '#ff6ea8',
      shadow: 'rgba(255, 143, 112, 0.24)',
    },
  }

  const palette = paletteMap[tone]
  return {
    '--agent-icon-from': palette.from,
    '--agent-icon-via': palette.via,
    '--agent-icon-to': palette.to,
    '--agent-icon-shadow': palette.shadow,
  } as CSSProperties
}

export function renderToolDirectoryCardIconContent(item: ToolDirectoryItem): ReactNode {
  const brandLabel = getToolDirectoryBrandLabel(item)
  if (!brandLabel) return null

  return (
    <span className="app-market-brand-icon" aria-hidden="true">
      <PlanBlueprintToolIcon label={brandLabel} />
    </span>
  )
}
