import { type CSSProperties, type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { PlanBlueprintToolIcon } from '../components/shared/WfBlueprintStepsBlock'
import { useLocale } from '../i18n/LocaleContext'
import {
  getToolCardTag,
  localizeToolForDisplay,
  localizeToolType,
  toolsT,
} from '../i18n/toolsStrings'
import {
  createCustomToolDirectoryItem,
  createImportedToolDirectoryItem,
  createRemoteMcpToolDirectoryItem,
  isReferencedTool,
  isMcpToolItem,
  type ToolDirectoryItem,
  type ToolIconTone,
  type ToolIntegrationApp,
} from '../data/tools-directory'
import { useRbac } from '../auth/useRbac'
import { SectionIterationVersionModal } from '../modules/team-collaboration-space/components/SectionIterationVersionModal'
import type { SectionIterationPublishPayload } from '../modules/team-collaboration-space/utils/appendSectionIterationRecord'
import { recordInitialSectionIteration } from '../modules/team-collaboration-space/utils/appendSectionIterationRecord'
import { publishSectionIteration } from '../modules/team-collaboration-space/utils/publishSectionIteration'
import { tcsT } from '../modules/team-collaboration-space/i18n/strings'

type ToolsDirectoryViewMode = 'table' | 'cards'
type ToolsDirectoryMenu = 'columns' | 'sort' | null
type ToolsDirectoryTab = 'all' | 'referenced' | 'tool' | 'mcp' | 'mine'
type CreateToolModalStep = 'choose' | 'mcpHub' | 'mcpCustom' | 'mcpPreset' | null
type McpPresetId = 'notion' | 'linear' | 'canva' | 'atlassian' | 'clickup' | 'zapier' | 'tally'
type McpAuthType = 'none' | 'api-key' | 'custom-headers' | 'oauth'
type McpConnectionMode = 'per-user' | 'shared'
type ToolColumnId =
  | 'description'
  | 'type'
  | 'integrations'
  | 'owner'
  | 'agents'
  | 'lastRun'
  | 'lastModified'
  | 'created'
  | 'timesRun'
type ToolSortId = 'name' | 'description' | 'created' | 'lastModified' | 'lastRun' | 'timesRun'
type ToolConfigSchemaRow = {
  id: string
  property: string
  type: string
  description: string
  required: boolean
}

type ToolConfigDraft = {
  toolName: string
  toolDescription: string
  toolIconSource: string
  inputSchemaRows: ToolConfigSchemaRow[]
  javascriptFunction: string
}

type McpHeaderDraft = {
  id: string
  name: string
  value: string
}

type McpCustomDraft = {
  url: string
  label: string
  authentication: McpAuthType
  isAdvancedOpen: boolean
  headers: McpHeaderDraft[]
}

type McpPresetDraft = {
  presetId: McpPresetId
  url: string
  label: string
  authentication: 'oauth'
  connectionMode: McpConnectionMode
  isAdvancedOpen: boolean
  clientId: string
  clientSecret: string
  headers: McpHeaderDraft[]
}

type McpOAuthStep = 'login' | 'email' | 'saml' | 'google-accounts' | 'google-consent'

type McpOAuthGoogleAccount = {
  id: string
  name: string
  email: string
  avatarLabel: string
  avatarTone: string
}

const MCP_OAUTH_GOOGLE_ACCOUNTS: McpOAuthGoogleAccount[] = [
  { id: 'google-1', name: 'Martin Cooper', email: 'martin.cooper@gmail.com', avatarLabel: 'M', avatarTone: '#c4a484' },
  { id: 'google-2', name: 'Emily Watson', email: 'emily.watson@gmail.com', avatarLabel: 'E', avatarTone: '#8b5cf6' },
  { id: 'google-3', name: 'James Miller', email: 'james.miller.2003@gmail.com', avatarLabel: 'J', avatarTone: '#14b8a6' },
]

const COLUMN_OPTION_CONFIG: { id: ToolColumnId; defaultVisible: boolean }[] = [
  { id: 'description', defaultVisible: true },
  { id: 'type', defaultVisible: true },
  { id: 'integrations', defaultVisible: true },
  { id: 'owner', defaultVisible: false },
  { id: 'agents', defaultVisible: true },
  { id: 'lastRun', defaultVisible: false },
  { id: 'lastModified', defaultVisible: false },
  { id: 'created', defaultVisible: false },
  { id: 'timesRun', defaultVisible: false },
]

const SORT_OPTION_IDS: ToolSortId[] = ['name', 'description', 'created', 'lastModified', 'lastRun', 'timesRun']
const TOOLS_PER_PAGE = 7
const EMPTY_MCP_HEADERS: McpHeaderDraft[] = []
const TOOL_FUNCTION_GUIDE = `/*
* You can use any libraries imported in Flowise
* You can use properties specified in Input Schema as variables. Ex: Property = userid, Variable = $userid
* You can get default flow config: $flow.sessionId, $flow.chatId, $flow.chatflowId, $flow.input, $flow.state
* You can get custom variables: $vars.<variable-name>
* Must return a string value at the end of function
*/`
const TOOL_FUNCTION_EXAMPLE = `${TOOL_FUNCTION_GUIDE}

const fetch = require('node-fetch');
const url = 'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current_weather=true';
const options = {
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};
try {
    const response = await fetch(url, options);
    const text = await response.text();
    return text;
} catch (error) {
    console.error(error);
    return '';
}`
const MCP_PRESET_CONFIG: Record<
  McpPresetId,
  {
    name: { zh: string; en: string }
    description: { zh: string; en: string }
    url: string
    authentication: 'oauth'
  }
> = {
  notion: {
    name: { zh: 'Notion', en: 'Notion' },
    description: { zh: '连接你的 Notion 工作区', en: 'Connect to your Notion workspace' },
    url: 'https://mcp.notion.com/mcp',
    authentication: 'oauth',
  },
  linear: {
    name: { zh: 'Linear', en: 'Linear' },
    description: { zh: '同步项目与 issue 管理', en: 'Sync project and issue management' },
    url: 'https://mcp.linear.app/sse',
    authentication: 'oauth',
  },
  canva: {
    name: { zh: 'Canva', en: 'Canva' },
    description: { zh: '连接 Canva 设计资产', en: 'Connect Canva design assets' },
    url: 'https://mcp.canva.com/sse',
    authentication: 'oauth',
  },
  atlassian: {
    name: { zh: 'Atlassian', en: 'Atlassian' },
    description: { zh: '访问 Jira 与 Confluence', en: 'Access Jira and Confluence' },
    url: 'https://mcp.atlassian.com/sse',
    authentication: 'oauth',
  },
  clickup: {
    name: { zh: 'ClickUp', en: 'ClickUp' },
    description: { zh: '同步 ClickUp 任务与列表', en: 'Sync ClickUp tasks and lists' },
    url: 'https://mcp.clickup.com/sse',
    authentication: 'oauth',
  },
  zapier: {
    name: { zh: 'Zapier', en: 'Zapier' },
    description: { zh: '连接 Zapier 自动化与应用集成', en: 'Connect Zapier automations and app integrations' },
    url: 'https://mcp.zapier.com/sse',
    authentication: 'oauth',
  },
  tally: {
    name: { zh: 'Tally', en: 'Tally' },
    description: { zh: '连接 Tally 表单与提交流程', en: 'Connect Tally forms and submission workflows' },
    url: 'https://mcp.tally.so/sse',
    authentication: 'oauth',
  },
}

function createMcpHeaderDraft(): McpHeaderDraft {
  return {
    id: `mcp-header-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: '',
    value: '',
  }
}

function buildEmptyMcpCustomDraft(): McpCustomDraft {
  return {
    url: '',
    label: '',
    authentication: 'oauth',
    isAdvancedOpen: false,
    headers: EMPTY_MCP_HEADERS,
  }
}

function buildMcpPresetDraft(presetId: McpPresetId, locale: 'zh' | 'en'): McpPresetDraft {
  const preset = MCP_PRESET_CONFIG[presetId]
  return {
    presetId,
    url: preset.url,
    label: preset.name[locale],
    authentication: preset.authentication,
    connectionMode: 'per-user',
    isAdvancedOpen: false,
    clientId: '',
    clientSecret: '',
    headers: EMPTY_MCP_HEADERS,
  }
}

function RequiredLabel({ text }: { text: string }) {
  return (
    <span>
      {text} <span className="tools-directory-required-indicator">*</span>
    </span>
  )
}

function McpMarkIcon() {
  return (
    <span className="tools-directory-mcp-mark" aria-hidden="true">
      <svg viewBox="0 0 48 48" focusable="false">
        <circle cx="24" cy="24" r="24" fill="currentColor" />
        <path
          d="M16 30V17.5c0-1.1.9-2 2-2 .4 0 .8.1 1.1.3l5.5 3.7c.9.6 2 .6 2.9 0l2.8-1.9c1.3-.9 3 .1 3 1.7V31c0 1.1-.9 2-2 2-.4 0-.8-.1-1.1-.3L24.7 29c-.9-.6-2-.6-2.9 0L19 30.8c-1.3.9-3-.1-3-1.8Z"
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}

function RemoteMcpOptionIcon() {
  return (
    <svg
      viewBox="0 0 1024 1024"
      focusable="false"
      aria-hidden="true"
      className="tools-directory-create-option-mcp-svg"
    >
      <path
        d="M607.934444 417.856853c-6.179746-6.1777-12.766768-11.746532-19.554358-16.910135l-0.01228 0.011256c-6.986111-6.719028-16.47216-10.857279-26.930349-10.857279-21.464871 0-38.864146 17.400299-38.864146 38.864146 0 9.497305 3.411703 18.196431 9.071609 24.947182l-0.001023 0c0.001023 0.001023 0.00307 0.00307 0.005117 0.004093 2.718925 3.242857 5.953595 6.03853 9.585309 8.251941 3.664459 3.021823 7.261381 5.997598 10.624988 9.361205l3.203972 3.204995c40.279379 40.229237 28.254507 109.539812-12.024871 149.820214L371.157763 796.383956c-40.278355 40.229237-105.761766 40.229237-146.042167 0l-3.229554-3.231601c-40.281425-40.278355-40.281425-105.809861 0-145.991002l75.93546-75.909877c9.742898-7.733125 15.997346-19.668968 15.997346-33.072233 0-23.312962-18.898419-42.211381-42.211381-42.211381-8.797363 0-16.963347 2.693342-23.725354 7.297197-0.021489-0.045025-0.044002-0.088004-0.066515-0.134053l-0.809435 0.757247c-2.989077 2.148943-5.691629 4.669346-8.025791 7.510044l-78.913281 73.841775c-74.178443 74.229608-74.178443 195.632609 0 269.758863l3.203972 3.202948c74.178443 74.127278 195.529255 74.127278 269.707698 0l171.829484-171.880649c74.076112-74.17435 80.357166-191.184297 6.282077-265.311575L607.934444 417.856853z"
        fill="currentColor"
      />
      <path
        d="M855.61957 165.804257l-3.203972-3.203972c-74.17742-74.178443-195.528232-74.178443-269.706675 0L410.87944 334.479911c-74.178443 74.178443-78.263481 181.296089-4.085038 255.522628l3.152806 3.104711c3.368724 3.367701 6.865361 6.54302 10.434653 9.588379 2.583848 2.885723 5.618974 5.355985 8.992815 7.309476 0.025583 0.020466 0.052189 0.041956 0.077771 0.062422l0.011256-0.010233c5.377474 3.092431 11.608386 4.870938 18.257829 4.870938 20.263509 0 36.68962-16.428158 36.68962-36.68962 0-5.719258-1.309832-11.132548-3.645017-15.95846l0 0c-4.850471-10.891048-13.930267-17.521049-20.210297-23.802102l-3.15383-3.102664c-40.278355-40.278355-24.982998-98.79612 15.295358-139.074476l171.930791-171.830507c40.179095-40.280402 105.685018-40.280402 145.965419 0l3.206018 3.152806c40.279379 40.281425 40.279379 105.838513 0 146.06775l-75.686796 75.737962c-10.296507 7.628748-16.97358 19.865443-16.97358 33.662681 0 23.12365 18.745946 41.87062 41.87062 41.87062 8.048303 0 15.563464-2.275833 21.944801-6.211469 0.048095 0.081864 0.093121 0.157589 0.141216 0.240477l1.173732-1.083681c3.616364-2.421142 6.828522-5.393847 9.529027-8.792247l79.766718-73.603345C929.798013 361.334535 929.798013 239.981676 855.61957 165.804257z"
        fill="currentColor"
      />
    </svg>
  )
}

function McpPresetLogo({ presetId }: { presetId: McpPresetId }) {
  switch (presetId) {
    case 'notion':
      return (
        <span className="tools-directory-mcp-preset-logo-scale-75">
          <PlanBlueprintToolIcon label="Notion" />
        </span>
      )
    case 'linear':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <path
            d="M3.03509 12.9431C3.24245 14.9227 4.10472 16.8468 5.62188 18.364C7.13904 19.8811 9.0631 20.7434 11.0428 20.9508L3.03509 12.9431Z"
            fill="black"
          />
          <path
            d="M3 11.4938L12.4921 20.9858C13.2976 20.9407 14.0981 20.7879 14.8704 20.5273L3.4585 9.11548C3.19793 9.88771 3.0451 10.6883 3 11.4938Z"
            fill="black"
          />
          <path
            d="M3.86722 8.10999L15.8758 20.1186C16.4988 19.8201 17.0946 19.4458 17.6493 18.9956L4.99021 6.33659C4.54006 6.89125 4.16573 7.487 3.86722 8.10999Z"
            fill="black"
          />
          <path
            d="M5.66301 5.59517C9.18091 2.12137 14.8488 2.135 18.3498 5.63604C21.8508 9.13708 21.8645 14.8049 18.3907 18.3228L5.66301 5.59517Z"
            fill="black"
          />
        </svg>
      )
    case 'canva':
      return (
        <svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">
          <defs>
            <linearGradient id="canvaLogo" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle cx="24" cy="24" r="18" fill="url(#canvaLogo)" />
          <text x="24" y="28" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" fontStyle="italic">
            Canva
          </text>
        </svg>
      )
    case 'atlassian':
      return (
        <svg viewBox="0 0 1024 1024" focusable="false" aria-hidden="true">
          <circle cx="512" cy="512" r="512" fill="#0052cc" />
          <path
            d="M413.7 462.6c-4.6-6-13.2-7.2-19.3-2.6-1.8 1.3-3.2 3.1-4.1 5.1L272 701.9c-3.5 7-.7 15.5 6.3 19 2 1 4.1 1.5 6.3 1.5h164.9c5.4.1 10.4-2.9 12.7-7.8 35.5-73.6 14-185.3-48.5-252zm86.9-215.4c-60 92.4-67 209.5-18.2 308.3l79.5 159c2.4 4.8 7.3 7.8 12.7 7.8h164.9c7.8 0 14.2-6.3 14.2-14.2 0-2.2-.5-4.4-1.5-6.3 0 0-221.8-443.7-227.4-454.8-3.2-6.6-11.2-9.4-17.9-6.2-2.8 1.5-5 3.7-6.3 6.4z"
            fill="#ffffff"
          />
        </svg>
      )
    case 'clickup':
      return (
        <span className="tools-directory-mcp-preset-logo-scale-75">
          <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
            <defs>
              <linearGradient id="clickupLogo" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8930FD" />
                <stop offset="55%" stopColor="#FF4D97" />
                <stop offset="100%" stopColor="#FF6C5F" />
              </linearGradient>
            </defs>
            <path
              fill="url(#clickupLogo)"
              d="m2 18.439 3.69-2.828c1.961 2.56 4.044 3.739 6.363 3.739 2.307 0 4.33-1.166 6.203-3.704L22 18.405C19.298 22.065 15.941 24 12.053 24 8.178 24 4.788 22.078 2 18.439zM12.04 6.15l-6.568 5.66-3.036-3.52L12.055 0l9.543 8.296-3.05 3.509z"
            />
          </svg>
        </span>
      )
    case 'zapier':
      return (
        <span className="tools-directory-mcp-preset-logo-scale-75">
          <svg viewBox="0 0 256 256" focusable="false" aria-hidden="true">
            <path
              d="M128.080089,-0.000183105 C135.311053,0.0131003068 142.422517,0.624138494 149.335663,1.77979593 L149.335663,1.77979593 L149.335663,76.2997796 L202.166953,23.6044907 C208.002065,27.7488446 213.460883,32.3582023 218.507811,37.3926715 C223.557281,42.4271407 228.192318,47.8867213 232.346817,53.7047992 L232.346817,53.7047992 L179.512985,106.400063 L254.227854,106.400063 C255.387249,113.29414 256,120.36111 256,127.587243 L256,127.587243 L256,127.759881 C256,134.986013 255.387249,142.066204 254.227854,148.960282 L254.227854,148.960282 L179.500273,148.960282 L232.346817,201.642324 C228.192318,207.460402 223.557281,212.919983 218.523066,217.954452 L218.523066,217.954452 L218.507811,217.954452 C213.460883,222.988921 208.002065,227.6115 202.182208,231.742607 L202.182208,231.742607 L149.335663,179.04709 L149.335663,253.5672 C142.435229,254.723036 135.323765,255.333244 128.092802,255.348499 L128.092802,255.348499 L127.907197,255.348499 C120.673691,255.333244 113.590195,254.723036 106.677048,253.5672 L106.677048,253.5672 L106.677048,179.04709 L53.8457596,231.742607 C42.1780766,223.466917 31.977435,213.278734 23.6658953,201.642324 L23.6658953,201.642324 L76.4997269,148.960282 L1.78485803,148.960282 C0.612750404,142.052729 0,134.946095 0,127.719963 L0,127.719963 L0,127.349037 C0.0121454869,125.473817 0.134939797,123.182933 0.311311815,120.812834 L0.36577283,120.099764 C0.887996182,113.428547 1.78485803,106.400063 1.78485803,106.400063 L1.78485803,106.400063 L76.4997269,106.400063 L23.6658953,53.7047992 C27.8076812,47.8867213 32.4300059,42.4403618 37.4769335,37.4193681 L37.4769335,37.4193681 L37.5023588,37.3926715 C42.5391163,32.3582023 48.0106469,27.7488446 53.8457596,23.6044907 L53.8457596,23.6044907 L106.677048,76.2997796 L106.677048,1.77979593 C113.590195,0.624138494 120.688946,0.0131003068 127.932622,-0.000183105 L127.932622,-0.000183105 L128.080089,-0.000183105 Z M128.067377,95.7600714 L127.945335,95.7600714 C118.436262,95.7600714 109.32891,97.5001809 100.910584,100.661566 C97.7553011,109.043534 96.0085811,118.129275 95.9958684,127.613685 L95.9958684,127.733184 C96.0085811,137.217594 97.7553011,146.303589 100.923296,154.685303 C109.32891,157.846943 118.436262,159.587052 127.945335,159.587052 L128.067377,159.587052 C137.576449,159.587052 146.683802,157.846943 155.089415,154.685303 C158.257411,146.290368 160.004131,137.217594 160.004131,127.733184 L160.004131,127.613685 C160.004131,118.129275 158.257411,109.043534 155.089415,100.661566 C146.683802,97.5001809 137.576449,95.7600714 128.067377,95.7600714 Z"
              fill="#FF4A00"
              fillRule="nonzero"
            />
          </svg>
        </span>
      )
    case 'tally':
      return (
        <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#004E34" />
          <g transform="translate(2.4 2.4) scale(0.8)">
            <path
              d="M3.661 2.67105C3.71317 2.39988 3.97931 2.18005 4.25546 2.18005H6.25546C6.5316 2.18005 6.71317 2.39988 6.661 2.67105L5.33853 9.54499C5.28636 9.81616 5.02021 10.036 4.74406 10.036H2.74406C2.46792 10.036 2.28636 9.81616 2.33853 9.54499L3.661 2.67105Z"
              fill="#ffffff"
            />
            <path
              d="M8.661 2.67105C8.71317 2.39988 8.97931 2.18005 9.25546 2.18005H11.2555C11.5316 2.18005 11.7132 2.39988 11.661 2.67105L8.07144 21.3289C8.01927 21.6001 7.75312 21.8199 7.47698 21.8199H5.47698C5.20083 21.8199 5.01927 21.6001 5.07144 21.3289L8.661 2.67105Z"
              fill="#ffffff"
            />
            <path
              d="M13.661 2.67105C13.7132 2.39988 13.9793 2.18005 14.2555 2.18005H16.2555C16.5316 2.18005 16.7132 2.39988 16.661 2.67105L13.0714 21.3289C13.0193 21.6001 12.7531 21.8199 12.477 21.8199H10.477C10.2008 21.8199 10.0193 21.6001 10.0714 21.3289L13.661 2.67105Z"
              fill="#ffffff"
            />
            <path
              d="M18.661 2.67105C18.7132 2.39988 18.9793 2.18005 19.2555 2.18005H21.2555C21.5316 2.18005 21.7132 2.39988 21.661 2.67105L20.3385 9.54499C20.2864 9.81616 20.0202 10.036 19.7441 10.036H17.7441C17.4679 10.036 17.2864 9.81616 17.3385 9.54499L18.661 2.67105Z"
              fill="#ffffff"
            />
          </g>
        </svg>
      )
  }
}

const INTEGRATION_META: Record<ToolIntegrationApp, { label: string }> = {
  gmail: {
    label: 'Gmail',
  },
  slack: {
    label: 'Slack',
  },
  excel: {
    label: 'Excel',
  },
  teams: {
    label: 'Teams',
  },
  notion: {
    label: 'Notion',
  },
  googleSheets: {
    label: 'Google Sheets',
  },
}

function formatTimesRun(value: number, locale: 'zh' | 'en') {
  return locale === 'zh' ? `${value} 次` : `${value} runs`
}

function createToolConfigSchemaRow(
  property: string,
  type: string,
  description: string,
  required: boolean,
): ToolConfigSchemaRow {
  return {
    id: `tool-schema-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    property,
    type,
    description,
    required,
  }
}

function buildToolIconSource(item: ToolDirectoryItem) {
  const integrationIconMap: Partial<Record<ToolIntegrationApp, string>> = {
    gmail: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/gmail-icon.svg',
    slack: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/slack-icon.svg',
    excel: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/microsoft-excel.svg',
    notion: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/notion-icon.svg',
    teams: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/microsoft-teams.svg',
    googleSheets: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/google-sheets.svg',
  }
  const firstIntegration = item.integrations[0]
  return firstIntegration
    ? (integrationIconMap[firstIntegration] ?? `https://cdn.example.com/tool-icons/${item.id}.svg`)
    : `https://cdn.example.com/tool-icons/${item.id}.svg`
}

function buildToolFunctionStarter(item: ToolDirectoryItem, locale: 'zh' | 'en') {
  return `${TOOL_FUNCTION_GUIDE}

const toolName = '${item.name}';
const summary = ${JSON.stringify(item.description)};

try {
    const payload = {
        tool: toolName,
        summary,
        input: $flow.input,
        state: $flow.state
    };
    return JSON.stringify(payload);
} catch (error) {
    console.error(error);
    return ${JSON.stringify(toolsT(locale, 'executionFailed'))};
}`
}

function buildToolConfigSchemaRows(item: ToolDirectoryItem): ToolConfigSchemaRow[] {
  switch (item.id) {
    case 'tool-forms-intake':
      return [
        createToolConfigSchemaRow('employeeName', 'string', '新员工姓名', true),
        createToolConfigSchemaRow('employeeEmail', 'string', '新员工邮箱地址', true),
        createToolConfigSchemaRow('formType', 'string', '表单类型，如入职资料或信息确认', false),
      ]
    case 'tool-trello-card':
      return [
        createToolConfigSchemaRow('employeeId', 'string', '员工唯一编号', true),
        createToolConfigSchemaRow('boardId', 'string', '目标看板 ID', true),
        createToolConfigSchemaRow('listName', 'string', '卡片要落入的列表名称', false),
      ]
    case 'tool-knowledge-answer':
      return [
        createToolConfigSchemaRow('question', 'string', '员工提出的问题内容', true),
        createToolConfigSchemaRow('knowledgeScope', 'string', '知识检索范围或知识库名称', false),
        createToolConfigSchemaRow('topK', 'number', '返回引用片段数量', false),
      ]
    case 'tool-csv-analyzer':
      return [
        createToolConfigSchemaRow('fileUrl', 'string', 'CSV 文件地址或上传后的文件链接', true),
        createToolConfigSchemaRow('sheetName', 'string', '需要分析的工作表名称', false),
        createToolConfigSchemaRow('checkMissing', 'boolean', '是否检查缺失值与格式异常', false),
      ]
    case 'tool-upload-csv':
      return [
        createToolConfigSchemaRow('fileUrl', 'string', '待导入 CSV 文件地址', true),
        createToolConfigSchemaRow('targetTable', 'string', '目标知识表名称', true),
        createToolConfigSchemaRow('overwriteExisting', 'boolean', '冲突时是否覆盖已有记录', false),
      ]
    case 'tool-delete-records':
      return [
        createToolConfigSchemaRow('recordIds', 'array<string>', '待删除记录 ID 列表', true),
        createToolConfigSchemaRow('reason', 'string', '执行删除的原因说明', false),
        createToolConfigSchemaRow('operatorName', 'string', '执行操作的人员名称', false),
      ]
    case 'tool-upsert-record':
      return [
        createToolConfigSchemaRow('uniqueId', 'string', '记录唯一标识', true),
        createToolConfigSchemaRow('recordContent', 'object', '待更新或插入的记录内容', true),
        createToolConfigSchemaRow('allowCreate', 'boolean', '记录不存在时是否允许自动创建', false),
      ]
    case 'tool-teams-message':
      return [
        createToolConfigSchemaRow('recipientId', 'string', 'Teams 接收人 ID', true),
        createToolConfigSchemaRow('message', 'string', '要发送的消息正文', true),
        createToolConfigSchemaRow('sendAt', 'string', '计划发送时间', false),
      ]
    default:
      return [
        createToolConfigSchemaRow('input', 'string', '工具执行所需的主要输入参数', true),
        createToolConfigSchemaRow('context', 'object', '补充上下文信息', false),
      ]
  }
}

function buildToolConfigDraft(item: ToolDirectoryItem, locale: 'zh' | 'en'): ToolConfigDraft {
  return {
    toolName: item.name,
    toolDescription: item.description,
    toolIconSource: buildToolIconSource(item),
    inputSchemaRows: buildToolConfigSchemaRows(item),
    javascriptFunction: buildToolFunctionStarter(item, locale),
  }
}

function buildEmptyToolConfigDraft(): ToolConfigDraft {
  return {
    toolName: '',
    toolDescription: '',
    toolIconSource: 'https://raw.githubusercontent.com/gilbarbara/logos/main/logos/tooljet.svg',
    inputSchemaRows: [],
    javascriptFunction: TOOL_FUNCTION_GUIDE,
  }
}

function parseToolSchemaRowsFromJson(raw: string) {
  const parsed = JSON.parse(raw) as
    | Array<Record<string, unknown>>
    | { properties?: Record<string, { type?: string; description?: string }>; required?: string[] }

  if (Array.isArray(parsed)) {
    return parsed.map((entry, index) =>
      createToolConfigSchemaRow(
        String(entry.property ?? entry.name ?? `field_${index + 1}`),
        String(entry.type ?? 'string'),
        String(entry.description ?? ''),
        Boolean(entry.required),
      ),
    )
  }

  if (parsed && typeof parsed === 'object' && parsed.properties && typeof parsed.properties === 'object') {
    const requiredSet = new Set(parsed.required ?? [])
    return Object.entries(parsed.properties).map(([property, config]) =>
      createToolConfigSchemaRow(
        property,
        typeof config?.type === 'string' ? config.type : 'string',
        typeof config?.description === 'string' ? config.description : '',
        requiredSet.has(property),
      ),
    )
  }

  throw new Error('Invalid input schema JSON')
}

function getToolTypeLabel(locale: 'zh' | 'en') {
  return locale === 'zh' ? '工具' : 'Tools'
}

function formatToolDateLabel(value: string, locale: 'zh' | 'en') {
  const target = new Date(value)
  const diffMs = target.getTime() - Date.now()
  const diffMinutes = Math.round(diffMs / (1000 * 60))
  const rtf = new Intl.RelativeTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', { numeric: 'auto' })

  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute')
  const diffHours = Math.round(diffMinutes / 60)
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour')
  const diffDays = Math.round(diffHours / 24)
  if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day')

  return new Intl.DateTimeFormat(locale === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(target)
}

function getToolCardIconStyle(tone: ToolIconTone): CSSProperties {
  const paletteMap: Record<
    ToolIconTone,
    { from: string; via: string; to: string; shadow: string }
  > = {
    violet: {
      from: '#7f7cff',
      via: '#8b5cf6',
      to: '#ff9a62',
      shadow: 'rgba(124, 92, 255, 0.28)',
    },
    sky: {
      from: '#5ea8ff',
      via: '#5b7cff',
      to: '#7b61ff',
      shadow: 'rgba(91, 124, 255, 0.24)',
    },
    amber: {
      from: '#ffd36a',
      via: '#ffab5b',
      to: '#ff7b72',
      shadow: 'rgba(255, 171, 91, 0.26)',
    },
    emerald: {
      from: '#62d6a5',
      via: '#33c0b8',
      to: '#3f8cff',
      shadow: 'rgba(51, 192, 184, 0.24)',
    },
    rose: {
      from: '#ff8cb7',
      via: '#ff7d95',
      to: '#9a6bff',
      shadow: 'rgba(255, 125, 149, 0.25)',
    },
    indigo: {
      from: '#7ad7ff',
      via: '#4ca9ff',
      to: '#7c73ff',
      shadow: 'rgba(76, 169, 255, 0.24)',
    },
    cyan: {
      from: '#19c7c7',
      via: '#2d9bf0',
      to: '#6d6bff',
      shadow: 'rgba(45, 155, 240, 0.24)',
    },
    orange: {
      from: '#ffb86c',
      via: '#ff8f70',
      to: '#ff6ea8',
      shadow: 'rgba(255, 143, 112, 0.24)',
    },
  }

  const palette = paletteMap[tone]
  return {
    '--agent-icon-from': palette.from,
    '--agent-icon-via': palette.via,
    '--agent-icon-to': palette.to,
    '--agent-icon-shadow': palette.shadow,
  } as CSSProperties
}

function filterTools(items: ToolDirectoryItem[], keyword: string, locale: 'zh' | 'en') {
  const query = keyword.trim().toLowerCase()
  if (!query) return items
  return items.filter((item) =>
    [
      item.name,
      item.description,
      item.type,
      getToolTypeLabel(locale),
      item.owner,
      item.integrations.join(' '),
      item.agents.join(' '),
      item.createdLabel,
      item.lastModifiedLabel,
      item.lastRunLabel,
      formatToolDateLabel(item.createdAt, locale),
      formatToolDateLabel(item.lastModifiedAt, locale),
      formatToolDateLabel(item.lastRunAt, locale),
      String(item.timesRun),
    ]
      .join(' ')
      .toLowerCase()
      .includes(query),
  )
}

function buildDefaultVisibleColumns() {
  return new Set(COLUMN_OPTION_CONFIG.filter((item) => item.defaultVisible).map((item) => item.id))
}

function sortTools(items: ToolDirectoryItem[], sortId: ToolSortId) {
  const sorted = items.slice()
  sorted.sort((left, right) => {
    switch (sortId) {
      case 'name':
        return left.name.localeCompare(right.name, 'zh-CN')
      case 'description':
        return left.description.localeCompare(right.description, 'zh-CN')
      case 'created':
        return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      case 'lastModified':
        return new Date(right.lastModifiedAt).getTime() - new Date(left.lastModifiedAt).getTime()
      case 'lastRun':
        return new Date(right.lastRunAt).getTime() - new Date(left.lastRunAt).getTime()
      case 'timesRun':
        return right.timesRun - left.timesRun
    }
  })
  return sorted
}

function getTableTemplate(visibleColumnIds: ToolColumnId[]) {
  const columns = ['44px', 'minmax(220px, 1.45fr)']
  visibleColumnIds.forEach((columnId) => {
    if (columnId === 'description') columns.push('minmax(220px, 1.4fr)')
    else if (columnId === 'type') columns.push('minmax(88px, 0.65fr)')
    else if (columnId === 'integrations') columns.push('minmax(96px, 0.55fr)')
    else if (columnId === 'owner') columns.push('minmax(92px, 0.72fr)')
    else if (columnId === 'agents') columns.push('minmax(180px, 1.05fr)')
    else if (columnId === 'lastRun') columns.push('minmax(120px, 0.85fr)')
    else if (columnId === 'lastModified') columns.push('minmax(120px, 0.85fr)')
    else if (columnId === 'created') columns.push('minmax(110px, 0.78fr)')
    else if (columnId === 'timesRun') columns.push('minmax(96px, 0.7fr)')
  })
  return columns.join(' ')
}

function isMcpPresetId(value: string | undefined): value is McpPresetId {
  return (
    value === 'notion' ||
    value === 'linear' ||
    value === 'canva' ||
    value === 'atlassian' ||
    value === 'clickup' ||
    value === 'zapier' ||
    value === 'tally'
  )
}

function McpHeaderDeleteIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true" className="tools-directory-mcp-header-delete-icon">
      <path
        d="M4.5 7.5h15M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5m-8.25 0V18a1.5 1.5 0 0 0 1.5 1.5h7.5a1.5 1.5 0 0 0 1.5-1.5V7.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M10 11.25v5.25M14 11.25v5.25" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function ToolDirectoryAvatar({ item }: { item: ToolDirectoryItem }) {
  if (isMcpPresetId(item.mcpPresetId)) {
    return (
      <span className="tools-directory-tool-avatar tools-directory-tool-avatar--preset" aria-hidden="true">
        <McpPresetLogo presetId={item.mcpPresetId} />
      </span>
    )
  }

  return (
    <span
      className="agent-card-icon agent-card-icon-grad tools-directory-tool-avatar"
      style={getToolCardIconStyle(item.iconTone)}
      aria-hidden="true"
    />
  )
}

function IntegrationBadges({ items, locale }: { items: ToolIntegrationApp[]; locale: 'zh' | 'en' }) {
  const joined = items.map((item) => INTEGRATION_META[item].label).join(locale === 'zh' ? '、' : ', ')
  return (
    <div className="tools-directory-integrations" aria-label={toolsT(locale, 'integrationsAria', { items: joined })}>
      {items.map((item) => {
        const meta = INTEGRATION_META[item]
        return (
          <span
            key={item}
            className="tools-directory-app-badge manus-wf-pipeline-card__step-plugin-pill"
            title={meta.label}
            role="img"
            aria-label={meta.label}
          >
            <span className="manus-wf-pipeline-card__step-plugin-icon" aria-hidden="true">
              <PlanBlueprintToolIcon label={meta.label} />
            </span>
          </span>
        )
      })}
    </div>
  )
}

function AgentTags({ items, locale }: { items: string[]; locale: 'zh' | 'en' }) {
  const joined = items.join(locale === 'zh' ? '、' : ', ')
  return (
    <div className="tools-directory-agent-tags" aria-label={toolsT(locale, 'agentsAria', { items: joined })}>
      {items.slice(0, 2).map((item) => (
        <span key={item} className="tools-directory-agent-tag" title={item}>
          {item}
        </span>
      ))}
      {items.length > 2 ? <span className="tools-directory-agent-tag is-muted">+{items.length - 2}</span> : null}
    </div>
  )
}

function ToolsDirectoryPageTagline() {
  const { locale } = useLocale()

  return (
    <div
      className="agents-subtitle agents-subtitle--tagline"
      aria-label={locale === 'zh' ? '调用·API·集成·执行·自动化' : 'Invoke · API · Integration · Execution · Automation'}
    >
      <span className="agents-subtitle-part">{locale === 'zh' ? '调用' : 'Invoke'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">API</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '集成' : 'Integration'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '执行' : 'Execution'}</span>
      <span className="agents-subtitle-dot" aria-hidden="true">·</span>
      <span className="agents-subtitle-part">{locale === 'zh' ? '自动化' : 'Automation'}</span>
    </div>
  )
}

type ToolsDirectoryPageProps = {
  items: ToolDirectoryItem[]
  onItemsChange: (items: ToolDirectoryItem[]) => void
  onOpenToolTemplates: () => void
}

export function ToolsDirectoryPage({ items, onItemsChange, onOpenToolTemplates }: ToolsDirectoryPageProps) {
  const { locale } = useLocale()
  const { can } = useRbac()
  const canPublishSectionVersion = can('team.view_changelog')
  const [toolVersionModalOpen, setToolVersionModalOpen] = useState(false)
  const [toolsTab, setToolsTab] = useState<ToolsDirectoryTab>('all')
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<ToolsDirectoryViewMode>('cards')
  const [activeMenu, setActiveMenu] = useState<ToolsDirectoryMenu>(null)
  const [sortId, setSortId] = useState<ToolSortId>('lastModified')
  const [visibleColumnIds, setVisibleColumnIds] = useState<Set<ToolColumnId>>(() => buildDefaultVisibleColumns())
  const [selectedToolIds, setSelectedToolIds] = useState<Set<string>>(new Set())
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [openCardMenuToolId, setOpenCardMenuToolId] = useState<string | null>(null)
  const [creatingToolDraft, setCreatingToolDraft] = useState<ToolConfigDraft | null>(null)
  const [toolConfigDrafts, setToolConfigDrafts] = useState<Record<string, ToolConfigDraft>>({})
  const [toolNoticeToast, setToolNoticeToast] = useState<{ title: string; sub?: string } | null>(null)
  const [isExportingToolConfig, setIsExportingToolConfig] = useState(false)
  const [isSavingToolConfig, setIsSavingToolConfig] = useState(false)
  const [createToolModalStep, setCreateToolModalStep] = useState<CreateToolModalStep>(null)
  const [mcpCustomDraft, setMcpCustomDraft] = useState<McpCustomDraft>(buildEmptyMcpCustomDraft())
  const [mcpPresetDraft, setMcpPresetDraft] = useState<McpPresetDraft | null>(null)
  const [mcpOAuthStep, setMcpOAuthStep] = useState<McpOAuthStep | null>(null)
  const [isMcpConnecting, setIsMcpConnecting] = useState(false)
  const [mcpOAuthEmail, setMcpOAuthEmail] = useState('')
  const [mcpOAuthSelectedGoogleAccountId, setMcpOAuthSelectedGoogleAccountId] = useState<string | null>(null)
  const [isMcpVerifyModalOpen, setIsMcpVerifyModalOpen] = useState(false)
  const [mcpVerifyCode, setMcpVerifyCode] = useState('')
  const [isMcpVerifySubmitting, setIsMcpVerifySubmitting] = useState(false)
  const mcpPresetConnectTimerRef = useRef<number | null>(null)

  const columnsMenuRef = useRef<HTMLDivElement>(null)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const jsonImportInputRef = useRef<HTMLInputElement>(null)
  const toolNoticeTimerRef = useRef<number | null>(null)
  const toolConfigExportTimerRef = useRef<number | null>(null)
  const toolConfigSaveTimerRef = useRef<number | null>(null)
  const text = useMemo(
    () => ({
      title: locale === 'zh' ? '工具' : 'Tools',
      filterLabel: locale === 'zh' ? '工具筛选' : 'Tool filters',
      tabAll: locale === 'zh' ? '全部' : 'All',
      tabReferenced: locale === 'zh' ? '引用' : 'Referenced',
      tabTools: locale === 'zh' ? '工具' : 'Tools',
      tabMcp: locale === 'zh' ? 'MCP' : 'MCP',
      tabMine: locale === 'zh' ? '自定义' : 'Custom',
      searchPlaceholder: locale === 'zh' ? '搜索工具...' : 'Search tools...',
      sortPrefix: locale === 'zh' ? '排序' : 'Sort',
      sortMenu: locale === 'zh' ? '排序方式' : 'Sort options',
      columns: locale === 'zh' ? '列设置' : 'Columns',
      create: locale === 'zh' ? '+ 新建工具' : '+ Create tool',
      viewToggle: locale === 'zh' ? '切换工具列表展示方式' : 'Switch tool list view',
      tableView: locale === 'zh' ? '列表视图' : 'Table view',
      cardsView: locale === 'zh' ? '卡片视图' : 'Card view',
      tableLabel: locale === 'zh' ? '工具记录列表' : 'Tool records list',
      cardsLabel: locale === 'zh' ? '工具卡片列表' : 'Tool cards list',
      paginationLabel: locale === 'zh' ? '工具列表分页' : 'Tool list pagination',
      previousPage: locale === 'zh' ? '上一页' : 'Previous',
      nextPage: locale === 'zh' ? '下一页' : 'Next',
      pageSummary: locale === 'zh' ? '第 {current} / {total} 页' : 'Page {current} / {total}',
      empty: locale === 'zh' ? '没有匹配的工具记录。' : 'No matching tools found.',
      selectAll: locale === 'zh' ? '全选列表' : 'Select all',
      deselectAllList: locale === 'zh' ? '取消全选列表' : 'Clear list selection',
      selectedCount: locale === 'zh' ? '已选 {count} 项' : '{count} selected',
      bulkLabel: locale === 'zh' ? '批量删除提示' : 'Bulk delete notice',
      bulkTitle:
        locale === 'zh' ? '你选中的部分工具已被 Agent 使用。' : 'Some selected tools are currently used by agents.',
      bulkText:
        locale === 'zh'
          ? '删除这些工具后，它们会从以下 Agent 中移除：'
          : 'Deleting these tools will remove them from the following agents:',
      delete: locale === 'zh' ? '删除' : 'Delete',
      clearSelection: locale === 'zh' ? '取消全选' : 'Deselect all',
      name: locale === 'zh' ? '工具名' : 'Tool name',
      createModalTitle: locale === 'zh' ? '创建工具' : 'Create tool',
      createModalSubtitle:
        locale === 'zh'
          ? '选择一种方式，把新工具添加到当前工作区。'
          : 'Choose a way to add a new tool to the current workspace.',
      createOptionTemplateTitle: locale === 'zh' ? '使用工具模板' : 'Use tool template',
      createOptionTemplateDesc:
        locale === 'zh'
          ? '跳转到应用市场的 Tools 区域，从模板中快速安装。'
          : 'Jump to the Tools area in the marketplace and install from a template.',
      createOptionJsonTitle: locale === 'zh' ? '以 JSON 导入' : 'Import from JSON',
      createOptionJsonDesc:
        locale === 'zh'
          ? '从本地选择 JSON 文件，将已有工具配置导入到当前工作区。'
          : 'Pick a local JSON file and import an existing tool config.',
      createOptionCustomTitle: locale === 'zh' ? '添加自定义工具' : 'Add custom tool',
      createOptionCustomDesc:
        locale === 'zh'
          ? '通过 OpenAPI Schema、默认请求参数和增强描述来创建自定义工具。'
          : 'Create a custom tool with OpenAPI schema and request defaults.',
      createOptionRemoteMcpTitle: locale === 'zh' ? '添加远程MCP服务' : 'Add remote MCP service',
      createOptionRemoteMcpDesc:
        locale === 'zh'
          ? '连接远程 MCP 服务，并把它作为可复用的 MCP 工具添加到当前工作区。'
          : 'Connect a remote MCP service and add it as a reusable MCP tool.',
      back: locale === 'zh' ? '返回' : 'Back',
      close: locale === 'zh' ? '关闭' : 'Close',
      toolConfigTitle: locale === 'zh' ? '工具配置' : 'Tool configuration',
      toolConfigSubtitle: locale === 'zh' ? '点击工具记录后，可在这里查看并调整工具配置。' : 'Review and adjust the selected tool configuration here.',
      toolConfigCreateSubtitle:
        locale === 'zh' ? '填写工具字段、输入 Schema 与函数逻辑后，即可保存为新的自定义工具。' : 'Fill in the tool fields, input schema, and function logic to save a new custom tool.',
      toolConfigName: locale === 'zh' ? '工具名称' : 'Tool Name',
      toolConfigDescription: locale === 'zh' ? '工具描述' : 'Tool Description',
      toolConfigIconSource: locale === 'zh' ? '工具图标来源' : 'Tool Icon Source',
      toolConfigNamePlaceholder: locale === 'zh' ? '请输入工具名称' : 'Enter tool name',
      toolConfigDescriptionPlaceholder: locale === 'zh' ? '请输入工具描述，帮助模型判断何时使用该工具。' : 'Describe what the tool does so the model knows when to use it.',
      toolConfigIconPlaceholder: locale === 'zh' ? '请输入工具图标 URL' : 'Enter tool icon URL',
      inputSchemaTitle: locale === 'zh' ? '输入 Schema' : 'Input Schema',
      inputSchemaProperty: locale === 'zh' ? '属性' : 'Property',
      inputSchemaType: locale === 'zh' ? '类型' : 'Type',
      inputSchemaDescription: locale === 'zh' ? '描述' : 'Description',
      inputSchemaRequired: locale === 'zh' ? '必填' : 'Required',
      inputSchemaEmpty: locale === 'zh' ? '暂无字段' : 'No rows',
      pasteJson: locale === 'zh' ? '粘贴 JSON' : 'Paste JSON',
      addItem: locale === 'zh' ? '添加条目' : 'Add Item',
      inputSchemaPasteSuccess: locale === 'zh' ? '导入成功' : 'Imported',
      inputSchemaPasteSuccessSub: locale === 'zh' ? '已从剪贴板导入输入 Schema。' : 'Imported input schema from clipboard.',
      inputSchemaPasteFailed: locale === 'zh' ? '导入失败' : 'Import failed',
      inputSchemaPasteFailedSub: locale === 'zh' ? '剪贴板中不是有效的 JSON Schema。' : 'Clipboard content is not valid JSON schema.',
      javascriptFunctionTitle: locale === 'zh' ? 'JavaScript 函数' : 'JavaScript Function',
      howToUseFunction: locale === 'zh' ? '如何使用函数' : 'How To Use Function',
      seeExample: locale === 'zh' ? '查看示例' : 'See Example',
      functionGuideLoaded: locale === 'zh' ? '已填入说明' : 'Guide loaded',
      functionGuideLoadedSub: locale === 'zh' ? '函数使用说明已填入编辑器。' : 'Function usage guide loaded into the editor.',
      functionExampleLoaded: locale === 'zh' ? '已填入示例' : 'Example loaded',
      functionExampleLoadedSub: locale === 'zh' ? '示例代码已填入编辑器。' : 'Example code loaded into the editor.',
      saveConfig: locale === 'zh' ? '保存配置' : 'Save Config',
      savingConfig: locale === 'zh' ? '保存中' : 'Saving',
      resetConfig: locale === 'zh' ? '重置配置' : 'Reset Config',
      saveConfigSuccess: locale === 'zh' ? '保存成功' : 'Saved',
      saveConfigSuccessSub: locale === 'zh' ? '工具配置已更新。' : 'Tool configuration has been updated.',
      saveAsTemplate: locale === 'zh' ? '存为模板' : 'Save as Template',
      saveAsTemplateSuccess: locale === 'zh' ? '已存为模板' : 'Saved as template',
      saveAsTemplateSuccessSub: locale === 'zh' ? '当前工具配置已保存为模板。' : 'Current tool configuration saved as a template.',
      addToolCreated: locale === 'zh' ? '已创建工具' : 'Tool created',
      addToolCreatedSub: locale === 'zh' ? '工具已添加到列表。' : 'The tool has been added to your list.',
      importToolSuccess: locale === 'zh' ? '导入成功' : 'Imported',
      importToolSuccessSub: locale === 'zh' ? '工具已从 JSON 文件导入到列表。' : 'Tool imported from JSON into your list.',
      exportConfig: locale === 'zh' ? '导出' : 'Export',
      exportingConfig: locale === 'zh' ? '导出中' : 'Exporting',
      schemaDelete: locale === 'zh' ? '删除字段' : 'Delete field',
      schemaActions: locale === 'zh' ? '操作' : 'Actions',
      deleteTool: locale === 'zh' ? '删除工具' : 'Delete Tool',
      deleteToolSuccess: locale === 'zh' ? '工具已删除' : 'Tool deleted',
      deleteToolSuccessSub: locale === 'zh' ? '工具已从列表中移除。' : 'The tool has been removed from your list.',
      cardEdit: locale === 'zh' ? '编辑' : 'Edit',
      cardMoreActions: locale === 'zh' ? '工具操作' : 'Tool actions',
      reset: locale === 'zh' ? '重置' : 'Reset',
      cancel: locale === 'zh' ? '取消' : 'Cancel',
      addTool: locale === 'zh' ? '添加工具' : 'Add Tool',
      mcpHubTitle: locale === 'zh' ? '连接MCP' : 'Connect MCP',
      mcpHubSubtitle: locale === 'zh' ? '桥接你的应用连接并提升工作流能力。' : 'Bridge your apps and boost your flow.',
      mcpConnectMine: locale === 'zh' ? '连接我的MCP' : 'Connect my own',
      mcpPresetTitle: locale === 'zh' ? '或从模板开始' : 'Or start with a preset',
      mcpCustomTitle: locale === 'zh' ? '连接我的' : 'Connect my own',
      mcpCustomSubtitle: locale === 'zh' ? '填写远程 MCP 服务地址、标签和认证方式。' : 'Provide a remote MCP server URL, label, and authentication type.',
      mcpCustomConnect: locale === 'zh' ? '连接' : 'Connect',
      mcpPresetDetailTitle: locale === 'zh' ? '连接MCP服务' : 'Connect MCP service',
      mcpPresetDetailSubtitle: locale === 'zh' ? '已根据所选模板预填信息，你可以补充连接方式与高级选项。' : 'Template details are prefilled. Complete connection mode and advanced options.',
      mcpUrl: locale === 'zh' ? '服务地址' : 'URL',
      mcpLabel: locale === 'zh' ? '标签' : 'Label',
      mcpAuthentication: locale === 'zh' ? '认证方式' : 'Authentication',
      mcpAuthenticationNone: locale === 'zh' ? '无' : 'None',
      mcpAuthenticationApiKey: locale === 'zh' ? '访问令牌 / API 密钥' : 'Access token / API key',
      mcpAuthenticationCustomHeaders: locale === 'zh' ? '自定义请求头' : 'Custom headers',
      mcpAuthenticationOAuth: locale === 'zh' ? 'OAuth' : 'OAuth',
      mcpAdvancedOptions: locale === 'zh' ? '高级选项' : 'Advanced Options',
      mcpHeadersTitle: locale === 'zh' ? '自定义配置头' : 'Custom Configuration Headers',
      mcpHeadersDesc:
        locale === 'zh'
          ? '为所有 MCP 请求附加自定义 HTTP headers。这些属于配置头，而非鉴权头。'
          : 'Add custom HTTP headers to all MCP requests. These are configuration headers, not authentication headers.',
      mcpHeaderName: locale === 'zh' ? '名称' : 'Name',
      mcpHeaderValue: locale === 'zh' ? '值' : 'Value',
      mcpAddHeader: locale === 'zh' ? '+ 添加请求头' : '+ Add Header',
      mcpConnectionMode: locale === 'zh' ? '连接模式' : 'Connection mode',
      mcpModePerUser: locale === 'zh' ? '按用户连接' : 'Per-user connection',
      mcpModeShared: locale === 'zh' ? '共享连接' : 'Shared connection',
      mcpClientId: locale === 'zh' ? '客户端 ID' : 'Client ID',
      mcpClientSecret: locale === 'zh' ? '客户端密钥' : 'Client Secret',
      mcpClientIdPlaceholder: locale === 'zh' ? '输入 OAuth 客户端 ID' : 'Enter OAuth client ID',
      mcpClientSecretPlaceholder: locale === 'zh' ? '输入 OAuth 客户端密钥' : 'Enter OAuth client secret',
      mcpUpdate: locale === 'zh' ? '更新' : 'Update',
      mcpPresetAuthLocked: locale === 'zh' ? '创建后无法更改认证类型' : 'Authentication type cannot be changed after creation',
      mcpPresetAuthHint:
        locale === 'zh' ? '点击更新后将配置 OAuth 认证。' : 'OAuth authentication will be configured after clicking Update.',
      mcpCreatedNotice: locale === 'zh' ? 'MCP 已连接' : 'MCP connected',
      mcpCreatedNoticeSub: locale === 'zh' ? 'MCP 工具已添加到列表。' : 'MCP tool added to your list.',
      mcpConnecting: locale === 'zh' ? '连接中' : 'Connecting',
      mcpOAuthLoginTitle: locale === 'zh' ? '登录以连接' : 'Log in to connect',
      mcpOAuthContinueGoogle: locale === 'zh' ? '使用 Google 继续' : 'Continue with Google',
      mcpOAuthContinueEmail: locale === 'zh' ? '使用邮箱继续' : 'Continue with email',
      mcpOAuthContinueSaml: locale === 'zh' ? '使用 SAML SSO 继续' : 'Continue with SAML SSO',
      mcpOAuthNoAccount: locale === 'zh' ? '还没有账号？' : "Don't have an account?",
      mcpOAuthSignUpLearn: locale === 'zh' ? '注册或了解更多' : 'Sign up or learn more',
      mcpOAuthEmailTitle: locale === 'zh' ? '你的邮箱地址是？' : "What's your email address?",
      mcpOAuthSamlTitle: locale === 'zh' ? '你的企业邮箱是？' : "What's your work email address?",
      mcpOAuthEmailPlaceholder: locale === 'zh' ? '输入邮箱地址…' : 'Enter your email address...',
      mcpOAuthEmailContinue: locale === 'zh' ? '使用邮箱继续' : 'Continue with email',
      mcpOAuthSamlContinue: locale === 'zh' ? '使用 SAML SSO 继续' : 'Continue with SAML SSO',
      mcpOAuthBackToLogin: locale === 'zh' ? '返回登录' : 'Back to login',
      mcpOAuthGoogleHeader: locale === 'zh' ? '使用 Google 登录' : 'Sign in with Google',
      mcpOAuthChooseAccount: locale === 'zh' ? '选择账号' : 'Choose an account',
      mcpOAuthContinueTo: locale === 'zh' ? '以继续连接到' : 'to continue to',
      mcpOAuthUseAnotherAccount: locale === 'zh' ? '使用其他账号' : 'Use another account',
      mcpOAuthSignInTo: locale === 'zh' ? '登录以连接' : 'Sign in to',
      mcpOAuthGoogleAccessInfo: locale === 'zh' ? 'Google 将允许该应用访问以下信息：' : 'Google will allow this app to access this info about you',
      mcpOAuthPermissionName: locale === 'zh' ? '姓名和头像' : 'Name and profile picture',
      mcpOAuthPermissionEmail: locale === 'zh' ? '邮箱地址' : 'Email address',
      mcpOAuthReviewPolicy:
        locale === 'zh'
          ? '请查看该应用的隐私政策和服务条款，了解其如何处理和保护你的数据。'
          : 'Review the app Privacy Policy and Terms of Service to understand how your data will be processed and protected.',
      mcpOAuthGoogleAccount: locale === 'zh' ? 'Google 账号' : 'Google Account',
      mcpOAuthLearnMore: locale === 'zh' ? '了解「使用 Google 登录」' : 'Learn more about Sign in with Google',
      mcpOAuthContinue: locale === 'zh' ? '继续' : 'Continue',
      mcpVerifyTitle: locale === 'zh' ? '输入验证码' : 'Enter verification code',
      mcpVerifySubtitle: locale === 'zh' ? '我们已向你的邮箱发送了 6 位验证码，请输入以完成连接。' : 'We sent a 6-digit code to your email. Enter it to finish connecting.',
      mcpVerifyPlaceholder: locale === 'zh' ? '6 位验证码' : '6-digit code',
      mcpVerifySubmit: locale === 'zh' ? '确认' : 'Confirm',
      mcpVerifySubmitting: locale === 'zh' ? '验证中…' : 'Verifying…',
    }),
    [locale],
  )
  const canConnectCustomMcp = mcpCustomDraft.url.trim().length > 0 && mcpCustomDraft.label.trim().length > 0
  const canUpdatePresetMcp = Boolean(mcpPresetDraft?.url.trim() && mcpPresetDraft.label.trim())
  const columnLabels = useMemo(
    () => ({
      description: locale === 'zh' ? '描述' : 'Description',
      type: locale === 'zh' ? '类型' : 'Type',
      integrations: locale === 'zh' ? '第三方接入' : 'Integrations',
      owner: locale === 'zh' ? '负责人' : 'Owner',
      agents: locale === 'zh' ? '关联 Agent' : 'Agents',
      lastRun: locale === 'zh' ? '上次运行' : 'Last run',
      lastModified: locale === 'zh' ? '上次修改' : 'Last modified',
      created: locale === 'zh' ? '创建时间' : 'Created',
      timesRun: locale === 'zh' ? '运行次数' : 'Run count',
    }),
    [locale],
  )
  const sortLabels = useMemo(
    () => ({
      name: locale === 'zh' ? '工具名' : 'Tool name',
      description: locale === 'zh' ? '描述' : 'Description',
      created: locale === 'zh' ? '创建时间' : 'Created',
      lastModified: locale === 'zh' ? '上次修改' : 'Last modified',
      lastRun: locale === 'zh' ? '上次运行' : 'Last run',
      timesRun: locale === 'zh' ? '运行次数' : 'Run count',
    }),
    [locale],
  )

  const visibleColumns = useMemo(
    () =>
      COLUMN_OPTION_CONFIG.filter((option) => visibleColumnIds.has(option.id)).map((option) => ({
        ...option,
        label: columnLabels[option.id],
      })),
    [columnLabels, visibleColumnIds],
  )
  const displayItems = useMemo(
    () => items.map((item) => localizeToolForDisplay(item, locale)),
    [items, locale],
  )
  const toolsTabCounts = useMemo(
    () => ({
      all: items.length,
      referenced: items.filter((item) => isReferencedTool(item)).length,
      tool: items.filter((item) => !isMcpToolItem(item)).length,
      mcp: items.filter((item) => isMcpToolItem(item)).length,
      mine: items.filter((item) => !isReferencedTool(item)).length,
    }),
    [items],
  )
  const tabFilteredItems = useMemo(() => {
    switch (toolsTab) {
      case 'referenced':
        return displayItems.filter((item) => isReferencedTool(item))
      case 'tool':
        return displayItems.filter((item) => !isMcpToolItem(item))
      case 'mcp':
        return displayItems.filter((item) => isMcpToolItem(item))
      case 'mine':
        return displayItems.filter((item) => !isReferencedTool(item))
      default:
        return displayItems
    }
  }, [displayItems, toolsTab])
  const filteredItems = useMemo(
    () => sortTools(filterTools(tabFilteredItems, search, locale), sortId),
    [tabFilteredItems, locale, search, sortId],
  )
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / TOOLS_PER_PAGE))
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * TOOLS_PER_PAGE
    return filteredItems.slice(startIndex, startIndex + TOOLS_PER_PAGE)
  }, [currentPage, filteredItems])
  const tableTemplate = useMemo(
    () => getTableTemplate(visibleColumns.map((column) => column.id)),
    [visibleColumns],
  )
  const sortLabel = sortLabels[sortId] ?? sortLabels.lastModified
  const selectedCount = selectedToolIds.size
  const visibleToolIds = useMemo(() => paginatedItems.map((item) => item.id), [paginatedItems])
  const selectedAgentNames = useMemo(
    () =>
      Array.from(
        new Set(
          items
            .filter((item) => selectedToolIds.has(item.id))
            .flatMap((item) => item.agents)
            .filter((agentName) => agentName.trim()),
        ),
      ),
    [items, selectedToolIds],
  )
  const allVisibleSelected =
    visibleToolIds.length > 0 && visibleToolIds.every((itemId) => selectedToolIds.has(itemId))
  const partiallySelected = visibleToolIds.some((itemId) => selectedToolIds.has(itemId)) && !allVisibleSelected
  const selectedToolItem = useMemo(() => {
    const raw = selectedToolId ? items.find((item) => item.id === selectedToolId) ?? null : null
    return raw ? localizeToolForDisplay(raw, locale) : null
  }, [items, selectedToolId, locale])
  const selectedToolConfig = useMemo(
    () =>
      selectedToolItem ? (toolConfigDrafts[selectedToolItem.id] ?? buildToolConfigDraft(selectedToolItem, locale)) : null,
    [locale, selectedToolItem, toolConfigDrafts],
  )
  const activeToolConfig = creatingToolDraft ?? selectedToolConfig
  const isCreatingToolConfig = creatingToolDraft != null
  const canSaveSelectedToolConfig =
    activeToolConfig != null &&
    activeToolConfig.toolName.trim().length > 0 &&
    activeToolConfig.toolDescription.trim().length > 0

  useEffect(() => {
    setSelectedToolIds((current) => {
      const next = new Set(Array.from(current).filter((itemId) => items.some((item) => item.id === itemId)))
      return next.size === current.size ? current : next
    })
  }, [items])

  useEffect(() => {
    if (!openCardMenuToolId) return
    const onDocClick = () => setOpenCardMenuToolId(null)
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [openCardMenuToolId])

  useEffect(() => {
    if (!selectedToolId) return
    if (items.some((item) => item.id === selectedToolId)) return
    setSelectedToolId(null)
  }, [items, selectedToolId])

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages))
  }, [totalPages])

  useEffect(() => {
    setCurrentPage(1)
  }, [search, sortId, toolsTab])

  useEffect(() => {
    return () => {
      if (toolNoticeTimerRef.current != null) {
        window.clearTimeout(toolNoticeTimerRef.current)
      }
      if (toolConfigExportTimerRef.current != null) {
        window.clearTimeout(toolConfigExportTimerRef.current)
      }
      if (toolConfigSaveTimerRef.current != null) {
        window.clearTimeout(toolConfigSaveTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!activeMenu) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (columnsMenuRef.current?.contains(target) || sortMenuRef.current?.contains(target)) return
      setActiveMenu(null)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActiveMenu(null)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [activeMenu])

  const toggleColumn = (columnId: ToolColumnId) => {
    setVisibleColumnIds((current) => {
      const next = new Set(current)
      if (next.has(columnId)) {
        if (next.size === 1) return current
        next.delete(columnId)
      } else {
        next.add(columnId)
      }
      return next
    })
  }

  const toggleToolSelection = (toolId: string) => {
    setSelectedToolIds((current) => {
      const next = new Set(current)
      if (next.has(toolId)) next.delete(toolId)
      else next.add(toolId)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    setSelectedToolIds((current) => {
      const next = new Set(current)
      if (allVisibleSelected) {
        visibleToolIds.forEach((itemId) => next.delete(itemId))
      } else {
        visibleToolIds.forEach((itemId) => next.add(itemId))
      }
      return next
    })
  }

  const clearSelection = () => setSelectedToolIds(new Set())

  const showToolNotice = (title: string, sub?: string) => {
    setToolNoticeToast({ title, sub: sub?.trim() || undefined })
    if (toolNoticeTimerRef.current != null) {
      window.clearTimeout(toolNoticeTimerRef.current)
    }
    toolNoticeTimerRef.current = window.setTimeout(() => {
      setToolNoticeToast(null)
      toolNoticeTimerRef.current = null
    }, 2000)
  }

  const closeToolConfigModal = () => {
    if (isSavingToolConfig) return
    setSelectedToolId(null)
    setCreatingToolDraft(null)
  }

  const handleSelectTool = (item: ToolDirectoryItem) => {
    setCreatingToolDraft(null)
    setSelectedToolId(item.id)
    setToolConfigDrafts((current) => (current[item.id] ? current : { ...current, [item.id]: buildToolConfigDraft(item, locale) }))
  }

  const updateActiveToolConfig = (updater: (current: ToolConfigDraft) => ToolConfigDraft) => {
    if (creatingToolDraft != null) {
      setCreatingToolDraft((current) => (current ? updater(current) : current))
      return
    }
    if (!selectedToolItem) return
    setToolConfigDrafts((current) => ({
      ...current,
      [selectedToolItem.id]: updater(current[selectedToolItem.id] ?? buildToolConfigDraft(selectedToolItem, locale)),
    }))
  }

  const handleDeleteSelected = () => {
    if (selectedToolIds.size === 0) return
    onItemsChange(items.filter((item) => !selectedToolIds.has(item.id)))
    setSelectedToolIds(new Set())
  }

  const resetMcpOAuthFlow = () => {
    if (mcpPresetConnectTimerRef.current != null) {
      window.clearTimeout(mcpPresetConnectTimerRef.current)
      mcpPresetConnectTimerRef.current = null
    }
    setMcpOAuthStep(null)
    setIsMcpConnecting(false)
    setMcpOAuthEmail('')
    setMcpOAuthSelectedGoogleAccountId(null)
    setIsMcpVerifyModalOpen(false)
    setMcpVerifyCode('')
    setIsMcpVerifySubmitting(false)
  }

  const resetMcpDrafts = () => {
    setMcpCustomDraft(buildEmptyMcpCustomDraft())
    setMcpPresetDraft(null)
    resetMcpOAuthFlow()
  }

  const closeCreateToolModal = () => {
    setCreateToolModalStep(null)
    resetMcpDrafts()
  }

  const handleOpenCustomCreate = () => {
    setCreateToolModalStep(null)
    resetMcpDrafts()
    setSelectedToolId(null)
    setCreatingToolDraft(buildEmptyToolConfigDraft())
  }

  const handleOpenRemoteMcpHub = () => {
    resetMcpDrafts()
    setCreateToolModalStep('mcpHub')
  }

  const handleOpenMcpCustom = () => {
    setMcpCustomDraft(buildEmptyMcpCustomDraft())
    setMcpPresetDraft(null)
    setCreateToolModalStep('mcpCustom')
  }

  const handleOpenMcpPreset = (presetId: McpPresetId) => {
    setMcpPresetDraft(buildMcpPresetDraft(presetId, locale))
    setCreateToolModalStep('mcpPreset')
  }

  const handleImportJsonClick = () => {
    if (jsonImportInputRef.current) {
      jsonImportInputRef.current.value = ''
      jsonImportInputRef.current.click()
    }
  }

  const handleJsonImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    onItemsChange([createImportedToolDirectoryItem(file.name), ...items])
    setCreateToolModalStep(null)
    event.target.value = ''
    showToolNotice(text.importToolSuccess, text.importToolSuccessSub)
  }

  const handleAddMcpHeader = (target: 'custom' | 'preset') => {
    if (target === 'custom') {
      setMcpCustomDraft((current) => ({
        ...current,
        headers: [...current.headers, createMcpHeaderDraft()],
      }))
      return
    }
    setMcpPresetDraft((current) =>
      current
        ? {
            ...current,
            headers: [...current.headers, createMcpHeaderDraft()],
          }
        : current,
    )
  }

  const handleUpdateMcpHeader = (
    target: 'custom' | 'preset',
    headerId: string,
    field: 'name' | 'value',
    value: string,
  ) => {
    if (target === 'custom') {
      setMcpCustomDraft((current) => ({
        ...current,
        headers: current.headers.map((header) => (header.id === headerId ? { ...header, [field]: value } : header)),
      }))
      return
    }
    setMcpPresetDraft((current) =>
      current
        ? {
            ...current,
            headers: current.headers.map((header) => (header.id === headerId ? { ...header, [field]: value } : header)),
          }
        : current,
    )
  }

  const handleDeleteMcpHeader = (target: 'custom' | 'preset', headerId: string) => {
    if (target === 'custom') {
      setMcpCustomDraft((current) => ({
        ...current,
        headers: current.headers.filter((header) => header.id !== headerId),
      }))
      return
    }
    setMcpPresetDraft((current) =>
      current
        ? {
            ...current,
            headers: current.headers.filter((header) => header.id !== headerId),
          }
        : current,
    )
  }

  const finalizeMcpConnection = () => {
    if (createToolModalStep === 'mcpPreset' && mcpPresetDraft) {
      const preset = MCP_PRESET_CONFIG[mcpPresetDraft.presetId]
      onItemsChange([
        createRemoteMcpToolDirectoryItem({
          title: mcpPresetDraft.label,
          description:
            locale === 'zh'
              ? `${preset.name.zh} MCP 连接，${mcpPresetDraft.connectionMode === 'shared' ? '共享连接模式' : '按用户连接模式'}。`
              : `${preset.name.en} MCP connection in ${mcpPresetDraft.connectionMode} mode.`,
          mcpPresetId: mcpPresetDraft.presetId,
        }),
        ...items,
      ])
      closeCreateToolModal()
      showToolNotice(text.mcpCreatedNotice, text.mcpCreatedNoticeSub)
      return
    }

    if (createToolModalStep === 'mcpCustom') {
      const title = mcpCustomDraft.label.trim() || (locale === 'zh' ? '未命名 MCP' : 'Untitled MCP')
      const description =
        locale === 'zh'
          ? `连接到远程 MCP 服务 ${mcpCustomDraft.url.trim() || 'https://mcp.example.com'}。`
          : `Connect to remote MCP service ${mcpCustomDraft.url.trim() || 'https://mcp.example.com'}.`
      onItemsChange([
        createRemoteMcpToolDirectoryItem({
          title,
          description,
        }),
        ...items,
      ])
      closeCreateToolModal()
      showToolNotice(text.mcpCreatedNotice, text.mcpCreatedNoticeSub)
    }
  }

  const handleStartMcpOAuth = () => {
    const canStartPreset = createToolModalStep === 'mcpPreset' && mcpPresetDraft && canUpdatePresetMcp
    const canStartCustom = createToolModalStep === 'mcpCustom' && canConnectCustomMcp
    if ((!canStartPreset && !canStartCustom) || isMcpConnecting) return

    setIsMcpConnecting(true)
    if (mcpPresetConnectTimerRef.current != null) {
      window.clearTimeout(mcpPresetConnectTimerRef.current)
    }
    mcpPresetConnectTimerRef.current = window.setTimeout(() => {
      setIsMcpConnecting(false)
      setMcpOAuthStep('login')
      mcpPresetConnectTimerRef.current = null
    }, 1100)
  }

  const handleOpenMcpVerifyModal = () => {
    setIsMcpVerifyModalOpen(true)
    setMcpVerifyCode('')
  }

  const handleSubmitMcpVerifyCode = () => {
    if (mcpVerifyCode.trim().length !== 6 || isMcpVerifySubmitting) return
    setIsMcpVerifySubmitting(true)
    window.setTimeout(() => {
      setIsMcpVerifySubmitting(false)
      finalizeMcpConnection()
    }, 900)
  }

  const selectedMcpOAuthGoogleAccount =
    MCP_OAUTH_GOOGLE_ACCOUNTS.find((account) => account.id === mcpOAuthSelectedGoogleAccountId) ??
    MCP_OAUTH_GOOGLE_ACCOUNTS[0]

  const handleAddToolConfigSchemaRow = () => {
    updateActiveToolConfig((current) => ({
      ...current,
      inputSchemaRows: [...current.inputSchemaRows, createToolConfigSchemaRow('', 'string', '', false)],
    }))
  }

  const handlePasteToolConfigSchema = async () => {
    try {
      const raw = await navigator.clipboard.readText()
      const rows = parseToolSchemaRowsFromJson(raw)
      updateActiveToolConfig((current) => ({
        ...current,
        inputSchemaRows: rows,
      }))
      showToolNotice(text.inputSchemaPasteSuccess, text.inputSchemaPasteSuccessSub)
    } catch {
      showToolNotice(text.inputSchemaPasteFailed, text.inputSchemaPasteFailedSub)
    }
  }

  const handleResetSelectedToolConfig = () => {
    if (creatingToolDraft != null) {
      setCreatingToolDraft(buildEmptyToolConfigDraft())
      return
    }
    if (!selectedToolItem) return
    setToolConfigDrafts((current) => ({
      ...current,
      [selectedToolItem.id]: buildToolConfigDraft(selectedToolItem, locale),
    }))
  }

  const handleSaveSelectedToolConfig = () => {
    if (!activeToolConfig || !canSaveSelectedToolConfig) return
    const now = new Date().toISOString()
    if (creatingToolDraft != null) {
      const newItem = createCustomToolDirectoryItem({
        title: activeToolConfig.toolName.trim(),
        description: activeToolConfig.toolDescription.trim(),
      })
      onItemsChange([newItem, ...items])
      recordInitialSectionIteration({
        sectionType: 'tool',
        sectionId: newItem.id,
        sectionNameZh: newItem.name,
        sectionNameEn: newItem.name,
        summaryZh: '初始创建工具',
        summaryEn: 'Initial tool creation',
      })
      setToolConfigDrafts((current) => ({
        ...current,
        [newItem.id]: {
          ...activeToolConfig,
          toolName: activeToolConfig.toolName.trim(),
          toolDescription: activeToolConfig.toolDescription.trim(),
        },
      }))
    } else if (selectedToolItem) {
      onItemsChange(
        items.map((item) =>
          item.id === selectedToolItem.id
            ? {
                ...item,
                name: activeToolConfig.toolName.trim(),
                description: activeToolConfig.toolDescription.trim(),
                lastModifiedAt: now,
                lastModifiedLabel: locale === 'zh' ? '刚刚编辑' : 'Edited just now',
              }
            : item,
        ),
      )
    } else {
      return
    }
    setIsSavingToolConfig(true)
    if (creatingToolDraft != null) {
      showToolNotice(text.addToolCreated, text.addToolCreatedSub)
    } else {
      showToolNotice(text.saveConfigSuccess, text.saveConfigSuccessSub)
    }
    if (toolConfigSaveTimerRef.current != null) {
      window.clearTimeout(toolConfigSaveTimerRef.current)
    }
    toolConfigSaveTimerRef.current = window.setTimeout(() => {
      setIsSavingToolConfig(false)
      setSelectedToolId(null)
      setCreatingToolDraft(null)
      toolConfigSaveTimerRef.current = null
    }, 950)
  }

  const handleDeleteToolConfigSchemaRow = (rowId: string) => {
    updateActiveToolConfig((current) => ({
      ...current,
      inputSchemaRows: current.inputSchemaRows.filter((item) => item.id !== rowId),
    }))
  }

  const handleExportSelectedToolConfig = () => {
    if (!activeToolConfig || isExportingToolConfig) return
    setIsExportingToolConfig(true)
    const blob = new Blob([JSON.stringify(activeToolConfig, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${activeToolConfig.toolName || selectedToolItem?.id || 'custom-tool'}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    if (toolConfigExportTimerRef.current != null) {
      window.clearTimeout(toolConfigExportTimerRef.current)
    }
    toolConfigExportTimerRef.current = window.setTimeout(() => {
      setIsExportingToolConfig(false)
      toolConfigExportTimerRef.current = null
    }, 900)
  }

  const completeToolVersionPublish = (payload: SectionIterationPublishPayload) => {
    const toolId = selectedToolItem?.id
    const toolName = activeToolConfig?.toolName.trim() || selectedToolItem?.name
    if (!toolId || !toolName || !canPublishSectionVersion) return
    publishSectionIteration({
      sectionType: 'tool',
      sectionId: toolId,
      sectionNameZh: toolName,
      sectionNameEn: toolName,
      ...payload,
    })
    setToolVersionModalOpen(false)
  }

  const handleSaveAsTemplate = () => {
    showToolNotice(text.saveAsTemplateSuccess, text.saveAsTemplateSuccessSub)
  }

  const handleDeleteSelectedTool = () => {
    if (isSavingToolConfig) return
    if (creatingToolDraft != null) {
      setCreatingToolDraft(null)
      return
    }
    if (!selectedToolItem) return
    onItemsChange(items.filter((item) => item.id !== selectedToolItem.id))
    setSelectedToolId(null)
    showToolNotice(text.deleteToolSuccess, text.deleteToolSuccessSub)
  }

  const handleDeleteTool = (item: ToolDirectoryItem) => {
    onItemsChange(items.filter((entry) => entry.id !== item.id))
    if (selectedToolId === item.id) {
      setSelectedToolId(null)
    }
    setOpenCardMenuToolId(null)
    showToolNotice(text.deleteToolSuccess, text.deleteToolSuccessSub)
  }

  const renderMcpHeaders = (target: 'custom' | 'preset', headers: McpHeaderDraft[]) => (
    <div className="tools-directory-mcp-headers-block">
      <div className="tools-directory-mcp-headers-copy">
        <strong>{text.mcpHeadersTitle}</strong>
        <span>{text.mcpHeadersDesc}</span>
      </div>
      <div className="tools-directory-mcp-header-list">
        {headers.map((header) => (
          <div key={header.id} className="tools-directory-mcp-header-row">
            <input
              value={header.name}
              placeholder={text.mcpHeaderName}
              onChange={(event) => handleUpdateMcpHeader(target, header.id, 'name', event.target.value)}
            />
            <input
              value={header.value}
              placeholder={text.mcpHeaderValue}
              onChange={(event) => handleUpdateMcpHeader(target, header.id, 'value', event.target.value)}
            />
            <button
              type="button"
              className="tools-directory-mcp-header-delete"
              aria-label={text.delete}
              onClick={() => handleDeleteMcpHeader(target, header.id)}
            >
              <McpHeaderDeleteIcon />
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="tools-directory-mcp-add-header" onClick={() => handleAddMcpHeader(target)}>
        {text.mcpAddHeader}
      </button>
    </div>
  )

  const renderMcpOAuthBrandLogo = (presetId: McpPresetId | null) => {
    if (presetId) {
      return <McpPresetLogo presetId={presetId} />
    }
    return <McpMarkIcon />
  }

  const renderMcpOAuthFlow = (options: { presetId: McpPresetId | null; serviceLabel: string }) => {
    const { presetId, serviceLabel } = options

    if (mcpOAuthStep === 'login') {
      return (
        <div className="tools-directory-mcp-oauth-panel">
          <div className="tools-directory-mcp-oauth-brand">
            <span className="tools-directory-mcp-oauth-logo" aria-hidden="true">
              {renderMcpOAuthBrandLogo(presetId)}
            </span>
            <h2 className="tools-directory-mcp-oauth-title">
              {text.mcpOAuthLoginTitle} {serviceLabel}
            </h2>
          </div>
          <div className="tools-directory-mcp-oauth-actions">
            <button
              type="button"
              className="tools-directory-mcp-oauth-btn tools-directory-mcp-oauth-btn--google"
              onClick={() => {
                setMcpOAuthSelectedGoogleAccountId(MCP_OAUTH_GOOGLE_ACCOUNTS[0]?.id ?? null)
                setMcpOAuthStep('google-accounts')
              }}
            >
              {text.mcpOAuthContinueGoogle}
            </button>
            <button
              type="button"
              className="tools-directory-mcp-oauth-btn tools-directory-mcp-oauth-btn--outline"
              onClick={() => {
                setMcpOAuthEmail('')
                setMcpOAuthStep('email')
              }}
            >
              {text.mcpOAuthContinueEmail}
            </button>
            <button
              type="button"
              className="tools-directory-mcp-oauth-btn tools-directory-mcp-oauth-btn--outline"
              onClick={() => {
                setMcpOAuthEmail('')
                setMcpOAuthStep('saml')
              }}
            >
              {text.mcpOAuthContinueSaml}
            </button>
          </div>
          <p className="tools-directory-mcp-oauth-footer">
            {text.mcpOAuthNoAccount}{' '}
            <button type="button" className="tools-directory-mcp-oauth-link">
              {text.mcpOAuthSignUpLearn}
            </button>
          </p>
        </div>
      )
    }

    if (mcpOAuthStep === 'email' || mcpOAuthStep === 'saml') {
      const isSaml = mcpOAuthStep === 'saml'
      return (
        <div className="tools-directory-mcp-oauth-panel">
          <div className="tools-directory-mcp-oauth-brand">
            <span className="tools-directory-mcp-oauth-logo" aria-hidden="true">
              {renderMcpOAuthBrandLogo(presetId)}
            </span>
            <h2 className="tools-directory-mcp-oauth-title">{isSaml ? text.mcpOAuthSamlTitle : text.mcpOAuthEmailTitle}</h2>
          </div>
          <label className="tools-directory-mcp-oauth-email-field">
            <input
              type="email"
              value={mcpOAuthEmail}
              placeholder={text.mcpOAuthEmailPlaceholder}
              onChange={(event) => setMcpOAuthEmail(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="tools-directory-mcp-oauth-btn tools-directory-mcp-oauth-btn--outline tools-directory-mcp-oauth-btn--full"
            disabled={!mcpOAuthEmail.trim()}
            onClick={handleOpenMcpVerifyModal}
          >
            {isSaml ? text.mcpOAuthSamlContinue : text.mcpOAuthEmailContinue}
          </button>
          <button
            type="button"
            className="tools-directory-mcp-oauth-back-link"
            onClick={() => setMcpOAuthStep('login')}
          >
            {text.mcpOAuthBackToLogin}
          </button>
        </div>
      )
    }

    if (mcpOAuthStep === 'google-accounts') {
      return (
        <div className="tools-directory-mcp-oauth-panel tools-directory-mcp-oauth-panel--google">
          <div className="tools-directory-mcp-google-header">
            <span className="tools-directory-mcp-google-g" aria-hidden="true">
              G
            </span>
            <span>{text.mcpOAuthGoogleHeader}</span>
          </div>
          <div className="tools-directory-mcp-google-body">
            <div className="tools-directory-mcp-google-brand">
              <span className="tools-directory-mcp-oauth-logo tools-directory-mcp-oauth-logo--google" aria-hidden="true">
                {renderMcpOAuthBrandLogo(presetId)}
              </span>
              <h2 className="tools-directory-mcp-google-title">{text.mcpOAuthChooseAccount}</h2>
              <p className="tools-directory-mcp-google-subtitle">
                {text.mcpOAuthContinueTo} <strong>{serviceLabel}</strong>
              </p>
            </div>
            <div className="tools-directory-mcp-google-account-list">
              {MCP_OAUTH_GOOGLE_ACCOUNTS.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  className="tools-directory-mcp-google-account-item"
                  onClick={() => {
                    setMcpOAuthSelectedGoogleAccountId(account.id)
                    setMcpOAuthStep('google-consent')
                  }}
                >
                  <span className="tools-directory-mcp-google-avatar" style={{ backgroundColor: account.avatarTone }}>
                    {account.avatarLabel}
                  </span>
                  <span className="tools-directory-mcp-google-account-copy">
                    <strong>{account.name}</strong>
                    <span>{account.email}</span>
                  </span>
                </button>
              ))}
              <button type="button" className="tools-directory-mcp-google-account-item tools-directory-mcp-google-account-item--another">
                <span className="tools-directory-mcp-google-avatar tools-directory-mcp-google-avatar--muted" aria-hidden="true">
                  <svg viewBox="0 0 24 24" focusable="false">
                    <path
                      d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm0 2c-3.33 0-6 1.67-6 3.75V20h12v-2.25C18 15.67 15.33 14 12 14Z"
                      fill="currentColor"
                    />
                  </svg>
                </span>
                <span className="tools-directory-mcp-google-account-copy">
                  <strong>{text.mcpOAuthUseAnotherAccount}</strong>
                </span>
              </button>
            </div>
          </div>
        </div>
      )
    }

    if (mcpOAuthStep === 'google-consent') {
      return (
        <div className="tools-directory-mcp-oauth-panel tools-directory-mcp-oauth-panel--google">
          <div className="tools-directory-mcp-google-header">
            <span className="tools-directory-mcp-google-g" aria-hidden="true">
              G
            </span>
            <span>{text.mcpOAuthGoogleHeader}</span>
          </div>
          <div className="tools-directory-mcp-google-body">
            <div className="tools-directory-mcp-google-brand">
              <span className="tools-directory-mcp-oauth-logo tools-directory-mcp-oauth-logo--google" aria-hidden="true">
                {renderMcpOAuthBrandLogo(presetId)}
              </span>
              <h2 className="tools-directory-mcp-google-title">
                {text.mcpOAuthSignInTo} {serviceLabel}
              </h2>
            </div>
            <button type="button" className="tools-directory-mcp-google-selected-account">
              <span
                className="tools-directory-mcp-google-avatar"
                style={{ backgroundColor: selectedMcpOAuthGoogleAccount.avatarTone }}
              >
                {selectedMcpOAuthGoogleAccount.avatarLabel}
              </span>
              <span className="tools-directory-mcp-google-account-copy">
                <strong>{selectedMcpOAuthGoogleAccount.email}</strong>
              </span>
              <span className="tools-directory-mcp-google-caret" aria-hidden="true">
                ▾
              </span>
            </button>
            <p className="tools-directory-mcp-google-access">{text.mcpOAuthGoogleAccessInfo}</p>
            <ul className="tools-directory-mcp-google-permissions">
              <li>
                <span className="tools-directory-mcp-google-permission-icon" aria-hidden="true">
                  👤
                </span>
                <span>
                  <strong>{selectedMcpOAuthGoogleAccount.name}</strong>
                  <span>{text.mcpOAuthPermissionName}</span>
                </span>
              </li>
              <li>
                <span className="tools-directory-mcp-google-permission-icon" aria-hidden="true">
                  ✉
                </span>
                <span>
                  <strong>{selectedMcpOAuthGoogleAccount.email}</strong>
                  <span>{text.mcpOAuthPermissionEmail}</span>
                </span>
              </li>
            </ul>
            <p className="tools-directory-mcp-google-legal">{text.mcpOAuthReviewPolicy}</p>
            <p className="tools-directory-mcp-google-legal">
              {text.mcpOAuthGoogleAccount} · {text.mcpOAuthLearnMore}
            </p>
            <div className="tools-directory-mcp-google-actions">
              <button type="button" className="tools-directory-mcp-google-action-btn" onClick={() => setMcpOAuthStep('google-accounts')}>
                {text.cancel}
              </button>
              <button type="button" className="tools-directory-mcp-google-action-btn" onClick={handleOpenMcpVerifyModal}>
                {text.mcpOAuthContinue}
              </button>
            </div>
          </div>
        </div>
      )
    }

    return null
  }

  const renderCreateToolModalContent = () => {
    if (createToolModalStep === 'choose') {
      return (
        <div
          className="tools-directory-create-modal-panel"
          role="dialog"
          aria-modal="true"
          aria-label={text.createModalTitle}
        >
          <button
            type="button"
            className="tools-directory-create-modal-close"
            aria-label={text.close}
            onClick={closeCreateToolModal}
          >
            ×
          </button>
          <div className="tools-directory-create-modal-title">{text.createModalTitle}</div>
          <div className="tools-directory-create-modal-subtitle">{text.createModalSubtitle}</div>
          <div className="tools-directory-create-option-list">
            <button
              type="button"
              className="tools-directory-create-option-card"
              onClick={() => {
                closeCreateToolModal()
                onOpenToolTemplates()
              }}
            >
              <span className="tools-directory-create-option-icon" aria-hidden="true">
                ⚙
              </span>
              <span className="tools-directory-create-option-copy">
                <strong>{text.createOptionTemplateTitle}</strong>
                <span>{text.createOptionTemplateDesc}</span>
              </span>
            </button>
            <button type="button" className="tools-directory-create-option-card" onClick={handleImportJsonClick}>
              <span className="tools-directory-create-option-icon" aria-hidden="true">
                {'{}'}
              </span>
              <span className="tools-directory-create-option-copy">
                <strong>{text.createOptionJsonTitle}</strong>
                <span>{text.createOptionJsonDesc}</span>
              </span>
            </button>
            <button type="button" className="tools-directory-create-option-card" onClick={handleOpenCustomCreate}>
              <span className="tools-directory-create-option-icon" aria-hidden="true">
                ✎
              </span>
              <span className="tools-directory-create-option-copy">
                <strong>{text.createOptionCustomTitle}</strong>
                <span>{text.createOptionCustomDesc}</span>
              </span>
            </button>
            <button type="button" className="tools-directory-create-option-card" onClick={handleOpenRemoteMcpHub}>
              <span className="tools-directory-create-option-icon tools-directory-create-option-icon--mcp" aria-hidden="true">
                <RemoteMcpOptionIcon />
              </span>
              <span className="tools-directory-create-option-copy">
                <strong>{text.createOptionRemoteMcpTitle}</strong>
                <span>{text.createOptionRemoteMcpDesc}</span>
              </span>
            </button>
          </div>
        </div>
      )
    }

    if (createToolModalStep === 'mcpHub') {
      return (
        <div className="tools-directory-create-modal-panel tools-directory-create-modal-panel--mcp" role="dialog" aria-modal="true" aria-label={text.mcpHubTitle}>
          <button
            type="button"
            className="tools-directory-create-modal-close"
            aria-label={text.close}
            onClick={closeCreateToolModal}
          >
            ×
          </button>
          <div className="tools-directory-mcp-hub-head">
            <McpMarkIcon />
            <div className="tools-directory-create-modal-title">{text.mcpHubTitle}</div>
            <div className="tools-directory-create-modal-subtitle">{text.mcpHubSubtitle}</div>
          </div>
          <button type="button" className="tools-directory-mcp-primary-ghost" onClick={handleOpenMcpCustom}>
            {text.mcpConnectMine}
          </button>
          <div className="tools-directory-mcp-preset-title">{text.mcpPresetTitle}</div>
          <div className="tools-directory-mcp-preset-grid">
            {(['notion', 'linear', 'canva', 'atlassian', 'clickup', 'zapier', 'tally'] as McpPresetId[]).map((presetId) => (
              <button
                key={presetId}
                type="button"
                className="tools-directory-mcp-preset-card"
                onClick={() => handleOpenMcpPreset(presetId)}
              >
                <span className="tools-directory-mcp-preset-card-inner">
                  <span className="tools-directory-mcp-preset-logo">
                    <McpPresetLogo presetId={presetId} />
                  </span>
                  <span className="tools-directory-mcp-preset-name">{MCP_PRESET_CONFIG[presetId].name[locale]}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )
    }

    if (createToolModalStep === 'mcpCustom') {
      const customServiceLabel =
        mcpCustomDraft.label.trim() || (locale === 'zh' ? 'MCP 服务' : 'MCP service')

      if (mcpOAuthStep) {
        return (
          <div
            className="tools-directory-create-modal-panel tools-directory-create-modal-panel--mcp tools-directory-create-modal-panel--mcp-oauth"
            role="dialog"
            aria-modal="true"
            aria-label={text.mcpOAuthLoginTitle}
          >
            <button
              type="button"
              className="tools-directory-create-modal-close"
              aria-label={text.close}
              onClick={closeCreateToolModal}
            >
              ×
            </button>
            {renderMcpOAuthFlow({
              presetId: null,
              serviceLabel: customServiceLabel,
            })}
          </div>
        )
      }

      return (
        <div className="tools-directory-create-modal-panel tools-directory-create-modal-panel--mcp" role="dialog" aria-modal="true" aria-label={text.mcpCustomTitle}>
          <button
            type="button"
            className="tools-directory-create-modal-close"
            aria-label={text.close}
            onClick={closeCreateToolModal}
          >
            ×
          </button>
          <div className="tools-directory-custom-modal-header">
            <button type="button" className="tools-directory-custom-back" onClick={() => setCreateToolModalStep('mcpHub')}>
              ←
            </button>
            <div>
              <div className="tools-directory-create-modal-title">{text.mcpCustomTitle}</div>
              <div className="tools-directory-create-modal-subtitle">{text.mcpCustomSubtitle}</div>
            </div>
          </div>
          <div className="tools-directory-mcp-form-scroll">
            <label className="tools-directory-create-form-field">
              <span>{text.mcpUrl}</span>
              <input
                value={mcpCustomDraft.url}
                placeholder="https://mcp.example.com"
                onChange={(event) => setMcpCustomDraft((current) => ({ ...current, url: event.target.value }))}
              />
            </label>
            <label className="tools-directory-create-form-field">
              <span>{text.mcpLabel}</span>
              <input
                value={mcpCustomDraft.label}
                placeholder="my_mcp_server"
                onChange={(event) => setMcpCustomDraft((current) => ({ ...current, label: event.target.value }))}
              />
            </label>
            <label className="tools-directory-create-form-field">
              <span>{text.mcpAuthentication}</span>
              <select
                value={mcpCustomDraft.authentication}
                onChange={(event) =>
                  setMcpCustomDraft((current) => ({
                    ...current,
                    authentication: event.target.value as McpAuthType,
                  }))
                }
              >
                <option value="none">{text.mcpAuthenticationNone}</option>
                <option value="api-key">{text.mcpAuthenticationApiKey}</option>
                <option value="custom-headers">{text.mcpAuthenticationCustomHeaders}</option>
                <option value="oauth">{text.mcpAuthenticationOAuth}</option>
              </select>
            </label>
            <button
              type="button"
              className={
                mcpCustomDraft.isAdvancedOpen
                  ? 'tools-directory-mcp-advanced-toggle is-open'
                  : 'tools-directory-mcp-advanced-toggle'
              }
              onClick={() => setMcpCustomDraft((current) => ({ ...current, isAdvancedOpen: !current.isAdvancedOpen }))}
            >
              <span aria-hidden="true">{mcpCustomDraft.isAdvancedOpen ? '⌄' : '›'}</span>
              <span>{text.mcpAdvancedOptions}</span>
            </button>
            {mcpCustomDraft.isAdvancedOpen ? renderMcpHeaders('custom', mcpCustomDraft.headers) : null}
          </div>
          <div className="tools-directory-mcp-form-actions">
            <button type="button" className="agents-btn" onClick={() => setCreateToolModalStep('mcpHub')}>
              {text.back}
            </button>
            <button
              type="button"
              className={
                isMcpConnecting
                  ? 'agents-btn agents-btn-primary tools-directory-mcp-update-btn is-connecting'
                  : 'agents-btn agents-btn-primary tools-directory-mcp-update-btn'
              }
              onClick={handleStartMcpOAuth}
              disabled={!canConnectCustomMcp || isMcpConnecting}
            >
              {isMcpConnecting ? (
                <>
                  <span className="tools-directory-mcp-update-spinner" aria-hidden="true" />
                  <span>{text.mcpConnecting}</span>
                </>
              ) : (
                text.mcpCustomConnect
              )}
            </button>
          </div>
        </div>
      )
    }

    if (createToolModalStep === 'mcpPreset' && mcpPresetDraft) {
      if (mcpOAuthStep) {
        return (
          <div
            className="tools-directory-create-modal-panel tools-directory-create-modal-panel--mcp tools-directory-create-modal-panel--mcp-oauth"
            role="dialog"
            aria-modal="true"
            aria-label={text.mcpOAuthLoginTitle}
          >
            <button
              type="button"
              className="tools-directory-create-modal-close"
              aria-label={text.close}
              onClick={closeCreateToolModal}
            >
              ×
            </button>
            {renderMcpOAuthFlow({
              presetId: mcpPresetDraft.presetId,
              serviceLabel: MCP_PRESET_CONFIG[mcpPresetDraft.presetId].name[locale],
            })}
          </div>
        )
      }

      return (
        <div className="tools-directory-create-modal-panel tools-directory-create-modal-panel--mcp" role="dialog" aria-modal="true" aria-label={text.mcpPresetDetailTitle}>
          <button
            type="button"
            className="tools-directory-create-modal-close"
            aria-label={text.close}
            onClick={closeCreateToolModal}
          >
            ×
          </button>
          <div className="tools-directory-custom-modal-header">
            <button type="button" className="tools-directory-custom-back" onClick={() => setCreateToolModalStep('mcpHub')}>
              ←
            </button>
            <div>
              <div className="tools-directory-create-modal-title">{text.mcpPresetDetailTitle}</div>
              <div className="tools-directory-create-modal-subtitle">{text.mcpPresetDetailSubtitle}</div>
            </div>
          </div>
          <div className="tools-directory-mcp-form-scroll">
            <label className="tools-directory-create-form-field">
              <span>{text.mcpUrl}</span>
              <input value={mcpPresetDraft.url} readOnly />
            </label>
            <label className="tools-directory-create-form-field">
              <span>{text.mcpLabel}</span>
              <input value={mcpPresetDraft.label} readOnly />
            </label>
            <label className="tools-directory-create-form-field">
              <span>{text.mcpAuthentication}</span>
              <select value={mcpPresetDraft.authentication} disabled>
                <option value="oauth">{text.mcpAuthenticationOAuth}</option>
              </select>
            </label>
            <div className="tools-directory-mcp-inline-note">{text.mcpPresetAuthLocked}</div>
            <div className="tools-directory-mcp-inline-note is-soft">{text.mcpPresetAuthHint}</div>
            <div className="tools-directory-mcp-mode-group">
              <div className="tools-directory-mcp-mode-title">{text.mcpConnectionMode}</div>
              <div className="tools-directory-mcp-mode-grid">
                <button
                  type="button"
                  className={
                    mcpPresetDraft.connectionMode === 'per-user'
                      ? 'tools-directory-mcp-mode-card is-active'
                      : 'tools-directory-mcp-mode-card'
                  }
                  onClick={() => setMcpPresetDraft((current) => (current ? { ...current, connectionMode: 'per-user' } : current))}
                >
                  <strong>{text.mcpModePerUser}</strong>
                </button>
                <button
                  type="button"
                  className={
                    mcpPresetDraft.connectionMode === 'shared'
                      ? 'tools-directory-mcp-mode-card is-active'
                      : 'tools-directory-mcp-mode-card'
                  }
                  onClick={() => setMcpPresetDraft((current) => (current ? { ...current, connectionMode: 'shared' } : current))}
                >
                  <strong>{text.mcpModeShared}</strong>
                </button>
              </div>
            </div>
            <button
              type="button"
              className={
                mcpPresetDraft.isAdvancedOpen
                  ? 'tools-directory-mcp-advanced-toggle is-open'
                  : 'tools-directory-mcp-advanced-toggle'
              }
              onClick={() => setMcpPresetDraft((current) => (current ? { ...current, isAdvancedOpen: !current.isAdvancedOpen } : current))}
            >
              <span aria-hidden="true">{mcpPresetDraft.isAdvancedOpen ? '⌄' : '›'}</span>
              <span>{text.mcpAdvancedOptions}</span>
            </button>
            {mcpPresetDraft.isAdvancedOpen ? (
              <>
                <div className="tools-directory-mcp-credentials-grid">
                  <label className="tools-directory-create-form-field">
                    <span>{text.mcpClientId}</span>
                    <input
                      value={mcpPresetDraft.clientId}
                      placeholder={text.mcpClientIdPlaceholder}
                      onChange={(event) =>
                        setMcpPresetDraft((current) => (current ? { ...current, clientId: event.target.value } : current))
                      }
                    />
                  </label>
                  <label className="tools-directory-create-form-field">
                    <span>{text.mcpClientSecret}</span>
                    <input
                      value={mcpPresetDraft.clientSecret}
                      placeholder={text.mcpClientSecretPlaceholder}
                      onChange={(event) =>
                        setMcpPresetDraft((current) => (current ? { ...current, clientSecret: event.target.value } : current))
                      }
                    />
                  </label>
                </div>
                {renderMcpHeaders('preset', mcpPresetDraft.headers)}
              </>
            ) : null}
          </div>
          <div className="tools-directory-mcp-form-actions">
            <button type="button" className="agents-btn" onClick={() => setCreateToolModalStep('mcpHub')}>
              {text.back}
            </button>
            <button
              type="button"
              className={
                isMcpConnecting
                  ? 'agents-btn agents-btn-primary tools-directory-mcp-update-btn is-connecting'
                  : 'agents-btn agents-btn-primary tools-directory-mcp-update-btn'
              }
              onClick={handleStartMcpOAuth}
              disabled={!canUpdatePresetMcp || isMcpConnecting}
            >
              {isMcpConnecting ? (
                <>
                  <span className="tools-directory-mcp-update-spinner" aria-hidden="true" />
                  <span>{text.mcpConnecting}</span>
                </>
              ) : (
                text.mcpUpdate
              )}
            </button>
          </div>
        </div>
      )
    }

    return null
  }

  const renderCell = (item: ToolDirectoryItem, columnId: ToolColumnId) => {
    switch (columnId) {
      case 'description':
        return (
          <div className="tools-directory-row-desc" title={item.description}>
            {item.description}
          </div>
        )
      case 'type':
        return <span className="tools-directory-type-badge">{localizeToolType(item.type, locale)}</span>
      case 'integrations':
        return <IntegrationBadges items={item.integrations} locale={locale} />
      case 'owner':
        return item.owner
      case 'agents':
        return <AgentTags items={item.agents} locale={locale} />
      case 'lastRun':
        return formatToolDateLabel(item.lastRunAt, locale)
      case 'lastModified':
        return formatToolDateLabel(item.lastModifiedAt, locale)
      case 'created':
        return formatToolDateLabel(item.createdAt, locale)
      case 'timesRun':
        return formatTimesRun(item.timesRun, locale)
    }
  }

  return (
    <div className="tools-directory-page">
      <header className="agents-header">
        <div className="agents-header-lead">
          <div className="agents-title">{text.title}</div>
          <ToolsDirectoryPageTagline />
        </div>
        <div className="agents-header-actions">
          <button
            type="button"
            className="agents-btn agents-btn-primary"
            onClick={() => setCreateToolModalStep('choose')}
          >
            {text.create}
          </button>
        </div>
      </header>

      <div className="agents-tabs" role="tablist" aria-label={text.filterLabel}>
        {([
          ['all', text.tabAll, toolsTabCounts.all],
          ['referenced', text.tabReferenced, toolsTabCounts.referenced],
          ['tool', text.tabTools, toolsTabCounts.tool],
          ['mcp', text.tabMcp, toolsTabCounts.mcp],
          ['mine', text.tabMine, toolsTabCounts.mine],
        ] as Array<[ToolsDirectoryTab, string, number]>).map(([key, label, count]) => (
          <button
            key={key}
            className={toolsTab === key ? 'agents-tab is-active' : 'agents-tab'}
            type="button"
            role="tab"
            aria-selected={toolsTab === key}
            onClick={() => setToolsTab(key)}
          >
            {label} <span className="agents-tab-count">{count}</span>
          </button>
        ))}
      </div>

      <div className="agents-toolbar tools-directory-toolbar" aria-label={text.title}>
        <label className="agents-search tools-directory-search">
          <span className="agents-search-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" focusable="false">
              <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
              <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
          <input
            type="search"
            className="agents-search-input"
            placeholder={text.searchPlaceholder}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="tools-directory-toolbar-actions">
          <div ref={sortMenuRef} className="tools-directory-menu-wrap">
            <button
              type="button"
              className={activeMenu === 'sort' ? 'agents-btn is-active' : 'agents-btn'}
              aria-expanded={activeMenu === 'sort'}
              onClick={() => setActiveMenu((current) => (current === 'sort' ? null : 'sort'))}
            >
              {text.sortPrefix}: {sortLabel}
            </button>
            {activeMenu === 'sort' ? (
              <div className="tools-directory-popover tools-directory-sort-popover" role="menu" aria-label={text.sortMenu}>
                {SORT_OPTION_IDS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={sortId === option ? 'tools-directory-popover-item is-selected' : 'tools-directory-popover-item'}
                    onClick={() => {
                      setSortId(option)
                      setActiveMenu(null)
                    }}
                  >
                    <span>{sortLabels[option]}</span>
                    <span className="tools-directory-popover-check" aria-hidden="true">
                      {sortId === option ? '✓' : ''}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div ref={columnsMenuRef} className="tools-directory-menu-wrap">
            <button
              type="button"
              className={activeMenu === 'columns' ? 'agents-btn tools-directory-icon-btn is-active' : 'agents-btn tools-directory-icon-btn'}
              aria-label={text.columns}
              aria-expanded={activeMenu === 'columns'}
              onClick={() => setActiveMenu((current) => (current === 'columns' ? null : 'columns'))}
            >
              <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false">
                <path d="M3 5h14M3 10h14M3 15h14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
            {activeMenu === 'columns' ? (
              <div className="tools-directory-popover tools-directory-columns-popover" role="menu" aria-label={text.columns}>
                {COLUMN_OPTION_CONFIG.map((option) => {
                  const checked = visibleColumnIds.has(option.id)
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={checked ? 'tools-directory-column-option is-checked' : 'tools-directory-column-option'}
                      onClick={() => toggleColumn(option.id)}
                    >
                      <span className="tools-directory-column-option-box" aria-hidden="true">
                        {checked ? '✓' : ''}
                      </span>
                      <span>{columnLabels[option.id]}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>

          <div className="tools-directory-view-toggle" role="tablist" aria-label={text.viewToggle}>
            <button
              type="button"
              className={viewMode === 'table' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
              role="tab"
              aria-selected={viewMode === 'table'}
              onClick={() => setViewMode('table')}
              title={text.tableView}
            >
              ☰
            </button>
            <button
              type="button"
              className={viewMode === 'cards' ? 'tools-directory-view-toggle-btn is-active' : 'tools-directory-view-toggle-btn'}
              role="tab"
              aria-selected={viewMode === 'cards'}
              onClick={() => setViewMode('cards')}
              title={text.cardsView}
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <section className="tools-directory-table-shell" aria-label={text.tableLabel}>
          <div className="tools-directory-table-head" style={{ gridTemplateColumns: tableTemplate }}>
            <div className="tools-directory-table-cell tools-directory-table-cell--checkbox">
              <button
                type="button"
                className={
                  allVisibleSelected
                    ? 'tools-directory-select-box is-checked'
                    : partiallySelected
                      ? 'tools-directory-select-box is-indeterminate'
                      : 'tools-directory-select-box'
                }
                aria-label={allVisibleSelected ? text.deselectAllList : text.selectAll}
                aria-pressed={allVisibleSelected}
                onClick={toggleSelectAllVisible}
              >
                {allVisibleSelected ? '✓' : partiallySelected ? '−' : ''}
              </button>
            </div>
            <div className="tools-directory-table-cell tools-directory-table-cell--name">{text.name}</div>
            {visibleColumns.map((column) => (
              <div key={column.id} className={`tools-directory-table-cell tools-directory-table-cell--${column.id}`}>
                {column.label}
              </div>
            ))}
          </div>

          <div className="tools-directory-table-body">
            {filteredItems.length > 0 ? (
              paginatedItems.map((item) => (
                <article
                  key={item.id}
                  className={selectedToolId === item.id ? 'tools-directory-row is-active' : 'tools-directory-row'}
                  style={{ gridTemplateColumns: tableTemplate }}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleSelectTool(item)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    handleSelectTool(item)
                  }}
                >
                  <div className="tools-directory-table-cell tools-directory-table-cell--checkbox">
                    <button
                      type="button"
                      className={selectedToolIds.has(item.id) ? 'tools-directory-select-box is-checked' : 'tools-directory-select-box'}
                      aria-label={
                        selectedToolIds.has(item.id)
                          ? locale === 'zh'
                            ? `取消勾选 ${item.name}`
                            : `Unselect ${item.name}`
                          : locale === 'zh'
                            ? `勾选 ${item.name}`
                            : `Select ${item.name}`
                      }
                      aria-pressed={selectedToolIds.has(item.id)}
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleToolSelection(item.id)
                      }}
                    >
                      {selectedToolIds.has(item.id) ? '✓' : ''}
                    </button>
                  </div>
                  <div className="tools-directory-table-cell tools-directory-table-cell--name">
                    <div className="tools-directory-row-title-wrap">
                      <ToolDirectoryAvatar item={item} />
                      <div>
                        <div className="tools-directory-row-title">{item.name}</div>
                      </div>
                    </div>
                  </div>
                  {visibleColumns.map((column) => (
                    <div key={column.id} className={`tools-directory-table-cell tools-directory-table-cell--${column.id}`}>
                      {renderCell(item, column.id)}
                    </div>
                  ))}
                </article>
              ))
            ) : (
              <div className="tools-directory-empty">{text.empty}</div>
            )}
          </div>
        </section>
      ) : (
        <section className="agents-grid" aria-label={text.cardsLabel}>
          {filteredItems.length > 0 ? (
            paginatedItems.map((item) => (
              <article
                key={item.id}
                className={
                  [
                    'agent-card tools-directory-record-card',
                    selectedToolId === item.id ? 'is-active' : '',
                    openCardMenuToolId === item.id ? 'tools-directory-record-card--menu-open' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                role="button"
                tabIndex={0}
                onClick={(event) => {
                  if ((event.target as HTMLElement).closest('.agent-card-more-wrap')) return
                  handleSelectTool(item)
                }}
                onKeyDown={(event) => {
                  if (event.key !== 'Enter' && event.key !== ' ') return
                  event.preventDefault()
                  handleSelectTool(item)
                }}
              >
                <div
                  className="agent-card-more-wrap tools-directory-record-card-more-wrap"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="agent-card-more"
                    aria-label={text.cardMoreActions}
                    aria-haspopup="menu"
                    aria-expanded={openCardMenuToolId === item.id}
                    onClick={(event) => {
                      event.stopPropagation()
                      setOpenCardMenuToolId((current) => (current === item.id ? null : item.id))
                    }}
                  >
                    ⋮
                  </button>
                  <div
                    className={
                      openCardMenuToolId === item.id
                        ? 'agent-card-menu tools-directory-record-card-menu is-open'
                        : 'agent-card-menu tools-directory-record-card-menu'
                    }
                    role="menu"
                    aria-label={text.cardMoreActions}
                    onMouseDown={(event) => event.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="agent-card-menu-item"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation()
                        setOpenCardMenuToolId(null)
                        handleSelectTool(item)
                      }}
                    >
                      {text.cardEdit}
                    </button>
                    <button
                      type="button"
                      className="agent-card-menu-item is-danger"
                      role="menuitem"
                      onClick={(event) => {
                        event.stopPropagation()
                        handleDeleteTool(item)
                      }}
                    >
                      {text.delete}
                    </button>
                  </div>
                </div>
                <ToolDirectoryAvatar item={item} />
                <div className="agent-card-name">{item.name}</div>
                <div className="agent-card-desc">{item.description}</div>
                <div className="agent-card-footer">
                  <div className="agent-card-meta">{formatToolDateLabel(item.lastModifiedAt, locale)}</div>
                  <div className="agent-card-tag">{getToolCardTag(item, locale)}</div>
                </div>
              </article>
            ))
          ) : (
            <div className="tools-directory-empty">{text.empty}</div>
          )}
        </section>
      )}

      {filteredItems.length > 0 ? (
        <nav className="tools-directory-pagination" aria-label={text.paginationLabel}>
          <button
            type="button"
            className="tools-directory-pagination-btn"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            {text.previousPage}
          </button>
          <div className="tools-directory-pagination-pages">
            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1
              return (
                <button
                  key={page}
                  type="button"
                  aria-current={page === currentPage ? 'page' : undefined}
                  className={
                    page === currentPage
                      ? 'tools-directory-pagination-page is-active'
                      : 'tools-directory-pagination-page'
                  }
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            })}
          </div>
          <div className="tools-directory-pagination-summary">
            {text.pageSummary.replace('{current}', String(currentPage)).replace('{total}', String(totalPages))}
          </div>
          <button
            type="button"
            className="tools-directory-pagination-btn"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            {text.nextPage}
          </button>
        </nav>
      ) : null}

      {selectedCount > 0 ? (
        <div className="tools-directory-bulk-bar" role="region" aria-label={text.bulkLabel}>
          <div className="tools-directory-bulk-bar-head">
            <strong>{text.selectedCount.replace('{count}', String(selectedCount))}</strong>
            <button
              type="button"
              className="tools-directory-bulk-close"
              aria-label={locale === 'zh' ? '关闭批量操作条' : 'Close bulk actions'}
              onClick={clearSelection}
            >
              ×
            </button>
          </div>
          <div className="tools-directory-bulk-warning">
            <span className="tools-directory-bulk-warning-icon" aria-hidden="true">
              ⚠
            </span>
            <div>
              <div className="tools-directory-bulk-warning-title">{text.bulkTitle}</div>
              <div className="tools-directory-bulk-warning-text">{text.bulkText}</div>
              {selectedAgentNames.length > 0 ? (
                <div className="tools-directory-bulk-agent-row" aria-label={locale === 'zh' ? '关联 Agent 名称' : 'Related agent names'}>
                  {selectedAgentNames.map((agentName) => (
                    <span key={agentName} className="tools-directory-bulk-agent-name" title={agentName}>
                      {agentName}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          <button type="button" className="tools-directory-bulk-delete" onClick={handleDeleteSelected}>
            <span className="tools-directory-trash-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" focusable="false">
                <path
                  d="M4.5 7.5h15M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5m-7 0V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span>{text.delete}</span>
          </button>
          <button type="button" className="tools-directory-bulk-clear" onClick={clearSelection}>
            {text.clearSelection}
          </button>
        </div>
      ) : null}
      <input
        ref={jsonImportInputRef}
        type="file"
        accept=".json,application/json"
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleJsonImportChange}
      />
      {activeToolConfig ? (
        <div className="tools-directory-config-modal-layer" role="presentation">
          <button
            type="button"
            className="tools-directory-config-modal-backdrop"
            aria-label={text.close}
            onClick={closeToolConfigModal}
          />
          <section className="tools-directory-config-panel tools-directory-config-modal-panel" aria-label={text.toolConfigTitle}>
            <div className="tools-directory-config-panel-head">
              <div>
                <div className="tools-directory-config-panel-title">{text.toolConfigTitle}</div>
                <div className="tools-directory-config-panel-subtitle">
                  {isCreatingToolConfig
                    ? text.toolConfigCreateSubtitle
                    : `${text.toolConfigSubtitle} ${selectedToolItem?.name ?? ''}`}
                </div>
              </div>
              <div className="tools-directory-config-panel-actions">
                <button type="button" className="tools-directory-config-action-btn" onClick={handleSaveAsTemplate}>
                  {text.saveAsTemplate}
                </button>
                <button
                  type="button"
                  className={isExportingToolConfig ? 'tools-directory-config-export-btn is-loading' : 'tools-directory-config-export-btn'}
                  aria-label={isExportingToolConfig ? text.exportingConfig : text.exportConfig}
                  title={isExportingToolConfig ? text.exportingConfig : text.exportConfig}
                  disabled={isExportingToolConfig}
                  onClick={handleExportSelectedToolConfig}
                >
                  {isExportingToolConfig ? (
                    <span className="tools-directory-config-inline-spinner" aria-hidden="true" />
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                      <path
                        d="M12 4v10M8 10l4 4 4-4M5 18h14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="tools-directory-config-panel-body">
              <label className="tools-directory-config-field">
                <RequiredLabel text={text.toolConfigName} />
                <input
                  value={activeToolConfig.toolName}
                  placeholder={text.toolConfigNamePlaceholder}
                  onChange={(event) =>
                    updateActiveToolConfig((current) => ({
                      ...current,
                      toolName: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="tools-directory-config-field">
                <RequiredLabel text={text.toolConfigDescription} />
                <textarea
                  value={activeToolConfig.toolDescription}
                  placeholder={text.toolConfigDescriptionPlaceholder}
                  rows={4}
                  onChange={(event) =>
                    updateActiveToolConfig((current) => ({
                      ...current,
                      toolDescription: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="tools-directory-config-field">
                <span>{text.toolConfigIconSource}</span>
                <input
                  value={activeToolConfig.toolIconSource}
                  placeholder={text.toolConfigIconPlaceholder}
                  onChange={(event) =>
                    updateActiveToolConfig((current) => ({
                      ...current,
                      toolIconSource: event.target.value,
                    }))
                  }
                />
              </label>

              <section className="tools-directory-config-section">
                <div className="tools-directory-config-section-head">
                  <span>{text.inputSchemaTitle}</span>
                  <div className="tools-directory-config-section-actions">
                    <button type="button" className="tools-directory-config-action-btn" onClick={handlePasteToolConfigSchema}>
                      {text.pasteJson}
                    </button>
                    <button type="button" className="tools-directory-config-action-btn" onClick={handleAddToolConfigSchemaRow}>
                      ＋ {text.addItem}
                    </button>
                  </div>
                </div>
                <div className="tools-directory-config-schema-table">
                  <div className="tools-directory-config-schema-head">
                    <span>{text.inputSchemaProperty}</span>
                    <span>{text.inputSchemaType}</span>
                    <span>{text.inputSchemaDescription}</span>
                    <span>{text.inputSchemaRequired}</span>
                    <span>{text.schemaActions}</span>
                  </div>
                  <div className="tools-directory-config-schema-body">
                    {activeToolConfig.inputSchemaRows.length > 0 ? (
                      activeToolConfig.inputSchemaRows.map((row) => (
                        <div key={row.id} className="tools-directory-config-schema-row">
                          <input
                            value={row.property}
                            placeholder={text.inputSchemaProperty}
                            onChange={(event) =>
                              updateActiveToolConfig((current) => ({
                                ...current,
                                inputSchemaRows: current.inputSchemaRows.map((item) =>
                                  item.id === row.id ? { ...item, property: event.target.value } : item,
                                ),
                              }))
                            }
                          />
                          <input
                            value={row.type}
                            placeholder={text.inputSchemaType}
                            onChange={(event) =>
                              updateActiveToolConfig((current) => ({
                                ...current,
                                inputSchemaRows: current.inputSchemaRows.map((item) =>
                                  item.id === row.id ? { ...item, type: event.target.value } : item,
                                ),
                              }))
                            }
                          />
                          <input
                            value={row.description}
                            placeholder={text.inputSchemaDescription}
                            onChange={(event) =>
                              updateActiveToolConfig((current) => ({
                                ...current,
                                inputSchemaRows: current.inputSchemaRows.map((item) =>
                                  item.id === row.id ? { ...item, description: event.target.value } : item,
                                ),
                              }))
                            }
                          />
                          <label className="tools-directory-config-required-box">
                            <input
                              type="checkbox"
                              checked={row.required}
                              onChange={(event) =>
                                updateActiveToolConfig((current) => ({
                                  ...current,
                                  inputSchemaRows: current.inputSchemaRows.map((item) =>
                                    item.id === row.id ? { ...item, required: event.target.checked } : item,
                                  ),
                                }))
                              }
                            />
                          </label>
                          <button
                            type="button"
                            className="tools-directory-config-row-delete"
                            aria-label={text.schemaDelete}
                            title={text.schemaDelete}
                            onClick={() => handleDeleteToolConfigSchemaRow(row.id)}
                          >
                            <span className="tools-directory-trash-icon" aria-hidden="true">
                              <svg viewBox="0 0 24 24" focusable="false">
                                <path
                                  d="M4.5 7.5h15M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5m-7 0V18a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path d="M10 11v5M14 11v5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                              </svg>
                            </span>
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="tools-directory-config-schema-empty">{text.inputSchemaEmpty}</div>
                    )}
                  </div>
                </div>
              </section>

              <section className="tools-directory-config-section">
                <div className="tools-directory-config-section-head">
                  <span>{text.javascriptFunctionTitle}</span>
                  <div className="tools-directory-config-section-actions">
                    <button
                      type="button"
                      className="tools-directory-config-link-btn"
                      onClick={() => {
                        updateActiveToolConfig((current) => ({
                          ...current,
                          javascriptFunction: TOOL_FUNCTION_GUIDE,
                        }))
                        showToolNotice(text.functionGuideLoaded, text.functionGuideLoadedSub)
                      }}
                    >
                      {text.howToUseFunction}
                    </button>
                    <button
                      type="button"
                      className="tools-directory-config-action-btn"
                      onClick={() => {
                        updateActiveToolConfig((current) => ({
                          ...current,
                          javascriptFunction: TOOL_FUNCTION_EXAMPLE,
                        }))
                        showToolNotice(text.functionExampleLoaded, text.functionExampleLoadedSub)
                      }}
                    >
                      {text.seeExample}
                    </button>
                  </div>
                </div>
                <textarea
                  className="tools-directory-config-code"
                  value={activeToolConfig.javascriptFunction}
                  rows={16}
                  onChange={(event) =>
                    updateActiveToolConfig((current) => ({
                      ...current,
                      javascriptFunction: event.target.value,
                    }))
                  }
                />
              </section>
            </div>
            <div className="tools-directory-config-panel-footer">
              <div className="tools-directory-config-panel-footer-actions">
                <button
                  type="button"
                  className="agents-btn tools-directory-config-delete-btn"
                  disabled={isSavingToolConfig}
                  onClick={handleDeleteSelectedTool}
                >
                  {text.deleteTool}
                </button>
                {canPublishSectionVersion && !creatingToolDraft ? (
                  <button
                    type="button"
                    className="agents-btn agents-btn-secondary"
                    disabled={isSavingToolConfig}
                    onClick={() => setToolVersionModalOpen(true)}
                  >
                    {tcsT(locale, 'sectionVersionPublishBtn')}
                  </button>
                ) : null}
                <button
                  type="button"
                  className={isSavingToolConfig ? 'agents-btn agents-btn-primary tools-directory-config-save-btn is-saving' : 'agents-btn agents-btn-primary tools-directory-config-save-btn'}
                  disabled={!canSaveSelectedToolConfig || isSavingToolConfig}
                  onClick={handleSaveSelectedToolConfig}
                >
                  {isSavingToolConfig ? <span className="tools-directory-config-save-spinner" aria-hidden="true" /> : null}
                  <span>{isSavingToolConfig ? text.savingConfig : text.saveConfig}</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
      {toolVersionModalOpen && selectedToolItem ? (
        <SectionIterationVersionModal
          open
          locale={locale}
          sectionType="tool"
          sectionId={selectedToolItem.id}
          sectionName={activeToolConfig?.toolName.trim() || selectedToolItem.name}
          onClose={() => setToolVersionModalOpen(false)}
          onConfirm={completeToolVersionPublish}
        />
      ) : null}
      {createToolModalStep ? (
        <div className="tools-directory-create-modal-layer" role="presentation">
          <button
            type="button"
            className="tools-directory-create-modal-backdrop"
            aria-label={text.close}
            onClick={closeCreateToolModal}
          />
          {renderCreateToolModalContent()}
        </div>
      ) : null}
      {isMcpVerifyModalOpen ? (
        <div className="tools-directory-mcp-verify-layer" role="presentation">
          <button
            type="button"
            className="tools-directory-create-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsMcpVerifyModalOpen(false)}
          />
          <div className="tools-directory-mcp-verify-panel" role="dialog" aria-modal="true" aria-label={text.mcpVerifyTitle}>
            <button
              type="button"
              className="tools-directory-create-modal-close"
              aria-label={text.close}
              onClick={() => setIsMcpVerifyModalOpen(false)}
            >
              ×
            </button>
            <h3 className="tools-directory-mcp-verify-title">{text.mcpVerifyTitle}</h3>
            <p className="tools-directory-mcp-verify-subtitle">{text.mcpVerifySubtitle}</p>
            <input
              className="tools-directory-mcp-verify-input"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={mcpVerifyCode}
              placeholder={text.mcpVerifyPlaceholder}
              onChange={(event) => setMcpVerifyCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            />
            <button
              type="button"
              className={
                isMcpVerifySubmitting
                  ? 'agents-btn agents-btn-primary tools-directory-mcp-verify-submit is-submitting'
                  : 'agents-btn agents-btn-primary tools-directory-mcp-verify-submit'
              }
              disabled={mcpVerifyCode.length !== 6 || isMcpVerifySubmitting}
              onClick={handleSubmitMcpVerifyCode}
            >
              {isMcpVerifySubmitting ? text.mcpVerifySubmitting : text.mcpVerifySubmit}
            </button>
          </div>
        </div>
      ) : null}

      {toolNoticeToast
        ? createPortal(
            <div className="agents-publish-success-toast" role="status" aria-live="polite">
              <span className="agents-publish-success-toast__icon" aria-hidden="true">
                ✓
              </span>
              <div className="agents-publish-success-toast__text">
                <strong className="agents-publish-success-toast__title">{toolNoticeToast.title}</strong>
                {toolNoticeToast.sub ? (
                  <span className="agents-publish-success-toast__sub">{toolNoticeToast.sub}</span>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
