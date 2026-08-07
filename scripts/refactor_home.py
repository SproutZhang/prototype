"""
精确重构 Home.tsx：只删除 Joyce AI 相关代码，保留 Agent state 等其他代码。
"""

import sys
import re

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

path = "src/pages/Home.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

original_len = len(content)
print(f"Original: {original_len} chars")

def replace_once(old, new, label):
    global content
    if old not in content:
        print(f"WARN: not found: {label}")
        return False
    content = content.replace(old, new, 1)
    print(f"OK: {label}")
    return True

def delete_range(start_marker, end_marker, label, replacement=""):
    """Delete text from start_marker to (not including) end_marker."""
    global content
    si = content.find(start_marker)
    ei = content.find(end_marker, si + len(start_marker))
    if si == -1 or ei == -1:
        print(f"WARN: range not found: {label} (si={si}, ei={ei})")
        return
    removed = ei - si
    content = content[:si] + replacement + content[ei:]
    print(f"OK: deleted {removed} chars for {label}")

# ── 1. Update imports ─────────────────────────────────────────────────────────
replace_once(
    "import {\n"
    "  type CSSProperties,\n"
    "  useCallback,\n"
    "  useEffect,\n"
    "  useId,\n"
    "  useLayoutEffect,\n"
    "  useMemo,\n"
    "  useRef,\n"
    "  useState,\n"
    "  type KeyboardEvent as ReactKeyboardEvent,\n"
    "  type MouseEvent as ReactMouseEvent,\n"
    "  type PointerEvent as ReactPointerEvent,\n"
    "  type ReactNode,\n"
    "} from 'react'\n"
    "import { flushSync } from 'react-dom'\n"
    "import { OnboardingWorkflowPage } from '../components/onboarding/OnboardingWorkflowPage'\n"
    "import { ONBOARDING_OPTIMIZE_LINES } from '../data/onboardingOptimizeMarkdown'",
    "import {\n"
    "  type CSSProperties,\n"
    "  useCallback,\n"
    "  useEffect,\n"
    "  useId,\n"
    "  useLayoutEffect,\n"
    "  useMemo,\n"
    "  useRef,\n"
    "  useState,\n"
    "  type KeyboardEvent as ReactKeyboardEvent,\n"
    "  type MouseEvent as ReactMouseEvent,\n"
    "  type PointerEvent as ReactPointerEvent,\n"
    "  type ReactNode,\n"
    "} from 'react'\n"
    "import { flushSync } from 'react-dom'\n"
    "import { OnboardingWorkflowPage } from '../components/onboarding/OnboardingWorkflowPage'\n"
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n"
    "import { JoyceAiPanel } from '../components/shared/JoyceAiPanel'\n"
    "import { ONBOARDING_OPTIMIZE_LINES } from '../data/onboardingOptimizeMarkdown'\n"
    "import type {\n"
    "  Agent,\n"
    "  AgentRow,\n"
    "  DropdownOption,\n"
    "  ManagerialAgentSettingsDraft,\n"
    "  ScenarioRow,\n"
    "  SingleAgentSettingsDraft,\n"
    "} from '../types/agent'",
    "imports"
)

# ── 2. Remove inline type declarations inside Home() ─────────────────────────
replace_once(
    "  type Agent = {\n"
    "    name: string\n"
    "    desc: string\n"
    "    meta: string\n"
    "  }\n\n"
    "  type DropdownOption = {\n"
    "    id: string\n"
    "    title: string\n"
    "    description?: string\n"
    "    meta?: string\n"
    "  }\n\n"
    "  type SingleAgentSettingsDraft = {\n"
    "    name: string\n"
    "    modelConfig: string\n"
    "    instructions: string\n"
    "    generatedPrompt: string\n"
    "    agentTools: string[]\n"
    "    skills: string[]\n"
    "    knowledge: string[]\n"
    "    tools: string[]\n"
    "  }\n\n"
    "  type ManagerialAgentSettingsDraft = {\n"
    "    name: string\n"
    "    modelConfig: string\n"
    "    instructions: string\n"
    "    generatedPrompt: string\n"
    "    agentTools: string[]\n"
    "    skills: string[]\n"
    "    knowledge: string[]\n"
    "    tools: string[]\n"
    "    managerGoal: string\n"
    "    memberAgents: string[]\n"
    "    delegationStrategy: string\n"
    "    approvalMode: string\n"
    "    escalationTriggers: string[]\n"
    "    successCriteria: string\n"
    "    managerNotes: string\n"
    "    managerEnabled: boolean\n"
    "    managerAgents: { id: string; agentName: string; usage: string; source: 'agent' | 'a2a' }[]\n"
    "  }\n\n"
    "  const initialAgents",
    "  const initialAgents",
    "Agent/DropdownOption/Draft type decls"
)

