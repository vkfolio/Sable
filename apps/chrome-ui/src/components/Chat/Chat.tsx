// Chat — bottom-of-sidebar chat panel. Reduces AG-UI events into a
// scrollable message list with a textarea composer below.
//
// Phase 4 additions:
//  - On send, gather every tab flagged selectedForContext, extract its main
//    content via tabs.extractContent, and prefix the user message with
//    markdown-formatted tab blocks (greedy-by-recency, hard-capped).
//  - The user-facing bubble shows a compact "Used N tabs as context" header
//    rather than dumping the extracted text in the UI.

import { useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useChatStore } from '../../state/chat';
import { useSettingsStore } from '../../state/settings';
import { useTabsStore } from '../../state/tabs';
import { useLocalModelStore } from '../../state/local-model';
import { selectActiveSpace, useSpacesStore } from '../../state/spaces';
import { MessageList } from './MessageList';
import { Composer } from './Composer';
import { ChatEmptyState } from './ChatEmptyState';
import type {
  Citation,
  ChatImageAttachment,
  ImageCitation,
  TextCitation,
  TabState,
} from '../../types';

/** Conservative shared-budget across all selected tab extractions. */
const TAB_CONTEXT_CHAR_BUDGET = 18000;

export function Chat({ onOpenSettings }: { onOpenSettings: () => void }) {
  const activeSpace = useSpacesStore(selectActiveSpace);
  // Conversation id follows active space — switching spaces switches chat
  // history. Falls back to 'default' until spaces have hydrated.
  const conversationId = activeSpace?.conversationId ?? useChatStore.getState().conversationId;
  const messages = useChatStore(useShallow((s) => s.messages));
  const inflight = useChatStore((s) => s.inflight);
  const lastError = useChatStore((s) => s.lastError);
  const activeRunId = useChatStore((s) => s.activeRunId);
  const pushUserMessage = useChatStore((s) => s.pushUserMessage);
  const setActiveRun = useChatStore((s) => s.setActiveRun);

  const activeProvider = useSettingsStore((s) => s.activeProvider);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const providerKeyStatus = useSettingsStore((s) => s.providerKeyStatus);
  const localStatuses = useLocalModelStore(useShallow((s) => s.statuses));

  // The active provider is "ready" when:
  //   - remote provider: API key is set in OS keychain
  //   - qwen-local: the selectedModel variant is downloaded ('ready' state)
  const providerReady =
    activeProvider === 'qwen-local'
      ? localStatuses.some((s) => s.id === selectedModel && s.state === 'ready')
      : !!providerKeyStatus[activeProvider];

  // Manually-selected tabs (Ctrl+click in the strip) plus the active tab's
  // group (every tab sharing the active tab's groupId). Both feed the chat
  // as context.
  const tabsById = useTabsStore((s) => s.tabsById);
  const activeTabId = useTabsStore((s) => s.activeTabId);
  const manualSelectedTabs = useTabsStore(
    useShallow((s) => Array.from(s.tabsById.values()).filter((t) => t.selectedForContext)),
  );

  // When the active tab is part of a group, every other tab sharing that
  // groupId is automatically promoted into the chat context. Switching to a
  // tab outside the group narrows context back to just that tab. The "*[Used
  // N tabs as context]*" indicator on the assistant bubble already reports
  // the resulting count.
  const selectedTabs = useMemo(() => {
    const activeTab = activeTabId ? tabsById.get(activeTabId) : null;
    const activeGroupId = activeTab?.groupId ?? null;
    const seen = new Set<string>();
    const out: TabState[] = [];
    if (activeGroupId) {
      for (const t of tabsById.values()) {
        if (t.groupId === activeGroupId && !seen.has(t.id)) {
          seen.add(t.id);
          out.push(t);
        }
      }
    }
    for (const t of manualSelectedTabs) {
      if (seen.has(t.id)) continue;
      seen.add(t.id);
      out.push(t);
    }
    return out;
  }, [activeTabId, manualSelectedTabs, tabsById]);

  const [composerText, setComposerText] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [excludedTabsNote, setExcludedTabsNote] = useState<string | null>(null);

  // Re-hydrate history every time the conversation id changes (which
  // happens whenever the active space changes).
  useEffect(() => {
    void window.sable.chat
      .getHistory(conversationId)
      .then((h) => useChatStore.getState().hydrate(h));
  }, [conversationId]);

  const handleSubmit = async () => {
    const userText = composerText.trim();
    if (!providerReady || inflight) return;
    if (!userText && citations.length === 0 && selectedTabs.length === 0) return;

    setExcludedTabsNote(null);
    setExtracting(selectedTabs.length > 0);

    let tabContextBlock = '';
    let usedTabsCount = 0;
    let excludedCount = 0;
    if (selectedTabs.length > 0) {
      try {
        const result = await gatherTabContext(selectedTabs);
        tabContextBlock = result.formatted;
        usedTabsCount = result.usedCount;
        excludedCount = result.excludedCount;
        if (excludedCount > 0) {
          setExcludedTabsNote(
            `${excludedCount} tab${excludedCount === 1 ? '' : 's'} excluded — context budget hit. Click to swap which tabs are selected.`,
          );
        }
      } finally {
        setExtracting(false);
      }
    }

    const textCitations = citations.filter((c): c is TextCitation => c.kind === 'text');
    const imageCitations = citations.filter((c): c is ImageCitation => c.kind === 'image');

    const headForLlm = tabContextBlock + formatTextCitations(textCitations);
    const llmText =
      headForLlm + (userText || (imageCitations.length > 0 ? 'What do you see?' : '(see context above)'));

    const images: ChatImageAttachment[] = imageCitations.map((c) => ({
      mimeType: c.mimeType,
      base64: c.base64,
      sourceUrl: c.sourceUrl,
    }));

    // UI bubble: compact summary instead of dumping all extracted text.
    const headForUi = renderUiHeader(usedTabsCount) + formatTextCitations(textCitations);
    const uiText = renderUserBubble(headForUi, userText, imageCitations);
    pushUserMessage(uiText);

    setComposerText('');
    setCitations([]);

    try {
      const runId = await window.sable.chat.send(conversationId, { text: llmText, images });
      setActiveRun(runId);
    } catch (err) {
      console.error('chat send failed', err);
    }
  };

  const handleStop = () => {
    if (activeRunId) void window.sable.chat.stop(activeRunId);
  };

  const handleAddCitation = (c: Citation) => setCitations((prev) => [...prev, c]);
  const handleRemoveCitation = (id: string) => setCitations((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {messages.length === 0 && !providerReady ? (
        <ChatEmptyState onOpenSettings={onOpenSettings} provider={activeProvider} />
      ) : (
        <MessageList messages={messages} />
      )}
      {selectedTabs.length > 0 && (
        <div className="px-3 py-1.5 text-2xs text-fg-mute bg-accent/5 border-t border-accent/20">
          {selectedTabs.length} tab{selectedTabs.length === 1 ? '' : 's'} as context
          {extracting && <span className="ml-1.5 text-fg-dim">· extracting…</span>}
        </div>
      )}
      {excludedTabsNote && (
        <div className="px-3 py-1.5 text-2xs text-amber-300 bg-amber-900/15 border-t border-amber-900/30">
          {excludedTabsNote}
        </div>
      )}
      {lastError && (
        <div className="px-4 py-2 text-2xs text-red-300 bg-red-900/20 border-t border-red-900/40">
          {lastError}
        </div>
      )}
      <Composer
        value={composerText}
        onChange={setComposerText}
        onSubmit={handleSubmit}
        onStop={handleStop}
        disabled={!providerReady}
        inflight={inflight || extracting}
        placeholderHint={
          !providerReady
            ? activeProvider === 'qwen-local'
              ? 'Download a local model in Settings to begin…'
              : 'Add an API key in Settings to begin…'
            : citations.length > 0 || selectedTabs.length > 0
            ? 'Ask about the context…'
            : 'Ask anything · Ctrl+click tabs to add as context'
        }
        citations={citations}
        onAddCitation={handleAddCitation}
        onRemoveCitation={handleRemoveCitation}
      />
    </div>
  );
}

/**
 * Greedy-by-recency: extract content from selected tabs, most-recently-active
 * first, and stop when the shared char budget is hit. Returns the markdown
 * block plus counts so the UI can show "X tabs excluded".
 */
async function gatherTabContext(
  tabs: TabState[],
): Promise<{ formatted: string; usedCount: number; excludedCount: number }> {
  const sorted = [...tabs].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
  const blocks: string[] = [];
  let used = 0;
  let totalChars = 0;

  for (const tab of sorted) {
    if (totalChars >= TAB_CONTEXT_CHAR_BUDGET) break;
    const remaining = TAB_CONTEXT_CHAR_BUDGET - totalChars;
    const extracted = await window.sable.tabs.extractContent(tab.id);
    if (!extracted || !extracted.text) continue;
    let text = extracted.text;
    let truncated = extracted.truncated;
    if (text.length > remaining) {
      text = text.slice(0, remaining) + '…';
      truncated = true;
    }
    blocks.push(formatTabBlock(extracted.title, extracted.url, text, truncated));
    totalChars += text.length;
    used += 1;
  }

  return {
    formatted: blocks.length > 0 ? blocks.join('\n') + '\n' : '',
    usedCount: used,
    excludedCount: tabs.length - used,
  };
}

function formatTabBlock(title: string, url: string, text: string, truncated: boolean): string {
  const t = truncated ? text + '\n\n*[content truncated]*' : text;
  return `## Tab: ${title}\n*${url}*\n\n${t}\n`;
}

function formatTextCitations(citations: TextCitation[]): string {
  if (citations.length === 0) return '';
  const parts: string[] = [];
  for (const c of citations) {
    parts.push(`> ${c.text}`);
    parts.push(`> — [${c.title || c.url}](${c.url})`);
    parts.push('');
  }
  return parts.join('\n') + '\n';
}

function renderUiHeader(usedTabsCount: number): string {
  if (usedTabsCount === 0) return '';
  return `*[Used ${usedTabsCount} tab${usedTabsCount === 1 ? '' : 's'} as context]*\n\n`;
}

/**
 * User bubble combines the UI header (compact tab summary), text citations,
 * inline images, and the user's actual question.
 */
function renderUserBubble(headForUi: string, userText: string, images: ImageCitation[]): string {
  const parts: string[] = [];
  if (images.length > 0) {
    for (const img of images) {
      parts.push(`![${img.alt || 'image'}](data:${img.mimeType};base64,${img.base64})`);
    }
  }
  if (headForUi) parts.push(headForUi.trimEnd());
  if (userText) parts.push(userText);
  if (!userText && images.length > 0) parts.push('What do you see?');
  return parts.join('\n\n');
}
