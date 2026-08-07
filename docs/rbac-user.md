# User 角色 — 全部权限清单

> 演示账号：`user@studiox.com` / `user123`  
> 权限定义：[`src/auth/rbac.ts`](../src/auth/rbac.ts)

---

## RBAC 权限码

| 权限码 | User |
|--------|:----:|
| `nav.home` | ✅ |
| `nav.scenarios` | ✅ |
| `nav.experience` | ✅ |
| `scenario.view` | ✅ |
| `nav.agent_library` | ❌ |
| `nav.app_market` | ❌ |
| `nav.knowledge_base` | ❌ |
| `nav.tools` | ❌ |
| `nav.skills` | ❌ |
| `nav.team` | ❌ |
| `nav.analytics` | ❌ |
| `nav.access_control` | ❌ |
| `agent.view` | ❌ |
| `agent.create` | ❌ |
| `agent.edit` | ❌ |
| `agent.delete` | ❌ |
| `agent.publish` | ❌ |
| `agent.advanced_config` | ❌ |
| `agent.manager_toggle` | ❌ |
| `scenario.create` | ❌ |
| `scenario.edit` | ❌ |
| `scenario.delete` | ❌ |
| `scenario.publish` | ❌ |
| `analytics.view` | ❌ |
| `analytics.export` | ❌ |
| `analytics.edit_layout` | ❌ |
| `team.view` | ❌ |
| `team.create_space` | ❌ |
| `team.configure_access` | ❌ |
| `team.invite_member` | ❌ |
| `team.manage_zones` | ❌ |
| `kb.view` | ❌ |
| `kb.create_folder` | ❌ |
| `kb.create` | ❌ |
| `kb.upload_documents` | ❌ |
| `kb.integrations` | ❌ |
| `kb.edit` | ❌ |
| `kb.manage_permissions` | ❌ |
| `tools.view` | ❌ |
| `tools.create` | ❌ |
| `tools.edit` | ❌ |
| `skills.view` | ❌ |
| `skills.create` | ❌ |
| `skills.edit` | ❌ |
| `app_market.view` | ❌ |
| `app_market.install` | ❌ |
| `ac.view` | ❌ |
| `ac.workspace_manage` | ❌ |
| `ac.users_manage` | ❌ |
| `ac.roles_manage` | ❌ |
| `ac.audit_log_view` | ❌ |

---

## 导航可见性

| 能力 | User |
|------|:----:|
| 首页 | ✅ |
| 场景配置 | ✅ |
| 体验 | ✅ |
| Agent 库 | ❌ 隐藏 |
| 应用市场 | ❌ 隐藏 |
| 知识库 | ❌ 隐藏 |
| 工具 | ❌ 隐藏 |
| Skills | ❌ 隐藏 |
| 团队协作空间 | ❌ 隐藏 |
| 分析 | ❌ 隐藏 |
| 访问控制 | ❌ 隐藏 |

---

## 1. 首页

| 能力 | User |
|------|:----:|
| 进入首页 | ✅ |
| Plan Mode 切换 | ❌ 隐藏 |
| Build Mode 切换 | ❌ 隐藏 |
| 入职快捷入口（Onboarding Shortcuts） | ❌ 隐藏 |
| 单对话框聊天（`chatOnly`） | ✅ |
| 发送消息并接收演示回复 | ✅ |
| Joyce AI 侧栏（会话态） | ❌ 隐藏 |

---

## 2. Agent 库

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看 Agent 列表/详情 | ❌ |
| 新建 Agent | ❌ |
| 编辑 Agent | ❌ |
| 删除 Agent | ❌ |
| 高级配置（Advanced Config） | ❌ |
| Manager Agent 开关 | ❌ |
| 发布 Agent | ❌ |
| Joyce AI 侧栏 | ❌ |

---

## 3. 场景配置

