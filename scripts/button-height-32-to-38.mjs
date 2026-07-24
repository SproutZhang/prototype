import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, '../src/App.css');
let css = fs.readFileSync(cssPath, 'utf8');

/** Never buttons — form controls and decorative 32px tiles */
const FORM_SEL =
  /(?:^|[\s,>+~])(?:input\b|select\b|textarea\b)|(?:-|\.)(?:[\w-]*(?:input-text|input-select|kickoff-input|search-input|name-input|drawer-input|drawer-select|combobox-row|combobox-option|manual-input-select|manual-input-txt|runs-input|path-rules-input|interval-input|datetime-local|entity-select|range-select|range-date-input|usage-input|preview-input|trigger-select|hitl-select|reviewer-select|reviewer-pick-input|approval-value-set|repeat-interval-input|add-field-select|add-field-name|notice-recipient|mail-picker-trigger|popover-search|branch-select|collect-drawer-select|tool-search|composer-input|experience-composer-input|experience-field|quiz-custom-input|collect-input-text|plugin-status|report-status|step-num|step-ic|icon-tile|user-avatar|handoff-avatar|panel-avatar|overview-avatar|agent-node-icon|showcase-step-icon|section-head\s*>|report-section-head))/i;

/** Explicit button-like class names */
const BUTTON_SEL =
  /(?:^|[\s,>+~])(?:button\b)|(?:-|\.)(?:[\w-]*(?:btn|button)\b|feature-chip|composer-send|composer-voice|collect-input-continue|chat-back|ai-toggle|main-report|main-restart|plugin-connect|verify-close|collect-form-skip|collect-form-submit|card-delete|defaults-remove|modal-close|optimize-close|modal__close|toolbar-icon|toolbar-primary|instructions-expand|popover-close|joyce-close|experience-send|experience-top-tab|agents-view|toast__close|popover__add|scheduler-modal-close|kickoff-aside-btn|selected-preview-chip|add-rule-row|manual-config-add-field|publish-app-modal__close|create-scenario-modal__close|columns-popover__add|filter-btn|onboard-pill)/i;

const SQUARE_ICON_SEL =
  /(?:close|delete|expand|toggle|icon|toolbar|board-add|popover-close|modal-close|optimize-close|verify-close|card-delete|defaults-remove|agents-ai-toggle|chat-back|instructions-expand|joyce-close|workflow-joyce-close|composer-send|composer-voice)/i;

function isFormRule(selector) {
  const s = selector.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!s || s.startsWith('@')) return false;
  return FORM_SEL.test(s);
}

function isButtonRule(selector, body) {
  const s = selector.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!s || s.startsWith('@')) return false;
  if (isFormRule(s)) return false;
  if (BUTTON_SEL.test(s)) return true;
  if (
    /\bcursor\s*:\s*pointer\b/.test(body) &&
    /\b(height|min-height|max-height)\s*:\s*32px\b/.test(body)
  ) {
    return true;
  }
  return false;
}

function patchBody(body, selector) {
  let out = body;
  const had32 =
    /\b(height|min-height|max-height)\s*:\s*32px\b/.test(body) ||
    /\bline-height\s*:\s*32px\b/.test(body);
  if (!had32) return body;

  out = out.replace(/\b(height|min-height|max-height)\s*:\s*32px\b/g, '$1: 38px');
  out = out.replace(/\bline-height\s*:\s*32px\b/g, 'line-height: 36px');

  const square =
    SQUARE_ICON_SEL.test(selector) &&
    /\bwidth\s*:\s*32px\b/.test(body) &&
    /\b(height|min-height|max-height)\s*:\s*38px\b/.test(out);
  if (square) {
    out = out.replace(/\bwidth\s*:\s*32px\b/g, 'width: 38px');
  }

  return out;
}

let changes = 0;
const changed = [];

function processRules(text) {
  return text.replace(/([^{}@/]+)\{([^{}]*)\}/g, (full, sel, body) => {
    if (!isButtonRule(sel, body)) return full;
    const newBody = patchBody(body, sel);
    if (newBody !== body) {
      changes++;
      changed.push(sel.trim().slice(0, 120));
      return sel + '{' + newBody + '}';
    }
    return full;
  });
}

css = processRules(css);
css = css.replace(/@media[^{]+\{([\s\S]*?)\n\}/g, (mediaFull, inner) => {
  const patched = processRules(inner);
  return mediaFull.replace(inner, patched);
});

fs.writeFileSync(cssPath, css);
console.log('Button rules updated:', changes);

const remain = [];
css.replace(/([^{}@/]+)\{([^{}]*)\}/g, (full, sel, body) => {
  if (!isButtonRule(sel, body)) return full;
  if (/\b(height|min-height|max-height)\s*:\s*32px\b/.test(body)) {
    remain.push(sel.trim().slice(0, 120));
  }
  return full;
});
console.log('Remaining button 32px:', remain.length);
if (remain.length) console.log(remain.join('\n'));
