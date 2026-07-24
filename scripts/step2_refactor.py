"""
Step 2 refactor: Extract AgentLibraryPage from Home.tsx
Usage: python -X utf8 scripts/step2_refactor.py
"""
import sys, os, re

sys.stdout.reconfigure(encoding='utf-8')

HOME = os.path.join('src', 'pages', 'Home.tsx')
AGENT_LIB = os.path.join('src', 'pages', 'AgentLibraryPage.tsx')

with open(HOME, 'r', encoding='utf-8') as f:
    home_lines = f.readlines()

assert len(home_lines) == 6343, f'Expected 6343 lines, got {len(home_lines)}'

def extract(start, end):
    """Extract lines [start..end] (1-based, inclusive)."""
    return ''.join(home_lines[start - 1:end])

def deindent2(text):
    """Remove 2 leading spaces from each line."""
    return ''.join(
        line[2:] if line.startswith('  ') else line
        for line in text.splitlines(keepends=True)
    )

def deindent(text, n):
    """Remove n leading spaces from each line."""
    return ''.join(
        line[n:] if line.startswith(' ' * n) else line
        for line in text.splitlines(keepends=True)
    )

# ─── MODULE-LEVEL PIECES (de-indented) ────────────────────────────────────────

pick_agent_tag      = deindent2(extract(1929, 1934))  # const pickAgentTag
initial_agents      = deindent2(extract(1943, 2004))  # const initialAgents
options_data        = deindent2(extract(2005, 2160))  # modelConfigOptions … managerialEscalationOptions
helper_fns          = deindent2(extract(2161, 2193))  # hashSeed … buildInstructionContextForAgent
build_prompt        = deindent2(extract(2277, 2315))  # buildGeneratedPrompt (BEFORE createSingleAgentDraft)
create_single       = deindent2(extract(2195, 2213))  # createSingleAgentDraft
init_single_members = deindent2(extract(2215, 2221))  # initialSingleAgentMemberOptions
create_managerial   = deindent2(extract(2223, 2275))  # createManagerialAgentDraft

make_dup_name = """\
const makeDuplicateName = (baseName: string, usedNames: Set<string>) => {
  const root = `${baseName} Copy`
  if (!usedNames.has(root)) return root
  let i = 2
  while (usedNames.has(`${root} ${i}`)) i++
  return `${root} ${i}`
}

"""

# ─── COMPONENT-LEVEL PIECES (kept at 2-space indent) ─────────────────────────

editing_agent_name_state = extract(933, 933)   # const [editingAgentName,...]
agents_tab_state         = extract(1549, 1549) # const [agentsTab,...]

# singleAgentSettingsByKey … isOnboardingWorkflowOpen (L2318-L2359)
settings_state = extract(2318, 2359)

# agentsWithDerived + derived + selectedSingleAgent/selectedManagerialAgent (L2369-L2393)
derived_state = extract(2369, 2393)

# useEffect for selectedManagerialAgentKey → setIsOnboardingWorkflowOpen (L2394-L2396)
effect_workflow_open = extract(2394, 2396)

# Helper functions (L2398-L2488): updateSelectedSingleAgent … openManagerialAgentSettings
helper_component_fns = extract(2398, 2488)

# Render functions
render_agent_edit   = extract(4434, 4463)
render_single_agent = extract(4464, 4902)
render_managerial   = extract(4903, 5597)  # ends at closing } of the function (not the effects!)

# IIFE content: the routing/return logic (L6166-L6236, skipping the IIFE opener at L6165)
# De-indent by 14 spaces (from 16-space IIFE body to 2-space component body)
iife_content = deindent(extract(6166, 6236), 14)

# ─── GLOBAL EVENT LISTENER for AgentLibraryPage ───────────────────────────────

global_listener = """\
  // Global Escape / click-outside handler for this page
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return
      if (target.closest('.single-agent-select-wrap')) return
      if (target.closest('.single-agent-modal')) return
      if (target.closest('.manager-agent-select-wrap')) return
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      setOpenSettingsDropdown(null)
      setOpenManagerAgentPickerRowId(null)
      if (!isInstructionGenerating) setIsInstructionModalOpen(false)
      if (editingAgentName != null) {
        setEditingAgentName(null)
      }
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [editingAgentName, isInstructionGenerating])

"""

