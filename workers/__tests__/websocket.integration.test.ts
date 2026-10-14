import { describe, it, expect } from 'vitest';

const DEFAULT_HTTP_BASE = 'http://localhost:8787';
const DEFAULT_WS_BASE = 'ws://localhost:8787/parties/yjs-room';

const HTTP_BASE = process.env.COLLAB_HTTP_BASE || DEFAULT_HTTP_BASE;
const WS_BASE = process.env.COLLAB_WS_BASE || DEFAULT_WS_BASE;
const HEALTH_PROBE_TIMEOUT_MS = 1000;

// These tests need a live collab worker (npm run dev:local). When none is
// reachable, skip rather than fail so the default suite stays green in CI
// and on a laptop without the worker running.
async function isWorkerReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${HTTP_BASE}/health`, {
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}

const workerReachable = await isWorkerReachable();

describe.skipIf(!workerReachable)('Cloudflare Worker Integration', () => {
  describe('Health endpoint', () => {
    it('returns ok status', async () => {
      const response = await fetch(`${HTTP_BASE}/health`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.status).toBe('ok');
      expect(typeof data.timestamp).toBe('number');
    });
  });

  describe('WebSocket connection', () => {
    it('connects to a room successfully', async () => {
      // Skip in CI or when WebSocket is not available
      if (typeof WebSocket === 'undefined') {
        console.log('WebSocket not available, skipping test');
        return;
      }

      const roomId = `test-room-${Date.now()}`;

      await new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(`${WS_BASE}/${roomId}`);
        const timeout = setTimeout(() => {
          ws.close();
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        ws.onopen = () => {
          clearTimeout(timeout);
          ws.close();
          resolve();
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          reject(new Error(`WebSocket error: ${error}`));
        };
      });
    });
  });
});
