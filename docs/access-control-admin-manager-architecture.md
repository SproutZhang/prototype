# 访问控制与权限架构（Admin / Manager）

> 基于当前代码梳理，源码入口：  
> - 登录角色 RBAC：[`src/auth/rbac.ts`](../src/auth/rbac.ts)  
> - 角色权限清单：[`src/modules/access-control/data/rolePermissionsCatalog.ts`](../src/modules/access-control/data/rolePermissionsCatalog.ts)  
> - 访问控制能力门控：[`src/modules/access-control/hooks/useAccessControlCapabilities.ts`](../src/modules/access-control/hooks/useAccessControlCapabilities.ts)  
> - 项目空间能力门控：[`src/modules/team-collaboration-space/hooks/useTeamCollaborationCapabilities.ts`](../src/modules/team-collaboration-space/hooks/useTeamCollaborationCapabilities.ts)  
> - 工作区成员预设：[`src/modules/access-control/data/permissions.ts`](../src/modules/access-control/data/permissions.ts)

演示账号：**Admin** `admin@studiox.com` / `admin123` · **Manager** `manager@studiox.com` / `mgr123`

---

## 1. 权限体系三层模型

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1 · 登录角色（LoginRole: admin / manager / user）     │
│  AppPermission · 控制侧栏导航 + 各业务模块入口与操作            │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Layer 2 · 角色权限清单（Role Permission Catalog）            │
│  细粒度 id（如 nav.agent_library、ac-nav.workspace）          │
│  在「访问控制 → 角色」中勾选，可配置自定义工作区角色             │
└───────────────────────────┬─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│  Layer 3 · 工作区成员预设（RolePreset + Permission[]）          │
│  observer / collaborator / publisher / zone_admin / space_admin │
│  控制单个工作区/协作空间内的资源与成员操作                       │
└─────────────────────────────────────────────────────────────┘
```

| 层级 | 粒度 | 配置入口 | Admin | Manager |
|------|------|----------|:-----:|:-------:|
| Layer 1 | 应用级功能码 | 代码内置 + Catalog 导航项联动 | 全量 | 接近全量，治理项除外 |
| Layer 2 | 清单项（约 150+ 项） | 访问控制 → 角色 → 权限抽屉 | 全部可配 | 缺 6 项（见 §4） |
| Layer 3 | 18 项空间权限 | 工作区/空间成员角色 | 可分配任意预设 | 可分配，不可改内置 Admin 角色 |

**继承关系**：`Admin 权限 ⊇ Manager 权限 ⊇ User 权限`（Layer 1）；Layer 2 中 Manager 的 catalogProfile 为「全量减拒绝列表」。

---

## 2. Layer 1 — RBAC 功能权限码（Admin vs Manager）

### 2.1 导航权限 `nav.*`

| 权限码 | 模块 | Manager | Admin | 说明 |
|--------|------|:-------:|:-----:|------|
| `nav.home` | 首页 | ✅ | ✅ | |
| `nav.agent_library` | Agent 库 | ✅ | ✅ | |
| `nav.scenarios` | 场景配置 | ✅ | ✅ | |
| `nav.experience` | 体验 | ✅ | ✅ | |
| `nav.app_market` | 应用市场 | ✅ | ✅ | |
| `nav.knowledge_base` | 知识库 | ✅ | ✅ | |
| `nav.tools` | 工具 | ✅ | ✅ | |
| `nav.skills` | 技能库 | ✅ | ✅ | |
| `nav.team` | 项目空间 | ✅ | ✅ | Manager/Admin 内置账户始终可进 |
| `nav.analytics` | 分析 | ✅ | ✅ | |
| `nav.access_control` | 访问控制 | ✅ | ✅ | |

### 2.2 Agent 库 `agent.*`

| 权限码 | 能力 | Manager | Admin |
|--------|------|:-------:|:-----:|
| `agent.view` | 查看 | ✅ | ✅ |
| `agent.create` | 新建 | ✅ | ✅ |
| `agent.edit` | 编辑 | ✅ | ✅ |
| `agent.delete` | 删除 | ✅ | ✅ |
| `agent.publish` | 发布 | ✅ | ✅ |
| `agent.advanced_config` | 高级配置 | ✅ | ✅ |
| `agent.manager_toggle` | Manager Agent 开关 | ✅ | ✅ |

### 2.3 场景配置 `scenario.*`

| 权限码 | 能力 | Manager | Admin |
|--------|------|:-------:|:-----:|
| `scenario.view` | 查看 | ✅ | ✅ |
| `scenario.create` | 新建 | ✅ | ✅ |
| `scenario.edit` | 编辑 | ✅ | ✅ |
| `scenario.delete` | 删除 | ✅ | ✅ |
| `scenario.publish` | 发布 | ✅ | ✅ |

### 2.4 分析 `analytics.*`

| 权限码 | 能力 | Manager | Admin |
|--------|------|:-------:|:-----:|
| `analytics.view` | 查看仪表盘 | ✅ | ✅ |
| `analytics.export` | 导出 | ✅ | ✅ |
| `analytics.edit_layout` | 编辑布局 | ✅ | ✅ |

### 2.5 项目空间 / 团队协作 `team.*`

| 权限码 | 能力 | Manager | Admin | UI 门控补充 |
|--------|------|:-------:|:-----:|-------------|
| `team.view` | 进入模块 | ✅ | ✅ | |
| `team.create_space` | 创建空间 | ✅ | ✅ | |
| `team.configure_access` | 配置访问权限 | ✅ | ✅ | |
| `team.invite_member` | 邀请成员 | ✅ | ✅ | |
| `team.manage_zones` | 管理子级 Zone | ✅（RBAC） | ✅ | **UI：仅 Admin 可增删改 Zone** |

| 细项能力（`useTeamCollaborationCapabilities`） | Manager | Admin |
|--------------------------------------------------|:-------:|:-----:|
| 查看项目空间 | ✅ | ✅ |
| 新建/编辑/删除团队区一级空间 | ✅ | ✅ |
| 编辑/删除/新建公共空间 | ❌ | ✅ |
| 子级空间（Zone）增删改 | ❌ 只读 | ✅ |
| 邀请成员 | ✅ | ✅ |

### 2.6 知识库 `kb.*`

| 权限码 | 能力 | Manager | Admin |
|--------|------|:-------:|:-----:|
| `kb.view` | 查看 | ✅ | ✅ |
| `kb.create_folder` | 创建文件夹 | ✅ | ✅ |
| `kb.create` | 创建知识库 | ✅ | ✅ |
| `kb.upload_documents` | 上传文档 | ✅ | ✅ |
| `kb.integrations` | 第三方集成 | ✅ | ✅ |
| `kb.edit` | 编辑内容 | ✅ | ✅ |
| `kb.manage_permissions` | 权限分配 | ✅ | ✅ |

### 2.7 工具 / 技能 / 应用市场

| 域 | 查看 | 创建 | 编辑 | 安装 |
|----|:----:|:----:|:----:|:----:|
| 工具 `tools.*` | M/A ✅ | M/A ✅ | M/A ✅ | — |
| 技能 `skills.*` | M/A ✅ | M/A ✅ | M/A ✅ | — |
| 应用市场 `app_market.*` | M/A ✅ | — | — | M/A ✅ |

### 2.8 访问控制 `ac.*`

| 权限码 | 能力 | Manager | Admin |
|--------|------|:-------:|:-----:|
| `ac.view` | 进入访问控制 | ✅ | ✅ |
| `ac.workspace_manage` | 项目空间管理 | ✅ | ✅ |
| `ac.users_manage` | 成员/用户管理 | ✅ | ✅ |
| `ac.roles_manage` | 角色管理 | ✅ | ✅ |
| `ac.audit_log_view` | 审计日志查看 | ✅ | ✅ |

> **说明**：Layer 1 中 Manager 与 Admin 在 `ac.*` 上已对齐；**Admin 专属能力由 Layer 2 清单拒绝项 + UI 门控（`useAccessControlCapabilities`）进一步细分**。

---

## 3. Layer 2 — 访问控制子导航（`ac-nav.*`）

侧栏配置见 [`navConfig.ts`](../src/modules/access-control/nav/navConfig.ts)。

| 子版块 | 权限 id | Manager 侧栏 | Admin 侧栏 | Manager 操作范围 | Admin 操作范围 |
|--------|---------|:------------:|:----------:|------------------|----------------|
| 项目空间管理 | `ac-nav.workspace` | ✅ | ✅ | 增删改工作区、编辑成员、改访问模式（公共空间模式锁定） | 同左 + 全量 |
| 用户管理 | `ac-nav.users` | ❌ 隐藏 | ✅（入口暂未开放） | — | 创建/邀请用户 |
| 角色 | `ac-nav.roles` | ✅ | ✅ | 创建/编辑/删除**非内置**角色；不可改 Admin 内置角色 | 全部角色含内置 |
| 部门管理 | `ac-nav.departments` | ❌ 隐藏 | ✅（入口暂未开放） | — | 部门结构 CRUD |
| 成员管理 | `ac-nav.members` | ✅ | ✅ | 见 §5.2 | 见 §5.2 |
| 审计日志 | `ac-nav.audit-log` | ✅ | ✅ | **仅查看** | 查看 + 取消/删除记录 |
| API 密钥 | `ac-nav.api-keys` | ❌ | ✅ | — | 创建/启停/删除密钥 |
| 模型管理 | `ac-nav.model-management` | ❌ | ✅ | — | 模型 CRUD |

---

## 4. Layer 2 — 角色权限清单 Catalog（按版块）

Manager 的 catalogProfile 规则：**全量项 − MANAGER_DENIED_IDS**。

### 4.1 Manager 被拒绝的清单项（Admin 独有）

| 权限 id | 版块 | 中文标签 |
|---------|------|----------|
| `ac-nav.api-keys` | 访问控制 | API 密钥 |
| `ac-nav.model-management` | 访问控制 | 模型管理 |
| `ac-nav.users` | 访问控制 | 用户 |
| `basic.permission` | 基础设置 | 工作区 |
| `basic.role` | 基础设置 | 角色 |
| `other.cache` | 其它 | 缓存管理 |
| `other.api-doc` | 其它 | 接口文档 |

### 4.2 导航 `nav.*`（11 项）

| 权限 id | 标签 | Manager | Admin |
|---------|------|:-------:|:-----:|
| `nav.home` | 首页 | ✅ | ✅ |
| `nav.agent_library` | Agent库 | ✅ | ✅ |
| `nav.scenarios` | 场景配置 | ✅ | ✅ |
| `nav.experience` | 体验 | ✅ | ✅ |
| `nav.app_market` | 应用市场 | ✅ | ✅ |
| `nav.knowledge_base` | 知识库 | ✅ | ✅ |
| `nav.tools` | 工具 | ✅ | ✅ |
| `nav.skills` | 技能库 | ✅ | ✅ |
| `nav.team` | 项目空间 | ✅ | ✅ |
| `nav.analytics` | 分析 | ✅ | ✅ |
| `nav.access_control` | 访问控制 | ✅ | ✅ |

### 4.3 业务模块（Agent 库 / 场景 / 体验 / 应用市场 / 知识库 / 工具 / 技能库）

各模块均含 10 项标准能力（view / create / copy / export / edit_config / show_menu / update / delete / import / allowed_domains），Manager 与 Admin **均为 ✅**。

模块 id 前缀：`chat-flow`、`agent-library`、`scenarios`、`experience`、`app-market`、`knowledge-base`、`tools-directory`、`skills-library`。

### 4.4 文件库 `file-library.*`（9 项）

view · create · delete_doc_storage · delete_doc_loader · update_config · show_menu · update · add_doc_loader · preview_process_blocks — Manager/Admin 均为 ✅。

### 4.5 基础设置 `basic.*`

| 权限 id | 标签 | Manager | Admin | 依赖说明 |
|---------|------|:-------:|:-----:|----------|
| `basic.menu` | 菜单 | ✅ | ✅ | 勾选后才可配置「导航」版块 |
| `basic.role` | 角色 | ❌ | ✅ | 勾选后解锁 `ac-nav.roles` |
| `basic.permission` | 工作区 | ❌ | ✅ | 勾选后解锁 `ac-nav.workspace` |
| `basic.org` | 部门管理 | ✅ | ✅ | 勾选后解锁 `ac-nav.departments` |
| `basic.user` | 用户 | ✅ | ✅ | 勾选后解锁 `ac-nav.users` |

### 4.6 搜索 `search.*`（4 项）

keyword · record · suggest · hot — Manager/Admin ✅。

### 4.7 应用 `app.*`（5 项）

app · center · category · plugin · store — Manager/Admin ✅。

### 4.8 历史记录 `history-records.*`

| 权限 id | 标签 | Manager | Admin |
|---------|------|:-------:|:-----:|
| `history-records.all` | 全部内容 | ✅ | ✅ |
| `history-records.chat` | 历史对话记录 | ✅ | ✅ |
| `history-records.scenario` | 场景历史记录 | ✅ | ✅ |
| `history-records.agent` | Agent历史记录 | ✅ | ✅ |

### 4.9 统计分析 `analytics.*`（5 项）

traffic · visitor · source · visited · search — Manager/Admin ✅。

### 4.10 工作流管理 `workflow-mgmt.*`（10 项）

| 权限 id | 标签 |
|---------|------|
| `workflow-mgmt.process` | 流程 |
| `workflow-mgmt.task` | 任务管理 |
| `workflow-mgmt.node` | 节点 |
| `workflow-mgmt.history` | 历史 |
| `workflow-mgmt.proxy` | 代理 |
| `workflow-mgmt.design` | 模型设计 |
| `workflow-mgmt.deploy` | 部署 |
| `workflow-mgmt.instance` | 流程实例 |
| `workflow-mgmt.running` | 运行中任务 |
| `workflow-mgmt.done` | 已办任务 |

Manager / Admin 均为 ✅。

### 4.11 日志 `log.*`

| 权限 id | 标签 | Manager | Admin |
|---------|------|:-------:|:-----:|
| `log.login` | 登录 | ✅ | ✅ |
| `log.operation` | 操作日志 | ✅ | ✅ |
| `log.exception` | 异常 | ✅ | ✅ |

### 4.12 知识库（Catalog 独立版块）`knowledge.*`

catalog · manage · qa · tag — Manager/Admin ✅。

### 4.13 其它 `other.*`

| 权限 id | 标签 | Manager | Admin |
|---------|------|:-------:|:-----:|
| `other.cache` | 缓存管理 | ❌ | ✅ |
| `other.api-doc` | 接口文档 | ❌ | ✅ |

---

## 5. 访问控制模块 — UI 能力矩阵（`useAccessControlCapabilities`）

### 5.1 项目空间管理（工作区列表 / 编辑抽屉）

| 能力 | Manager | Admin |
|------|:-------:|:-----:|
| 进入项目空间管理 | ✅ | ✅ |
| 创建工作区 | ✅ | ✅ |
| 编辑工作区（名称/描述/成员） | ✅ | ✅ |
| 修改访问权限模式 | ✅ | ✅ |
| 公共空间访问模式 | 锁定「全员可访问」 | 同左 |
| 删除公共空间 | ✅ | ✅ |
| 删除其他工作区 | ✅ | ✅ |
| 锁定管理员行 | 显示已激活，不可移除 | 同左 |

### 5.2 成员管理

| 能力 | Manager | Admin |
|------|:-------:|:-----:|
| 进入成员管理 | ✅ | ✅ |
| 行内操作（激活/失效/删除成员） | ✅ | ✅ |
| 创建子部门 | ✅ | ✅ |
| 删除部门 / 批量删除 | ✅ | ✅ |
| 成员管理内编辑部门 | ✅ | ✅ |
| 侧栏部门树编辑 | ✅ | ✅ |

### 5.3 部门管理（入口隐藏，能力预置）

| 能力 | Manager | Admin |
|------|:-------:|:-----:|
| 侧栏入口 | ❌ | ❌（`ENABLE_DEPARTMENTS_NAV_SECTION=false`） |
| 创建部门 / 子部门 / 批量 / 第三方导入 | ❌ | ✅ |
| 删除部门（含批量） | ❌ | ✅ |
| 编辑部门 | ✅ 受限 | ✅ |
| 批量编辑 / 列表多选 | ❌ | ✅ |
| 部门内添加成员 | ✅ | ✅ |

### 5.4 角色管理

| 能力 | Manager | Admin |
|------|:-------:|:-----:|
| 进入角色管理 | ✅ | ✅ |
| 创建角色 | ✅ | ✅ |
| 编辑自定义角色 | ✅ | ✅ |
| 编辑内置 Admin 角色 | ❌ | ✅ |
| 编辑内置 Manager / User 角色 | ✅ | ✅ |
| 删除角色 | ✅（不可删 Admin 内置） | ✅ |
| 配置权限清单（RolePermissionsChecklist） | ✅ | ✅ |
| 角色内添加/移除成员 | ✅ | ✅ |

**内置角色保护规则**（`workspaceRoles.ts`）：

- Manager 不可变更 **Admin** 内置角色（`admin`）
- User 不可变更 **Admin、Manager** 内置角色

### 5.5 审计日志

| 能力 | Manager | Admin |
|------|:-------:|:-----:|
| 查看审计日志 | ✅ | ✅ |
| Tab：成员邀请 / 登录日志 等 | ✅ | ✅ |
| 取消审计记录 | ❌ | ✅ |
| 删除审计记录 | ❌ | ✅ |

### 5.6 Admin 专属子版块

| 子版块 | Manager | Admin |
|--------|:-------:|:-----:|
| API 密钥 | ❌ 不可见 | ✅ 全功能 |
| 模型管理 | ❌ 不可见 | ✅ 全功能 |
| 用户管理 | ❌ 不可见 | ✅（入口暂未开放） |

---

## 6. Layer 3 — 工作区成员预设（RolePreset）

| 预设 | 中文 | 空间访问 | 资源 | 成员 | Zone | 空间设置 |
|------|------|:--------:|:----:|:----:|:----:|:--------:|
| **observer** 观察者 | 查看 | view, list | view | view | view | — |
| **collaborator** 协作者 | +编辑 | +edit, create, run | +edit, create, run | view | view | — |
| **publisher** 发布者 | +发布 | +publish | 同协作者 | view | view | — |
| **zone_admin** 区管理员 | +区管 | 同发布者 | +invite, remove, edit_permission | +edit | — |
| **space_admin** 空间管理员 | 全部 18 项 | 含 space.edit / space.delete | 全部 | 全部 | 全部 | 全部 |

18 项空间权限完整列表：

```
access.view · access.list_resources
resource.view · resource.edit · resource.create · resource.delete · resource.run · resource.publish
member.view · member.invite · member.remove · member.edit_permission
zone.view · zone.create · zone.edit · zone.delete
space.edit · space.delete
```

**访问模式与初始成员**（`memberInit.ts`）：

| 模式 | 说明 | 典型初始成员 |
|------|------|--------------|
| default | 预定义默认成员 | 5 人混合预设 |
| open | 组织全员观察者 | 全员 observer |
| shared | 全员可访问 | 全员 + 共享空间权限集 |
| private | 仅自己 | space_admin 自己 |
| copy | 复制已有对象 | 从源复制 |

**公共空间（id=default）**：访问模式固定 `shared`（全员可访问），锁定不可改；组织全员以 User 预设加入。

---

## 7. 权限依赖关系图

```
basic.menu（菜单）
  └── nav.*（导航各项，含 nav.access_control）
        └── ac-nav.*（访问控制子导航）
              ├── basic.role → ac-nav.roles
              ├── basic.permission → ac-nav.workspace
              ├── basic.org → ac-nav.departments
              └── basic.user → ac-nav.users

