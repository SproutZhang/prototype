import { useMemo, useState, type DragEvent } from 'react'

import {
  TOOL_LIBRARY_CATEGORIES,
  type ToolLibraryAgentTemplateItem,
  type ToolLibraryIcon,
  type ToolLibraryItem,
  type ToolLibraryToolItem,
} from '../../data/tool-library'
import { WorkflowIcon } from './WorkflowIcon'

type WorkflowToolLibraryPanelProps = {
  onClose: () => void
}

export const WORKFLOW_TOOL_DRAG_MIME = 'application/x-workflow-tool'
export const WORKFLOW_AGENT_TEMPLATE_DRAG_MIME = 'application/x-workflow-agent-template'
export const WORKFLOW_DRAG_STATE_EVENT = 'workflow-tool-drag-state'

type WorkflowDragStateDetail = {
  active: boolean
  itemType?: ToolLibraryItem['itemType']
  item?: ToolLibraryItem
}

export function ToolGlyph({ icon }: { icon: ToolLibraryIcon | 'task' }) {
  const commonProps = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (icon) {
    case 'task':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="4.4" y="3.8" width="11.2" height="12.4" rx="2.4" {...commonProps} />
          <path d="M7.2 3.8h5.6M7.4 9.8l1.4 1.4 3.6-3.6" {...commonProps} />
        </svg>
      )
    case 'agent':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="6.4" r="2.5" {...commonProps} />
          <path d="M5.4 15.4c.7-2.2 2.5-3.4 4.6-3.4s3.9 1.2 4.6 3.4" {...commonProps} />
        </svg>
      )
    case 'route':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M4 5h5m0 0v10m0-10 7 0m-7 5h7m-7 5h5" {...commonProps} />
        </svg>
      )
    case 'embed':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="m7 5-4 5 4 5M13 5l4 5-4 5M8.8 15.6l2.4-11.2" {...commonProps} />
        </svg>
      )
    case 'eval':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M4.5 10.4 8 13.6l7.5-7.2M4.4 5.5h5.4M4.4 15h3.6" {...commonProps} />
        </svg>
      )
    case 'queue':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="4.2" y="4.5" width="4.1" height="4.1" rx="1.1" {...commonProps} />
          <rect x="11.7" y="4.5" width="4.1" height="4.1" rx="1.1" {...commonProps} />
          <rect x="4.2" y="11.4" width="4.1" height="4.1" rx="1.1" {...commonProps} />
          <path d="M8.3 6.5h3.4M6.2 8.6v2.8M11.7 13.4h-3.4" {...commonProps} />
        </svg>
      )
    case 'retry':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M6 7.1h3.1V4M14 12.9h-3.1V16" {...commonProps} />
          <path d="M6.6 13.4a4.7 4.7 0 0 0 7-1.1M13.4 6.6a4.7 4.7 0 0 0-7 1.1" {...commonProps} />
        </svg>
      )
    case 'webhook':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M6.2 8.4A3.4 3.4 0 1 1 10 13.8m3.8-2.2A3.4 3.4 0 1 1 10 6.2" {...commonProps} />
          <path d="M9.8 4.5v2.4M10.2 13.1v2.4" {...commonProps} />
        </svg>
      )
    case 'identity':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="3.6" y="5" width="12.8" height="10" rx="2.2" {...commonProps} />
          <circle cx="7.4" cy="10" r="1.8" {...commonProps} />
          <path d="M11.3 8.2h2.6M11.3 10.2h3M11.3 12.2H14" {...commonProps} />
        </svg>
      )
    case 'risk':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="m10 3 6 2.2v3.5c0 4.2-2.4 6.4-6 8.3-3.6-1.9-6-4.1-6-8.3V5.2L10 3Z" {...commonProps} />
          <path d="M10 7.2v3.6M10 13.4h.01" {...commonProps} />
        </svg>
      )
    case 'sql':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <ellipse cx="10" cy="5.4" rx="5.3" ry="2.4" {...commonProps} />
          <path d="M4.7 5.4v4.8c0 1.3 2.4 2.4 5.3 2.4s5.3-1.1 5.3-2.4V5.4m-10.6 4.8v4.3c0 1.3 2.4 2.4 5.3 2.4s5.3-1.1 5.3-2.4v-4.3" {...commonProps} />
        </svg>
      )
    case 'memory':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="5.1" y="5.1" width="9.8" height="9.8" rx="2" {...commonProps} />
          <path d="M7.2 3.8v1.4M10 3.8v1.4M12.8 3.8v1.4M7.2 14.8v1.4M10 14.8v1.4M12.8 14.8v1.4M3.8 7.2h1.4M3.8 10h1.4M3.8 12.8h1.4M14.8 7.2h1.4M14.8 10h1.4M14.8 12.8h1.4" {...commonProps} />
        </svg>
      )
    case 'extract':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M5 4.4h7.2l2.8 2.8v8.4H5z" {...commonProps} />
          <path d="M12.2 4.4v2.8H15M7.2 10h5.6M7.2 12.7h4.1" {...commonProps} />
        </svg>
      )
    case 'pdf':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#E5252A" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path fill="#FF6B6B" d="M14 2v6h6" />
          <path
            fill="#fff"
            d="M7.2 15.4h1.5c1.1 0 1.7-.5 1.7-1.2s-.6-1.2-1.6-1.2H8.4V12H7.2v3.4zm1.5-2.2h.8c.6 0 .9.3.9.7s-.3.7-.9.7H8.7v-1.4zm3.1 2.2h1.1l1.4-3.4h1.3l-2.2 5.2h-1.1l.5-1.2h-1.9l.5 1.2h-1.1l-1.4-3.4zm2.5 0 1.1 2.6 1.1-2.6h1.1l-1.7 3.4h-1.1l1.7-3.4z"
          />
        </svg>
      )
    case 'ocr':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="4.2" y="5" width="11.6" height="10" rx="2" {...commonProps} />
          <path d="M7.1 11.8a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4Zm3.3 0V8.4h1.2c1 0 1.6.6 1.6 1.7s-.6 1.7-1.6 1.7h-1.2Zm4.3 0V8.4h1.9" {...commonProps} />
        </svg>
      )
    case 'gmail':
      return (
        <svg viewBox="52 42 88 66" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
          <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
          <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
          <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
          <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
          <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
        </svg>
      )
    case 'google-docs':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#4285F4" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path fill="#A1C2FA" d="M14 2v6h6" />
          <path fill="#fff" d="M8 13h8v1.5H8zm0 2.5h8V17H8zm0 2.5h5V20H8z" />
        </svg>
      )
    case 'google-sheets':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#0F9D58" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
          <path fill="#87CEAC" d="M14 2v6h6" />
          <path
            fill="none"
            stroke="#fff"
            strokeWidth="1.1"
            strokeLinecap="round"
            d="M8 11.2h8M8 14h8M8 16.8h8M10.8 11.2v7.2M14.2 11.2v7.2"
          />
        </svg>
      )
    case 'slack':
      return (
        <svg viewBox="0 0 1024 1024" aria-hidden="true" focusable="false">
          <path
            d="M244.224 643.84c0 59.221333-45.098667 107.264-100.778667 107.264C87.808 751.104 42.666667 703.061333 42.666667 643.84c0-59.221333 45.141333-107.264 100.778666-107.264h100.778667v107.264zM294.613333 643.84c0-59.306667 45.141333-107.306667 100.821334-107.306667 55.637333 0 100.778667 48.042667 100.778666 107.264v268.288c0 59.264-45.141333 107.306667-100.778666 107.306667-55.68 0-100.821333-48.042667-100.821334-107.306667v-268.288z"
            fill="#E01E5A"
          />
          <path
            d="M395.392 214.613333c-55.637333 0-100.778667-48.042667-100.778667-107.306666C294.613333 48.042667 339.754667 0 395.392 0c55.68 0 100.821333 48.042667 100.821333 107.306667V214.613333H395.392zM395.392 268.245333c55.68 0 100.821333 48.085333 100.821333 107.306667 0 59.306667-45.141333 107.306667-100.821333 107.306667H143.445333C87.808 482.858667 42.666667 434.816 42.666667 375.552c0-59.221333 45.141333-107.306667 100.778666-107.306667h251.946667z"
            fill="#36C5F0"
          />
          <path
            d="M798.549333 375.552c0-59.221333 45.098667-107.306667 100.778667-107.306667 55.637333 0 100.778667 48.085333 100.778667 107.306667 0 59.306667-45.141333 107.306667-100.778667 107.306667h-100.778667V375.552zM748.16 375.552c0 59.306667-45.141333 107.306667-100.821333 107.306667-55.637333 0-100.778667-48.042667-100.778667-107.306667V107.306667C546.56 48.042667 591.701333 0 647.338667 0c55.68 0 100.821333 48.042667 100.821333 107.306667v268.245333z"
            fill="#2EB67D"
          />
          <path
            d="M647.381333 804.778667c55.637333 0 100.778667 48.042667 100.778667 107.306666 0 59.264-45.141333 107.306667-100.778667 107.306667-55.68 0-100.821333-48.042667-100.821333-107.306667v-107.306666h100.821333zM647.381333 751.104c-55.68 0-100.821333-48.042667-100.821333-107.306667 0-59.221333 45.141333-107.306667 100.821333-107.306666h251.904c55.68 0 100.778667 48.085333 100.778667 107.306666 0 59.306667-45.098667 107.306667-100.778667 107.306667h-251.904z"
            fill="#ECB22E"
          />
        </svg>
      )
    case 'teams':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="8" height="14" rx="1.5" fill="#5059C9" />
          <rect x="13" y="5" width="8" height="8" rx="1.5" fill="#7B83EB" />
          <rect x="13" y="15" width="8" height="4" rx="1" fill="#5059C9" />
        </svg>
      )
    case 'notion':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="4.2" y="4.2" width="11.6" height="11.6" rx="1.8" {...commonProps} />
          <path d="M7.1 13.2V7.3l5 5.9V7.3" {...commonProps} />
        </svg>
      )
    case 'http':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="6.3" {...commonProps} />
          <path d="M3.9 10h12.2M10 3.7c1.8 1.7 2.8 3.9 2.8 6.3S11.8 14.6 10 16.3M10 3.7C8.2 5.4 7.2 7.6 7.2 10s1 4.6 2.8 6.3" {...commonProps} />
        </svg>
      )
    case 'research':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M4.8 14.8 8.5 10 11 12.8 14.2 8.6 15.8 10" {...commonProps} />
          <path d="M5 5h10v10H5z" {...commonProps} />
        </svg>
      )
    case 'search':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="8.7" cy="8.7" r="4.4" {...commonProps} />
          <path d="m12.1 12.1 3.2 3.2" {...commonProps} />
        </svg>
      )
    case 'browser':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <rect x="3.8" y="4.6" width="12.4" height="10.8" rx="2" {...commonProps} />
          <path d="M3.8 7.6h12.4M7 15.4l1.7-2.4h2.6l1.7 2.4" {...commonProps} />
        </svg>
      )
    case 'dom':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="m6.4 6.1-2.7 3.9 2.7 3.9M13.6 6.1l2.7 3.9-2.7 3.9M8.6 15.2l2.8-10.4" {...commonProps} />
        </svg>
      )
    case 'web':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="6.4" {...commonProps} />
          <path d="M3.9 10h12.2M10 3.8a11 11 0 0 1 0 12.4m0-12.4a11 11 0 0 0 0 12.4" {...commonProps} />
        </svg>
      )
    case 'rate-limit':
      return (
        <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M10 4.2v5.2l3.1 1.8" {...commonProps} />
          <circle cx="10" cy="10" r="5.9" {...commonProps} />
          <path d="M14.9 5.2 16.2 4" {...commonProps} />
        </svg>
      )
  }
}

