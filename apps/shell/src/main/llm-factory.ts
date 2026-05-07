// LlmFactory — produce a configured LangChain ChatModel based on the
// current SettingsStore state. Phase 2 supports Anthropic only; other
// providers slot in here as we add them.

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ProviderId, SettingsStore } from './settings-store';

export type LlmFactoryError =
  | { kind: 'no-key'; provider: ProviderId }
  | { kind: 'unsupported-provider'; provider: ProviderId };

export type LlmFactoryResult =
  | { ok: true; model: BaseChatModel; provider: ProviderId; modelId: string }
  | { ok: false; error: LlmFactoryError };

export async function buildActiveModel(settings: SettingsStore): Promise<LlmFactoryResult> {
  const provider = await settings.getActiveProvider();
  const modelId = await settings.getSelectedModel();

  if (provider === 'anthropic') {
    const apiKey = await settings.getApiKey('anthropic');
    if (!apiKey) return { ok: false, error: { kind: 'no-key', provider } };
    const model = new ChatAnthropic({
      apiKey,
      model: modelId,
      streaming: true,
    });
    return { ok: true, model, provider, modelId };
  }

  if (provider === 'openai') {
    const apiKey = await settings.getApiKey('openai');
    if (!apiKey) return { ok: false, error: { kind: 'no-key', provider } };
    const model = new ChatOpenAI({
      apiKey,
      model: modelId,
      streaming: true,
    });
    return { ok: true, model, provider, modelId };
  }

  // ollama / qwen-local arrive in subsequent slices.
  return { ok: false, error: { kind: 'unsupported-provider', provider } };
}
