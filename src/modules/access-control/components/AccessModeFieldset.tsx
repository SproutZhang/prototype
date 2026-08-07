import type { AppLocale } from '../../../i18n/homeStrings'
import {
  ACCESS_MODE_OPTIONS,
  accessModeHint,
  accessModeHintForChild,
  accessModeLabel,
  acT,
} from '../i18n/strings'
import type { AccessMode } from '../types'

type AccessModeFieldsetProps = {
  locale: AppLocale
  value: AccessMode
  onChange: (mode: AccessMode) => void
  name?: string
  legend?: string
  hintForMode?: (locale: AppLocale, mode: AccessMode) => string
}

export function AccessModeFieldset({
  locale,
  value,
  onChange,
  name = 'ac-access-mode',
  legend,
  hintForMode = accessModeHint,
}: AccessModeFieldsetProps) {
  return (
    <fieldset className="ac-access-mode-fieldset">
      <legend>{legend ?? acT(locale, 'formAccessMode')}</legend>
      <div className="ac-access-mode-list">
        {ACCESS_MODE_OPTIONS.map((mode) => (
          <label key={mode} className="ac-access-mode-option">
            <input
              type="radio"
              name={name}
              value={mode}
              checked={value === mode}
              onChange={() => onChange(mode)}
            />
            <span className="ac-access-mode-option-body">
              <span className="ac-access-mode-option-title">{accessModeLabel(locale, mode)}</span>
              <span className="ac-access-mode-option-hint">{hintForMode(locale, mode)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export { accessModeHintForChild }
