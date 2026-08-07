export type EmbeddingProviderId =
  | 'aws-bedrock'
  | 'azure-openai'
  | 'baidu-qianfan'
  | 'cohere'
  | 'google-gemini'
  | 'google-vertexai'
  | 'huggingface-inference'
  | 'ibm-watsonx'
  | 'jina'
  | 'localai'
  | 'mistralai'
  | 'ollama'
  | 'openai'
  | 'openai-custom'
  | 'togetherai'
  | 'voyageai'

export type EmbeddingProviderOption = {
  id: EmbeddingProviderId
  logoSrc: string
  labelKey:
    | 'embeddingProviderAwsBedrock'
    | 'embeddingProviderAzureOpenAI'
    | 'embeddingProviderBaiduQianfan'
    | 'embeddingProviderCohere'
    | 'embeddingProviderGoogleGemini'
    | 'embeddingProviderGoogleVertexAI'
    | 'embeddingProviderHuggingFace'
    | 'embeddingProviderIbmWatsonx'
    | 'embeddingProviderJina'
    | 'embeddingProviderLocalAI'
    | 'embeddingProviderMistralAI'
    | 'embeddingProviderOllama'
    | 'embeddingProviderOpenAI'
    | 'embeddingProviderOpenAICustom'
    | 'embeddingProviderTogetherAI'
    | 'embeddingProviderVoyageAI'
}

const logo = (file: string) => `/logos/embeddings/${file}`

export const EMBEDDING_PROVIDER_OPTIONS: EmbeddingProviderOption[] = [
  { id: 'aws-bedrock', logoSrc: logo('aws-wordmark.svg'), labelKey: 'embeddingProviderAwsBedrock' },
  { id: 'azure-openai', logoSrc: logo('azure-openai.svg'), labelKey: 'embeddingProviderAzureOpenAI' },
  { id: 'baidu-qianfan', logoSrc: logo('baidu-qianfan.svg'), labelKey: 'embeddingProviderBaiduQianfan' },
  { id: 'cohere', logoSrc: logo('cohere.svg'), labelKey: 'embeddingProviderCohere' },
  { id: 'google-gemini', logoSrc: logo('google-gemini.svg'), labelKey: 'embeddingProviderGoogleGemini' },
  { id: 'google-vertexai', logoSrc: logo('google-vertex.svg'), labelKey: 'embeddingProviderGoogleVertexAI' },
  {
    id: 'huggingface-inference',
    logoSrc: logo('huggingface.svg'),
    labelKey: 'embeddingProviderHuggingFace',
  },
  { id: 'ibm-watsonx', logoSrc: logo('ibm-watsonx.png'), labelKey: 'embeddingProviderIbmWatsonx' },
  { id: 'jina', logoSrc: logo('jina.svg'), labelKey: 'embeddingProviderJina' },
  { id: 'localai', logoSrc: logo('localai.png'), labelKey: 'embeddingProviderLocalAI' },
  { id: 'mistralai', logoSrc: logo('mistral.svg'), labelKey: 'embeddingProviderMistralAI' },
  { id: 'ollama', logoSrc: logo('ollama.svg'), labelKey: 'embeddingProviderOllama' },
  { id: 'openai', logoSrc: logo('openai.svg'), labelKey: 'embeddingProviderOpenAI' },
  { id: 'openai-custom', logoSrc: logo('openai-custom.svg'), labelKey: 'embeddingProviderOpenAICustom' },
  { id: 'togetherai', logoSrc: logo('togetherai.png'), labelKey: 'embeddingProviderTogetherAI' },
  { id: 'voyageai', logoSrc: logo('voyageai.png'), labelKey: 'embeddingProviderVoyageAI' },
]

export function findEmbeddingProviderOption(id: EmbeddingProviderId) {
  return EMBEDDING_PROVIDER_OPTIONS.find((option) => option.id === id)
}
