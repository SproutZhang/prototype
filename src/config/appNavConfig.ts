/** 主侧栏导航项（与 Home.tsx manus-sidebar-nav、rbac nav.* 一一对应） */
export type AppSidebarNavSectionConfig = {
  /** 权限 id 后缀，如 nav.home */
  slug: string
  labelZh: string
  labelEn: string
}

export const APP_SIDEBAR_NAV_SECTIONS: readonly AppSidebarNavSectionConfig[] = [
  { slug: 'home', labelZh: '首页', labelEn: 'Home' },
  { slug: 'agent_library', labelZh: 'Agent库', labelEn: 'Agents' },
  { slug: 'scenarios', labelZh: '场景配置', labelEn: 'Scenarios' },
  { slug: 'experience', labelZh: '体验', labelEn: 'Experience' },
  { slug: 'team', labelZh: '项目空间', labelEn: 'Project Space' },
  { slug: 'knowledge_base', labelZh: '知识库', labelEn: 'Knowledge Base' },
  { slug: 'tools', labelZh: '工具', labelEn: 'Tools' },
  { slug: 'skills', labelZh: '技能库', labelEn: 'Skills' },
  { slug: 'app_market', labelZh: '应用市场', labelEn: 'App Marketplace' },
  { slug: 'analytics', labelZh: '分析', labelEn: 'Analytics' },
  { slug: 'access_control', labelZh: '访问控制', labelEn: 'Access control' },
] as const
