# 三角色权限体系（RBAC）

本文档描述 Studio X 原型中 **Admin / Manager / User** 三个登录角色的权限划分，按侧栏导航模块梳理。

- **权限定义**：[`src/auth/rbac.ts`](../src/auth/rbac.ts)
- **导航门控**：[`src/pages/Home.tsx`](../src/pages/Home.tsx) — `canAccessPage()`
- **模块内门控**：各页面 `useRbac()` 及 `*Capabilities` Hook
- **User 全量清单**：[`rbac-user.md`](./rbac-user.md)（单列 User 表格样式）
- **三角色合一总表**：[`rbac-permissions-list.md`](./rbac-permissions-list.md)（单列表格，按导航版块）

## 演示账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| Admin | `admin@studiox.com` | `admin123` |
| Manager | `manager@studiox.com` | `mgr123` |
| User | `user@studiox.com` | `user123` |

## 角色层级

```
Admin（平台管理者）
  └── Manager（运营配置者）
        └── User（业务使用者）
```

| 维度 | User | Manager | Admin |
|------|:----:|:-------:|:-----:|
| 定位 | 业务使用者 | 运营配置者 | 平台管理者 |
| 导航模块数 | **3** | **11** | **11** |
| 配置/发布能力 | 无 | 大部分有 | 全部有 |
| 访问控制 | 不可见 | 部分管理 | 完整管理 + 审计 |

**继承关系**：Admin = Manager 全部权限 + 审计日志 + 若干 Admin 专属 UI 能力；Manager 在 User 之上增加创建/编辑/发布/协作配置；User 为最小可用集。

---

## 导航可见性总览

| 导航模块 | User | Manager | Admin |
|----------|:----:|:-------:|:-----:|
| 首页 | ✅ | ✅ | ✅ |
| Agent 库 | ❌ | ✅ | ✅ |
| 场景配置 | ✅ | ✅ | ✅ |
| 体验 | ✅ | ✅ | ✅ |
| 应用市场 | ❌ | ✅ | ✅ |
| 知识库 | ❌ | ✅ | ✅ |
| 工具 | ❌ | ✅ | ✅ |
| Skills | ❌ | ✅ | ✅ |
| 团队协作空间 | ❌ | ✅ | ✅ |
| 分析 | ❌ | ✅ | ✅ |
| 访问控制 | ❌ | ✅ | ✅ |
| 侧栏历史记录 | ✅（受限） | ✅ | ✅ |

---

## 各模块详细权限

### 1. 首页

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 进入首页 | ✅ | ✅ | ✅ |
| Plan Mode / Build Mode 切换 | ❌ | ✅ | ✅ |
| 入职快捷入口（Onboarding Shortcuts） | ❌ | ✅ | ✅ |
| 对话能力 | 单对话框、纯聊天（`chatOnly`） | Plan/Build 全流程 | 同 Manager |
| Joyce AI 侧栏（会话态） | ❌ | ✅ | ✅ |

**User 限制**：无 Plan/Build 模式；发送消息后仅演示回复；历史记录不含 Agent 类记录。

---

### 2. Agent 库

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看 Agent 列表/详情 | — | ✅ | ✅ |
| 新建 Agent | — | ✅ | ✅ |
| 编辑 Agent | — | ✅ | ✅ |
| 删除 Agent | — | ✅ | ✅ |
| 高级配置（Advanced Config） | — | ✅ | ✅ |
| Manager Agent 开关 | — | ✅ | ✅ |
| 发布 Agent（`agent.publish`） | — | RBAC 已定义，UI 待接入 | 同左 |

**布局**：Manager/Admin 页面右侧带 Joyce AI 分栏。

**相关权限码**：`nav.agent_library`、`agent.view`、`agent.create`、`agent.edit`、`agent.delete`、`agent.advanced_config`、`agent.manager_toggle`、`agent.publish`

---

### 3. 场景配置

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ✅ | ✅ | ✅ |
| 查看场景列表 | ✅ | ✅ | ✅ |
| 进入场景详情 | ✅ | ✅ | ✅ |
| 新建场景 | ❌ | ✅ | ✅ |
| 编辑场景卡片 | ❌ | ✅ | ✅ |
| 复制 / 删除场景 | ❌ | ✅ | ✅ |
| 发布场景 | ❌ | ✅ | ✅ |
| 冻结场景激活 | ❌ | ✅ | ✅ |
| 详情 · Build（工作流编辑） | ❌ | ✅ | ✅ |
| 详情 · Runs（运行测试） | ✅ | ✅ | ✅ |
| 工具栏 + New / Joyce AI | ❌ | ✅ | ✅ |
| Joyce AI 侧栏 | ❌ | ✅ | ✅ |
| 创建者 / 模板来源展示 | ✅ 只读 | ✅ | ✅ |

