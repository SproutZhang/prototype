export type DocChunkPreviewItem = {
  index: number
  charCount: number
  content: string
}

export type DocChunkPreviewSplitter =
  | 'none'
  | 'characterTextSplitter'
  | 'codeTextSplitter'
  | 'htmlToMarkdownTextSplitter'
  | 'markdownTextSplitter'
  | 'recursiveCharacterTextSplitter'
  | 'tokenTextSplitter'

export type DocChunkPreviewParams = {
  splitter: DocChunkPreviewSplitter
  chunkSize: number
  chunkOverlap: number
}

export const DOC_CHUNK_VIEW_DEFAULT_SETTINGS: DocChunkPreviewParams = {
  splitter: 'codeTextSplitter',
  chunkSize: 100,
  chunkOverlap: 200,
}

const CHUNK_CONTENTS: readonly string[] = [
  `ICS 35.240
CCS L67
金融行业标准
金融智能体应用规范
Guidelines for Financial AI Agents Application
{
  "来源": "金融行业标准",
  "k-v类型": "规范文档"
}`,
  `目  录
1  引言 ........................................ 1
1.1  范围 ...................................... 1
1.2  规范性引用文件 ............................ 1
1.3  术语和定义 ................................ 2
2  总体要求 .................................... 4
3  智能体架构 .................................. 6
4  数据与知识管理 .............................. 9
5  技能引用与调度 ............................. 12
5.1  技能注册 .................................. 12
5.2  技能引用与调度 ............................ 13
6  安全与合规 ................................. 15
7  运行与运维 ................................. 18
8  测试与验证 ................................. 21
9  附录 ....................................... 24`,
  `10.1  智能体生命周期管理 ...................... 24
10.2  多智能体协同 .............................. 26
10.3  异常处理与降级 ............................ 28
10.4  审计与追溯 ................................ 30
10.5  版本与发布 ................................ 32
11  参考文献 ................................... 34
附  录 A（资料性） 典型应用场景 ................. 36
附  录 B（资料性） 接口示例 ..................... 38`,
  `本文件规定了金融领域智能体（Financial AI Agent）在规划、构建、部署、运行与治理全生命周期中的总体要求、架构原则、数据与知识管理、技能引用与调度、安全合规及运维验证等方面的应用规范，适用于银行、证券、保险、基金等金融机构及其科技子公司在内部业务系统与对外服务中引入智能体能力时的设计与实施。`,
  `智能体应遵循「可控、可审计、可解释、可降级」四项基本原则。可控指人类对关键决策保留最终裁量权；可审计指关键交互、工具调用与数据访问留痕完整；可解释指对业务人员输出可追溯的推理摘要；可降级指在外部模型或工具不可用时具备规则或人工兜底路径。`,
  `金融机构部署智能体前，应完成场景分级评估，明确是否涉及客户敏感信息、是否触发自动交易或授信决策、是否跨系统写入等高风险操作，并据此配置权限边界、审批链路与监控策略。`,
  `数据与知识管理章节要求：训练与检索所用数据应来源合法、分类分级清晰、脱敏策略可验证；知识库更新应支持增量索引与版本回滚；向智能体注入的上下文应遵循最小必要原则，避免无关字段进入提示词。`,
  `技能（Skill）是智能体可调用的原子能力单元，包括查询、计算、填单、审批发起、报告生成等。技能注册时应声明输入输出 schema、超时阈值、幂等性、所需权限及失败时的错误码规范，便于统一调度与观测。`,
  `技能引用与调度应支持同步与异步两种模式。对实时交互场景优先同步调用并设置严格超时；对批处理或长链路任务采用异步队列，并提供任务 ID 供用户查询进度。调度器应记录每次调用的 latency、token 消耗与结果状态。`,
  `安全要求涵盖身份认证、传输加密、存储加密与密钥轮换。智能体访问内部 API 须使用短期凭证或服务账号，禁止在提示词或日志中明文写入密钥。对外部大模型服务的调用应通过统一网关，实施内容过滤与出站审计。`,
  `涉及 Chain of Thought（CoT）等推理增强时，金融机构应评估是否向用户展示中间步骤，以及如何对推理链进行脱敏。生产环境默认不向终端用户展示完整 CoT，仅向运维与合规角色开放受限视图。`,
  `通信协议方面，内部微服务间调用推荐 HTTPS/gRPC，消息体采用 JSON 或 Protobuf；跨域 Webhook 回调须验证 HMAC 签名与时间戳，防止重放攻击。`,
  `多智能体协同场景下，应明确主控智能体（Orchestrator）与子智能体（Worker）的职责划分。主控负责意图识别、任务分解与结果汇总；子智能体专注单一领域任务，避免循环委托导致成本失控。`,
  `运行与运维要求建立 SLA 指标：可用性、P95 响应时延、幻觉率抽检、工具调用成功率、人工接管率等。应配置告警阈值与值班升级路径，并与现有 ITSM 流程对接。`,
  `测试与验证应覆盖功能、安全、性能与合规四类用例。功能测试包含典型问答、边界输入与多轮对话；安全测试包含提示注入、越权调用与数据泄露探针；性能测试在峰值 QPS 下验证扩容策略。`,
  `版本发布应采用灰度策略：先在内部试点用户群验证，再逐步扩大流量；每次发布须保留模型版本、提示词版本、知识库索引版本的三元组记录，支持一键回滚。`,
  `审计日志应包含：用户标识、会话 ID、输入摘要、检索片段 ID、工具调用参数哈希、输出摘要、人工反馈标记。日志保留期限应符合监管要求，并支持按案件调查导出。`,
  `对客服务类智能体，应在界面显著位置提示「AI 生成内容仅供参考」，并提供转人工入口。涉及投资建议、保险条款解释等场景，输出须附带免责声明与引用来源链接。`,
  `知识库切片策略应结合文档结构：法规条文按条款切分，操作手册按步骤切分，FAQ 按问答对切分。切片长度与重叠参数应可配置，并在预览界面展示切片效果供业务人员确认。`,
  `索引失败与部分成功状态须在管理台可见，支持对失败条目单独重试。批量重索引任务应显示进度与预计完成时间，避免重复提交。`,
  `与 JR/T 0071-2020、JR/T 0166-2020 等金融行业网络安全与数据安全相关标准衔接时，智能体平台应映射控制项到具体技术措施，并在年度自查中提供证据材料。`,
  `智能体访问客户个人信息时，须遵循告知同意原则，并在调用链中传递 consent token。缺少有效授权的请求应被拒绝并记录审计事件，不得静默降级为匿名访问。`,
  `模型选型应评估：中文金融术语理解、数值计算准确性、长上下文稳定性、私有化部署可行性及供应商退出预案。禁止在未评估数据出境风险的情况下将境内客户数据发送至境外公有模型。`,
  `提示词工程应纳入配置管理：模板变更需 Code Review，禁止在生产环境直接编辑未评审模板。敏感词与禁答列表应集中维护，支持热更新。`,
  `工具调用失败时的用户体验应友好：明确告知失败原因（超时、权限不足、下游不可用），给出可操作建议（稍后重试、联系人工），避免向用户暴露堆栈或内部系统名。`,
  `智能体平台应提供运营看板：会话量、活跃用户、Top 意图、未命中知识比例、用户满意度（ thumbs up/down ）等，供产品与合规团队持续优化。`,
  `灾备要求：核心编排服务与向量库应具备跨可用区部署能力；RPO/RTO 目标应写入业务连续性计划。定期演练故障切换，验证智能体在备站只读模式下的降级行为。`,
  `培训与上岗：业务人员应接受智能体能力边界培训；运维人员应熟悉日志查询与回滚操作；开发人员应遵循安全编码规范，禁止在技能实现中硬编码凭据。`,
  `Smart Agent（智能体）架构建议采用中心化管理与分布式执行：中心侧统一策略、权限与观测；执行侧就近部署以降低时延。任务分发应支持优先级队列，保障 VIP 客户或监管报送类任务。`,
  `参考文献
[1] JR/T 0071-2020 金融行业网络安全等级保护实施指引
[2] JR/T 0166-2020 云计算技术金融应用规范
[3] JR/T 0185-2020 商业银行应用程序接口安全管理规范
[4] GB/T 22239-2019 信息安全技术 网络安全等级保护基本要求
[5] 国家网信办生成式人工智能服务管理暂行办法`,
]

