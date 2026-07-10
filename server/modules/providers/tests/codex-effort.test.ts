import assert from 'node:assert/strict';
import test from 'node:test';

import {
  getCodexReasoningEffortLevels,
  isCodexReasoningEffortSupported,
} from '../../../../shared/codex-effort.js';

test('GPT-5.6 Codex reasoning levels vary by model', () => {
  assert.deepEqual(getCodexReasoningEffortLevels('gpt-5.6-sol'), [
    'low', 'medium', 'high', 'xhigh', 'max', 'ultra',
  ]);
  assert.deepEqual(getCodexReasoningEffortLevels('gpt-5.6-terra'), [
    'low', 'medium', 'high', 'xhigh', 'max', 'ultra',
  ]);
  assert.deepEqual(getCodexReasoningEffortLevels('gpt-5.6-luna'), [
    'low', 'medium', 'high', 'xhigh', 'max',
  ]);
});

test('GPT-5.6 Codex reasoning validation rejects unsupported levels', () => {
  assert.equal(isCodexReasoningEffortSupported('gpt-5.6-sol', 'ultra'), true);
  assert.equal(isCodexReasoningEffortSupported('gpt-5.6-luna', 'ultra'), false);
  assert.equal(isCodexReasoningEffortSupported('gpt-5.6-terra', 'minimal'), false);
  assert.equal(isCodexReasoningEffortSupported('gpt-5.5', 'high'), false);
});
