import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, '../src/App.css');
let css = fs.readFileSync(cssPath, 'utf8');

const EXCLUDE_SEL =
  /(?:^|[\s,>+~])(?:button\b|\.[\w-]*(?:btn|button)\b)|(?:btn|button|icon-btn|sidebar-toggle|composer-send|composer-voice|feature-chip|onboard-pill|toolbar-icon|toolbar-primary|modal-close|popover-close|verify-close|card-delete|defaults-remove|chat-back|ai-toggle|main-report|main-restart|plugin-connect|collect-form-skip|collect-form-submit|collect-input-continue|instructions-expand|joyce-close|experience-send|experience-top-tab|toast__close|filter-btn|fold-btn|ghost-btn|primary-btn|secondary-btn|kickoff-aside-btn|schema-add|record-create|task-button|board-add|agents-view|columns-popover__add|publish-app-modal__close|create-scenario-modal__close|scheduler-modal-close|workflow-toolbar-primary|add-field-popover-close|plugin-status|report-status|step-num|step-ic|icon-tile|user-avatar|handoff-avatar|panel-avatar|overview-avatar|agent-node-icon|showcase-step-icon|report-section-head\s*>|experience-sidebar-kicker)/i;

const INCLUDE_SEL =
  /(?:^|[\s,>+~])(?:input\b|select\b|textarea\b)|(?:-|\.)(?:[\w-]*(?:input|select|combobox|datetime-local|search-input|drawer-input|drawer-select|runs-input|collect-input-text|manual-input|path-rules-input|interval-input|usage-input|data-input-combo|combobox-row|combobox-input|combobox-option|hitl-select-trigger|reviewer-select|reviewer-pick-input|reviewer-timeout-input|approval-value-set-key|add-field-select|repeat-interval-input|scheduled-detail|trigger-drawer-search|branch-add-step-search|insert-popover-search-input|agents-search-input|manager-agent-select|manager-agent-usage|single-agent-select|single-agent-search|single-agent-preview|trigger-manual-input|branch-path-rules|date-pick-offset-input|date-pick-dropdown|date-pick-sign-select|date-pick-days-combo|joyce-experience-composer-input|joyce-experience-field|plan-detail-quiz-custom-input|workflow-tool-search|analytics-entity-select|analytics-range-select|analytics-range-date|mail-picker-trigger|email-send-as-option|path-rules-selected-preview|selected-preview-select|selected-preview-chip|notice-recipient|add-field-type-trigger|add-field-name|branch-select|collect-drawer-select|trigger-select|popover-search|entity-select|usage-input|preview-input|manual-config-drawer-input|manual-config-drawer-select|manual-config-drawer-textarea|manual-config-add-field|hitl-op-config-textarea))/i;

const ROW_ALIGN_SEL =
  /(?:name-row|req--pill-row|combobox-row|data-input-combo|scheduled-detail-name-row|approval-inline-field-wrap|mail-picker-trigger|path-rules-select-trigger|path-rules-add-rule-row|hitl-op-config-notice-recipient-chips|textarea--send-preview|textarea--notice-recipients)/i;

function isFormRule(selector) {
  const s = selector.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!s || s.startsWith('@')) return false;
  if (EXCLUDE_SEL.test(s)) return false;
  if (INCLUDE_SEL.test(s)) return true;
  if (ROW_ALIGN_SEL.test(s) && /\b(?:height|min-height|max-height|line-height)\s*:\s*32px\b/.test(s)) {
    return true;
  }
  return false;
}

function patchBody(body) {
  let out = body;
  const had32 =
    /\b(height|min-height|max-height)\s*:\s*32px\b/.test(body) ||
    /\bline-height\s*:\s*32px\b/.test(body);
  if (!had32) return body;

  out = out.replace(/\b(height|min-height|max-height)\s*:\s*32px\b/g, '$1: 38px');
  out = out.replace(/\bline-height\s*:\s*32px\b/g, 'line-height: 36px');
  return out;
}

let changes = 0;
const changed = [];

function processRules(text) {
  return text.replace(/([^{}@/]+)\{([^{}]*)\}/g, (full, sel, body) => {
    if (!isFormRule(sel)) return full;
    const newBody = patchBody(body);
    if (newBody !== body) {
      changes++;
      changed.push(sel.trim().slice(0, 100));
      return sel + '{' + newBody + '}';
    }
    return full;
  });
}

css = processRules(css);
css = css.replace(/@media[^{]+\{([\s\S]*?)\n\}/g, (mediaFull, inner) => {
  return mediaFull.replace(inner, processRules(inner));
});

fs.writeFileSync(cssPath, css);
console.log('Form control rules updated:', changes);

const remain = [];
css.replace(/([^{}@/]+)\{([^{}]*)\}/g, (full, sel, body) => {
  if (!isFormRule(sel)) return full;
  if (/\b(height|min-height|max-height)\s*:\s*32px\b/.test(body)) {
    remain.push(sel.trim().slice(0, 120));
  }
  return full;
});
console.log('Remaining form 32px:', remain.length);
if (remain.length) console.log(remain.join('\n'));