# ─── ASSEMBLE AgentLibraryPage.tsx ────────────────────────────────────────────

agent_lib_content = (
    "import { useState, useEffect, type Dispatch, type SetStateAction } from 'react'\n"
    "import { OnboardingWorkflowPage } from '../components/onboarding/OnboardingWorkflowPage'\n"
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n"
    "import type {\n"
    "  Agent,\n"
    "  AgentRow,\n"
    "  DropdownOption,\n"
    "  ManagerialAgentSettingsDraft,\n"
    "  SingleAgentSettingsDraft,\n"
    "} from '../types/agent'\n"
    "\n"
    "// ─── Module-level utilities ───────────────────────────────────────────────────\n"
    "\n"
    + pick_agent_tag.rstrip('\n') + "\n\n"
    + initial_agents.rstrip('\n') + "\n\n"
    + options_data.rstrip('\n') + "\n\n"
    + helper_fns.rstrip('\n') + "\n\n"
    + build_prompt.rstrip('\n') + "\n\n"
    + create_single.rstrip('\n') + "\n\n"
    + init_single_members.rstrip('\n') + "\n\n"
    + create_managerial.rstrip('\n') + "\n\n"
    + make_dup_name
    + "// ─── Component ───────────────────────────────────────────────────────────────\n"
    "\n"
    "export function AgentLibraryPage({\n"
    "  agents,\n"
    "  setAgents,\n"
    "}: {\n"
    "  agents: Agent[]\n"
    "  setAgents: Dispatch<SetStateAction<Agent[]>>\n"
    "}) {\n"
    + editing_agent_name_state
    + agents_tab_state
    + settings_state
    + "\n"
    + derived_state
    + "\n"
    + effect_workflow_open
    + "\n"
    + global_listener
    + helper_component_fns
    + "\n"
    + render_agent_edit
    + "\n"
    + render_single_agent
    + "\n"
    + render_managerial
    + "\n"
    "  // ─── Page routing ──────────────────────────────────────────────────────────\n"
    + iife_content
    + "}\n"
)

with open(AGENT_LIB, 'w', encoding='utf-8') as f:
    f.write(agent_lib_content)
print(f'[OK] Created {AGENT_LIB} ({len(agent_lib_content.splitlines())} lines)')

# ─── MODIFY Home.tsx ──────────────────────────────────────────────────────────

content = ''.join(home_lines)

def remove_block(start_text, end_text):
    """Remove the block from start_text to end_text (inclusive) from content."""
    global content
    si = content.find(start_text)
    if si == -1:
        raise ValueError(f'start_text not found: {repr(start_text[:60])}')
    ei = content.find(end_text, si)
    if ei == -1:
        raise ValueError(f'end_text not found: {repr(end_text[:60])}')
    ei += len(end_text)
    content = content[:si] + content[ei:]

def replace_block(old_text, new_text):
    """Replace old_text with new_text in content."""
    global content
    if old_text not in content:
        raise ValueError(f'text not found: {repr(old_text[:80])}')
    content = content.replace(old_text, new_text, 1)

# 1. Add AgentLibraryPage import (after AgentCardsGrid import)
replace_block(
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n",
    "import { AgentLibraryPage } from './AgentLibraryPage'\n"
    "import { AgentCardsGrid } from '../components/shared/AgentCardsGrid'\n"
)
print('[OK] Added AgentLibraryPage import')

# 2. Remove editingAgentName state line
remove_block(
    "  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)\n",
    ""  # special: just this line
)
# Fix: remove_block with empty end_text doesn't work right, use replace instead
content = content.replace(
    "  const [editingAgentName, setEditingAgentName] = useState<string | null>(null)\n",
    "", 1
)
print('[OK] Removed editingAgentName state')

# 3. Remove agentsTab state line
content = content.replace(
    "  const [agentsTab, setAgentsTab] = useState<'all' | 'single' | 'managerial'>('all')\n",
    "", 1
)
print('[OK] Removed agentsTab state')

# 4. Remove pickAgentTag function (L1929-1934 = 6 lines)
pick_agent_tag_in_home = ''.join(home_lines[1928:1934])  # lines 1929-1934 (0-indexed 1928-1933)
content = content.replace(pick_agent_tag_in_home, '', 1)
print('[OK] Removed pickAgentTag')