const DOC_CHUNK_SOURCE_TEXT = CHUNK_CONTENTS.join('\n\n')

function splitSourceText(text: string, chunkSize: number, chunkOverlap: number): string[] {
  if (text.length === 0) return []
  if (chunkSize <= 0) return [text]

  const overlap = Math.max(0, Math.min(chunkOverlap, chunkSize - 1))
  const step = Math.max(1, chunkSize - overlap)
  const chunks: string[] = []

  for (let start = 0; start < text.length; start += step) {
    chunks.push(text.slice(start, start + chunkSize))
    if (start + chunkSize >= text.length) break
  }

  return chunks
}

function getStaticDocChunkPreview(): DocChunkPreviewItem[] {
  return CHUNK_CONTENTS.map((content, index) => ({
    index: index + 1,
    charCount: content.length,
    content,
  }))
}

export function buildDocChunkPreview(params: DocChunkPreviewParams): DocChunkPreviewItem[] {
  if (params.splitter === 'none') {
    return getStaticDocChunkPreview()
  }

  const chunkSize = Math.max(1, params.chunkSize)
  const chunkOverlap = Math.max(0, params.chunkOverlap)

  return splitSourceText(DOC_CHUNK_SOURCE_TEXT, chunkSize, chunkOverlap).map((content, index) => ({
    index: index + 1,
    charCount: content.length,
    content,
  }))
}

export function getDocChunkPreviewTotalChars(chunks: DocChunkPreviewItem[]): number {
  return chunks.reduce((sum, chunk) => sum + chunk.charCount, 0)
}

/** @deprecated Use buildDocChunkPreview instead */
export function getDocChunkPreview(): DocChunkPreviewItem[] {
  return getStaticDocChunkPreview()
}
