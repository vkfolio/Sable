// LlmFactory — produce a configured LangChain ChatModel based on the
// current SettingsStore state. Phase 2 supports Anthropic only; other
// providers slot in here as we add them.

import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { ProviderId, SettingsStore } from './settings-store';
import type { LocalModelManager, LocalModelVariantId } from './local-model-manager';
import { QwenLocalChatModel } from './chat-models/qwen-local';

export type LlmFactoryError =
  | { kind: 'no-key'; provider: ProviderId }
  | { kind: 'unsupported-provider'; provider: ProviderId }
  | { kind: 'local-model-missing'; provider: ProviderId; variantId: string };

export type LlmFactoryResult =
  | { ok: true; model: BaseChatModel; provider: ProviderId; modelId: string }
  | { ok: false; error: LlmFactoryError };

export async function buildActiveModel(
  settings: SettingsStore,
  localModels?: LocalModelManager,
): Promise<LlmFactoryResult> {
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

  if (provider === 'qwen-local') {
    if (!localModels) {
      return { ok: false, error: { kind: 'unsupported-provider', provider } };
    }
    const variantId = modelId as LocalModelVariantId;
    const modelPath = await localModels.getReadyPath(variantId);
    if (!modelPath) {
      return {
        ok: false,
        error: { kind: 'local-model-missing', provider, variantId },
      };
    }
    const model = new QwenLocalChatModel({ modelPath });
    return { ok: true, model, provider, modelId };
  }

  // ollama arrives in a subsequent slice.
  return { ok: false, error: { kind: 'unsupported-provider', provider } };
}
