import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Ticket, Comment, Settings } from './types';
import { t } from './locale';


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
      title: t('selectFolder.dialogTitle')
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
      throw new Error(t('error.noFolder'));
    }
    return folderPath;
  }

  getTicketList(): Ticket[] {
    const folderPath = this.getFolderPath();
    if (!fs.existsSync(folderPath)) {
      return [];
    }
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json') && !f.startsWith('_') && f !== 'rassure.json');
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
      throw new Error(t('error.ticketNotFound', id));
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
      const configFile = path.join(folderPath, 'rassure.json');
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content) as { categories?: unknown[] };
        if (Array.isArray(config?.categories)) {
          return (config.categories as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
        }
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
      const configFile = path.join(folderPath, 'rassure.json');
      if (!fs.existsSync(configFile)) {
        const defaultCategories: string[] = t('categories.default')
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        fs.writeFileSync(configFile, this.buildRassureJson(defaultCategories), 'utf-8');
      }
    } catch {
      // best effort
    }
  }

  migrateCategoriesIfNeeded(): void {
    try {
      const folderPath = this.getSettings().folderPath;
      if (!folderPath) { return; }
      const oldFile = path.join(folderPath, 'categories');
      const configFile = path.join(folderPath, 'rassure.json');
      if (!fs.existsSync(oldFile) || fs.existsSync(configFile)) { return; }
      const categories = fs.readFileSync(oldFile, 'utf-8')
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      fs.writeFileSync(configFile, this.buildRassureJson(categories), 'utf-8');
    } catch {
      // best effort
    }
  }

  private buildRassureJson(categories: string[]): string {
    return JSON.stringify({ categories }, null, 2) + '\n';
  }

  static readonly DEFAULT_EXPORT_COLUMN_ORDER = ['ID','status','priority','target','category','description','comments','reporter','assignee','dueDate','createdAt','updatedAt'];

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
  getIdPrefix(): string {
    const configured = vscode.workspace.getConfiguration('rassure-vscode').get<string>('idPrefix');
    return (configured && configured.trim()) ? configured.trim() : '#';
  }

  private generateId(folderPath: string): string {
    const prefix = this.getIdPrefix();
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^${escapedPrefix}\\d+\\.json$`);
    const files = fs.existsSync(folderPath)
      ? fs.readdirSync(folderPath).filter((f: string) => pattern.test(f))
      : [];
    const nums = files
      .map((f: string) => parseInt(f.slice(prefix.length, f.length - 5), 10))
      .filter((n: number) => !isNaN(n));
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }
}