export function WorkflowToolLibraryPanel({ onClose }: WorkflowToolLibraryPanelProps) {
  const [search, setSearch] = useState('')
  const [expandedCategoryIds, setExpandedCategoryIds] = useState<Record<string, boolean>>({
    tools: true,
    'agent-library': true,
  })
  const [expandedSectionIds, setExpandedSectionIds] = useState<Record<string, boolean>>({
    documents: true,
    collaboration: true,
  })

  const keyword = search.trim().toLowerCase()

  const filteredCategories = useMemo(
    () =>
      TOOL_LIBRARY_CATEGORIES.map((category) => {
        if (category.sections) {
          return {
            ...category,
            sections: category.sections
              .map((section) => ({
                ...section,
                items: section.items.filter((item) => item.label.toLowerCase().includes(keyword)),
              }))
              .filter((section) => section.items.length > 0 || keyword.length === 0),
          }
        }

        return {
          ...category,
          items: category.items?.filter((item) => item.label.toLowerCase().includes(keyword)) ?? [],
        }
      }).filter((category) => {
        if (category.sections) return category.sections.length > 0
        return (category.items?.length ?? 0) > 0
      }),
    [keyword],
  )

  const toggleCategory = (categoryId: string) => {
    setExpandedCategoryIds((prev) => ({ ...prev, [categoryId]: !prev[categoryId] }))
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSectionIds((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const handleToolDragStart = (event: DragEvent<HTMLButtonElement>, item: ToolLibraryToolItem) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(WORKFLOW_TOOL_DRAG_MIME, JSON.stringify(item))
    event.dataTransfer.setData('text/plain', item.label)
    window.dispatchEvent(
      new CustomEvent<WorkflowDragStateDetail>(WORKFLOW_DRAG_STATE_EVENT, {
        detail: { active: true, itemType: item.itemType, item },
      }),
    )
  }

  const handleAgentTemplateDragStart = (
    event: DragEvent<HTMLButtonElement>,
    item: ToolLibraryAgentTemplateItem,
  ) => {
    event.dataTransfer.effectAllowed = 'copy'
    event.dataTransfer.setData(WORKFLOW_AGENT_TEMPLATE_DRAG_MIME, JSON.stringify(item))
    event.dataTransfer.setData('text/plain', item.label)
    window.dispatchEvent(
      new CustomEvent<WorkflowDragStateDetail>(WORKFLOW_DRAG_STATE_EVENT, {
        detail: { active: true, itemType: item.itemType, item },
      }),
    )
  }

  const handleToolDragEnd = () => {
    window.dispatchEvent(
      new CustomEvent<WorkflowDragStateDetail>(WORKFLOW_DRAG_STATE_EVENT, {
        detail: { active: false },
      }),
    )
  }

  return (
    <section className="workflow-tool-panel" aria-label="工具1面板">
      <div className="workflow-tool-panel-header">
        <div>
          <div className="workflow-tool-panel-title">能力资源库</div>
        </div>
        <button className="workflow-tool-panel-close" type="button" onClick={onClose} aria-label="关闭工具面板">
          <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
            <path
              d="m5.8 5.8 8.4 8.4m0-8.4-8.4 8.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <div className="workflow-tool-panel-scroll">
        {filteredCategories.map((category) => {
          const isToolsCategory = category.id === 'tools'
          const expanded = isToolsCategory ? true : (expandedCategoryIds[category.id] ?? true)

          return (
            <div key={category.id} className="workflow-tool-group">
              {!isToolsCategory ? (
                <button
                  className="workflow-tool-group-toggle"
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  aria-expanded={expanded}
                >
                  <span>{category.title}</span>
                </button>
              ) : null}

              {expanded ? (
                <div className="workflow-tool-group-body">
                  {category.id === 'agent-library' ? (
                    <div className="workflow-tool-group-hint">拖入画布以创建智能体节点</div>
                  ) : null}
                  {category.id === 'tools' ? (
                    <>
                      <div className="workflow-tool-search-row">
                        <div className="workflow-tool-search">
                          <span className="workflow-tool-search-icon">
                            <ToolGlyph icon="search" />
                          </span>
                          <input
                            className="workflow-tool-search-input"
                            type="text"
                            placeholder="搜索工具..."
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                          />
                        </div>
                      </div>

                      {category.sections?.map((section) => {
                        const sectionExpanded = expandedSectionIds[section.id] ?? false

                        return (
                          <div key={section.id} className="workflow-tool-section">
                            <button
                              className="workflow-tool-section-toggle"
                              type="button"
                              onClick={() => toggleSection(section.id)}
                              aria-expanded={sectionExpanded}
                            >
                              <span>{section.title}</span>
                            </button>

                            {sectionExpanded ? (
                              <div className="workflow-tool-items">
                                {section.items.map((item) => (
                                  <button
                                    key={item.id}
                                    className="workflow-tool-item"
                                    type="button"
                                    draggable
                                    onDragStart={(event) => handleToolDragStart(event, item as ToolLibraryToolItem)}
                                    onDragEnd={handleToolDragEnd}
                                  >
                                    <span className="workflow-tool-item-icon">
                                      <ToolGlyph icon={item.icon} />
                                    </span>
                                    <span className="workflow-tool-item-label">{item.label}</span>
                                  </button>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        )
                      })}
                    </>
                  ) : (
                    <div className="workflow-tool-items">
                      {category.items?.map((item) => (
                        <button
                          key={item.id}
                          className={
                            item.itemType === 'agent-template'
                              ? 'workflow-tool-item is-agent-template'
                              : 'workflow-tool-item'
                          }
                          type="button"
                          draggable
                          onDragStart={(event) =>
                            item.itemType === 'agent-template'
                              ? handleAgentTemplateDragStart(event, item)
                              : handleToolDragStart(event, item)
                          }
                          onDragEnd={handleToolDragEnd}
                        >
                          <span className="workflow-tool-item-icon">
                            {item.itemType === 'agent-template' ? (
                              <WorkflowIcon icon={item.nodeIcon} />
                            ) : (
                              <ToolGlyph icon={item.icon} />
                            )}
                          </span>
                          <span className="workflow-tool-item-copy">
                            <span className="workflow-tool-item-label">{item.label}</span>
                            {item.itemType === 'agent-template' ? (
                              <span className="workflow-tool-item-hint">拖入画布</span>
                            ) : null}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}