# 5. Remove modelConfigOptions … buildGeneratedPrompt (L2005-2315 = 311 lines)
options_to_end_of_factory = ''.join(home_lines[2004:2315])  # L2005-L2315 inclusive
content = content.replace(options_to_end_of_factory, '', 1)
print('[OK] Removed options + factory functions block')

# 6. Remove singleAgentSettingsByKey … isOnboardingWorkflowOpen + blank line (L2318-2360)
settings_block = ''.join(home_lines[2317:2360])  # L2318-L2360 (includes trailing blank)
content = content.replace(settings_block, '', 1)
print('[OK] Removed agent settings state block')

# 7. Remove agentsWithDerived … openManagerialAgentSettings (L2369-L2491)
#    Including the 3 trailing blank lines before renderWorkflowNodeDeleteButton
derived_and_helpers = ''.join(home_lines[2368:2491])  # L2369-L2491 inclusive
content = content.replace(derived_and_helpers, '', 1)
print('[OK] Removed derived state + helper functions')

# 8. Remove renderAgentEdit … renderManagerialAgentSettingsPage (L4434-L5597)
render_fns_block = ''.join(home_lines[4433:5597])  # L4434-L5597 inclusive
content = content.replace(render_fns_block, '', 1)
print('[OK] Removed render functions block')

# 9. Update the activePage effect (L5599-5605): remove editingAgentName part
replace_block(
    "  useEffect(() => {\n"
    "    if (activePage !== 'scenarios') {\n"
    "      setSelectedScenarioName(null)\n"
    "      setEditingScenarioName(null)\n"
    "    }\n"
    "    if (activePage !== 'agent-library') setEditingAgentName(null)\n"
    "  }, [activePage])\n",
    "  useEffect(() => {\n"
    "    if (activePage !== 'scenarios') {\n"
    "      setSelectedScenarioName(null)\n"
    "      setEditingScenarioName(null)\n"
    "    }\n"
    "  }, [activePage])\n"
)
print('[OK] Simplified activePage useEffect')

# 10. Update sync effect (L5607-5629): remove agent-library block
replace_block(
    "    if (\n"
    "      activePage === 'agent-library' &&\n"
    "      editingAgentName != null &&\n"
    "      !agents.some((a) => a.name === editingAgentName)\n"
    "    ) {\n"
    "      setEditingAgentName(null)\n"
    "    }\n"
    "  }, [activePage, selectedScenarioName, editingScenarioName, editingAgentName, agents])\n",
    "  }, [activePage, selectedScenarioName, editingScenarioName, agents])\n"
)
print('[OK] Simplified sync useEffect')

# 11. Simplify global mousedown/keydown listener (L5637-5680)
replace_block(
    "    const onMouseDown = (event: MouseEvent) => {\n"
    "      const target = event.target as HTMLElement | null\n"
    "      if (!target) return\n"
    "      if (target.closest('.single-agent-select-wrap')) return\n"
    "      if (target.closest('.single-agent-modal')) return\n"
    "      if (target.closest('.manager-agent-select-wrap')) return\n"
    "      setOpenSettingsDropdown(null)\n"
    "      setOpenManagerAgentPickerRowId(null)\n"
    "    }\n"
    "\n"
    "    const onKeyDown = (event: KeyboardEvent) => {\n"
    "      if (event.key !== 'Escape') return\n"
    "      setOpenSettingsDropdown(null)\n"
    "      setOpenManagerAgentPickerRowId(null)\n"
    "      if (!isInstructionGenerating) setIsInstructionModalOpen(false)\n"
    "      if (activePage === 'scenarios') {\n"
    "        if (editingScenarioName != null) {\n"
    "          setEditingScenarioName(null)\n"
    "          return\n"
    "        }\n"
    "        if (selectedScenarioName != null) {\n"
    "          setSelectedScenarioName(null)\n"
    "          return\n"
    "        }\n"
    "      }\n"
    "      if (activePage === 'agent-library' && editingAgentName != null) {\n"
    "        setEditingAgentName(null)\n"
    "      }\n"
    "    }\n"
    "\n"
    "    document.addEventListener('mousedown', onMouseDown)\n"
    "    document.addEventListener('keydown', onKeyDown)\n"
    "    return () => {\n"
    "      document.removeEventListener('mousedown', onMouseDown)\n"
    "      document.removeEventListener('keydown', onKeyDown)\n"
    "    }\n"
    "  }, [\n"
    "    activePage,\n"
    "    editingScenarioName,\n"
    "    editingAgentName,\n"
    "    selectedScenarioName,\n"
    "    isInstructionGenerating,\n"
    "  ])\n",
    "    const onKeyDown = (event: KeyboardEvent) => {\n"
    "      if (event.key !== 'Escape') return\n"
    "      if (activePage === 'scenarios') {\n"
    "        if (editingScenarioName != null) {\n"
    "          setEditingScenarioName(null)\n"
    "          return\n"
    "        }\n"
    "        if (selectedScenarioName != null) {\n"
    "          setSelectedScenarioName(null)\n"
    "          return\n"
    "        }\n"
    "      }\n"
    "    }\n"
    "\n"
    "    document.addEventListener('keydown', onKeyDown)\n"
    "    return () => {\n"
    "      document.removeEventListener('keydown', onKeyDown)\n"
    "    }\n"
    "  }, [\n"
    "    activePage,\n"
    "    editingScenarioName,\n"
    "    selectedScenarioName,\n"
    "  ])\n"
)
print('[OK] Simplified global event listener')