replace_once(
    "  type ScenarioRow = Agent & {\n"
    "    tag: string\n"
    "    category: 'medical' | 'finance' | 'tech' | 'accounting'\n"
    "  }\n\n"
    "  const renderScenarioDetail",
    "  const renderScenarioDetail",
    "ScenarioRow type"
)

replace_once(
    "  type AgentRow = Agent & { tag: string }\n\n  const renderAgentEdit",
    "  const renderAgentEdit",
    "AgentRow type"
)

# ── 3. Remove openAgentMenu + Joyce AI panel state ────────────────────────────
replace_once(
    "  const [openAgentMenu, setOpenAgentMenu] = useState<string | null>(null)\n"
    "  const [isRunsExpanded, setIsRunsExpanded] = useState(true)\n"
    "  const [isAiPanelCollapsed, setIsAiPanelCollapsed] = useState(true)\n"
    "  const [aiPanelWidthPx, setAiPanelWidthPx] = useState(360)\n"
    "  const [isAiResizeDragging, setIsAiResizeDragging] = useState(false)",
    "  const [isRunsExpanded, setIsRunsExpanded] = useState(true)",
    "openAgentMenu + AI panel state"
)

# ── 4. Remove joyceAiLogoGradId ───────────────────────────────────────────────
replace_once(
    "  const joyceAiLogoGradId = `joyce-ai-logo-${tabListId.replace(/:/g, '')}`\n"
    "  const runSearchInputId",
    "  const runSearchInputId",
    "joyceAiLogoGradId"
)

# ── 5a. Delete clampAiPanelWidth → just before agentChatInput ────────────────
# From "\n  const clampAiPanelWidth..." to "\n\n  const [agentChatInput..."
delete_range(
    "\n  const clampAiPanelWidth = useCallback((w: number) => {",
    "\n  const [agentChatInput, setAgentChatInput] = useState('')",
    "clampAiPanelWidth + float handlers + effects",
    "\n"
)

# ── 5b. Delete agentChatInput + agentChatMessages state ──────────────────────
replace_once(
    "  const [agentChatInput, setAgentChatInput] = useState('')\n"
    "  const [agentChatMessages, setAgentChatMessages] = useState<\n"
    "    { id: string; role: 'user' | 'assistant'; text: string }[]\n"
    "  >([{ id: 'welcome', role: 'assistant', text: '你好，我是 Joyce AI，可在此咨询 Agent 相关问题。' }])\n",
    "",
    "agentChatInput/Messages state"
)

# ── 5c. Delete sendAgentChat function ─────────────────────────────────────────
replace_once(
    "\n  const sendAgentChat = () => {\n"
    "    const text = agentChatInput.trim()\n"
    "    if (!text) return\n"
    "    const id = `${Date.now()}`\n"
    "    setAgentChatMessages((prev) => [\n"
    "      ...prev,\n"
    "      { id: `${id}-u`, role: 'user', text },\n"
    "      {\n"
    "        id: `${id}-a`,\n"
    "        role: 'assistant',\n"
    "        text: '（演示）已收到你的消息。接入后端后可返回真实 AI 回复。',\n"
    "      },\n"
    "    ])\n"
    "    setAgentChatInput('')\n"
    "  }\n",
    "\n",
    "sendAgentChat function"
)

# ── 5d. Delete renderJoyceAiSplitLayout function ──────────────────────────────
delete_range(
    "\n  const renderJoyceAiSplitLayout = (sectionAriaLabel: string, main: ReactNode) => {",
    "\n  const scenarioConfigTagline = (",
    "renderJoyceAiSplitLayout function",
    "\n"
)

# ── 6. Remove scenarioConfigTagline (already in AgentCardsGrid) ───────────────
replace_once(
    "  const scenarioConfigTagline = (\n"
    "    <div className=\"agents-subtitle agents-subtitle--tagline\" aria-label=\"场景·Agent·流程·动作\">\n"
    "      <span className=\"agents-subtitle-part\">场景</span>\n"
    "      <span className=\"agents-subtitle-dot\" aria-hidden=\"true\">\n"
    "        ·\n"
    "      </span>\n"
    "      <span className=\"agents-subtitle-part\">Agent</span>\n"
    "      <span className=\"agents-subtitle-dot\" aria-hidden=\"true\">\n"
    "        ·\n"
    "      </span>\n"
    "      <span className=\"agents-subtitle-part\">流程</span>\n"
    "      <span className=\"agents-subtitle-dot\" aria-hidden=\"true\">\n"
    "        ·\n"
    "      </span>\n"
    "      <span className=\"agents-subtitle-part\">动作</span>\n"
    "    </div>\n"
    "  )\n\n"
    "  const renderWorkflowNodeDeleteButton",
    "  const renderWorkflowNodeDeleteButton",
    "scenarioConfigTagline"
)

