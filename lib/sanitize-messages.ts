// FIX: prompt-injection guard. Client-supplied "messages" must never be
// trusted to carry a "role" of "system"/"developer"/etc — that would let
// anyone inject arbitrary system-level instructions into the model call.
// This strips every message down to a safe { role, content } shape before
// it's ever sent to a provider.

export interface SafeChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const MAX_CONTENT_LENGTH = 8000

export function sanitizeChatMessages(messages: unknown): SafeChatMessage[] {
  if (!Array.isArray(messages)) return []

  const safe: SafeChatMessage[] = []

  for (const raw of messages) {
    if (!raw || typeof raw !== 'object') continue
    const m = raw as { role?: unknown; content?: unknown }

    if (typeof m.content !== 'string') continue
    const content = m.content.trim()
    if (!content) continue

    // Only "user" or "assistant" are ever allowed through. Any other value
    // (system, developer, tool, or a forged/unexpected string) is forced to
    // "user" rather than trusted or used to override system behavior.
    const role: 'user' | 'assistant' = m.role === 'assistant' ? 'assistant' : 'user'

    safe.push({
      role,
      content: content.slice(0, MAX_CONTENT_LENGTH),
    })
  }

  return safe
}
