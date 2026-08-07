import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cssPath = path.join(__dirname, '../src/App.css');
let css = fs.readFileSync(cssPath, 'utf8');

const EXCLUDE_SEL =
  /(?:^|[\s,>+~])(?:button\b|\.[\w-]*(?:btn|button)\b)|(?:btn|button|icon-btn|sidebar-toggle|logo\b|nav-item|avatar|(?:^|[-_])ic\b|icon-wrap|icon-svg|close\b|toggle|composer-send|composer-voice|agents-ai-send|exec-verify|exec-modal-close|report-btn|toolbar-btn|toolbar-primary|new-task|icon-btn|runs-send|plugin-ic|card-icon|tail-line|resizer|tool-item|ghost-btn|primary-btn|inline-button|footer-btn|offset-remove|offset-add|date-pick-footer|mention-option|branch-mention|fold-btn|wf-instr-modal|prompt-modal|collect-report-edit|workflow-tab-add|add-step-app-badge|collect-drawer-close|collect-drawer-back|hitl-icon-wrap|newnode-item|handover-avatar|run-actor-avatar|feature-chip|mode-pill|trigger-summary-item|quiz-btn|add-field-footer)/i;

const INCLUDE_SEL =
  /(?:^|[\s,>+~])(?:input\b|select\b|textarea\b)|(?:-|\.)(?:[\w-]*(?:input|select|combobox|datetime-local|search-input|drawer-input|drawer-select|runs-input|collect-input|manual-input|path-rules-input|interval-input|usage-input|data-input-combo|combobox-row|combobox-input|hitl-select-trigger|reviewer-select|reviewer-pick-input|reviewer-timeout-input|approval-value-set-key|add-field-select|repeat-interval-input|scheduled-detail|trigger-drawer-search|branch-add-step-search|insert-popover-search-input|agents-search-input|manager-agent-select|manager-agent-usage|single-agent-select|trigger-manual-input|branch-path-rules|date-pick-offset-input|date-pick-dropdown|date-pick-sign-select|date-pick-value|joyce-experience-employee-row input|joyce-experience-composer-input|experience-composer-input|plan-detail-quiz-custom-input))/i;

const ROW_ALIGN_SEL =
  /(?:name-row|req--pill-row|combobox-row|data-input-combo|scheduled-detail-name-row)/i;

function isFormRule(selector) {
  const s = selector.replace(/\/\*[\s\S]*?\*\//g, '').trim();
  if (!s || s.startsWith('@')) return false;
  if (EXCLUDE_SEL.test(s)) return false;
  if (INCLUDE_SEL.test(s)) return true;
  if (ROW_ALIGN_SEL.test(s) && /min-height/.test(s)) return true;
  return false;
}

function patchBody(body) {
  let out = body;
  out = out.replace(
    /\b(height|min-height|max-height)\s*:\s*(34|36|40)px\b/g,
    '$1: 32px',
  );
  out = out.replace(/\bline-height\s*:\s*34px\b/g, 'line-height: 30px');
  return out;
}

let changes = 0;
const changedSelectors = [];

css = css.replace(/([^{}@/]+)\{([^{}]*)\}/g, (full, sel, body) => {
  if (sel.includes('@') || sel.trim().startsWith('@')) return full;
  if (!isFormRule(sel)) return full;
  const newBody = patchBody(body);
  if (newBody !== body) {
    changes++;
    changedSelectors.push(sel.trim().slice(0, 120));
    return sel + '{' + newBody + '}';
  }
  return full;
});

// @media blocks: re-run inside each block
css = css.replace(/@media[^{]+\{([\s\S]*?)\n\}/g, (mediaFull, inner) => {
  let patched = inner;
  let innerChanges = 0;
  patched = patched.replace(/([^{}]+)\{([^{}]*)\}/g, (full, sel, body) => {
    if (!isFormRule(sel)) return full;
    const newBody = patchBody(body);
    if (newBody !== body) {
      innerChanges++;
      changedSelectors.push('[media] ' + sel.trim().slice(0, 100));
      return sel + '{' + newBody + '}';
    }
    return full;
  });
  if (innerChanges) changes += innerChanges;
  return mediaFull.replace(inner, patched);
});

fs.writeFileSync(cssPath, css);
console.log('Updated rules:', changes);
console.log(changedSelectors.join('\n'));
