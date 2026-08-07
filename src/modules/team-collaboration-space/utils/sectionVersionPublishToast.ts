import type { AppLocale } from '../../../i18n/homeStrings'
import { tcsT } from '../i18n/strings'

let toastTimer: ReturnType<typeof setTimeout> | undefined
let toastElement: HTMLElement | null = null

/** 版本发布成功 · 轻提示（独立于弹窗生命周期） */
export function showSectionVersionPublishSuccessToast(locale: AppLocale): void {
  if (typeof document === 'undefined') return

  if (toastTimer) window.clearTimeout(toastTimer)
  toastElement?.remove()

  const title = tcsT(locale, 'sectionVersionPublishSuccess')
  const sub = tcsT(locale, 'sectionVersionPublishSuccessSub')

  const toast = document.createElement('div')
  toast.className = 'agents-publish-success-toast tcs-success-toast'
  toast.setAttribute('role', 'status')
  toast.setAttribute('aria-live', 'polite')
  toast.innerHTML = `
    <span class="agents-publish-success-toast__icon" aria-hidden="true">✓</span>
    <div class="agents-publish-success-toast__text">
      <strong class="agents-publish-success-toast__title"></strong>
      <span class="agents-publish-success-toast__sub"></span>
    </div>
  `
  const titleEl = toast.querySelector('.agents-publish-success-toast__title')
  const subEl = toast.querySelector('.agents-publish-success-toast__sub')
  if (titleEl) titleEl.textContent = title
  if (subEl) subEl.textContent = sub

  document.body.appendChild(toast)
  toastElement = toast

  toastTimer = window.setTimeout(() => {
    toastTimer = undefined
    toast.remove()
    if (toastElement === toast) toastElement = null
  }, 3200)
}