**User 详情页**：默认 Runs；隐藏 Build Tab；画布锁定；不可拖拽节点、不可打开配置抽屉。

**相关权限码**：`nav.scenarios`、`scenario.view`、`scenario.create`、`scenario.edit`、`scenario.delete`、`scenario.publish`

---

### 4. 体验

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ✅ | ✅ | ✅ |
| 体验列表 | ✅ | ✅ | ✅ |
| 创建 / 复制 / 删除体验卡片 | ✅ | ✅ | ✅ |
| 进入「新员工入职」完整体验流 | ✅ | ✅ | ✅ |
| Joyce AI 侧栏 | ❌ | ✅ | ✅ |

**相关权限码**：`nav.experience`

---

### 5. 应用市场

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 浏览模板（Agent / 场景 / 工具 / Skills） | — | ✅ | ✅ |
| 安装模板到工作区 | — | ✅ | ✅ |
| Joyce AI 侧栏 | — | ✅ | ✅ |

**相关权限码**：`nav.app_market`、`app_market.view`、`app_market.install`

---

### 6. 知识库

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看知识库 | — | ✅ | ✅ |
| 根目录创建文件夹/知识库 | — | ✅ | ✅ |
| 文件夹内创建知识库 | — | ✅ | ✅ |
| 上传文档 | — | ✅（直开本地上传） | ✅（可选本地/集成来源） |
| 编辑知识库内容 | — | ✅ | ✅ |
| 权限分配 | — | ✅ | ✅ |
| 查看第三方集成版块 | — | ✅ | ✅ |
| 连接/配置第三方集成 | — | ❌（需联系 IT） | ✅ |
| 文档完整操作（预览/API/代码块等） | — | ❌（仅删除） | ✅ |
| 上传高级设置 | — | ❌ | ✅ |

**说明**：User 在 RBAC 中无 `nav.knowledge_base`，无法从导航进入。`useKnowledgeBaseCapabilities` 中 User 相关逻辑为预留设计。

**相关权限码**：`nav.knowledge_base`、`kb.view`、`kb.create_folder`、`kb.create`、`kb.upload_documents`、`kb.integrations`、`kb.edit`、`kb.manage_permissions`

**实现参考**：[`src/modules/knowledge-base/hooks/useKnowledgeBaseCapabilities.ts`](../src/modules/knowledge-base/hooks/useKnowledgeBaseCapabilities.ts)

---

### 7. 工具（Tools）

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看工具目录 | — | ✅ | ✅ |
| 新建 / 编辑工具 | — | ✅ | ✅ |
| Joyce AI 侧栏 | — | ✅ | ✅ |

**相关权限码**：`nav.tools`、`tools.view`、`tools.create`、`tools.edit`

---

### 8. Skills

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看 Skills 列表 | — | ✅ | ✅ |
| 新建 / 编辑 Skill | — | ✅ | ✅ |
| Joyce AI 侧栏 | — | ✅ | ✅ |

**相关权限码**：`nav.skills`、`skills.view`、`skills.create`、`skills.edit`

---

### 9. 团队协作空间

列表页仅两个版块：**共享空间** + **团队协作空间**（无个人空间版块）。

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看共享空间 | — | ✅（只读） | ✅ |
| 编辑 / 删除共享空间 | — | ❌ | ✅ |
| 查看团队协作空间 | — | ✅ | ✅ |
| 新建团队协作空间 | — | ✅ | ✅ |
| 编辑 / 删除团队空间 | — | ✅ | ✅ |
| 成员管理 / 邀请 | — | ✅ | ✅ |
| 子级空间（Zone）增删改 | — | ❌（只读） | ✅ |

**相关权限码**：`nav.team`、`team.view`、`team.create_space`、`team.configure_access`、`team.invite_member`、`team.manage_zones`

**实现参考**：[`src/modules/team-collaboration-space/hooks/useTeamCollaborationCapabilities.ts`](../src/modules/team-collaboration-space/hooks/useTeamCollaborationCapabilities.ts)

---

### 10. 分析

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 导航入口 | ❌ | ✅ | ✅ |
| 查看分析仪表盘 | — | ✅ | ✅ |
| 导出数据 | — | ✅ | ✅ |
| 编辑布局 | — | ✅ | ✅ |
| Joyce AI 侧栏 | — | ✅ | ✅ |

**相关权限码**：`nav.analytics`、`analytics.view`、`analytics.export`、`analytics.edit_layout`

---

### 11. 访问控制