| 能力 | User |
|------|:----:|
| 导航入口 | ✅ |
| 查看场景列表 | ✅ |
| 查看创建者 / 模板来源 | ✅ 只读 |
| 进入场景详情 | ✅ |
| 新建场景 | ❌ 隐藏 |
| 编辑场景卡片（名称/描述） | ❌ 隐藏 |
| 复制场景 | ❌ 隐藏 |
| 删除场景 | ❌ 隐藏 |
| 发布场景 | ❌ 隐藏 |
| 冻结场景激活 | ❌ 隐藏 |
| 卡片更多菜单 | ❌ 隐藏 |
| 详情 · Build（工作流编辑） | ❌ 隐藏 |
| 详情 · Runs（运行测试） | ✅ |
| 工作流画布拖拽 / 编辑节点 | ❌ |
| 打开节点配置抽屉 | ❌ |
| 工具栏 + New | ❌ 隐藏 |
| 工具栏 Joyce AI | ❌ 隐藏 |
| Save / Publish / 更多菜单 | ❌ 隐藏 |
| Joyce AI 侧栏 | ❌ 隐藏 |

---

## 4. 体验

| 能力 | User |
|------|:----:|
| 导航入口 | ✅ |
| 查看体验列表 | ✅ |
| 搜索 / 筛选体验 | ✅ |
| 创建体验 | ✅ |
| 复制体验 | ✅ |
| 删除体验 | ✅ |
| 进入「新员工入职」完整体验流 | ✅ |
| Joyce AI 侧栏 | ❌ 隐藏 |

---

## 5. 应用市场

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 浏览模板（Agent / 场景 / 工具 / Skills） | ❌ |
| 安装模板到工作区 | ❌ |
| Joyce AI 侧栏 | ❌ |

---

## 6. 知识库

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看知识库 | ❌ |
| 根目录创建文件夹/知识库 | ❌ |
| 文件夹内创建知识库 | ❌ |
| 上传文档 | ❌ |
| 编辑知识库内容 | ❌ |
| 权限分配 | ❌ |
| 查看第三方集成版块 | ❌ |
| 连接/配置第三方集成 | ❌ |
| 文档完整操作（预览/API/代码块等） | ❌ |
| 上传高级设置 | ❌ |

---

## 7. 工具（Tools）

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看工具目录 | ❌ |
| 新建工具 | ❌ |
| 编辑工具 | ❌ |
| Joyce AI 侧栏 | ❌ |

---

## 8. Skills

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看 Skills 列表 | ❌ |
| 新建 Skill | ❌ |
| 编辑 Skill | ❌ |
| Joyce AI 侧栏 | ❌ |

---

## 9. 团队协作空间

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看共享空间 | ❌ |
| 编辑 / 删除共享空间 | ❌ |
| 查看团队协作空间 | ❌ |
| 新建团队协作空间 | ❌ |
| 编辑 / 删除团队空间 | ❌ |
| 成员管理 / 邀请 | ❌ |
| 子级空间（Zone）增删改 | ❌ |

---

## 10. 分析

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 查看分析仪表盘 | ❌ |
| 导出数据 | ❌ |
| 编辑布局 | ❌ |
| Joyce AI 侧栏 | ❌ |

---

## 11. 访问控制

| 能力 | User |
|------|:----:|
| 导航入口 | ❌ 隐藏 |
| 工作区管理 | ❌ |
| 用户管理 | ❌ |
| 成员管理 | ❌ |
| 部门管理 | ❌ |
| 角色管理 | ❌ |
| 审计日志 | ❌ |

---

## 12. 侧栏 · 历史记录

非独立导航项，但受角色约束。

| 能力 | User |
|------|:----:|
| 查看历史列表 | ✅ |
| 筛选：全部 / 对话 / 场景 | ✅ |
| 筛选：Agent | ❌ 隐藏 |
| Agent 类历史记录 | ❌ 隐藏 |

---

*完整三角色对照见 [`rbac.md`](./rbac.md)。*
