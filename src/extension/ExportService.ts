import * as vscode from 'vscode';
import * as ExcelJS from 'exceljs';
import { TicketStorage } from './TicketStorage';

const STATUS_LABELS: Record<string, string> = {
  open: '未着手',
  in_progress: '対応中',
  resolved: '解決済',
  closed: 'クローズ'
};

const PRIORITY_LABELS: Record<string, string> = {
  high: '高',
  medium: '中',
  low: '低'
};

function formatComments(comments: { timestamp: string; author: string; body: string }[]): string {
  if (!comments || comments.length === 0) return '';
  return comments.map(c => {
    const date = new Date(c.timestamp).toLocaleString('ja-JP');
    return `[${date}] ${c.author}\n${c.body}`;
  }).join('\n');
}

export async function exportToExcel(storage: TicketStorage): Promise<void> {
  // 保存先をユーザーに選択させる
  const uri = await vscode.window.showSaveDialog({
    defaultUri: vscode.Uri.file('issues_export.xlsx'),
    filters: { 'Excel ファイル': ['xlsx'] },
    title: 'エクスポート先を選択'
  });
  if (!uri) return;

  const statusItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusItem.text = '$(loading~spin) Rassure: Excel 出力中...';
  statusItem.show();

  try {
    const tickets = storage.getTicketList();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'rassure-vscode';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('課題一覧');

    // 列定義
    sheet.columns = [
      { header: 'ID',       key: 'id',          width: 10 },
      { header: '状況',     key: 'status',       width: 12 },
      { header: '重要度',   key: 'priority',     width: 10 },
      { header: '指摘対象', key: 'target',       width: 20 },
      { header: '指摘種別', key: 'category',     width: 16 },
      { header: '説明',     key: 'description',  width: 50 },
      { header: 'コメント', key: 'comments',     width: 50 },
      { header: '指摘者',   key: 'reporter',     width: 14 },
      { header: '担当者',   key: 'assignee',     width: 14 },
      { header: '期限',     key: 'dueDate',      width: 14 },
      { header: '作成日',   key: 'createdAt',    width: 20 },
      { header: '更新日',   key: 'updatedAt',    width: 20 },
    ];

    // ヘッダー行のスタイル
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.commit();

    // データ行
    for (const ticket of tickets) {
      const commentsText = formatComments(ticket.comments ?? []);
      const row = sheet.addRow({
        id:          ticket.id,
        status:      STATUS_LABELS[ticket.status] ?? ticket.status,
        priority:    PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
        target:      ticket.target,
        category:    ticket.category,
        description: ticket.description,
        comments:    commentsText,
        reporter:    ticket.reporter,
        assignee:    ticket.assignee,
        dueDate:     ticket.dueDate,
        createdAt:   ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('ja-JP') : '',
        updatedAt:   ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('ja-JP') : '',
      });

      // 説明・コメントセルの折り返し設定
      row.getCell('description').alignment = { wrapText: true, vertical: 'top' };
      row.getCell('comments').alignment   = { wrapText: true, vertical: 'top' };
      row.commit();
    }

    // ヘッダー行を固定
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    await workbook.xlsx.writeFile(uri.fsPath);

    statusItem.dispose();
    vscode.window.showInformationMessage(
      `Rassure: ${tickets.length} 件の課題を Excel にエクスポートしました → ${uri.fsPath}`
    );
  } catch (e) {
    statusItem.dispose();
    const msg = e instanceof Error ? e.message : String(e);
    vscode.window.showErrorMessage(`Rassure: Excel エクスポートに失敗しました — ${msg}`);
  }
}
