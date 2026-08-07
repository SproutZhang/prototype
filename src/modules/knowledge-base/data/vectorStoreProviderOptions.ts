export type VectorStoreProviderId =
  | 'astra'
  | 'chroma'
  | 'couchbase'
  | 'elasticsearch'
  | 'aws-kendra'
  | 'meilisearch'
  | 'milvus'
  | 'mongodb-atlas'
  | 'opensearch'
  | 'pinecone'
  | 'postgres'
  | 'qdrant'
  | 'redis'
  | 'singlestore'
  | 'supabase'
  | 'upstash-vector'
  | 'vectara'
  | 'vectara-upload-file'
  | 'weaviate'
  | 'zep-collection-open-source'
  | 'zep-collection-cloud'

export type VectorStoreProviderOption = {
  id: VectorStoreProviderId
  logoSrc: string
  labelKey:
    | 'vectorStoreProviderAstra'
    | 'vectorStoreProviderChroma'
    | 'vectorStoreProviderCouchbase'
    | 'vectorStoreProviderElasticsearch'
    | 'vectorStoreProviderAwsKendra'
    | 'vectorStoreProviderMeilisearch'
    | 'vectorStoreProviderMilvus'
    | 'vectorStoreProviderMongoDbAtlas'
    | 'vectorStoreProviderOpenSearch'
    | 'vectorStoreProviderPinecone'
    | 'vectorStoreProviderPostgres'
    | 'vectorStoreProviderQdrant'
    | 'vectorStoreProviderRedis'
    | 'vectorStoreProviderSingleStore'
    | 'vectorStoreProviderSupabase'
    | 'vectorStoreProviderUpstashVector'
    | 'vectorStoreProviderVectara'
    | 'vectorStoreProviderVectaraUploadFile'
    | 'vectorStoreProviderWeaviate'
    | 'vectorStoreProviderZepCollectionOpenSource'
    | 'vectorStoreProviderZepCollectionCloud'
}

const logo = (file: string) => `/logos/vector-stores/${file}`

export const VECTOR_STORE_PROVIDER_OPTIONS: VectorStoreProviderOption[] = [
  { id: 'astra', logoSrc: logo('astra.svg'), labelKey: 'vectorStoreProviderAstra' },
  { id: 'chroma', logoSrc: logo('chroma.svg'), labelKey: 'vectorStoreProviderChroma' },
  { id: 'couchbase', logoSrc: logo('couchbase.svg'), labelKey: 'vectorStoreProviderCouchbase' },
  { id: 'elasticsearch', logoSrc: logo('elasticsearch.svg'), labelKey: 'vectorStoreProviderElasticsearch' },
  { id: 'aws-kendra', logoSrc: logo('aws-kendra.svg'), labelKey: 'vectorStoreProviderAwsKendra' },
  { id: 'meilisearch', logoSrc: logo('meilisearch.svg'), labelKey: 'vectorStoreProviderMeilisearch' },
  { id: 'milvus', logoSrc: logo('milvus.svg'), labelKey: 'vectorStoreProviderMilvus' },
  { id: 'mongodb-atlas', logoSrc: logo('mongodb-atlas.svg'), labelKey: 'vectorStoreProviderMongoDbAtlas' },
  { id: 'opensearch', logoSrc: logo('opensearch.svg'), labelKey: 'vectorStoreProviderOpenSearch' },
  { id: 'pinecone', logoSrc: logo('pinecone.svg'), labelKey: 'vectorStoreProviderPinecone' },
  { id: 'postgres', logoSrc: logo('postgres.svg'), labelKey: 'vectorStoreProviderPostgres' },
  { id: 'qdrant', logoSrc: logo('qdrant.svg'), labelKey: 'vectorStoreProviderQdrant' },
  { id: 'redis', logoSrc: logo('redis.svg'), labelKey: 'vectorStoreProviderRedis' },
  { id: 'singlestore', logoSrc: logo('singlestore.svg'), labelKey: 'vectorStoreProviderSingleStore' },
  { id: 'supabase', logoSrc: logo('supabase.svg'), labelKey: 'vectorStoreProviderSupabase' },
  { id: 'upstash-vector', logoSrc: logo('upstash-vector.svg'), labelKey: 'vectorStoreProviderUpstashVector' },
  { id: 'vectara', logoSrc: logo('vectara.svg'), labelKey: 'vectorStoreProviderVectara' },
  {
    id: 'vectara-upload-file',
    logoSrc: logo('vectara.svg'),
    labelKey: 'vectorStoreProviderVectaraUploadFile',
  },
  { id: 'weaviate', logoSrc: logo('weaviate.svg'), labelKey: 'vectorStoreProviderWeaviate' },
  {
    id: 'zep-collection-open-source',
    logoSrc: logo('zep.svg'),
    labelKey: 'vectorStoreProviderZepCollectionOpenSource',
  },
  {
    id: 'zep-collection-cloud',
    logoSrc: logo('zep.svg'),
    labelKey: 'vectorStoreProviderZepCollectionCloud',
  },
]

export function findVectorStoreProviderOption(id: VectorStoreProviderId) {
  return VECTOR_STORE_PROVIDER_OPTIONS.find((option) => option.id === id)
}