# ── 7. Modify renderScenarioDetail/Edit/AgentEdit to return main only ─────────
replace_once(
    "    return renderJoyceAiSplitLayout(`场景详情 · ${row.name}`, main)\n"
    "  }\n\n"
    "  const renderScenarioEdit",
    "    return main\n"
    "  }\n\n"
    "  const renderScenarioEdit",
    "renderScenarioDetail return"
)

replace_once(
    "    return renderJoyceAiSplitLayout(`编辑场景 · ${row.name}`, main)\n"
    "  }\n\n"
    "  const renderAgentEdit",
    "    return main\n"
    "  }\n\n"
    "  const renderAgentEdit",
    "renderScenarioEdit return"
)

replace_once(
    "    return renderJoyceAiSplitLayout(`编辑 Agent · ${row.name}`, main)\n"
    "  }\n\n"
    "  const renderCardsPage",
    "    return main\n"
    "  }\n\n"
    "  const renderCardsPage",
    "renderAgentEdit return"
)

# ── 8. Delete renderCardsPage function ────────────────────────────────────────
delete_range(
    "\n  const renderCardsPage = <T extends { name: string; desc: string; meta: string; tag: string }>(\n",
    "\n  const renderSingleAgentSettingsPage",
    "renderCardsPage function",
    "\n"
)

# ── 9. Replace activePage JSX blocks ─────────────────────────────────────────
BLOCK_START = "        ) : activePage === 'agent-library' ? ("
BLOCK_END_MARKERS = [
    "        ) : null}\n      </div>\n    </div>",  # try1
    "        ) : null}\n",                            # try2
]

bs = content.find(BLOCK_START)
if bs == -1:
    print("WARN: activePage block start not found")
