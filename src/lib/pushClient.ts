/** Tell the server something was saved so it can push newly arrived work to the staff it belongs to. */
export function triggerPush() {
  try {
    fetch('/api/push/dispatch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}', keepalive: true }).catch(() => {})
  } catch {}
}
