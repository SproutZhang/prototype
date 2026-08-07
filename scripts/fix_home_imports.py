import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('src/pages/Home.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove OnboardingWorkflowPage import
content = content.replace(
    "import { OnboardingWorkflowPage } from '../components/onboarding/OnboardingWorkflowPage'\n",
    '', 1
)

# Remove unused type imports from ../types/agent - keep only Agent and ScenarioRow
old_imports = (
    "import type {\n"
    "  Agent,\n"
    "  AgentRow,\n"
    "  DropdownOption,\n"
    "  ManagerialAgentSettingsDraft,\n"
    "  ScenarioRow,\n"
    "  SingleAgentSettingsDraft,\n"
    "} from '../types/agent'\n"
)
new_imports = (
    "import type {\n"
    "  Agent,\n"
    "  ScenarioRow,\n"
    "} from '../types/agent'\n"
)
content = content.replace(old_imports, new_imports, 1)

with open('src/pages/Home.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done. Fixed unused imports in Home.tsx')
