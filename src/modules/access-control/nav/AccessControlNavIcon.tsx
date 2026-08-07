import type { AccessControlSection } from '../utils/routing'

type AccessControlNavIconProps = {
  section: AccessControlSection
}

export function AccessControlNavIcon({ section }: AccessControlNavIconProps) {
  if (section === 'workspace') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="3.5" y="4" width="7.5" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <rect x="13" y="4" width="7.5" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <rect x="3.5" y="12.5" width="7.5" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <rect x="13" y="12.5" width="7.5" height="7.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
      </svg>
    )
  }

  if (section === 'users') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="9" cy="8.5" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M3.5 19.5v-1A5.5 5.5 0 0 1 9 13a5.5 5.5 0 0 1 5.5 5.5v1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="9" r="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M14.5 19.5v-.75A4.25 4.25 0 0 1 18.75 14.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (section === 'members') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="8" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M3.5 19.5v-1a5.5 5.5 0 0 1 5.5-5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="16.5" cy="10" r="2.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M13.5 19.5v-.75a4.25 4.25 0 0 1 4.25-4.25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M20 8.5h3M21.5 7v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (section === 'departments') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M4 20V9l8-4 8 4v11"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M9 20v-6h6v6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M9 9h.01M15 9h.01"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.8"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (section === 'roles') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 3 4 7v5c0 4.2 3.2 8.2 8 9.3 4.8-1.1 8-5.1 8-9.3V7l-8-4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M9.5 12.5 11.5 14.5 15 10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (section === 'audit-log') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M6 4h12v16H6V4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M9 8h6M9 12h6M9 16h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M8 4V3M16 4V3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (section === 'work-log') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M12 7v5l3 2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 19h16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  if (section === 'api-keys') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="8" cy="15" r="4.5" fill="none" stroke="currentColor" strokeWidth="2.2" />
        <path
          d="M11.5 12.5 19 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M16 5h3v3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (section === 'model-management') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect
          x="4"
          y="5"
          width="16"
          height="14"
          rx="2"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path
          d="M8 10h8M8 14h5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle cx="17" cy="8" r="2" fill="currentColor" />
      </svg>
    )
  }

  return null
}
