import type { JoyceChatMessage } from '../components/shared/JoyceAiPanel'

/** 侧栏「历史记录」中对话类条目的演示会话快照（与 Home 中 run id 对应） */
export const RUN_HISTORY_CHAT_SNAPSHOTS: Record<string, JoyceChatMessage[]> = {
  h1: [
    { id: 'hist-h1-u1', role: 'user', text: '辅助新员工入职智能体' },
    {
      id: 'hist-h1-a1',
      role: 'assistant',
      planOnboardingDetailQuiz: true,
      text:
        '我是 Joyce，将与您协作完成「新员工入职」智能体的设计。为帮您对齐方案，我会分两步收集偏好：第一步先选择系统主要服务的角色；第二步再选择入职与培训流程中的关键环节。请先完成下方第一步。',
    },
    {
      id: 'hist-h1-u2',
      role: 'user',
      text: '【入职方案采集】服务角色：新员工；关键环节：其他/通用（我会描述它们）',
    },
    {
      id: 'hist-h1-a2',
      role: 'assistant',
      text: '',
      richBubble: 'plan-multi-agent-system-created',
    },
  ],
  h2: [
    { id: 'hist-h2-u1', role: 'user', text: '帮我总结本周待办' },
    {
      id: 'hist-h2-a1',
      role: 'assistant',
      text:
        '根据你上周留下的备注，本周待办大致包括：① 完成两名新员工的工位与设备分配确认；② 跟进试用期中期面谈日程；③ 与 IT 对齐账号开通 SLA。需要我把某一项拆成可执行子任务吗？',
    },
    { id: 'hist-h2-u2', role: 'user', text: '把第①项拆一下' },
    {
      id: 'hist-h2-a2',
      role: 'assistant',
      text:
        '① 可拆为：确认座位图与显示器库存 → 在资产系统建单 → 通知行政配送 → 员工到岗日验收签字。若要同步到任务系统，可以说一下你们用的工具名称。',
    },
    { id: 'hist-h2-u3', role: 'user', text: '我们用 Jira，② 面谈也顺便排个时间线吧' },
    {
      id: 'hist-h2-a3',
      role: 'assistant',
      text:
        '② 建议时间线：周一发「意向时段」问卷给经理与员工 → 周三前收齐 → 周四在日历上锁 30 分钟 × 2 备选 → 周五发出会议邀请并附面谈提纲链接。Jira 里可建 Epic「试用期中期」，下面三个 Story：收问卷、锁时间、发邀请。',
    },
    {
      id: 'hist-h2-u4',
      role: 'user',
      text: '③ IT SLA 我想写成一页给老板汇报，要突出风险点',
    },
    {
      id: 'hist-h2-a4',
      role: 'assistant',
      text:
        '一页纸结构建议：现状（平均开通时长、峰值队列）→ 目标 SLA（例如 T+1 工作日）→ 风险（上游主数据延迟、外包账号审批链长）→ 缓解动作（加急通道、值班表）→ 本周需要你拍板的一个决策点。需要我按你手头数字先填一版占位稿吗？',
    },
    { id: 'hist-h2-u5', role: 'user', text: '可以，数字我下午补给你' },
    {
      id: 'hist-h2-a5',
      role: 'assistant',
      text:
        '那我先留占位：平均开通 [X] 小时、峰值等待 [Y] 人日。你下午把 X/Y 和「最痛的一个系统名」发我，我帮你压成三句话结论放在页首。',
    },
  ],
  h3: [
    { id: 'hist-h3-u1', role: 'user', text: '会议室预订规则是什么？' },
    {
      id: 'hist-h3-a1',
      role: 'assistant',
      text:
        '常见规则是：提前 14 天开放预订；单次最长 2 小时；超过 10 人需走「活动场地」流程；释放需在开始前 30 分钟完成以免占用。具体以你们行政发布的版本为准，我也可以帮你对照员工手册里的条款。',
    },
    { id: 'hist-h3-u2', role: 'user', text: '如果是跨时区远程参会，最长 2 小时还能延长吗？' },
    {
      id: 'hist-h3-a2',
      role: 'assistant',
      text:
        '不少公司会对「含外部客户或跨洲多时区」开放例外：需备注参会时区、并抄送行政备案，单次可延长至 90 分钟或拆成两段预订。你们若没有明文，建议先走活动场地或邮件向行政单次申请，避免被系统自动取消。',
    },
    { id: 'hist-h3-u3', role: 'user', text: '会议室里的电视投屏要提前申请吗？' },
    {
      id: 'hist-h3-a3',
      role: 'assistant',
      text:
        '通常不需要单独「申请投屏」，但建议预订描述里写「需 HDMI / 无线投屏」，并在会前 10 分钟到场地试连。若涉及访客网络或录制，可能要另走 IT 工单——你们若有访客 Wi‑Fi 账号流程，我可以帮你写进会议邀请的注意事项里。',
    },
    { id: 'hist-h3-u4', role: 'user', text: '明白了，我先把下周的客户演示会备注写清楚' },
    {
      id: 'hist-h3-a4',
      role: 'assistant',
      text:
        '好的。邀请里可附三条：会议室门牌与地图链接、投屏方式、访客到达与登记联系人。若需要英文版注意事项，发我中文版我帮你对齐翻译一版。',
    },
  ],
  h4: [
    { id: 'hist-h4-u1', role: 'user', text: '把这段政策要点改成邮件草稿' },
    {
      id: 'hist-h4-a1',
      role: 'assistant',
      text:
        '下面是一版可直接发送的草稿（语气中性）：\n\n各位同事，\n\n根据最新政策，现就要点同步如下：[在此填入要点]。请于 [日期] 前完成阅读并在系统中确认收悉。\n\n谢谢，\n[署名]\n\n若需要改成更口语或更正式的版本，告诉我收件人角色即可。',
    },
    {
      id: 'hist-h4-u2',
      role: 'user',
      text: '收件人是全体员工，语气再正式一点，并加上「如有疑问请联系 HR」',
    },
    {
      id: 'hist-h4-a2',
      role: 'assistant',
      text:
        '各位同事：\n\n根据公司最新制度，现就相关政策要点通知如下：\n\n一、[要点一]\n二、[要点二]\n三、[要点三]\n\n请各位于 [日期] 前认真阅读，并登录 [系统名称] 完成确认。如对条款理解或执行方式有疑问，请联系人力资源部（HR@company.com）。\n\n此致\n敬礼\n[部门名称]\n[日期]',
    },
    {
      id: 'hist-h4-u3',
      role: 'user',
      text: '第三点想强调「自愿参与培训不计入加班」，怎么写更不容易歧义？',
    },
    {
      id: 'hist-h4-a3',
      role: 'assistant',
      text:
        '可改为：「所列培训为自愿参加，参与时间不计入加班工时核算；如因业务安排确需在工作时间外组织的必修培训，将另行按考勤制度审批。」这样既突出自愿，又预留必修例外口径。',
    },
    { id: 'hist-h4-u4', role: 'user', text: '再给一个英文版主题行 Subject line' },
    {
      id: 'hist-h4-a4',
      role: 'assistant',
      text:
        'Subject 建议：「Policy Update: Action Required by [Date] / 政策更新：请于 [日期] 前完成确认」。若全员敏感度高，可改成：「Important: Updated Policy Acknowledgement Required」。需要我把整封邮件中英双语并排一版也可以。',
    },
  ],
  /** 与侧栏场景「新员工入职」(id s1) 对应；父子级子行点击时载入右侧 Build 会话 */
  s1: [
    {
      id: 'hist-s1-u1',
      role: 'user',
      text: '帮我梳理「新员工入职」场景里必配的节点清单。',
    },
    {
      id: 'hist-s1-a1',
      role: 'assistant',
      text:
        '可先按「准备期 / 到岗日 / 第一周 / 试用跟进」四段列必需节点：准备期覆盖 Offer 确认、资料采集、账号预开；到岗日覆盖签署、工位与设备签收；第一周覆盖必修培训与经理对齐目标；试用跟进覆盖 30/60/90 天检查清单。需要我按你们现有模板改成可勾选版本吗？',
    },
    {
      id: 'hist-s1-u2',
      role: 'user',
      text: '先给一版可勾选的，并标出哪些是法务或 IT 必须签字的。',
    },
    {
      id: 'hist-s1-a2',
      role: 'assistant',
      text:
        '好的。我会在每行前加复选框占位，并用标签标注「员工」「经理」「HR」「法务」「IT」签字点；默认把合同与保密协议、账号开通、门禁权限标为法务/IT 必签。你确认后我可以再补一列「系统/表单链接」方便直接挂到场景画布上。',
    },
  ],
  /** 与侧栏场景「销售经理入职工作流」(id s6) 对应；载入右侧工作流步骤主区（含未完成警告态） */
  s6: [
    {
      id: 'hist-s6-u1',
      role: 'user',
      text: '为销售经理启动入职流程，并同步当前各步骤完成情况。',
    },
    {
      id: 'hist-s6-a1',
      role: 'assistant',
      text:
        '已为销售经理候选人创建入职项目并发送欢迎邮件；IT 设备开通与培训安排仍在推进中，部分子任务尚未闭环。你可以在右侧工作流步骤中查看警告标记的待办项。',
    },
  ],
  /** 与侧栏场景「身份验证」(id s5) 对应；右侧步骤区与 s3 同为 fault + 表单触发 */
  s5: [
    {
      id: 'hist-s5-u1',
      role: 'user',
      text: '打开身份验证子流程，看下证件核验与账户侧哪些 Agent 报错、哪些任务还没跑完。',
    },
    {
      id: 'hist-s5-a1',
      role: 'assistant',
      text:
        '身份验证流已由表单触发，但信息收集与证件 OCR 接口出现故障；账户子代理里权限工单也被驳回。右侧步骤卡上标「故障」的为需优先处理的 Agent，可先补材料或重试后再继续。',
    },
  ],
  /** 与侧栏场景「初级运维入职工作流」(id s7) 对应；右侧为表单触发 + 运维向采集/账户矩阵 */
  s7: [
    {
      id: 'hist-s7-u1',
      role: 'user',
      text: '表单已提交：为初级运维同学开通堡垒机、VPN 与监控只读权限，并同步当前进度。',
    },
    {
      id: 'hist-s7-a1',
      role: 'assistant',
      text:
        '初级运维入职工作流已由表单触发；IT 资产预采集与权限配置仍有警告项（设备清单、VPN/MFA 等）。账户子代理未全闭环前不会展示培训与监控步骤，请先在右侧处理标黄任务。',
    },
  ],
  /** 与侧栏场景「运营经理入职工作流」(id s4) 对应 */
  s4: [
    {
      id: 'hist-s4-u1',
      role: 'user',
      text: '打开运营经理入职工作流，看下欢迎邮件与自动化步骤还有哪些未完成项。',
    },
    {
      id: 'hist-s4-a1',
      role: 'assistant',
      text:
        '运营经理入职工作流已由表单触发；欢迎邮件 Agent 侧提示邮件配置异常，部分子任务仍为警告态。可在右侧步骤区查看欢迎助手任务明细，并先修复 Gmail 插件配置后再重试发送。',
    },
  ],
  /** 与侧栏场景「高级研发入职工作流」(id s3) 对应；右侧步骤区演示部分 Agent 故障 / 任务失败 */
  s3: [
    {
      id: 'hist-s3-u1',
      role: 'user',
      text: '打开高级研发入职工作流子流程，看下哪些 Agent 报错、哪些任务还没跑完。',
    },
    {
      id: 'hist-s3-a1',
      role: 'assistant',
      text:
        '当前评估流已触发，但信息收集与培训排期侧出现接口故障；账户子代理里也有权限工单被驳回。右侧步骤卡上标「故障」的为需优先处理的 Agent，可先按明细重试或补材料后再继续。',
    },
  ],
}

export function getRunHistoryChatSnapshot(runId: string): JoyceChatMessage[] | null {
  const snap = RUN_HISTORY_CHAT_SNAPSHOTS[runId]
  return snap && snap.length > 0 ? snap.map((m) => ({ ...m })) : null
}

export function hasRunHistoryChatSnapshot(runId: string): boolean {
  const n = RUN_HISTORY_CHAT_SNAPSHOTS[runId]?.length
  return typeof n === 'number' && n > 0
}
