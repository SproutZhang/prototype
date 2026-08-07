export type ModelStatus = 'active' | 'disabled'

export type ModelType =
  | 'chat'
  | 'embedding'
  | 'image'
  | 'audio'
  | 'chunk'
  | 'vectorStorage'
  | 'vectorChunkRecordStorage'

export type ModelRow = {
  id: string
  name: string
  provider: string
  type: ModelType
  modelId: string
  status: ModelStatus
  updatedAt: string
}

export const MODEL_PROVIDERS = ['OpenAI', 'Anthropic', 'Azure OpenAI', 'Google', 'DeepSeek', '本地部署'] as const

export const MODEL_TYPES: ModelType[] = [
  'chat',
  'embedding',
  'image',
  'audio',
  'chunk',
  'vectorStorage',
  'vectorChunkRecordStorage',
]

export const MODELS_SEED: ModelRow[] = [
  {
    id: 'model-1',
    name: 'GPT-4o',
    provider: 'OpenAI',
    type: 'chat',
    modelId: 'gpt-4o',
    status: 'active',
    updatedAt: '2026-06-18T10:30:00+08:00',
  },
  {
    id: 'model-2',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    type: 'chat',
    modelId: 'claude-3-5-sonnet-20241022',
    status: 'active',
    updatedAt: '2026-06-15T14:20:00+08:00',
  },
  {
    id: 'model-3',
    name: 'Text Embedding 3 Large',
    provider: 'OpenAI',
    type: 'embedding',
    modelId: 'text-embedding-3-large',
    status: 'active',
    updatedAt: '2026-05-28T09:00:00+08:00',
  },
  {
    id: 'model-4',
    name: 'DALL·E 3',
    provider: 'OpenAI',
    type: 'image',
    modelId: 'dall-e-3',
    status: 'disabled',
    updatedAt: '2026-04-10T16:45:00+08:00',
  },
  {
    id: 'model-5',
    name: 'DeepSeek V3',
    provider: 'DeepSeek',
    type: 'chat',
    modelId: 'deepseek-chat',
    status: 'active',
    updatedAt: '2026-06-20T08:15:00+08:00',
  },
  {
    id: 'model-6',
    name: '默认语义切块',
    provider: '本地部署',
    type: 'chunk',
    modelId: 'semantic-chunk-v1',
    status: 'active',
    updatedAt: '2026-06-19T11:00:00+08:00',
  },
  {
    id: 'model-7',
    name: 'Milvus 向量库',
    provider: '本地部署',
    type: 'vectorStorage',
    modelId: 'milvus-default',
    status: 'active',
    updatedAt: '2026-06-17T09:30:00+08:00',
  },
  {
    id: 'model-8',
    name: '向量切块记录库',
    provider: '本地部署',
    type: 'vectorChunkRecordStorage',
    modelId: 'chunk-record-store-v1',
    status: 'active',
    updatedAt: '2026-06-16T15:45:00+08:00',
  },
]
