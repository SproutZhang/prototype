type TcsSectionHintIconProps = {
  hintId: string
  hint: string
  ariaLabel: string
}

export function TcsSectionHintIcon({ hintId, hint, ariaLabel }: TcsSectionHintIconProps) {
  return (
    <span className="tcs-section-hint-icon-wrap">
      <button
        type="button"
        className="tcs-section-hint-icon"
        aria-label={ariaLabel}
        aria-describedby={hintId}
      >
        <span aria-hidden="true">i</span>
      </button>
      <span id={hintId} role="tooltip" className="tcs-section-hint-popover">
        {hint}
      </span>
    </span>
  )
}
