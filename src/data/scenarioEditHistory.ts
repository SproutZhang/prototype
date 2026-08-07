import type { AppLocale } from '../i18n/homeStrings'
import type { ScenarioStringKey } from '../i18n/scenarioStrings'

export type EditHistoryAction =
  | { kind: 'text'; key: ScenarioStringKey }
  | { kind: 'step'; key: ScenarioStringKey; step: string }

export type EditHistoryItem =
  | { type: 'date'; dateKey: 'jun8' | 'may28' }
  | {
      type: 'entry'
      id: string
      time: string
      userName: string
      userInitial: string
      action: EditHistoryAction
    }
  | { type: 'revertSnapshot'; id: string; revisionTime: string }

const EDIT_HISTORY_ITEMS: EditHistoryItem[] = [
  { type: 'date', dateKey: 'jun8' },
  {
    type: 'entry',
    id: 'jun8-1',
    time: '17:08',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryChangedEmoji' },
  },
  {
    type: 'entry',
    id: 'jun8-2',
    time: '16:35',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryEditedTitle' },
  },
  {
    type: 'entry',
    id: 'jun8-3',
    time: '16:22',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryUpdatedTrigger' },
  },
  {
    type: 'entry',
    id: 'jun8-4',
    time: '16:16',
    userName: 'Oak',
    userInitial: 'O',
    action: {
      kind: 'step',
      key: 'editHistoryEditedSchema',
      step: '(4) AI 生成办公物品配置清单',
    },
  },
  { type: 'revertSnapshot', id: 'snap-jun8-1', revisionTime: '16:16:08' },
  {
    type: 'entry',
    id: 'jun8-5',
    time: '16:08',
    userName: 'Oak',
    userInitial: 'O',
    action: {
      kind: 'step',
      key: 'editHistoryEditedStep',
      step: '(3) 发送欢迎邮件给新员工',
    },
  },
  {
    type: 'entry',
    id: 'jun8-6',
    time: '15:55',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryRemovedStep' },
  },
  {
    type: 'entry',
    id: 'jun8-7',
    time: '15:42',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'step', key: 'editHistoryAddedStep', step: 'Path 1' },
  },
  { type: 'date', dateKey: 'may28' },
  {
    type: 'entry',
    id: 'may28-1',
    time: '14:20',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryPublishedWorkflow' },
  },
  {
    type: 'entry',
    id: 'may28-2',
    time: '11:05',
    userName: 'Oak',
    userInitial: 'O',
    action: {
      kind: 'step',
      key: 'editHistoryEditedStep',
      step: '(2) 收集员工入职材料',
    },
  },
  { type: 'revertSnapshot', id: 'snap-may28-1', revisionTime: '11:05:00' },
  {
    type: 'entry',
    id: 'may28-3',
    time: '10:48',
    userName: 'Oak',
    userInitial: 'O',
    action: { kind: 'text', key: 'editHistoryCreatedWorkflow' },
  },
]

export function getScenarioEditHistoryItems(_locale: AppLocale): EditHistoryItem[] {
  return EDIT_HISTORY_ITEMS
}
