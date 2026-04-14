import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Ticket, Comment, Settings } from './types';

export class TicketStorage {
  constructor(private readonly context: vscode.ExtensionContext) {}

  // ──────────────────────────────────────────────
  // Central dispatcher
  // ──────────────────────────────────────────────
  async handle(type: string, payload: unknown): Promise<unknown> {
    switch (type) {
      case 'getCurrentUser':   return this.getCurrentUser();
      case 'getSettings':      return this.getSettings();
      case 'saveSettings':     return this.saveSettings(payload as Settings);
      case 'selectFolder':     return this.selectFolder();
      case 'getTicketList':    return this.getTicketList();
      case 'getTicketDetail':  return this.getTicketDetail((payload as { id: string }).id);
      case 'saveTicket':       return this.saveTicket(payload as Partial<Ticket>);
      case 'addComment':       return this.addComment((payload as { id: string; body: string }).id, (payload as { id: string; body: string }).body);
      case 'getCategories':    return this.getCategories();
      case 'getTargetSuggestions': return this.getTargetSuggestions();
      case 'getAssigneeSuggestions': return this.getAssigneeSuggestions();
      case 'getExportColumnOrder': return this.getExportColumnOrder();
      case 'saveExportColumnOrder': return this.saveExportColumnOrder((payload as { order: string[] }).order);
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  }

  // ──────────────────────────────────────────────
  // User
  // ──────────────────────────────────────────────
  getCurrentUser(): string {
    const configured = vscode.workspace.getConfiguration('rassure-vscode').get<string>('username');
    if (configured && configured.trim()) {
      return configured.trim();
    }
    try {
      return os.userInfo().username;
    } catch {
      return process.env.USERNAME || process.env.USER || 'unknown';
    }
  }

  // ──────────────────────────────────────────────
  // Settings (stored in VS Code globalState)
  // ──────────────────────────────────────────────
  private getWorkspaceFolderPath(): string {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
  }

  getSettings(): Settings {
    const saved = this.context.globalState.get<string>('rassure.folderPath', '');
    const folderPath = saved || this.getWorkspaceFolderPath();
    return { folderPath };
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    await this.context.globalState.update('rassure.folderPath', settings.folderPath);
    return settings;
  }

  async selectFolder(): Promise<{ folderPath: string }> {
    const result = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      title: 'チケット保存フォルダを選択'
    });
    if (!result || result.length === 0) {
      return { folderPath: '' };
    }
    // Use .fsPath to correctly handle Windows UNC paths (\\server\share)
    return { folderPath: result[0].fsPath };
  }

  // ──────────────────────────────────────────────
  // Ticket CRUD
  // ──────────────────────────────────────────────
  private getFolderPath(): string {
    const folderPath = this.getSettings().folderPath;
    if (!folderPath) {
      throw new Error('フォルダが開かれていません。VS Codeでフォルダを開くか、設定からチケット保存フォルダを指定してください。');
    }
    return folderPath;
  }

  getTicketList(): Ticket[] {
    const folderPath = this.getFolderPath();
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json') && !f.startsWith('_'));
    const tickets: Ticket[] = [];
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const ticket = JSON.parse(content) as Ticket;
        if (ticket.id) {
          tickets.push(ticket);
        }
      } catch {
        // skip malformed files
      }
    }
    return tickets.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  getTicketDetail(id: string): Ticket {
    const folderPath = this.getFolderPath();
    const filePath = path.join(folderPath, `${id}.json`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`チケット ${id} が見つかりません`);
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as Ticket;
  }

  saveTicket(data: Partial<Ticket>): Ticket {
    const folderPath = this.getFolderPath();
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const now = new Date().toISOString();

    if (data.id) {
      // Update existing
      const existing = this.getTicketDetail(data.id);
      const updated: Ticket = {
        ...existing,
        ...data,
        comments: existing.comments,
        updatedAt: now
      };
      fs.writeFileSync(path.join(folderPath, `${updated.id}.json`), JSON.stringify(updated, null, 2), 'utf-8');
      return updated;
    } else {
      // Create new
      const id = this.generateId(folderPath);
      const ticket: Ticket = {
        id,
        description: data.description || '',
        target: data.target || '',
        category: data.category || '',
        status: data.status || 'open',
        priority: data.priority || 'medium',
        assignee: data.assignee || '',
        dueDate: data.dueDate || '',
        reporter: data.reporter || this.getCurrentUser(),
        createdAt: now,
        updatedAt: now,
        comments: []
      };
      fs.writeFileSync(path.join(folderPath, `${ticket.id}.json`), JSON.stringify(ticket, null, 2), 'utf-8');
      return ticket;
    }
  }

  addComment(ticketId: string, body: string): Ticket {
    const ticket = this.getTicketDetail(ticketId);
    const folderPath = this.getFolderPath();
    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: this.getCurrentUser(),
      body,
      timestamp: new Date().toISOString()
    };
    ticket.comments = [...(ticket.comments || []), comment];
    ticket.updatedAt = new Date().toISOString();
    fs.writeFileSync(path.join(folderPath, `${ticket.id}.json`), JSON.stringify(ticket, null, 2), 'utf-8');
    return ticket;
  }

  getCategories(): string[] {
    try {
      const folderPath = this.getFolderPath();
      const catFile = path.join(folderPath, 'categories');
      if (fs.existsSync(catFile)) {
        const content = fs.readFileSync(catFile, 'utf-8');
        return content
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }
    } catch {
      // fall through to empty
    }
    return [];
  }

  ensureDefaultFiles(): void {
    try {
      const folderPath = this.getSettings().folderPath;
      if (!folderPath) { return; }
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }
      const catFile = path.join(folderPath, 'categories');
      if (!fs.existsSync(catFile)) {
        const defaults = ['誤記', '記載不足', '要確認', '修正依頼', '質問'].join('\n');
        fs.writeFileSync(catFile, defaults, 'utf-8');
      }
    } catch {
      // best effort
    }
  }

  // ──────────────────────────────────────────────
  // Export column order (stored in globalState)
  // ──────────────────────────────────────────────
  static readonly DEFAULT_EXPORT_COLUMN_ORDER = ['ID','状況','重要度','指摘対象','指摘種別','説明','コメント','指摘者','担当者','期限','作成日','更新日'];

  getExportColumnOrder(): string[] {
    const saved = this.context.globalState.get<string[]>('rassure.exportColumnOrder');
    return (saved && saved.length > 0) ? saved : TicketStorage.DEFAULT_EXPORT_COLUMN_ORDER;
  }

  async saveExportColumnOrder(order: string[]): Promise<void> {
    await this.context.globalState.update('rassure.exportColumnOrder', order);
  }

  getTargetSuggestions(): string[] {
    try {
      const tickets = this.getTicketList();
      const targets = new Set(tickets.map(t => t.target).filter(Boolean));
      return Array.from(targets);
    } catch {
      return [];
    }
  }

  getAssigneeSuggestions(): string[] {
    try {
      const tickets = this.getTicketList();
      const assignees = new Set(tickets.map(t => t.assignee).filter(Boolean));
      return Array.from(assignees);
    } catch {
      return [];
    }
  }

  // ──────────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────────
  private generateId(folderPath: string): string {
    const files = fs.existsSync(folderPath) ? fs.readdirSync(folderPath).filter(f => f.match(/^#\d+\.json$/)) : [];
    const nums = files.map(f => parseInt(f.replace('#', '').replace('.json', ''), 10)).filter((n: number) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `#${String(next).padStart(3, '0')}`;
  }
}
