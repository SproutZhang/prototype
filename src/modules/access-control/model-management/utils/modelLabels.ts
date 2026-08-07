import type { AppLocale } from '../../../../i18n/homeStrings'
import { acT } from '../../i18n/strings'
import type { ModelType } from '../data/modelsSeed'

export function modelTypeLabel(locale: AppLocale, type: ModelType): string {
  const keyMap: Record<
    ModelType,
    | 'modelTypeChat'
    | 'modelTypeEmbedding'
    | 'modelTypeImage'
    | 'modelTypeAudio'
    | 'modelTypeChunk'
    | 'modelTypeVectorStorage'
    | 'modelTypeVectorChunkRecordStorage'
  > = {
    chat: 'modelTypeChat',
    embedding: 'modelTypeEmbedding',
    image: 'modelTypeImage',
    audio: 'modelTypeAudio',
    chunk: 'modelTypeChunk',
    vectorStorage: 'modelTypeVectorStorage',
    vectorChunkRecordStorage: 'modelTypeVectorChunkRecordStorage',
  }
  return acT(locale, keyMap[type])
}
