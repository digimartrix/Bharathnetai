// Local event stream used to demonstrate real-time behavior without external services.
// Replace this adapter with Socket.IO/SSE/WebSocket events in a production deployment.
export function createRealtimeStream(onEvent, intervalMs = 5000) {
  let timer = null;
  let sequence = 0;
  const start = () => {
    if (timer) return;
    timer = window.setInterval(() => { sequence += 1; onEvent({ sequence, receivedAt: new Date().toISOString(), source: 'synthetic-iot-gateway' }); }, intervalMs);
  };
  const stop = () => { if (timer) window.clearInterval(timer); timer = null; };
  return { start, stop };
}
