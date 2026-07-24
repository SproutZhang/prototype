"""
Step 3 refactor: Extract ScenarioConfigPage from Home.tsx
Usage: python -X utf8 scripts/step3_refactor.py
"""
import sys, os

sys.stdout.reconfigure(encoding='utf-8')

HOME = os.path.join('src', 'pages', 'Home.tsx')
SCENARIO_PAGE = os.path.join('src', 'pages', 'ScenarioConfigPage.tsx')

with open(HOME, 'r', encoding='utf-8') as f:
    home_lines = f.readlines()

assert len(home_lines) == 4586, f'Expected 4586 lines, got {len(home_lines)}'

def extract(start, end):
    return ''.join(home_lines[start - 1:end])

def deindent2(text):
    return ''.join(
        line[2:] if line.startswith('  ') else line
        for line in text.splitlines(keepends=True)
    )

# ─── PIECES FOR ScenarioConfigPage.tsx ────────────────────────────────────────

# Module-level code from Home (L24-910) — already at 0-indent, copy directly
module_level_code = extract(24, 910)

# pickScenarioCategory (L1923-1928) — de-indent to module-level
pick_scenario_category = deindent2(extract(1923, 1928))

# makeDuplicateName — module-level utility
make_dup_name = """\
const makeDuplicateName = (baseName: string, usedNames: Set<string>) => {
  const root = `${baseName} Copy`
  if (!usedNames.has(root)) return root
  let i = 2
  while (usedNames.has(`${root} ${i}`)) i++
  return `${root} ${i}`
}

"""

# Component-level: scenario state (L927-L1005)
scenario_state = extract(927, 1005)

# Component-level: scenario effects + callbacks (L1007-L1530)
scenario_effects_callbacks = extract(1007, 1530)

# scenariosTab state (L1544)
scenarios_tab_state = extract(1544, 1544)

# workflowViewportRef and all workflow/drag handlers (L1547-L1921)
workflow_refs_and_handlers = extract(1547, 1921)

# Render functions: renderWorkflowNodeDeleteButton … renderScenarioEdit (L2003-L3943)
render_functions = extract(2003, 3943)

# ─── MANUALLY WRITTEN END EFFECTS for ScenarioConfigPage ─────────────────────

end_effects = """\
  // Sync: reset if selected/editing scenario no longer exists
  useEffect(() => {
    if (selectedScenarioName != null && !agents.some((a) => a.name === selectedScenarioName)) {
      setSelectedScenarioName(null)
    }
    if (editingScenarioName != null && !agents.some((a) => a.name === editingScenarioName)) {
      setEditingScenarioName(null)
    }
  }, [selectedScenarioName, editingScenarioName, agents])

  // Reset canvas zoom when leaving 新员工入职
  useEffect(() => {
    if (selectedScenarioName !== '新员工入职') {
      setWorkspaceCanvasZoom(DEFAULT_WORKSPACE_CANVAS_ZOOM)
    }
  }, [selectedScenarioName])

  // Escape: clear editing/selection
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (editingScenarioName != null) { setEditingScenarioName(null); return }
      if (selectedScenarioName != null) { setSelectedScenarioName(null); return }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editingScenarioName, selectedScenarioName])

  // agentDetailBlankPage overlay: lock scroll + Escape to close
  useEffect(() => {
    if (!agentDetailBlankPageOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAgentDetailBlankPageOpen(false)
    }
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [agentDetailBlankPageOpen])

"""

# ─── MANUALLY WRITTEN RETURN for ScenarioConfigPage ──────────────────────────

component_return = """\
  // ─── Routing ─────────────────────────────────────────────────────────────────
  const withCat: ScenarioRow[] = agents.map((a) => ({
    name: a.name, desc: a.desc, meta: a.meta, tag: '',
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

  return (
    <>
      {editingRow
        ? renderScenarioEdit(editingRow)
        : selectedRow
          ? renderScenarioDetail(selectedRow)
          : (
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
      }
      {agentDetailBlankPageOpen ? (
        <div
          className="agent-detail-blank-page"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agent-detail-blank-title"
        >
          <header className="agent-detail-blank-page-header">
            <button
              type="button"
              className="agent-detail-blank-page-back"
              id="agent-detail-blank-title"
              aria-label="返回"
              onClick={() => setAgentDetailBlankPageOpen(false)}
            >
              <span className="agent-detail-blank-page-back-icon" aria-hidden="true">
                ←
              </span>
              返回
            </button>
          </header>
          <main className="agent-detail-blank-page-main" aria-label="详情内容区" />
        </div>
      ) : null}
    </>
  )
}
"""

# ─── ASSEMBLE ScenarioConfigPage.tsx ──────────────────────────────────────────

