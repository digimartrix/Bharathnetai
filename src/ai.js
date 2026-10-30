export async function askOperationsAI(message, context) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The AI service is unavailable right now.');
  return payload.response || 'I could not generate an operational answer from the current signals.';
}
