import type { ReactNode } from 'react'

type PluginToolKind =
  | 'gmail'
  | 'slack'
  | 'google-workspace'
  | 'google-drive'
  | 'google-sheets'
  | 'teams'
  | 'notion'
  | 'salesforce'
  | 'feishu'
  | 'hitl'
  | 'webhook'
  | 'queue'
  | 'crm'
  | 'database'
  | 'pdf'
  | 'ocr'
  | 'identity'
  | 'model-routing'
  | 'retry'
  | 'web-search'
  | 'eval'
  | 'skill'
  | 'sso'
  | 'generic'

function resolvePluginToolKind(label: string): PluginToolKind {
  const s = label.trim().toLowerCase()
  if (s.includes('gmail')) return 'gmail'
  if (s.includes('slack')) return 'slack'
  if (s.includes('google sheets') || s.includes('sheets')) return 'google-sheets'
  if (s.includes('google drive') || s.includes('drive')) return 'google-drive'
  if (s.includes('google workspace') || (s.includes('workspace') && s.includes('google'))) return 'google-workspace'
  if (s.includes('microsoft teams') || s === 'teams') return 'teams'
  if (s.includes('notion')) return 'notion'
  if (s.includes('salesforce')) return 'salesforce'
  if (s.includes('飞书') || s.includes('feishu') || s.includes('lark')) return 'feishu'
  if (s.includes('人工审批') || s.includes('hitl') || s.includes('approval step')) return 'hitl'
  if (s.includes('webhook')) return 'webhook'
  if (s.includes('队列') || s.includes('queue')) return 'queue'
  if (s.includes('crm')) return 'crm'
  if (s.includes('数据库') || s.includes('database')) return 'database'
  if (s.includes('pdf')) return 'pdf'
  if (s.includes('ocr')) return 'ocr'
  if (s.includes('身份核验') || s.includes('identity')) return 'identity'
  if (s.includes('模型路由') || s.includes('model routing')) return 'model-routing'
  if (s.includes('重试') || s.includes('retry')) return 'retry'
  if (s.includes('网页搜索') || s.includes('web search')) return 'web-search'
  if (s.includes('评测') || s.includes('eval')) return 'eval'
  if (s.includes('sso')) return 'sso'
  if (s.includes('技能') || s.includes('skill') || s.includes('mcp')) return 'skill'
  return 'generic'
}

type PluginToolLogoProps = {
  name: string
  size?: number
}

