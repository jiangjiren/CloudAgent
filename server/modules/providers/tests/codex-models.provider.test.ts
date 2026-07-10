import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildCodexModelsDefinition,
  CODEX_FALLBACK_MODELS,
} from '@/modules/providers/list/codex/codex-models.provider.js';

test('Codex model catalog only exposes supported GPT-5.6 models', () => {
  const models = buildCodexModelsDefinition([
    { slug: 'gpt-5.5', display_name: 'GPT-5.5', priority: 0 },
    { slug: 'gpt-5.6-luna', display_name: 'GPT-5.6-Luna', priority: 3 },
    { slug: 'gpt-5.6-terra', display_name: 'GPT-5.6-Terra', priority: 2 },
    { slug: 'gpt-5.6-sol', display_name: 'GPT-5.6-Sol', priority: 1 },
    { slug: 'gpt-5.6-preview', display_name: 'GPT-5.6 Preview', visibility: 'hidden', priority: 0 },
  ]);

  assert.deepEqual(models, {
    OPTIONS: [
      { value: 'gpt-5.6-sol', label: 'GPT-5.6-Sol', description: undefined },
      { value: 'gpt-5.6-terra', label: 'GPT-5.6-Terra', description: undefined },
      { value: 'gpt-5.6-luna', label: 'GPT-5.6-Luna', description: undefined },
    ],
    DEFAULT: 'gpt-5.6-sol',
  });
});

test('Codex model catalog falls back to GPT-5.6 when no supported cached model exists', () => {
  const models = buildCodexModelsDefinition([
    { slug: 'gpt-5.5', display_name: 'GPT-5.5', priority: 0 },
  ]);

  assert.deepEqual(models, CODEX_FALLBACK_MODELS);
});
