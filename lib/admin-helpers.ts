// FIX: maskKey() used to be duplicated (and, in the PUT handler, missing
// entirely). Centralized here so both app/api/admin/providers/route.ts and
// app/api/admin/providers/[id]/route.ts mask API keys the exact same way.
export function maskKey(apiKey: string): string {
  if (!apiKey) return ''
  return `${apiKey.slice(0, 4)}${'*'.repeat(8)}`
}
