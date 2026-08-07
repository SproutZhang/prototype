import type { AppLocale } from '../i18n/homeStrings'
import type { ScenarioStringKey } from '../i18n/scenarioStrings'

export type ActivityLogTone = 'error' | 'success' | 'neutral'

export type ActivityLogEntry = {
  id: string
  time: string
  activityKey:
    | 'automationError'
    | 'automationCompleted'
    | 'humanStepCompleted'
    | 'waitCompleted'
    | 'aiStepCompleted'
    | 'pathSelected'
    | 'notification'
    | 'runUpgraded'
  tone: ActivityLogTone
  step: string
  /** 详情列：说明该条目在流程中的作用 */
  detailsKey: ScenarioStringKey
  expandable?:
    | {
        kind: 'issues'
        summaryKey: 'automationVerifyFailed'
        issueKeys: readonly ['fieldOnboardingDateMissing', 'fieldEmployeeNameMissing']
      }
    | { kind: 'pathRuleMatch' }
}

export type ActivityLogGroup = {
  dateKey: 'may25' | 'may19'
  entries: ActivityLogEntry[]
}

const LOG_GROUPS_ZH: ActivityLogGroup[] = [
  {
    dateKey: 'may25',
    entries: [
      {
        id: 'may25-1',
        time: '16:26:44',
        activityKey: 'automationError',
        tone: 'error',
        step: '(7) 通知行政配置办公物品',
        detailsKey: 'activityLogDetailNotifyAdminOffice',
        expandable: {
          kind: 'issues',
          summaryKey: 'automationVerifyFailed',
          issueKeys: ['fieldOnboardingDateMissing', 'fieldEmployeeNameMissing'],
        },
      },
      {
        id: 'may25-2',
        time: '16:19:06',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(22) 创建入职培训日历会议',
        detailsKey: 'activityLogDetailCreateTrainingCalendar',
      },
      {
        id: 'may25-3',
        time: '15:52:07',
        activityKey: 'humanStepCompleted',
        tone: 'success',
        step: '(5) 审批办公物品配置清单',
        detailsKey: 'activityLogDetailApproveOfficeChecklist',
      },
      {
        id: 'may25-4',
        time: '15:51:11',
        activityKey: 'waitCompleted',
        tone: 'neutral',
        step: '(21) AI 查询法定节假日',
        detailsKey: 'activityLogDetailAiLookupHolidays',
      },
      {
        id: 'may25-5',
        time: '15:51:03',
        activityKey: 'aiStepCompleted',
        tone: 'success',
        step: '(8) 等待 30 天 - 入职培训 - 5.26',
        detailsKey: 'activityLogDetailWaitForTraining',
      },
      {
        id: 'may25-6',
        time: '15:51:02',
        activityKey: 'pathSelected',
        tone: 'success',
        step: '(18) 通知 HR 收集员工材料',
        detailsKey: 'activityLogDetailNotifyHrCollectMaterials',
        expandable: { kind: 'pathRuleMatch' },
      },
      {
        id: 'may25-7',
        time: '15:50:58',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(23) 配置入职试用/辅导关系',
        detailsKey: 'activityLogDetailConfigureBuddy',
      },
    ],
  },
  {
    dateKey: 'may19',
    entries: [
      {
        id: 'may19-1',
        time: '12:16:57',
        activityKey: 'notification',
        tone: 'neutral',
        step: '(3) 通知各角色确认材料',
        detailsKey: 'activityLogDetailNotifyConfirmMaterials',
      },
      {
        id: 'may19-2',
        time: '12:16:43',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(25) HR 确认材料与入职信息',
        detailsKey: 'activityLogDetailHrConfirmMaterials',
      },
      {
        id: 'may19-3',
        time: '12:16:34',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(4) 规则筛选协作角色与邮件组',
        detailsKey: 'activityLogDetailFilterCollaborators',
      },
      {
        id: 'may19-4',
        time: '12:16:26',
        activityKey: 'runUpgraded',
        tone: 'neutral',
        step: '',
        detailsKey: 'activityLogDetailRunUpgraded',
      },
      {
        id: 'may19-5',
        time: '10:42:15',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(24) 创建员工账号',
        detailsKey: 'activityLogDetailCreateEmployeeAccount',
      },
    ],
  },
]

