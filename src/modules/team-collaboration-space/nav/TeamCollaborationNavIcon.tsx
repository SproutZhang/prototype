import type { TeamCollaborationNavSection } from '../types'

type TeamCollaborationNavIconProps = {
  section: TeamCollaborationNavSection
}

export function TeamCollaborationNavIcon({ section }: TeamCollaborationNavIconProps) {
  if (section === 'project-space') {
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
          d="M9 5v14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M12 10h5.5M12 13.5h4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

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
