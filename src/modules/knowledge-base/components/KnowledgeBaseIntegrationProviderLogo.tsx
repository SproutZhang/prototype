import type { KnowledgeBaseIntegrationProvider } from '../types'

type KnowledgeBaseIntegrationProviderLogoProps = {
  provider: KnowledgeBaseIntegrationProvider
  size?: number
}

const LOGO_SRC: Record<KnowledgeBaseIntegrationProvider, string> = {
  feishu: '/logos/feishu.svg',
  notion: '/logos/notion.svg',
  confluence: '/logos/confluence.svg',
}

export function KnowledgeBaseIntegrationProviderLogo({
  provider,
  size = 28,
}: KnowledgeBaseIntegrationProviderLogoProps) {
  return (
    <img
      className="kb-integration-provider-logo"
      src={LOGO_SRC[provider]}
      alt=""
      width={size}
      height={size}
      draggable={false}
    />
  )
}