const LOG_GROUPS_EN: ActivityLogGroup[] = [
  {
    dateKey: 'may25',
    entries: [
      {
        id: 'may25-1',
        time: '16:26:44',
        activityKey: 'automationError',
        tone: 'error',
        step: '(7) Notify admin to provision office supplies',
        detailsKey: 'activityLogDetailNotifyAdminOffice',
        expandable: {
          kind: 'issues',
          summaryKey: 'automationVerifyFailed',
          issueKeys: ['fieldOnboardingDateMissing', 'fieldEmployeeNameMissing'],
        },
      },
      {
        id: 'may25-2',
        time: '16:19:06',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(22) Create onboarding training calendar event',
        detailsKey: 'activityLogDetailCreateTrainingCalendar',
      },
      {
        id: 'may25-3',
        time: '15:52:07',
        activityKey: 'humanStepCompleted',
        tone: 'success',
        step: '(5) Approve office supplies checklist',
        detailsKey: 'activityLogDetailApproveOfficeChecklist',
      },
      {
        id: 'may25-4',
        time: '15:51:11',
        activityKey: 'waitCompleted',
        tone: 'neutral',
        step: '(21) AI lookup public holidays',
        detailsKey: 'activityLogDetailAiLookupHolidays',
      },
      {
        id: 'may25-5',
        time: '15:51:03',
        activityKey: 'aiStepCompleted',
        tone: 'success',
        step: '(8) Wait 30 days - onboarding training - 5.26',
        detailsKey: 'activityLogDetailWaitForTraining',
      },
      {
        id: 'may25-6',
        time: '15:51:02',
        activityKey: 'pathSelected',
        tone: 'success',
        step: '(18) Notify HR to collect employee materials',
        detailsKey: 'activityLogDetailNotifyHrCollectMaterials',
        expandable: { kind: 'pathRuleMatch' },
      },
      {
        id: 'may25-7',
        time: '15:50:58',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(23) Configure onboarding buddy relationship',
        detailsKey: 'activityLogDetailConfigureBuddy',
      },
    ],
  },
  {
    dateKey: 'may19',
    entries: [
      {
        id: 'may19-1',
        time: '12:16:57',
        activityKey: 'notification',
        tone: 'neutral',
        step: '(3) Notify stakeholders to confirm materials',
        detailsKey: 'activityLogDetailNotifyConfirmMaterials',
      },
      {
        id: 'may19-2',
        time: '12:16:43',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(25) HR confirms materials and onboarding info',
        detailsKey: 'activityLogDetailHrConfirmMaterials',
      },
      {
        id: 'may19-3',
        time: '12:16:34',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(4) Rules filter collaborators and mailing lists',
        detailsKey: 'activityLogDetailFilterCollaborators',
      },
      {
        id: 'may19-4',
        time: '12:16:26',
        activityKey: 'runUpgraded',
        tone: 'neutral',
        step: '',
        detailsKey: 'activityLogDetailRunUpgraded',
      },
      {
        id: 'may19-5',
        time: '10:42:15',
        activityKey: 'automationCompleted',
        tone: 'success',
        step: '(24) Create employee account',
        detailsKey: 'activityLogDetailCreateEmployeeAccount',
      },
    ],
  },
]

export function getScenarioActivityLogGroups(locale: AppLocale): ActivityLogGroup[] {
  return locale === 'zh' ? LOG_GROUPS_ZH : LOG_GROUPS_EN
}

export function buildScenarioActivityRunLabel(scenarioName: string, locale: AppLocale): string {
  const suffix = locale === 'zh' ? '入职' : 'onboarding'
  return `demo (UI) ${suffix} - 5glbk`
}