| 子模块 | User | Manager | Admin |
|--------|:----:|:-------:|:-----:|
| 导航入口 | ❌ | ✅ | ✅ |
| 工作区管理 | — | ✅ | ✅ |
| 用户管理 | — | ✅ | ✅ |
| 成员管理 · 行内操作 | — | ✅ | ✅ |
| 成员管理 · 创建子部门 | — | ❌ | ✅ |
| 成员管理 · 删除部门/批量删除 | — | ❌ | ✅ |
| 成员管理 · 完整编辑部门 | — | ❌ | ✅ |
| 部门管理 · 创建/删除/批量操作 | — | ❌ | ✅ |
| 部门管理 · 编辑部门 | — | ✅（受限） | ✅ |
| 角色 · 创建/编辑/删除 | — | ❌ | ✅ |
| 角色 · 添加/移除成员 | — | ✅ | ✅ |
| **审计日志** | — | ❌ | ✅ |

**Manager 成员保护**：部门 Manager 成员在成员管理中受保护，不可被随意删除/失效。

**相关权限码**：`nav.access_control`、`ac.view`、`ac.workspace_manage`、`ac.users_manage`、`ac.roles_manage`、`ac.audit_log_view`（仅 Admin）

**实现参考**：[`src/modules/access-control/hooks/useAccessControlCapabilities.ts`](../src/modules/access-control/hooks/useAccessControlCapabilities.ts)

---

### 12. 侧栏 · 历史记录

非独立导航项，但受角色约束。

| 能力 | User | Manager | Admin |
|------|------|---------|-------|
| 查看历史列表 | ✅ | ✅ | ✅ |
| 筛选：全部 / 对话 / 场景 | ✅ | ✅ | ✅ |
| 筛选：Agent | ❌ | ✅ | ✅ |
| Agent 类历史记录 | ❌ 隐藏 | ✅ | ✅ |

---

## Manager vs Admin 关键差异

| 领域 | Manager | Admin 额外能力 |
|------|---------|----------------|
| 访问控制 | 无审计日志；不可管部门结构/角色 CRUD | 审计日志；完整部门/角色管理 |
| 团队协作 | 共享空间只读；不可管理子级 Zone | 共享空间可编辑；子级 Zone 可管理 |
| 知识库 | 本地上传；不可连集成；文档操作受限 | 集成本地双通道；完整文档操作；上传高级设置 |
| RBAC 权限码 | 无 `ac.audit_log_view` | 有 `ac.audit_log_view` |

---

## 权限码清单（按角色）

### User

```
nav.home, nav.scenarios, nav.experience, scenario.view
```

### Manager（= SHARED + MANAGER_EXTRA + MANAGER_KB_EXTRA）

在 User 基础上增加：

- **导航**：Agent 库、应用市场、知识库、工具、Skills、团队协作、分析、访问控制
- **Agent**：delete, publish, advanced_config, manager_toggle
- **场景**：create, edit, delete, publish
- **分析**：export, edit_layout
- **团队**：create_space, configure_access, invite_member, manage_zones
- **知识库**：create_folder, create, upload_documents, integrations, edit, manage_permissions
- **工具/Skills**：create, edit
- **访问控制**：view, workspace_manage, users_manage, roles_manage

### Admin（= Manager + ADMIN_EXTRA）

额外：

```
ac.audit_log_view
```

---

## 架构说明

```
rbac.ts（权限定义）
    ├── USER_NAV_AND_VIEW      → User 最小集
    ├── SHARED_NAV_AND_VIEW    → Manager/Admin 共享基础
    ├── MANAGER_EXTRA          → Manager 运营配置
    ├── MANAGER_KB_EXTRA       → 知识库完整管理
    └── ADMIN_EXTRA            → 审计日志

Home.tsx                     → 导航门控 canAccessPage()
各模块 *Capabilities Hook     → 页面内细粒度 UI 门控
```

**三层门控**：

1. **导航级** — `nav.*` 控制侧栏是否显示模块入口
2. **功能级** — `agent.*` / `scenario.*` / `kb.*` 等控制按钮与操作
3. **UI 级** — 部分 Manager/Admin 差异通过 `role === 'admin'` 判断（如知识库集成、共享空间编辑）

**API 速查**：

```typescript
import { hasAppPermission, canAccessAppPage, getRolePermissions } from './auth/rbac'
import { useRbac } from './auth/useRbac'

// 静态检查
hasAppPermission('manager', 'scenario.edit')  // true
canAccessAppPage('user', 'agent-library')     // false

// 组件内
const { role, can, canAccessPage } = useRbac()
can('scenario.publish')
canAccessPage('scenarios')
```

---

*文档随代码演进更新；以 `src/auth/rbac.ts` 与各模块 Capabilities Hook 为准。*
