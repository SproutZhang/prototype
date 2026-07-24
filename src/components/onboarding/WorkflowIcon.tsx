import type { OnboardingNodeIcon } from '../../data/onboarding-workflow'

export function WorkflowIcon({ icon }: { icon: OnboardingNodeIcon }) {
  switch (icon) {
    case 'brain':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M9.3 4.8a3.2 3.2 0 0 0-4.7 2.8 3.2 3.2 0 0 0 1.1 2.4 3.5 3.5 0 0 0-.8 2.2 3.2 3.2 0 0 0 2 3v.4a3.1 3.1 0 0 0 5.1 2.4 3.1 3.1 0 0 0 5.1-2.4v-.4a3.2 3.2 0 0 0 2-3 3.5 3.5 0 0 0-.8-2.2 3.2 3.2 0 0 0 1.1-2.4 3.2 3.2 0 0 0-4.7-2.8A3.5 3.5 0 0 0 12 3.4a3.5 3.5 0 0 0-2.7 1.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 10.2c.6.6.9 1.3.9 2.2v5M15 10.2c-.6.6-.9 1.3-.9 2.2v5M9.2 7.8c.9.3 1.7.8 2.2 1.6M14.8 7.8c-.9.3-1.7.8-2.2 1.6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'monitor':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="11" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.9" />
          <path d="M9 19h6M12 16v3" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
        </svg>
      )
    case 'file':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8 4.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V6A1.5 1.5 0 0 1 8.5 4.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M14 4.8V9h4M9.5 12.5h5M9.5 15.5h5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'key':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8.5" cy="11.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path
            d="M12 11.5h8M16 11.5v3M19 11.5v2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'bell':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 10a5 5 0 1 1 10 0v3.3l1.2 2a1 1 0 0 1-.9 1.5H6.7a1 1 0 0 1-.9-1.5l1.2-2V10Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path d="M10 18.2a2.3 2.3 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'sparkles':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 3.8l1.5 4.7 4.7 1.5-4.7 1.5-1.5 4.7-1.5-4.7-4.7-1.5 4.7-1.5L12 3.8ZM18.5 15l.8 2.5 2.5.8-2.5.8-.8 2.5-.8-2.5-2.5-.8 2.5-.8.8-2.5Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'user-input':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 5.2a3.2 3.2 0 1 1 0 6.4 3.2 3.2 0 0 1 0-6.4ZM6.8 18.5a5.2 5.2 0 0 1 10.4 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M18.4 7.2h2.2M19.5 6.1v2.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'orchestrator':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.2" y="5" width="5.4" height="4.8" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="14.4" y="5" width="5.4" height="4.8" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <rect x="9.3" y="14.2" width="5.4" height="4.8" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 9.8v4.4M9.6 7.4h4.8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )
    case 'loop':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7.2 8.3H4.8V5.9M16.8 15.7h2.4v2.4M6.3 17.4a6.4 6.4 0 0 0 10.1-1.1M17.7 6.6A6.4 6.4 0 0 0 7.6 7.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
    case 'subflow':
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M8.4 7.2H6.2A2.2 2.2 0 0 0 4 9.4v8.4A2.2 2.2 0 0 0 6.2 20h8.4a2.2 2.2 0 0 0 2.2-2.2v-2.2M15.6 4H18a2 2 0 0 1 2 2v2.4M10.2 13.8l9.2-9.2M15 4h4.4v4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )
  }
}