else:
    # Find the closing ) : null}
    be = -1
    be_len = 0
    for marker in BLOCK_END_MARKERS:
        idx = content.find(marker, bs)
        if idx != -1:
            be = idx
            be_len = len(marker)
            break
    
    if be == -1:
        print("WARN: activePage block end not found, searching manually...")
        # Search for the closing pattern
        search = content[bs:bs+20000]
        for pat in [") : null}\n      </div>", ") : null}\n"]:
            idx = search.rfind(pat)
            if idx != -1:
                be = bs + idx
                be_len = len(pat)
                print(f"  Found at offset {idx}")
                break
    
    if be != -1:
        removed_block = content[bs:be + be_len]
        print(f"OK: found activePage block ({be - bs} chars)")
        
        NEW_BLOCK = '''        ) : (
          <JoyceAiPanel
            sectionAriaLabel={
              activePage === 'analytics' ? '分析'
              : activePage === 'experience' ? '体验'
              : activePage === 'agent-library'
                ? (editingAgentName ? `编辑 Agent · ${editingAgentName}`
                   : selectedSingleAgent ? selectedSingleAgent.name
                   : selectedManagerialAgent ? selectedManagerialAgent.name
                   : 'Agents')
              : (editingScenarioName ? `编辑场景 · ${editingScenarioName}`
                 : selectedScenarioName ? `场景详情 · ${selectedScenarioName}`
                 : '场景配置')
            }
          >
            {activePage === 'agent-library' ? (
              (() => {
                if (editingAgentName != null) {
                  const row = agentsWithDerived.find((a) => a.name === editingAgentName)
                  if (row) return renderAgentEdit(row)
                }
                if (selectedSingleAgent) return renderSingleAgentSettingsPage()
                if (selectedManagerialAgent) {
                  return isOnboardingWorkflowOpen ? (
                    <OnboardingWorkflowPage
                      managerName={selectedManagerialAgent.name}
                      modelConfig={selectedManagerialAgent.modelConfig}
                      instructions={selectedManagerialAgent.instructions}
                      generatedPrompt={selectedManagerialAgent.generatedPrompt}
                      managerAgents={selectedManagerialAgent.managerAgents}
                      onBack={() => setIsOnboardingWorkflowOpen(false)}
                    />
                  ) : (
                    renderManagerialAgentSettingsPage()
                  )
                }
                return (
                  <AgentCardsGrid
                    title="Agents"
                    primaryActionLabel="+ Create Agent"
                    tabs={[
                      { key: 'all', label: 'All', count: agentsWithDerived.length },
                      { key: 'single', label: 'Single', count: singleAgents.length },
                      { key: 'managerial', label: 'Managerial', count: managerialAgents.length },
                    ]}
                    activeTab={agentsTab}
                    onTabChange={(k) => setAgentsTab(k as typeof agentsTab)}
                    items={filteredAgents}
                    tagLabel={(a) => (agentsTab === 'managerial' ? 'Managerial Agent' : a.tag)}
                    onEditItem={(item) => setEditingAgentName(item.name)}
                    onOpenSingleAgent={(item) => openSingleAgentSettings(item as unknown as Agent)}
                    onOpenManagerialAgent={(item) => openManagerialAgentSettings(item as unknown as Agent)}
                    onDuplicateItem={(item) => {
                      setAgents((prev) => {
                        const used = new Set(prev.map((x) => x.name))
                        const name = makeDuplicateName(item.name, used)
                        const copy: Agent = { name, desc: item.desc, meta: 'just now' }
                        if (item.tag === 'Single Agent') {
                          setSingleAgentSettingsByKey((p) => {
                            const src = p[item.name] ?? createSingleAgentDraft(item as unknown as Agent)
                            return { ...p, [name]: { ...src, name } }
                          })
                        }
                        if (item.tag === 'Managerial Agent') {
                          setManagerialAgentSettingsByKey((p) => {
                            const src = p[item.name] ?? createManagerialAgentDraft(item as unknown as Agent)
                            return { ...p, [name]: { ...src, name } }
                          })
                        }
                        const idx = prev.findIndex((x) => x.name === item.name)
                        return idx === -1 ? [copy, ...prev] : [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
                      })
                    }}
                    onDeleteItem={(item) => {
                      setAgents((prev) => prev.filter((x) => x.name !== item.name))
                      setSingleAgentSettingsByKey((prev) => {
                        if (!(item.name in prev)) return prev
                        const next = { ...prev }; delete next[item.name]; return next
                      })
                      setManagerialAgentSettingsByKey((prev) => {
                        if (!(item.name in prev)) return prev
                        const next = { ...prev }; delete next[item.name]; return next
                      })
                      setSelectedSingleAgentKey((prev) => (prev === item.name ? null : prev))
                      setSelectedManagerialAgentKey((prev) => (prev === item.name ? null : prev))
                    }}
                  />
                )
              })()
            ) : activePage === 'scenarios' ? (
              (() => {
                const withCat: ScenarioRow[] = agentsWithDerived.map((a) => ({
                  name: a.name, desc: a.desc, meta: a.meta, tag: a.tag,
                  category: pickScenarioCategory(a.name) as ScenarioRow['category'],
                }))
                const medical = withCat.filter((a) => a.category === 'medical')
                const finance = withCat.filter((a) => a.category === 'finance')
                const tech = withCat.filter((a) => a.category === 'tech')
                const accounting = withCat.filter((a) => a.category === 'accounting')
                const filtered =
                  scenariosTab === 'medical' ? medical
                  : scenariosTab === 'finance' ? finance
                  : scenariosTab === 'tech' ? tech
                  : scenariosTab === 'accounting' ? accounting
                  : withCat
                const selectedRow = selectedScenarioName == null
                  ? null : (withCat.find((x) => x.name === selectedScenarioName) ?? null)
                const editingRow = editingScenarioName == null
                  ? null : (withCat.find((x) => x.name === editingScenarioName) ?? null)
                if (editingRow) return renderScenarioEdit(editingRow)
                if (selectedRow) return renderScenarioDetail(selectedRow)
                return (
                  <AgentCardsGrid
                    title="场景配置"
                    primaryActionLabel="+ 创建场景"
                    tabs={[
                      { key: 'all', label: '全部', count: withCat.length },
                      { key: 'medical', label: '医疗', count: medical.length },
                      { key: 'finance', label: '金融', count: finance.length },
                      { key: 'tech', label: '科技', count: tech.length },
                      { key: 'accounting', label: '财务', count: accounting.length },
                    ]}
                    activeTab={scenariosTab}
                    onTabChange={(k) => setScenariosTab(k as typeof scenariosTab)}
                    items={filtered}
                    tagLabel={(a) =>
                      a.category === 'medical' ? '医疗'
                      : a.category === 'finance' ? '金融'
                      : a.category === 'tech' ? '科技'
                      : '财务'
                    }
                    onCardClick={(item) => setSelectedScenarioName(item.name)}
                    onEditItem={(item) => setEditingScenarioName(item.name)}
                    onDuplicateItem={(item) => {
                      setAgents((prev) => {
                        const used = new Set(prev.map((x) => x.name))
                        const name = makeDuplicateName(item.name, used)
                        const idx = prev.findIndex((x) => x.name === item.name)
                        const copy: Agent = { name, desc: item.desc, meta: 'just now' }
                        return idx === -1 ? [copy, ...prev] : [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]
                      })
                    }}
                    onDeleteItem={(item) => {
                      setAgents((prev) => prev.filter((x) => x.name !== item.name))
                      if (selectedScenarioName === item.name) setSelectedScenarioName(null)
                      if (editingScenarioName === item.name) setEditingScenarioName(null)
                    }}
                  />
                )
              })()
            ) : (
              <header className="agents-header">
                <div>
                  <div className="agents-title">
                    {activePage === 'experience' ? '体验' : '分析'}
                  </div>
                  <div className="agents-subtitle">
                    {activePage === 'experience'
                      ? '在此试用与预览产品能力。'
                      : '在此查看数据指标与运营分析。'}
                  </div>
                </div>
              </header>
            )}
          </JoyceAiPanel>
        )}\n      </div>\n    </div>'''

        content = content[:bs] + NEW_BLOCK + content[be + be_len:]
        print("OK: activePage blocks replaced")
    else:
        print("WARN: could not locate activePage block end")