export function PluginToolLogo({ name, size = 22 }: PluginToolLogoProps) {
  const kind = resolvePluginToolKind(name)
  const svg = (children: ReactNode, viewBox = '0 0 24 24') => (
    <svg width={size} height={size} viewBox={viewBox} aria-hidden="true" focusable="false">
      {children}
    </svg>
  )

  switch (kind) {
    case 'gmail':
    case 'google-workspace':
      return svg(
        <>
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </>,
      )
    case 'slack':
      return svg(
        <>
          <path
            d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 6.313 24a2.528 2.528 0 0 1-2.52-2.522v-6.313z"
            fill="#E01E5A"
          />
          <path
            d="M8.47 5.042a2.527 2.527 0 0 1-2.52-2.522A2.527 2.527 0 0 1 8.47 0a2.527 2.527 0 0 1 2.523 2.52v2.522H8.47zm0 1.271a2.528 2.528 0 0 1 2.523 2.521 2.528 2.528 0 0 1-2.523 2.521H2.157A2.527 2.527 0 0 1 0 6.834a2.528 2.528 0 0 1 2.157-2.521H8.47z"
            fill="#36C5F0"
          />
          <path
            d="M18.956 8.47a2.528 2.528 0 0 1 2.522-2.52A2.528 2.528 0 0 1 24 8.47a2.527 2.527 0 0 1-2.522 2.523h-2.522V8.47zm-1.27 0a2.527 2.527 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.523-2.521V2.157A2.528 2.528 0 0 1 15.683 0a2.528 2.528 0 0 1 2.523 2.522V8.47z"
            fill="#2EB67D"
          />
          <path
            d="M15.53 18.956a2.528 2.528 0 0 1 2.52 2.522A2.528 2.528 0 0 1 15.53 24a2.527 2.527 0 0 1-2.523-2.522v-2.522h2.523zm0-1.27a2.527 2.527 0 0 1-2.523-2.523 2.527 2.527 0 0 1 2.523-2.52h6.313A2.528 2.528 0 0 1 24 15.683a2.528 2.528 0 0 1-2.522 2.523h-6.313z"
            fill="#ECB22E"
          />
        </>,
        '0 0 24 24',
      )
    case 'google-drive':
      return svg(
        <>
          <path fill="#0066DA" d="M7.66 3h8.68L24 14.5 16.34 21H7.66L0 14.5 7.66 3z" />
          <path fill="#00AC47" d="M12 3 4.5 14.5h15L12 3z" />
          <path fill="#EA4335" d="M0 14.5 7.66 21h8.68L24 14.5H0z" />
        </>,
      )
    case 'google-sheets':
      return svg(
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" fill="#0F9D58" />
          <rect x="6" y="7" width="5" height="2" rx="0.5" fill="#fff" />
          <rect x="6" y="11" width="12" height="2" rx="0.5" fill="#fff" opacity="0.9" />
          <rect x="6" y="15" width="9" height="2" rx="0.5" fill="#fff" opacity="0.85" />
        </>,
      )
    case 'teams':
      return svg(
        <path
          fill="#6264A7"
          d="M20.625 8.127q-.55 0-1.025-.205-.475-.205-.832-.563-.358-.357-.563-.832Q18 6.053 18 5.502q0-.54.205-1.02t.563-.837q.357-.358.832-.563.474-.205 1.025-.205.54 0 1.02.205t.837.563q.358.357.563.837.205.48.205 1.02 0 .55-.205 1.025-.205.475-.563.832-.357.358-.837.563-.48.205-1.02.205zm0-3.75q-.469 0-.797.328-.328.328-.328.797 0 .469.328.797.328.328.797.328.469 0 .797-.328.328-.328.328-.797 0-.469-.328-.797-.328-.328-.797-.328zM24 10.002v5.578q0 .774-.293 1.46-.293.685-.803 1.194-.51.51-1.195.803-.686.293-1.459.293-.445 0-.908-.105-.463-.106-.85-.329-.293.95-.855 1.729-.563.78-1.319 1.336-.756.557-1.67.861-.914.305-1.898.305-1.148 0-2.162-.398-1.014-.399-1.805-1.102-.79-.703-1.312-1.664t-.674-2.086h-5.8q-.411 0-.704-.293T0 16.881V6.873q0-.41.293-.703t.703-.293h8.59q-.34-.715-.34-1.5 0-.727.275-1.365.276-.639.75-1.114.475-.474 1.114-.75.638-.275 1.365-.275t1.365.275q.639.276 1.114.75.474.475.75 1.114.275.638.275 1.365t-.275 1.365q-.276.639-.75 1.113-.475.475-1.114.75-.638.276-1.365.276-.188 0-.375-.024-.188-.023-.375-.058v1.078h10.875q.469 0 .797.328.328.328.328.797zM12.75 2.373q-.41 0-.78.158-.368.158-.638.434-.27.275-.428.639-.158.363-.158.773 0 .41.158.78.159.368.428.638.27.27.639.428.369.158.779.158.41 0 .773-.158.364-.159.64-.428.274-.27.433-.639.158-.369.158-.779 0-.41-.158-.773-.159-.364-.434-.64-.275-.275-.639-.433-.363-.158-.773-.158zM6.937 9.814h2.25V7.94H2.814v1.875h2.25v6h1.875zm10.313 7.313v-6.75H12v6.504q0 .41-.293.703t-.703.293H8.309q.152.809.556 1.5.405.691.985 1.19.58.497 1.318.779.738.281 1.582.281.926 0 1.746-.352.82-.351 1.436-.966.615-.616.966-1.43.352-.815.352-1.752zm5.25-1.547v-5.203h-3.75v6.855q.305.305.691.452.387.146.809.146.469 0 .879-.176.41-.175.715-.48.304-.305.48-.715t.176-.879Z"
        />,
      )
    case 'notion':
      return svg(
        <path
          fill="#000000"
          d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"
        />,
      )
    case 'salesforce':
      return svg(
        <>
          <path
            fill="#00A1E0"
            d="M12 4.5c1.8-1.9 4.6-2.2 6.7-.6 2.4 1.8 2.9 5.2 1.2 7.6 2.5.4 4.4 2.6 4.4 5.2 0 2.9-2.4 5.3-5.3 5.3H6c-2.9 0-5.3-2.4-5.3-5.3 0-2.6 1.9-4.8 4.4-5.2-1.7-2.4-1.2-5.8 1.2-7.6 2.1-1.6 4.9-1.3 6.7.6z"
          />
        </>,
      )
    case 'feishu':
      return svg(
        <>
          <rect x="2" y="2" width="20" height="20" rx="5" fill="#3370FF" />
          <path
            fill="#fff"
            d="M8.2 8.5h3.2l1.4 4.2 1.4-4.2h3.2L14.2 16h-2.6l1-3.1-1 3.1H9.2L8.2 8.5z"
          />
        </>,
      )
    case 'hitl':
      return svg(
        <>
          <circle cx="9" cy="8" r="3" fill="#6366f1" />
          <path
            fill="#6366f1"
            d="M4 20c0-3.3 2.2-6 5-6s5 2.7 5 6"
          />
          <path
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 11l2 2 5-5"
          />
        </>,
      )
    case 'webhook':
      return svg(
        <>
          <circle cx="7" cy="7" r="3" fill="#8b5cf6" />
          <circle cx="17" cy="17" r="3" fill="#8b5cf6" />
          <path
            fill="none"
            stroke="#8b5cf6"
            strokeWidth="2"
            strokeLinecap="round"
            d="M9.5 8.5L14.5 15.5"
          />
        </>,
      )
    case 'queue':
      return svg(
        <>
          <rect x="4" y="5" width="16" height="4" rx="1" fill="#64748b" />
          <rect x="4" y="10" width="16" height="4" rx="1" fill="#94a3b8" />
          <rect x="4" y="15" width="16" height="4" rx="1" fill="#cbd5e1" />
        </>,
      )
    case 'crm':
      return svg(
        <>
          <rect x="3" y="6" width="18" height="13" rx="2" fill="#0ea5e9" />
          <path fill="#fff" d="M7 10h10v2H7zm0 4h7v2H7z" />
        </>,
      )
    case 'database':
      return svg(
        <>
          <ellipse cx="12" cy="6.5" rx="7" ry="3" fill="#3b82f6" />
          <path fill="#60a5fa" d="M5 6.5v11c0 1.66 3.13 3 7 3s7-1.34 7-3v-11" />
          <ellipse cx="12" cy="17.5" rx="7" ry="3" fill="#2563eb" />
        </>,
      )
    case 'pdf':
      return svg(
        <>
          <rect x="4" y="3" width="16" height="18" rx="2" fill="#E53935" />
          <text x="12" y="14" textAnchor="middle" fill="#fff" fontSize="7" fontWeight="700" fontFamily="sans-serif">
            PDF
          </text>
        </>,
      )
    case 'ocr':
      return svg(
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" fill="none" stroke="#64748b" strokeWidth="1.75" />
          <path fill="#64748b" d="M7 9h10v1.5H7zm0 3h7v1.5H7zm0 3h9v1.5H7z" />
          <circle cx="18" cy="8" r="2" fill="#22c55e" />
        </>,
      )
    case 'identity':
      return svg(
        <>
          <rect x="4" y="6" width="16" height="12" rx="2" fill="#f59e0b" />
          <circle cx="12" cy="11" r="2.5" fill="#fff" />
          <rect x="7" y="14" width="10" height="2" rx="1" fill="#fff" opacity="0.9" />
        </>,
      )
    case 'model-routing':
      return svg(
        <>
          <circle cx="6" cy="12" r="2.5" fill="#6366f1" />
          <circle cx="18" cy="6" r="2.5" fill="#8b5cf6" />
          <circle cx="18" cy="18" r="2.5" fill="#a78bfa" />
          <path fill="none" stroke="#6366f1" strokeWidth="1.75" d="M8.2 11.2L15.8 7M8.2 12.8l7.6 4.2" />
        </>,
      )
    case 'retry':
      return svg(
        <path
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 8A7 7 0 1 0 19 12M19 6v6h-6"
        />,
      )
    case 'web-search':
      return svg(
        <>
          <circle cx="10.5" cy="10.5" r="5.5" fill="none" stroke="#4285F4" strokeWidth="2" />
          <path stroke="#4285F4" strokeWidth="2" strokeLinecap="round" d="M15 15l5 5" />
        </>,
      )
    case 'eval':
      return svg(
        <>
          <rect x="3" y="4" width="18" height="16" rx="2" fill="#7c3aed" />
          <rect x="6" y="13" width="2.5" height="4" rx="0.4" fill="#fff" />
          <rect x="10.75" y="10" width="2.5" height="7" rx="0.4" fill="#fff" />
          <rect x="15.5" y="7" width="2.5" height="10" rx="0.4" fill="#fff" />
        </>,
      )
    case 'sso':
      return svg(
        <>
          <rect x="5" y="10" width="14" height="10" rx="2" fill="#64748b" />
          <path
            fill="#fbbf24"
            d="M12 3a5 5 0 0 1 4.9 4H14a3 3 0 1 0-2.8 2h-1.2A5 5 0 0 1 12 3z"
          />
        </>,
      )
    case 'skill':
      return svg(
        <>
          <circle cx="12" cy="12" r="9" fill="#7f7cff" />
          <path
            fill="#fff"
            d="M12 7.5l1.1 3.4h3.6l-2.9 2.1 1.1 3.4L12 14.2l-2.9 2.2 1.1-3.4-2.9-2.1h3.6L12 7.5z"
          />
        </>,
      )
    default:
      return svg(
        <path
          fill="none"
          stroke="#6366f1"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        />,
      )
  }
}
