import type { ToolDirectoryItem } from '../data/tools-directory'

export type ToolInputSchemaRow = {
  property: string
  type: string
  description: string
  required: boolean
}

function createRow(
  property: string,
  type: string,
  description: string,
  required: boolean,
): ToolInputSchemaRow {
  return { property, type, description, required }
}

export function buildToolInputSchemaRows(item: ToolDirectoryItem): ToolInputSchemaRow[] {
  switch (item.id) {
    case 'tool-forms-intake':
      return [
        createRow('employeeName', 'string', '新员工姓名', true),
        createRow('employeeEmail', 'string', '新员工邮箱地址', true),
        createRow('formType', 'string', '表单类型，如入职资料或信息确认', false),
      ]
    case 'tool-trello-card':
      return [
        createRow('employeeId', 'string', '员工唯一编号', true),
        createRow('boardId', 'string', '目标看板 ID', true),
        createRow('listName', 'string', '卡片要落入的列表名称', false),
      ]
    case 'tool-knowledge-answer':
      return [
        createRow('question', 'string', '员工提出的问题内容', true),
        createRow('knowledgeScope', 'string', '知识检索范围或知识库名称', false),
        createRow('topK', 'number', '返回引用片段数量', false),
      ]
    case 'tool-csv-analyzer':
      return [
        createRow('fileUrl', 'string', 'CSV 文件地址或上传后的文件链接', true),
        createRow('sheetName', 'string', '需要分析的工作表名称', false),
        createRow('checkMissing', 'boolean', '是否检查缺失值与格式异常', false),
      ]
    case 'tool-upload-csv':
      return [
        createRow('fileUrl', 'string', '待导入 CSV 文件地址', true),
        createRow('targetTable', 'string', '目标知识表名称', true),
        createRow('overwriteExisting', 'boolean', '冲突时是否覆盖已有记录', false),
      ]
    case 'tool-delete-records':
      return [
        createRow('recordIds', 'array<string>', '待删除记录 ID 列表', true),
        createRow('reason', 'string', '执行删除的原因说明', false),
        createRow('operatorName', 'string', '执行操作的人员名称', false),
      ]
    case 'tool-upsert-record':
      return [
        createRow('uniqueId', 'string', '记录唯一标识', true),
        createRow('recordContent', 'object', '待更新或插入的记录内容', true),
        createRow('allowCreate', 'boolean', '记录不存在时是否允许自动创建', false),
      ]
    case 'tool-teams-message':
      return [
        createRow('recipientId', 'string', 'Teams 接收人 ID', true),
        createRow('message', 'string', '要发送的消息正文', true),
        createRow('sendAt', 'string', '计划发送时间', false),
      ]
    default:
      return [
        createRow('input', 'string', '工具执行所需的主要输入参数', true),
        createRow('context', 'object', '补充上下文信息', false),
      ]
  }
}
