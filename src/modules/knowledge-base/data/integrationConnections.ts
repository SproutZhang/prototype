import type { KnowledgeBaseIntegrationProvider } from '../types'

export type KnowledgeBaseConnectionDef = {
  id: string
  nameEn: string
  nameZh: string
  provider?: KnowledgeBaseIntegrationProvider
  /** Opens the connector-bridge picker when already connected. */
  usesConnectorBridge?: boolean
  logoSrc: string
}

export const KNOWLEDGE_BASE_CONNECTIONS: KnowledgeBaseConnectionDef[] = [
  {
    id: 'aws-s3',
    nameEn: 'AWS S3',
    nameZh: 'AWS S3',
    usesConnectorBridge: true,
    logoSrc: '/logos/aws-s3.svg',
  },
  {
    id: 'confluence',
    nameEn: 'Confluence',
    nameZh: 'Confluence',
    provider: 'confluence',
    usesConnectorBridge: true,
    logoSrc: '/logos/confluence.svg',
  },
  {
    id: 'google-drive',
    nameEn: 'Google Drive',
    nameZh: 'Google Drive',
    logoSrc: '/logos/google-drive.svg',
  },
  {
    id: 'sharepoint',
    nameEn: 'Microsoft SharePoint',
    nameZh: 'Microsoft SharePoint',
    logoSrc: '/logos/sharepoint.svg',
  },
  {
    id: 'onenote',
    nameEn: 'OneNote',
    nameZh: 'OneNote',
    logoSrc: '/logos/onenote.svg',
  },
  {
    id: 'veeva',
    nameEn: 'Veeva',
    nameZh: 'Veeva',
    logoSrc: '/logos/veeva.svg',
  },
  {
    id: 'azure-blob',
    nameEn: 'Azure Blob Storage',
    nameZh: 'Azure Blob Storage',
    logoSrc: '/logos/azure-blob.svg',
  },
  {
    id: 'dropbox',
    nameEn: 'Dropbox',
    nameZh: 'Dropbox',
    logoSrc: '/logos/dropbox.svg',
  },
  {
    id: 'jira',
    nameEn: 'Jira',
    nameZh: 'Jira',
    usesConnectorBridge: true,
    logoSrc: '/logos/jira.svg',
  },
  {
    id: 'notion',
    nameEn: 'Notion',
    nameZh: 'Notion',
    provider: 'notion',
    usesConnectorBridge: true,
    logoSrc: '/logos/notion.svg',
  },
  {
    id: 'servicenow',
    nameEn: 'ServiceNow',
    nameZh: 'ServiceNow',
    logoSrc: '/logos/servicenow.svg',
  },
  {
    id: 'zoho-desk',
    nameEn: 'Zoho Desk',
    nameZh: 'Zoho Desk',
    logoSrc: '/logos/zoho-desk.svg',
  },
  {
    id: 'coda',
    nameEn: 'Coda',
    nameZh: 'Coda',
    logoSrc: '/logos/coda.svg',
  },
  {
    id: 'gmail',
    nameEn: 'Gmail',
    nameZh: 'Gmail',
    logoSrc: '/logos/gmail.svg',
  },
  {
    id: 'outlook',
    nameEn: 'Microsoft Outlook',
    nameZh: 'Microsoft Outlook',
    logoSrc: '/logos/outlook.svg',
  },
  {
    id: 'onedrive',
    nameEn: 'OneDrive',
    nameZh: 'OneDrive',
    logoSrc: '/logos/onedrive.svg',
  },
  {
    id: 'strapi',
    nameEn: 'Strapi',
    nameZh: 'Strapi',
    logoSrc: '/logos/strapi.svg',
  },
  {
    id: 'feishu',
    nameEn: 'Feishu',
    nameZh: '飞书',
    provider: 'feishu',
    usesConnectorBridge: true,
    logoSrc: '/logos/feishu.svg',
  },
]

export function connectionName(
  connection: KnowledgeBaseConnectionDef,
  locale: 'zh' | 'en',
): string {
  return locale === 'zh' ? connection.nameZh : connection.nameEn
}

export function connectionUsesConnectorBridge(connection: KnowledgeBaseConnectionDef): boolean {
  return connection.usesConnectorBridge === true
}

const CONTENT_PROVIDER_ORDER: KnowledgeBaseIntegrationProvider[] = ['feishu', 'notion', 'confluence']

/** 知识库「选择文件 / 选择集成」流程：飞书、Notion、Confluence */
export const KNOWLEDGE_BASE_CONTENT_PROVIDER_CONNECTIONS: KnowledgeBaseConnectionDef[] =
  CONTENT_PROVIDER_ORDER.flatMap((provider) => {
    const match = KNOWLEDGE_BASE_CONNECTIONS.find((c) => c.provider === provider)
    return match ? [match] : []
  })