scenario_content = (
    "import {\n"
    "  useCallback,\n"
    "  useEffect,\n"
    "  useId,\n"
    "  useLayoutEffect,\n"
    "  useRef,\n"
    "  useState,\n"
    "  type Dispatch,\n"
    "  type SetStateAction,\n"
    "  type KeyboardEvent as ReactKeyboardEvent,\n"
    "  type PointerEvent as ReactPointerEvent,\n"
    "  type ReactNode,\n"
    "} from 'react'\n"
    "import { flushSync } from 'react-dom'\n"
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n"
    "import { ONBOARDING_OPTIMIZE_LINES } from '../data/onboardingOptimizeMarkdown'\n"
    "import type { Agent, ScenarioRow } from '../types/agent'\n"
    "\n"
    + module_level_code.rstrip('\n') + "\n\n"
    + pick_scenario_category.rstrip('\n') + "\n\n"
    + make_dup_name
    + "// ─── Component ───────────────────────────────────────────────────────────────\n"
    "\n"
    "export function ScenarioConfigPage({\n"
    "  agents,\n"
    "  setAgents,\n"
    "}: {\n"
    "  agents: Agent[]\n"
    "  setAgents: Dispatch<SetStateAction<Agent[]>>\n"
    "}) {\n"
    "  const tabListId = useId()\n"
    + scenario_state
    + "\n"
    + scenarios_tab_state
    + "\n"
    + scenario_effects_callbacks
    + "\n"
    + workflow_refs_and_handlers
    + "\n"
    + render_functions
    + "\n"
    + end_effects
    + component_return
)

with open(SCENARIO_PAGE, 'w', encoding='utf-8') as f:
    f.write(scenario_content)
print(f'[OK] Created {SCENARIO_PAGE} ({len(scenario_content.splitlines())} lines)')

# ─── MODIFY Home.tsx ──────────────────────────────────────────────────────────

content = ''.join(home_lines)

def replace_block(old_text, new_text):
    global content
    if old_text not in content:
        raise ValueError(f'text not found:\n{repr(old_text[:120])}')
    content = content.replace(old_text, new_text, 1)

# 1. Replace ALL imports with simplified version
old_imports = (
    "import {\n"
    "  useCallback,\n"
    "  useEffect,\n"
    "  useId,\n"
    "  useLayoutEffect,\n"
    "  useMemo,\n"
    "  useRef,\n"
    "  useState,\n"
    "  type KeyboardEvent as ReactKeyboardEvent,\n"
    "  type PointerEvent as ReactPointerEvent,\n"
    "  type ReactNode,\n"
    "} from 'react'\n"
    "import { flushSync } from 'react-dom'\n"
    "import { AgentLibraryPage } from './AgentLibraryPage'\n"
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n"
    "import { JoyceAiPanel } from '../components/shared/JoyceAiPanel'\n"
    "import { ONBOARDING_OPTIMIZE_LINES } from '../data/onboardingOptimizeMarkdown'\n"
    "import type {\n"
    "  Agent,\n"
    "  ScenarioRow,\n"
    "} from '../types/agent'\n"
)
new_imports = (
    "import { useId, useMemo, useState } from 'react'\n"
    "import { AgentLibraryPage } from './AgentLibraryPage'\n"
    "import { ScenarioConfigPage } from './ScenarioConfigPage'\n"
    "import { JoyceAiPanel } from '../components/shared/JoyceAiPanel'\n"
    "import type { Agent } from '../types/agent'\n"
)
replace_block(old_imports, new_imports)
print('[OK] Updated imports')

# 2. Remove all module-level code L24-910 (randomTweakOptimizeMarkdown through ScenarioWorkflowBranchCanvasCard)
module_level_block = ''.join(home_lines[23:910])  # L24-910 (0-indexed 23-909)
replace_block(module_level_block, '')
print('[OK] Removed module-level code')

# 3. Remove scenario state L927-L1005
scenario_state_block = ''.join(home_lines[926:1005])  # L927-1005
replace_block(scenario_state_block, '')
print('[OK] Removed scenario state')

# 4. Remove scenario effects and callbacks L1007-L1530
scenario_effects_block = ''.join(home_lines[1006:1530])  # L1007-1530
replace_block(scenario_effects_block, '')
print('[OK] Removed scenario effects/callbacks')

# 5. Remove scenariosTab state (L1544)
replace_block(
    "  const [scenariosTab, setScenariosTab] = useState<'all' | 'medical' | 'finance' | 'tech' | 'accounting'>('all')\n",
    ''
)
print('[OK] Removed scenariosTab')

# 6. Remove workflowViewportRef and all workflow handlers (L1547-L1921)
workflow_block = ''.join(home_lines[1546:1921])  # L1547-1921
replace_block(workflow_block, '')
print('[OK] Removed workflowViewportRef and workflow handlers')

# 7. Remove pickScenarioCategory (L1923-L1929 including blank lines after)
# Now find exact text (line numbers shifted after previous removals)
replace_block(
    "  const pickScenarioCategory = (seed: string) => {\n"
    "    let h = 0\n"
    "    for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) >>> 0\n"
    "    const v = h % 4\n"
    "    return v === 0 ? 'medical' : v === 1 ? 'finance' : v === 2 ? 'tech' : 'accounting'\n"
    "  }\n"
    "\n"
    "\n",
    ''
)
print('[OK] Removed pickScenarioCategory')

