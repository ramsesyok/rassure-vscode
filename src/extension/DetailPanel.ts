import * as vscode from 'vscode';
import { TicketStorage } from './TicketStorage';
import { BoardPanel } from './BoardPanel';
import { WebviewRequest } from './types';

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class DetailPanel {
  private static panels: Map<string, DetailPanel> = new Map();

  private readonly _panel: vscode.WebviewPanel;
  private readonly _storage: TicketStorage;
  private readonly _context: vscode.ExtensionContext;
  private readonly _ticketId: string;
  private _disposables: vscode.Disposable[] = [];

  static disposeAll(): void {
    DetailPanel.panels.forEach(p => p.dispose());
    DetailPanel.panels.clear();
  }

  static createOrShow(context: vscode.ExtensionContext, storage: TicketStorage, ticketId: string): void {
    const existing = DetailPanel.panels.get(ticketId);
    if (existing) {
      existing._panel.reveal(vscode.ViewColumn.Beside);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      `rassureDetail-${ticketId}`,
      `Rassure — ${ticketId}`,
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')
        ],
        retainContextWhenHidden: true
      }
    );
    DetailPanel.panels.set(ticketId, new DetailPanel(panel, context, storage, ticketId));
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    storage: TicketStorage,
    ticketId: string
  ) {
    this._panel = panel;
    this._context = context;
    this._storage = storage;
    this._ticketId = ticketId;

    this._panel.webview.html = this._getHtml(panel.webview);

    this._panel.webview.onDidReceiveMessage(
      async (msg: WebviewRequest) => {
        const { requestId, type, payload } = msg;
        try {
          const data = await this._storage.handle(type, payload);
          this._panel.webview.postMessage({ requestId, type, data });

          if (type === 'saveTicket' || type === 'addComment') {
            BoardPanel.currentPanel?.postPush('ticketSaved');
          }
        } catch (e: unknown) {
          const error = e instanceof Error ? e.message : String(e);
          this._panel.webview.postMessage({ requestId, type, error });
        }
      },
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
  }

  private _getHtml(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview', 'index.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._context.extensionUri, 'dist', 'webview', 'index.css')
    );
    const nonce = getNonce();
    const currentUser = this._storage.getCurrentUser();

    const csp = [
      `default-src 'none'`,
      `connect-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
      `img-src ${webview.cspSource} data:`,
      `script-src 'nonce-${nonce}'`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="rassure-user" content="${currentUser}">
  <meta name="rassure-ticket-id" content="${this._ticketId}">
  <link rel="stylesheet" href="${styleUri}">
  <title>Rassure — ${this._ticketId}</title>
</head>
<body style="margin:0;padding:0;height:100vh;overflow:hidden;">
  <div id="root" style="height:100vh;"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    DetailPanel.panels.delete(this._ticketId);
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}
