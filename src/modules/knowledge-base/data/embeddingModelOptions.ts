export const AWS_BEDROCK_EMBEDDING_MODEL = 'AWS 基岩嵌入'
export const AZURE_OPENAI_EMBEDDING_MODEL = 'Azure OpenAI 嵌入'

export type EmbeddingModelOption = {
  value: string
  label: string
  logoSrc: string
}

const logo = (file: string) => `/logos/embeddings/${file}`

export const EMBEDDING_MODEL_OPTIONS: EmbeddingModelOption[] = [
  { value: AWS_BEDROCK_EMBEDDING_MODEL, label: AWS_BEDROCK_EMBEDDING_MODEL, logoSrc: logo('aws-wordmark.svg') },
  { value: AZURE_OPENAI_EMBEDDING_MODEL, label: AZURE_OPENAI_EMBEDDING_MODEL, logoSrc: logo('azure-openai.svg') },
  { value: '百度千帆嵌入', label: '百度千帆嵌入', logoSrc: logo('baidu-qianfan.svg') },
  { value: '凝聚嵌入', label: '凝聚嵌入', logoSrc: logo('cohere.svg') },
  { value: 'Google Gemini 嵌入', label: 'Google Gemini 嵌入', logoSrc: logo('google-gemini.svg') },
  { value: 'GoogleVertexAI 嵌入', label: 'GoogleVertexAI 嵌入', logoSrc: logo('google-vertex.svg') },
  { value: 'HuggingFace推理嵌入', label: 'HuggingFace推理嵌入', logoSrc: logo('huggingface.svg') },
  { value: 'IBM Watsonx 嵌入', label: 'IBM Watsonx 嵌入', logoSrc: logo('ibm-watsonx.png') },
  { value: 'Jina 嵌入', label: 'Jina 嵌入', logoSrc: logo('jina.svg') },
  { value: 'LocalAI 嵌入', label: 'LocalAI 嵌入', logoSrc: logo('localai.png') },
  { value: 'MistralAI 嵌入式', label: 'MistralAI 嵌入式', logoSrc: logo('mistral.svg') },
  { value: '奥拉玛嵌入', label: '奥拉玛嵌入', logoSrc: logo('ollama.svg') },
  { value: 'OpenAI 嵌入', label: 'OpenAI 嵌入', logoSrc: logo('openai.svg') },
  { value: 'OpenAI 自定义嵌入', label: 'OpenAI 自定义嵌入', logoSrc: logo('openai-custom.svg') },
  { value: 'TogetherAI 嵌入', label: 'TogetherAI 嵌入', logoSrc: logo('togetherai.png') },
  { value: 'VoyageAI嵌入式', label: 'VoyageAI嵌入式', logoSrc: logo('voyageai.png') },
]

export function findEmbeddingModelOption(value: string) {
  return EMBEDDING_MODEL_OPTIONS.find((option) => option.value === value)
}
