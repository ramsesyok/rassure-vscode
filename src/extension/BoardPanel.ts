import * as vscode from 'vscode';
import { TicketStorage } from './TicketStorage';
import { WebviewRequest } from './types';
import { t, getLocale } from './locale';

/** VS Code公式サンプルと同じ英数字ノンス生成（hex/base64不可） */
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

export class BoardPanel {
  static currentPanel: BoardPanel | undefined;

  private readonly _panel: vscode.WebviewPanel;
  private readonly _storage: TicketStorage;
  private readonly _context: vscode.ExtensionContext;
  private _disposables: vscode.Disposable[] = [];

  static createOrShow(context: vscode.ExtensionContext, storage: TicketStorage): void {
    if (BoardPanel.currentPanel) {
      // 起点フォルダが変わるので旧フォルダの詳細パネルを全て閉じる
      import('./DetailPanel').then(({ DetailPanel }) => DetailPanel.disposeAll());
      BoardPanel.currentPanel._panel.reveal(vscode.ViewColumn.One);
      BoardPanel.currentPanel.postPush('folderChanged');
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      'rassureBoard',
      t('board.title'),
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview')
        ],
        retainContextWhenHidden: true
      }
    );
    BoardPanel.currentPanel = new BoardPanel(panel, context, storage);
  }

  /** DetailPanel からの ticketSaved プッシュ通知をボードに転送 */
  postPush(type: string): void {
    this._panel.webview.postMessage({ requestId: -1, type });
  }

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    storage: TicketStorage
  ) {
    this._panel = panel;
    this._context = context;
    this._storage = storage;

    this._panel.webview.html = this._getHtml(panel.webview);

    this._panel.webview.onDidReceiveMessage(
      async (msg: WebviewRequest) => {
        const { requestId, type, payload } = msg;
        try {
          if (type === 'openDetail') {
            const { id } = payload as { id: string };
            const { DetailPanel } = await import('./DetailPanel');
            DetailPanel.createOrShow(this._context, this._storage, id);
            this._panel.webview.postMessage({ requestId, type, data: { ok: true } });
            return;
          }
          const data = await this._storage.handle(type, payload);
          this._panel.webview.postMessage({ requestId, type, data });
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
    const lang = getLocale();

    // CSP は必ず1行で記述（改行があるとVS CodeのWebviewパーサーが誤解析する）
    const csp = [
      `default-src 'none'`,
      `connect-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `font-src ${webview.cspSource} data:`,
      `img-src ${webview.cspSource} data:`,
      `script-src 'nonce-${nonce}'`
    ].join('; ');

    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="${csp}">
  <meta name="rassure-user" content="${currentUser}">
  <meta name="rassure-lang" content="${lang}">
  <link rel="stylesheet" href="${styleUri}">
  <title>Rassure</title>
</head>
<body style="margin:0;padding:0;height:100vh;overflow:hidden;">
  <div id="root" style="height:100vh;"></div>
  <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  dispose(): void {
    BoardPanel.currentPanel = undefined;
    this._panel.dispose();
    this._disposables.forEach(d => d.dispose());
    this._disposables = [];
  }
}