# 12. Simplify sectionAriaLabel in JoyceAiPanel
replace_block(
    "          sectionAriaLabel={\n"
    "              activePage === 'analytics' ? '分析'\n"
    "              : activePage === 'experience' ? '体验'\n"
    "              : activePage === 'agent-library'\n"
    "                ? (editingAgentName ? `编辑 Agent · ${editingAgentName}`\n"
    "                   : selectedSingleAgent ? selectedSingleAgent.name\n"
    "                   : selectedManagerialAgent ? selectedManagerialAgent.name\n"
    "                   : 'Agents')\n"
    "              : (editingScenarioName ? `编辑场景 · ${editingScenarioName}`\n"
    "                 : selectedScenarioName ? `场景详情 · ${selectedScenarioName}`\n"
    "                 : '场景配置')\n"
    "            }\n",
    "          sectionAriaLabel={\n"
    "              activePage === 'analytics' ? '分析'\n"
    "              : activePage === 'experience' ? '体验'\n"
    "              : activePage === 'agent-library' ? 'Agents'\n"
    "              : (editingScenarioName ? `编辑场景 · ${editingScenarioName}`\n"
    "                 : selectedScenarioName ? `场景详情 · ${selectedScenarioName}`\n"
    "                 : '场景配置')\n"
    "            }\n"
)
print('[OK] Simplified sectionAriaLabel')

# 13. Replace agent-library IIFE with <AgentLibraryPage ...>
# Find the agent-library ternary block (from "{activePage === 'agent-library' ? (" to "})()")
al_start = "            {activePage === 'agent-library' ? (\n"
al_end   = "              })()\n"
si = content.find(al_start)
if si == -1:
    raise ValueError('Cannot find agent-library block start')
ei = content.find(al_end, si)
if ei == -1:
    raise ValueError('Cannot find agent-library IIFE end')
ei += len(al_end)

new_agent_lib_jsx = (
    "            {activePage === 'agent-library' ? (\n"
    "              <AgentLibraryPage agents={agents} setAgents={setAgents} />\n"
)
content = content[:si] + new_agent_lib_jsx + content[ei:]
print('[OK] Replaced agent-library IIFE with <AgentLibraryPage>')

# 14. Update Scenarios IIFE to use agents directly (remove agentsWithDerived)
replace_block(
    "                const withCat: ScenarioRow[] = agentsWithDerived.map((a) => ({\n"
    "                  name: a.name, desc: a.desc, meta: a.meta, tag: a.tag,\n"
    "                  category: pickScenarioCategory(a.name) as ScenarioRow['category'],\n"
    "                }))\n",
    "                const withCat: ScenarioRow[] = agents.map((a) => ({\n"
    "                  name: a.name, desc: a.desc, meta: a.meta, tag: '',\n"
    "                  category: pickScenarioCategory(a.name) as ScenarioRow['category'],\n"
    "                }))\n"
)
print('[OK] Updated Scenarios IIFE')

# Write back
with open(HOME, 'w', encoding='utf-8') as f:
    f.write(content)
final_lines = content.count('\n')
print(f'[OK] Modified {HOME} (~{final_lines} lines)')
print('Done.')
