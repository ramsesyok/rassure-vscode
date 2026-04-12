// acquireVsCodeApi() can only be called ONCE per webview lifetime.
// This module holds the singleton and provides a promise-based postRequest helper.

interface VsCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VsCodeApi;

// Singleton — call once at module load time
const vscode: VsCodeApi = acquireVsCodeApi();

let nextId = 1;
const pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

// Push-notification subscribers (requestId === -1)
type PushHandler = (type: string) => void;
const pushHandlers: PushHandler[] = [];

window.addEventListener('message', (event) => {
  const msg = event.data as { requestId: number; type: string; data?: unknown; error?: string };
  if (msg.requestId === -1) {
    // Push notification from Extension Host
    pushHandlers.forEach(h => h(msg.type));
    return;
  }
  const p = pending.get(msg.requestId);
  if (!p) return;
  pending.delete(msg.requestId);
  if (msg.error) {
    p.reject(new Error(msg.error));
  } else {
    p.resolve(msg.data);
  }
});

export function postRequest<T = unknown>(type: string, payload?: unknown): Promise<T> {
  const requestId = nextId++;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(new Error(`Request timeout: ${type}`));
    }, 10000);

    pending.set(requestId, {
      resolve: (v) => { clearTimeout(timer); resolve(v as T); },
      reject: (e) => { clearTimeout(timer); reject(e); }
    });
    vscode.postMessage({ requestId, type, payload });
  });
}

export function onPush(handler: PushHandler): () => void {
  pushHandlers.push(handler);
  return () => {
    const idx = pushHandlers.indexOf(handler);
    if (idx !== -1) pushHandlers.splice(idx, 1);
  };
}