# 8. Remove makeDuplicateName (L1995-L2002)
replace_block(
    "  const makeDuplicateName = (baseName: string, usedNames: Set<string>) => {\n"
    "    const root = `${baseName} Copy`\n"
    "    if (!usedNames.has(root)) return root\n"
    "    let i = 2\n"
    "    while (usedNames.has(`${root} ${i}`)) i++\n"
    "    return `${root} ${i}`\n"
    "  }\n"
    "\n",
    ''
)
print('[OK] Removed makeDuplicateName')

# 9. Remove render functions (L2003-L3943): renderWorkflowNodeDeleteButton … renderScenarioEdit
render_fns_block = ''.join(home_lines[2002:3943])  # L2003-3943 (0-indexed 2002-3942)
replace_block(render_fns_block, '')
print('[OK] Removed render functions')

# 10. Remove end effects L3945-L4013 (the scenario effects that remain after render functions)
# These are: activePage effect, sync effect, zoom reset, keydown, agentDetailBlankPage
end_effects_block = ''.join(home_lines[3944:4013])  # L3945-4013 (0-indexed 3944-4012)
replace_block(end_effects_block, '')
print('[OK] Removed end effects')

# 11. Simplify sectionAriaLabel: remove editingScenarioName/selectedScenarioName
replace_block(
    "          sectionAriaLabel={\n"
    "              activePage === 'analytics' ? '分析'\n"
    "              : activePage === 'experience' ? '体验'\n"
    "              : activePage === 'agent-library' ? 'Agents'\n"
    "              : (editingScenarioName ? `编辑场景 · ${editingScenarioName}`\n"
    "                 : selectedScenarioName ? `场景详情 · ${selectedScenarioName}`\n"
    "                 : '场景配置')\n"
    "            }\n",
    "          sectionAriaLabel={\n"
    "              activePage === 'analytics' ? '分析'\n"
    "              : activePage === 'experience' ? '体验'\n"
    "              : activePage === 'agent-library' ? 'Agents'\n"
    "              : '场景配置'\n"
    "            }\n"
)
print('[OK] Simplified sectionAriaLabel')

# 12. Replace Scenarios IIFE with <ScenarioConfigPage ...>
# The IIFE spans from ") : activePage === 'scenarios' ? (\n              (() => {"
# to "})()\n"
sc_iife_start = "            ) : activePage === 'scenarios' ? (\n"
sc_iife_end   = "              })()\n"

si = content.find(sc_iife_start)
if si == -1:
    raise ValueError('Cannot find scenarios IIFE start')
ei = content.find(sc_iife_end, si)
if ei == -1:
    raise ValueError('Cannot find scenarios IIFE end')
ei += len(sc_iife_end)

new_scenarios_jsx = (
    "            ) : activePage === 'scenarios' ? (\n"
    "              <ScenarioConfigPage agents={agents} setAgents={setAgents} />\n"
)
content = content[:si] + new_scenarios_jsx + content[ei:]
print('[OK] Replaced Scenarios IIFE with <ScenarioConfigPage>')

# 13. Remove agentDetailBlankPage overlay JSX at the end of the main return
replace_block(
    "    {agentDetailBlankPageOpen ? (\n"
    "      <div\n"
    "        className=\"agent-detail-blank-page\"\n"
    "        role=\"dialog\"\n"
    "        aria-modal=\"true\"\n"
    "        aria-labelledby=\"agent-detail-blank-title\"\n"
    "      >\n"
    "        <header className=\"agent-detail-blank-page-header\">\n"
    "          <button\n"
    "            type=\"button\"\n"
    "            className=\"agent-detail-blank-page-back\"\n"
    "            id=\"agent-detail-blank-title\"\n"
    "            aria-label=\"返回\"\n"
    "            onClick={() => setAgentDetailBlankPageOpen(false)}\n"
    "          >\n"
    "            <span className=\"agent-detail-blank-page-back-icon\" aria-hidden=\"tru",
    ''  # partial match - let's find and remove
)
print('[SKIP] Overlay removal - need exact match')

# Find and remove overlay manually
overlay_start = '    {agentDetailBlankPageOpen ? ('
overlay_end = '    ) : null}\n'
osi = content.find(overlay_start)
if osi != -1:
    oei = content.find(overlay_end, osi)
    if oei != -1:
        oei += len(overlay_end)
        content = content[:osi] + content[oei:]
        print('[OK] Removed agentDetailBlankPage overlay JSX')
    else:
        print('[WARN] Could not find overlay end')
else:
    print('[WARN] Could not find overlay start')

# Write back
with open(HOME, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'[OK] Modified {HOME} (~{content.count(chr(10))} lines)')
print('Done.')