取消 basic.menu → 自动清除全部 nav.*
取消 nav.access_control → 自动清除全部 ac-nav.*
取消 basic.role / permission / org / user → 清除对应 ac-nav 项
```

配置入口：访问控制 → 角色 → 编辑 → 权限抽屉（`RolePermissionsChecklist`）。

---

## 8. Admin vs Manager 差异速查

| 维度 | Manager | Admin |
|------|---------|-------|
| **定位** | 运营配置者 | 平台治理者 |
| **Catalog 权限项** | 全量 − 6 项 | 全量 |
| **API 密钥 / 模型管理** | 不可见 | 完整管理 |
| **基础设置 · 角色/工作区开关** | 不可勾选 | 可勾选 |
| **缓存 / 接口文档** | 不可勾选 | 可勾选 |
| **审计日志写操作** | 只读 | 取消/删除 |
| **内置 Admin 角色** | 不可编辑 | 可编辑 |
| **部门结构 CRUD** | 不可用 | 可用（入口待开放） |
| **公共空间 CRUD** | 不可管理（项目空间模块） | 可管理 |
| **子级 Zone** | 只读 | 增删改 |
| **Layer 1 RBAC** | 与 Admin 基本相同 | 全量 |

---

## 9. 实现文件索引

| Concern | 文件 |
|---------|------|
| 登录角色权限集 | `src/auth/rbac.ts` |
| Catalog 目录与 Manager 拒绝列表 | `src/modules/access-control/data/rolePermissionsCatalog.ts` |
| 访问控制 UI 门控 | `src/modules/access-control/hooks/useAccessControlCapabilities.ts` |
| 访问控制侧栏 | `src/modules/access-control/nav/navConfig.ts` |
| 主侧栏导航 | `src/config/appNavConfig.ts` |
| 内置角色保护 | `src/modules/access-control/data/workspaceRoles.ts` |
| 工作区种子 / 公共空间 | `src/modules/access-control/data/workspacesSeed.ts` |
| 项目空间门控 | `src/modules/team-collaboration-space/hooks/useTeamCollaborationCapabilities.ts` |
| 权限依赖 sanitize | `rolePermissionsCatalog.ts` → `sanitizeRolePermissionGrantIds` |

---

## 10. 后续可细化方向（可选）

1. **Layer 1 与 Layer 2 对齐**：将 `ac-nav.api-keys` 等映射为独立 `AppPermission`（如 `ac.api_keys_manage`），便于非 Admin 账户通过 Catalog 精确授权。  
2. **Manager 角色管理**：当前 Manager 可在 UI 创建/编辑角色，但 Catalog 中 `basic.role` 被拒绝——若需「只能改成员、不能改角色定义」，需统一 Catalog 与 RBAC。  
3. **部门 / 用户入口**：`ENABLE_*_NAV_SECTION` 开放后，需同步更新本文档 §3、§5.3。  
4. **工作区操作审计**：删除公共空间等高危操作可写入 `audit-log` 演示数据。