# ── 10. Clean up global mousedown/keydown listeners ──────────────────────────
replace_once(
    "      if (target.closest('.agent-card-more-wrap')) return\n"
    "      if (target.closest('.single-agent-select-wrap')) return\n",
    "      if (target.closest('.single-agent-select-wrap')) return\n",
    "agent-card-more-wrap check"
)

for old in [
    "      setOpenAgentMenu(null)\n      setOpenSettingsDropdown(null)\n      setOpenManagerAgentPickerRowId",
    "      setOpenAgentMenu(null)\n      setOpenSettingsDropdown(null)\n",
]:
    if old in content:
        new = old.replace("      setOpenAgentMenu(null)\n", "")
        content = content.replace(old, new, 1)
        print("OK: setOpenAgentMenu removed from handler")
        break

# ── 11. Simplify Joyce AI toolbar button ─────────────────────────────────────
replace_once(
    "            onClick={() => {\n"
    "              if (isAiPanelFloating) {\n"
    "                endAiFloat()\n"
    "              }\n"
    "              setIsAiPanelCollapsed(false)\n"
    "            }}",
    "            onClick={() => { /* Joyce AI panel manages its own state */ }}",
    "toolbar Joyce AI button"
)

# ── 12. Fix remaining unused imports / undeclared names ───────────────────────
# Remove unused CSSProperties import
replace_once(
    "  type CSSProperties,\n",
    "",
    "remove CSSProperties import"
)
# Remove unused ReactMouseEvent import
replace_once(
    "  type MouseEvent as ReactMouseEvent,\n",
    "",
    "remove ReactMouseEvent import"
)
# Remove agentIconPalettes array + pickAgentIconPalette (already in AgentCardsGrid)
delete_range(
    "\n  const agentIconPalettes = [",
    "\n  const initialAgents",
    "agentIconPalettes + pickAgentIconPalette",
    "\n"
)
# Remove remaining setOpenAgentMenu call in onKeyDown listener
replace_once(
    "      setOpenAgentMenu(null)\n      setOpenSettingsDropdown(null)\n"
    "      setOpenManagerAgentPickerRowId(null)\n"
    "      if (!isInstructionGenerating) setIsInstructionModalOpen(false)",
    "      setOpenSettingsDropdown(null)\n"
    "      setOpenManagerAgentPickerRowId(null)\n"
    "      if (!isInstructionGenerating) setIsInstructionModalOpen(false)",
    "setOpenAgentMenu in keydown handler"
)

# ── Write ─────────────────────────────────────────────────────────────────────
with open(path, "w", encoding="utf-8") as f:
    f.write(content)

print(f"\nDone! {original_len} -> {len(content)} chars (saved {original_len - len(content)} chars)")

# Verify
remaining = []
for sym in ["isAiPanelCollapsed", "isAiPanelFloating", "aiPanelWidthPx", "openAgentMenu",
            "agentChatInput", "agentChatMessages", "sendAgentChat", "renderCardsPage",
            "renderJoyceAiSplitLayout", "joyceAiLogoGradId", "clampAiPanelWidth",
            "pickAgentIconPalette"]:
    if sym in content:
        remaining.append(sym)
if remaining:
    print(f"WARN still referenced: {remaining}")
else:
    print("OK: all removed symbols cleaned up")
