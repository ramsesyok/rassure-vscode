import * as vscode from 'vscode';
import * as ExcelJS from 'exceljs';
import { TicketStorage } from './TicketStorage';
import { t, getLocale } from './locale';

function getStatusLabel(status: string): string {
  const key = `status.${status}` as 'status.open';
  const labels: Record<string, string> = {
    open:        getLocale() === 'ja' ? '未着手' : 'Open',
    in_progress: getLocale() === 'ja' ? '対応中' : 'In Progress',
    resolved:    getLocale() === 'ja' ? '解決済' : 'Resolved',
    closed:      getLocale() === 'ja' ? 'クローズ' : 'Closed',
  };
  return labels[status] ?? status;
}

function getPriorityLabel(priority: string): string {
  const labels: Record<string, string> = {
    high:   getLocale() === 'ja' ? '高' : 'High',
    medium: getLocale() === 'ja' ? '中' : 'Medium',
    low:    getLocale() === 'ja' ? '低' : 'Low',
  };
  return labels[priority] ?? priority;
}

function formatComments(comments: { timestamp: string; author: string; body: string }[]): string {
  if (!comments || comments.length === 0) return '';
  const locale = getLocale();
  return comments.map(c => {
    const date = new Date(c.timestamp).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US');
    return `[${date}] ${c.author}\n${c.body}`;
  }).join('\n');
}

const COLUMN_META: Record<string, { width: number; wrap?: boolean }> = {
  'ID':          { width: 10 },
  'status':      { width: 12 },
  'priority':    { width: 10 },
  'target':      { width: 20 },
  'category':    { width: 16 },
  'description': { width: 50, wrap: true },
  'comments':    { width: 50, wrap: true },
  'reporter':    { width: 14 },
  'assignee':    { width: 14 },
  'dueDate':     { width: 14 },
  'createdAt':   { width: 20 },
  'updatedAt':   { width: 20 },
};

const COLUMN_NLS: Record<string, Parameters<typeof t>[0]> = {
  'ID':          'col.id',
  'status':      'col.status',
  'priority':    'col.priority',
  'target':      'col.target',
  'category':    'col.category',
  'description': 'col.description',
  'comments':    'col.comments',
  'reporter':    'col.reporter',
  'assignee':    'col.assignee',
  'dueDate':     'col.dueDate',
  'createdAt':   'col.createdAt',
  'updatedAt':   'col.updatedAt',
};

export async function exportToExcel(storage: TicketStorage): Promise<void> {
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('issues_export.xlsx'),
    filters: { [t('export.fileFilter')]: ['xlsx'] },
    title: t('export.dialogTitle')
  });
  if (!uri) return;

  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.text = t('export.statusBar');
  statusItem.show();

  try {
    const tickets = storage.getTicketList();
    const locale = getLocale();

    const configOrder = vscode.workspace
      .getConfiguration('rassure-vscode')
      .get<string[]>('exportColumnOrder');
    const columnOrder = (configOrder && configOrder.length > 0)
      ? configOrder
      : TicketStorage.DEFAULT_EXPORT_COLUMN_ORDER;

    const COLUMNS = columnOrder.map(jaKey => ({
      jaKey,
      label: COLUMN_NLS[jaKey] ? t(COLUMN_NLS[jaKey]) : jaKey,
      width: COLUMN_META[jaKey]?.width ?? 20,
      wrap:  COLUMN_META[jaKey]?.wrap ?? false,
    }));

    const ticketValueMap = (ticket: ReturnType<typeof storage.getTicketList>[number]): Record<string, ExcelJS.CellValue> => ({
      'ID':          ticket.id,
      'status':      getStatusLabel(ticket.status),
      'priority':    getPriorityLabel(ticket.priority),
      'target':      ticket.target,
      'category':    ticket.category,
      'description': ticket.description,
      'comments':    formatComments(ticket.comments ?? []),
      'reporter':    ticket.reporter,
      'assignee':    ticket.assignee,
      'dueDate':     ticket.dueDate,
      'createdAt':   ticket.createdAt ? new Date(ticket.createdAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US') : '',
      'updatedAt':   ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString(locale === 'ja' ? 'ja-JP' : 'en-US') : '',
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'rassure-vscode';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(t('worksheet.name'));

    const rows: ExcelJS.CellValue[][] = tickets.map(ticket => {
      const valueMap = ticketValueMap(ticket);
      return columnOrder.map(jaKey => valueMap[jaKey] ?? '');
    });

    sheet.addTable({
      name: 'IssuesTable',
      ref: 'A1',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: COLUMNS.map(c => ({ name: c.label, filterButton: true })),
      rows,
    });

    COLUMNS.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width;
    });

    const wrapColIndices = COLUMNS
      .map((c, i) => ({ wrap: c.wrap, colNum: i + 1 }))
      .filter(c => c.wrap);

    for (let rowIdx = 2; rowIdx <= tickets.length + 1; rowIdx++) {
      for (const { colNum } of wrapColIndices) {
        sheet.getCell(rowIdx, colNum).alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true,
        };
      }
    }

    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    await workbook.xlsx.writeFile(uri.fsPath);

    statusItem.dispose();
    vscode.window.showInformationMessage(t('export.success', tickets.length, uri.fsPath));
  } catch (e) {
    statusItem.dispose();
    const msg = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage(t('export.error', msg));
  }
}
