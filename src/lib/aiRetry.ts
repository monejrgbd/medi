/**
 * Polls a server action until a condition is met or max attempts reached.
 * Used by LetterGeneratorModal and SoapNoteEditor to wait for AI drafting.
 */
export async function pollUntil<T>(
  fetchFn: () => Promise<{ success: boolean; data?: T; error?: string }>,
  condition: (data: T) => boolean,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<{ success: boolean; data?: T; error?: string }> {
  const maxAttempts = options?.maxAttempts ?? 30;
  const intervalMs = options?.intervalMs ?? 2000;

  for (let i = 0; i < maxAttempts; i++) {
    const result = await fetchFn();
    if (!result.success) return result;
    if (result.data && condition(result.data)) return result;
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  return { success: false, error: "Timed out waiting for AI draft" };
}
