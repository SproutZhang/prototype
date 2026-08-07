type AcSectionHintIconProps = {
  hintId: string
  hint: string
  ariaLabel: string
}

export function AcSectionHintIcon({ hintId, hint, ariaLabel }: AcSectionHintIconProps) {
  return (
    <span className="ac-section-hint-icon-wrap">
      <button
        type="button"
        className="ac-section-hint-icon"
        aria-label={ariaLabel}
        aria-describedby={hintId}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span id={hintId} role="tooltip" className="ac-section-hint-popover">
        {hint}
      </span>
    </span>
  )
}
