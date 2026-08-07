export type AgentProvenance = 'manual' | 'app-market-template'

export type Agent = {
  name: string
  desc: string
  meta: string
  /** 用户自定义展示标题，覆盖默认本地化名称 */
  label?: string
  /** 手动创建时的创建者展示名 */
  createdBy?: string
  /** 来源：应用市场模板引入时为 app-market-template */
  provenance?: AgentProvenance
}

export type DropdownOption = {
  id: string
  title: string
  description?: string
  meta?: string
}

export type StructuredOutputPropertyType = 'string' | 'number' | 'boolean' | 'array' | 'object'
export type SchedulerMode = 'minutes' | 'hours' | 'days' | 'months' | 'cron'
export type MemoryType = 'short-term' | 'long-term'
export type MemoryLevel = 'low' | 'medium' | 'high'
export type MemoryMetadataMode = 'agent-decide' | 'rule-based'
export type MemoryMetadataUpdateTiming = 'after-tool-run' | 'after-trigger-received'
export type MemoryMetadataDataFormat = 'text' | 'number' | 'boolean' | 'single-option' | 'multiple-option' | 'count'

export type StoredMemoryItem = {
  id: string
  content: string
  source: string
  createdAt: string
  lastUsedAt: string
}

export type ShortTermMemoryMetadataItem = {
  id: string
  name: string
  mode: MemoryMetadataMode
  instruction: string
  updateTiming: MemoryMetadataUpdateTiming | ''
  targetId: string
  dataFormat: MemoryMetadataDataFormat
  /** Selectable values when dataFormat is single-option or multiple-option */
  dataFormatOptions?: string[]
}

export type ManagerialStructuredOutputProperty = {
  id: string
  key: string
  type: StructuredOutputPropertyType
  description: string
  required: boolean
}

export type ManagerialAdvancedConfig = {
  reasoningEnabled: boolean
  thinkingEnabled: boolean
  maxReasoningAttempts: number
  allowDelegation: boolean
  maxIterations: number
  maxRpm: number
  maxExecutionTime: number
  temperature: number
  useProviderDefaults: boolean
  maxTokens: number
  responseFormat: 'text' | 'markdown' | 'json' | 'structured'
  structuredOutputEnabled: boolean
  structuredOutputProperties: ManagerialStructuredOutputProperty[]
  outputExamplesText: string
  dataQueryEnabled: boolean
  dataQueryModelConfig: string
  dataQueryMaxAttempts: number
  dataQueryTimeLimitSeconds: number
  dataQueryAutoTrainModel: boolean
  dataQueryKnowledgeBaseId: string
  schedulerEnabled: boolean
  schedulerExpression: string
  schedulerMode: SchedulerMode
  schedulerInterval: string
  schedulerAtMinute: string
  schedulerWeekday: string
  schedulerMonthDay: string
  schedulerTimeLabel: string
  schedulerTimeMinute: string
  schedulerCronExpression: string
  schedulerMaxRetries: number
  schedulerRetryDelayMinutes: number
  schedulerInput: string
  webhookTriggerEnabled: boolean
  webhookPath: string
  memoryEnabled: boolean
  memoryType: MemoryType
  memoryProvider: string
  memoryMaxShortTermMessages: number
  shortTermMemoryMetadata: ShortTermMemoryMetadataItem[]
  longTermMemoryEnabled: boolean
  memoryLevel: MemoryLevel
  storedMemories: StoredMemoryItem[]
  memoryWriteRules: string
  memoryReadRules: string
  memoryDeleteDisabled: boolean
  memoryNotes: string
  voiceAgentEnabled: boolean
  contextEnabled: boolean
  contextText: string
  fileAsOutputEnabled: boolean
  imageAsOutputEnabled: boolean
  imageOutputProvider: string
  imageOutputModel: string
  safeResponsibleAiEnabled: boolean
  safeResponsibleAiNotes: string
  hallucinationManagerEnabled: boolean
  hallucinationManagerNotes: string
  versionControlEnabled: boolean
  versionControlNotes: string
}

export type SingleAgentSettingsDraft = {
  name: string
  avatar: string
  agentRole: string
  agentGoal: string
  agentInstructions: string
  agentRules: string
  modelConfig: string
  instructions: string
  generatedPrompt: string
  managerEnabled: boolean
  managerAgents: { id: string; agentName: string; usage: string; source: 'agent' | 'a2a' }[]
  advancedConfig: ManagerialAdvancedConfig
  skills: string[]
  knowledge: string[]
  tools: string[]
}

export type ManagerialAgentSettingsDraft = {
  name: string
  avatar: string
  agentRole: string
  agentGoal: string
  agentInstructions: string
  agentRules: string
  modelConfig: string
  instructions: string
  generatedPrompt: string
  skills: string[]
  knowledge: string[]
  tools: string[]
  managerGoal: string
  memberAgents: string[]
  delegationStrategy: string
  approvalMode: string
  escalationTriggers: string[]
  successCriteria: string
  managerNotes: string
  managerEnabled: boolean
  managerAgents: { id: string; agentName: string; usage: string; source: 'agent' | 'a2a' }[]
  advancedConfig: ManagerialAdvancedConfig
}

export type ScenarioRow = Agent & {
  tag: string
  category: 'medical' | 'finance' | 'tech' | 'accounting'
}

export type AgentRow = Agent & { tag: string }
