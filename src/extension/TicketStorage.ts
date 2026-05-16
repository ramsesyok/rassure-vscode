import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Ticket, Comment, Settings, TicketFormat, RassureConfig } from './types';
import { getSerializer, getSerializerByFileName, TicketSerializer } from './serializers';
import { t } from './locale';


const CONFIG_FILE = 'rassure.json';
const TICKET_EXTENSIONS = ['.json', '.md'] as const;

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
      case 'openTargetFile':   return this.openTargetFile((payload as { text: string }).text);
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
    const config = this.readRassureConfig(folderPath);
    const targetRoot = config?.targetRoot || undefined;
    return { folderPath, targetRoot };
  }

  async saveSettings(settings: Settings): Promise<Settings> {
    await this.context.globalState.update('rassure.folderPath', settings.folderPath);
    // Only touch rassure.json when targetRoot is explicitly provided (i.e. called from the settings dialog).
    // Omitting targetRoot (undefined) means "don't change rassure.json" — this prevents overwriting the
    // file with {} when saveSettings is called with only folderPath during board initialisation.
    if (settings.folderPath && settings.targetRoot !== undefined) {
      try {
        if (!fs.existsSync(settings.folderPath)) {
          fs.mkdirSync(settings.folderPath, { recursive: true });
        }
        const configFile = path.join(settings.folderPath, CONFIG_FILE);
        let existing: Record<string, unknown> = {};
        if (fs.existsSync(configFile)) {
          try { existing = JSON.parse(fs.readFileSync(configFile, 'utf-8')); } catch { /* ignore */ }
        }
        existing.targetRoot = settings.targetRoot.trim() || undefined;
        if (!existing.targetRoot) { delete existing.targetRoot; }
        fs.writeFileSync(configFile, JSON.stringify(existing, null, 2) + '\n', 'utf-8');
      } catch { /* best effort */ }
    }
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
    const files = fs.readdirSync(folderPath).filter(f => isTicketFile(f));
    const tickets: Ticket[] = [];
    const seenIds = new Set<string>();
    const formatPreference = this.getTicketFormat();
    const preferredExt = getSerializer(formatPreference).extension;

    // When the same id exists in both .json and .md, the configured format wins.
    const sortedFiles = files.slice().sort((a, b) => {
      const aPreferred = a.endsWith(preferredExt) ? 0 : 1;
      const bPreferred = b.endsWith(preferredExt) ? 0 : 1;
      return aPreferred - bPreferred;
    });

    for (const file of sortedFiles) {
      const serializer = getSerializerByFileName(file);
      if (!serializer) { continue; }
      try {
        const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
        const ticket = serializer.parse(content);
        if (ticket.id && !seenIds.has(ticket.id)) {
          seenIds.add(ticket.id);
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
    const existing = this.findExistingTicketFile(folderPath, id);
    if (!existing) {
      throw new Error(t('error.ticketNotFound', id));
    }
    const content = fs.readFileSync(existing.filePath, 'utf-8');
    return existing.serializer.parse(content);
  }

  saveTicket(data: Partial<Ticket>): Ticket {
    const folderPath = this.getFolderPath();
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    const now = new Date().toISOString();

    if (data.id) {
      // Update existing — keep the file's existing format
      const existing = this.findExistingTicketFile(folderPath, data.id);
      if (!existing) {
        throw new Error(t('error.ticketNotFound', data.id));
      }
      const current = existing.serializer.parse(fs.readFileSync(existing.filePath, 'utf-8'));
      const updated: Ticket = {
        ...current,
        ...data,
        comments: current.comments,
        updatedAt: now,
      };
      fs.writeFileSync(existing.filePath, existing.serializer.stringify(updated), 'utf-8');
      return updated;
    }

    // Create new — use the configured format
    const serializer = getSerializer(this.getTicketFormat());
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
      comments: [],
    };
    const filePath = path.join(folderPath, `${ticket.id}${serializer.extension}`);
    fs.writeFileSync(filePath, serializer.stringify(ticket), 'utf-8');
    return ticket;
  }

  addComment(ticketId: string, body: string): Ticket {
    const folderPath = this.getFolderPath();
    const existing = this.findExistingTicketFile(folderPath, ticketId);
    if (!existing) {
      throw new Error(t('error.ticketNotFound', ticketId));
    }
    const ticket = existing.serializer.parse(fs.readFileSync(existing.filePath, 'utf-8'));
    const comment: Comment = {
      id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      author: this.getCurrentUser(),
      body,
      timestamp: new Date().toISOString()
    };
    ticket.comments = [...(ticket.comments || []), comment];
    ticket.updatedAt = new Date().toISOString();
    fs.writeFileSync(existing.filePath, existing.serializer.stringify(ticket), 'utf-8');
    return ticket;
  }

  getCategories(): string[] {
    const folderPath = this.getSettings().folderPath;
    const config = this.readRassureConfig(folderPath);
    if (config && Array.isArray(config.categories)) {
      return (config.categories as unknown[]).filter((c): c is string => typeof c === 'string' && c.trim().length > 0);
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
      const configFile = path.join(folderPath, CONFIG_FILE);
      if (!fs.existsSync(configFile)) {
        const defaultCategories: string[] = t('categories.default')
          .split(/\r?\n/)
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
        const format = this.getDefaultTicketFormat();
        fs.writeFileSync(configFile, this.buildRassureJson(defaultCategories, format), 'utf-8');
      }
    } catch {
      // best effort
    }
  }

  async openTargetFile(text: string): Promise<void> {
    if (!text?.trim()) { return; }

    // パス解析: "src/main.ts:15" / "src/main.ts 行15" / "src/main.ts L15"
    const m = text.trim().match(/^(.+?)(?::(\d+)|[\s　]+(?:行|L)(\d+))?\s*$/);
    if (!m) { return; }
    const rawPath = m[1].trim();
    const lineNum = m[2] !== undefined ? parseInt(m[2], 10) - 1
                  : m[3] !== undefined ? parseInt(m[3], 10) - 1
                  : undefined;

    // ベースパスの決定
    let basePath: string | undefined;
    const folderPath = this.getSettings().folderPath;
    if (folderPath) {
      const config = this.readRassureConfig(folderPath);
      if (config?.targetRoot) {
        basePath = path.isAbsolute(config.targetRoot)
          ? config.targetRoot
          : path.join(folderPath, config.targetRoot);
      }
    }
    if (!basePath) {
      basePath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    }
    if (!basePath) {
      vscode.window.showErrorMessage(t('error.openFile.noBasePath'));
      return;
    }

    const absPath = path.resolve(basePath, rawPath);
    if (!absPath.startsWith(path.resolve(basePath) + path.sep) &&
        absPath !== path.resolve(basePath)) {
      vscode.window.showErrorMessage(t('error.openFile.outsidePath'));
      return;
    }

    if (!fs.existsSync(absPath)) {
      vscode.window.showWarningMessage(t('error.openFile.notFound', absPath));
      return;
    }

    const doc = await vscode.workspace.openTextDocument(absPath);
    const editor = await vscode.window.showTextDocument(doc, { viewColumn: vscode.ViewColumn.Beside });
    if (lineNum !== undefined && lineNum >= 0) {
      const pos = new vscode.Position(lineNum, 0);
      editor.selection = new vscode.Selection(pos, pos);
      editor.revealRange(new vscode.Range(pos, pos), vscode.TextEditorRevealType.InCenter);
    }
  }

  migrateCategoriesIfNeeded(): void {
    try {
      const folderPath = this.getSettings().folderPath;
      if (!folderPath) { return; }
      const oldFile = path.join(folderPath, 'categories');
      const configFile = path.join(folderPath, CONFIG_FILE);
      if (!fs.existsSync(oldFile) || fs.existsSync(configFile)) { return; }
      const categories = fs.readFileSync(oldFile, 'utf-8')
        .split(/\r?\n/)
        .map((line: string) => line.trim())
        .filter((line: string) => line.length > 0);
      const format = this.getDefaultTicketFormat();
      fs.writeFileSync(configFile, this.buildRassureJson(categories, format), 'utf-8');
      fs.unlinkSync(oldFile);
    } catch {
      // best effort
    }
  }

  private buildRassureJson(categories: string[], ticketFormat: TicketFormat): string {
    return JSON.stringify({ categories, ticketFormat }, null, 2) + '\n';
  }

  /**
   * Resolve the `ticketFormat` to write into a newly-created rassure.json.
   * Reads the VS Code setting `rassure-vscode.defaultTicketFormat` and falls
   * back to 'json' when the setting is unset or invalid.
   */
  private getDefaultTicketFormat(): TicketFormat {
    const configured = vscode.workspace
      .getConfiguration('rassure-vscode')
      .get<string>('defaultTicketFormat');
    return normalizeTicketFormat(configured);
  }

  private getTicketFormat(): TicketFormat {
    const folderPath = this.getSettings().folderPath;
    const config = this.readRassureConfig(folderPath);
    return normalizeTicketFormat(config?.ticketFormat);
  }

  private readRassureConfig(folderPath: string): RassureConfig | undefined {
    if (!folderPath) { return undefined; }
    try {
      const configFile = path.join(folderPath, CONFIG_FILE);
      if (!fs.existsSync(configFile)) { return undefined; }
      return JSON.parse(fs.readFileSync(configFile, 'utf-8')) as RassureConfig;
    } catch {
      return undefined;
    }
  }

  private findExistingTicketFile(folderPath: string, id: string): { filePath: string; serializer: TicketSerializer } | undefined {
    const preferred = getSerializer(this.getTicketFormat());
    const otherExt = preferred.extension === '.json' ? '.md' : '.json';
    const candidates = [preferred.extension, otherExt];
    for (const ext of candidates) {
      const filePath = path.join(folderPath, `${id}${ext}`);
      if (fs.existsSync(filePath)) {
        const serializer = getSerializerByFileName(filePath);
        if (serializer) {
          return { filePath, serializer };
        }
      }
    }
    return undefined;
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
    const pattern = new RegExp(`^${escapedPrefix}(\\d+)\\.(json|md)$`);
    const files = fs.existsSync(folderPath)
      ? fs.readdirSync(folderPath)
      : [];
    const nums: number[] = [];
    for (const file of files) {
      const m = file.match(pattern);
      if (m) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n)) { nums.push(n); }
      }
    }
    const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
    return `${prefix}${String(next).padStart(3, '0')}`;
  }
}

function isTicketFile(fileName: string): boolean {
  if (fileName === CONFIG_FILE) { return false; }
  if (fileName.startsWith('_')) { return false; }
  return TICKET_EXTENSIONS.some(ext => fileName.endsWith(ext));
}

function normalizeTicketFormat(value: unknown): TicketFormat {
  return value === 'markdown' ? 'markdown' : 'json';
}
