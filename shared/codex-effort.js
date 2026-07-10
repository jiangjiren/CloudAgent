export const CODEX_REASONING_EFFORTS_BY_MODEL = Object.freeze({
  'gpt-5.6-sol': Object.freeze(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']),
  'gpt-5.6-terra': Object.freeze(['low', 'medium', 'high', 'xhigh', 'max', 'ultra']),
  'gpt-5.6-luna': Object.freeze(['low', 'medium', 'high', 'xhigh', 'max']),
});

export const getCodexReasoningEffortLevels = (model) => (
  typeof model === 'string' ? CODEX_REASONING_EFFORTS_BY_MODEL[model] ?? [] : []
);

export const isCodexReasoningEffortSupported = (model, effort) => (
  getCodexReasoningEffortLevels(model).includes(effort)
);
