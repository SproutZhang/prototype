import type { AppLocale } from '../../../i18n/homeStrings'
import {
  appendScenarioPublishVersionFromIteration,
  type ScenarioPublishVersion,
} from '../../../data/scenarioPublishVersions'
import type { SectionIterationRecord } from '../types/sectionIteration'
import {
  appendSectionIterationRecord,
  type AppendSectionIterationInput,
} from './appendSectionIterationRecord'

export function publishWorkflowSectionIteration(
  sourceName: string,
  input: AppendSectionIterationInput,
  stored: Record<string, ScenarioPublishVersion[]>,
  locale: AppLocale,
): { iterationRecord: SectionIterationRecord; publishVersions: Record<string, ScenarioPublishVersion[]> } {
  const iterationRecord = appendSectionIterationRecord(input)
  const publishVersions = appendScenarioPublishVersionFromIteration(sourceName, iterationRecord, stored, locale)
  return { iterationRecord, publishVersions }
}

export function publishSectionIteration(input: AppendSectionIterationInput): SectionIterationRecord {
  return appendSectionIterationRecord(input)
}
