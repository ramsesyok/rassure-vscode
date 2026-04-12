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

// 列定義（順序は出力列順）
const COLUMNS: { name: string; width: number }[] = [
  { name: 'ID',       width: 10 },
  { name: '状況',     width: 12 },
  { name: '重要度',   width: 10 },
  { name: '指摘対象', width: 20 },
  { name: '指摘種別', width: 16 },
  { name: '説明',     width: 50 },
  { name: 'コメント', width: 50 },
  { name: '指摘者',   width: 14 },
  { name: '担当者',   width: 14 },
  { name: '期限',     width: 14 },
  { name: '作成日',   width: 20 },
  { name: '更新日',   width: 20 },
];

// 折り返しを適用する列名
const WRAP_COLUMNS = new Set(['説明', 'コメント']);

export async function exportToExcel(storage: TicketStorage): Promise<void> {
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

    // データ行を二次元配列として構築
    const rows: ExcelJS.CellValue[][] = tickets.map(ticket => [
      ticket.id,
      STATUS_LABELS[ticket.status]   ?? ticket.status,
      PRIORITY_LABELS[ticket.priority] ?? ticket.priority,
      ticket.target,
      ticket.category,
      ticket.description,
      formatComments(ticket.comments ?? []),
      ticket.reporter,
      ticket.assignee,
      ticket.dueDate,
      ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('ja-JP') : '',
      ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString('ja-JP') : '',
    ]);

    // テーブルとして追加
    sheet.addTable({
      name: 'IssuesTable',
      ref: 'A1',
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: COLUMNS.map(c => ({ name: c.name, filterButton: true })),
      rows,
    });

    // テーブル追加後に列幅を設定
    COLUMNS.forEach((col, i) => {
      sheet.getColumn(i + 1).width = col.width;
    });

    // 折り返しが必要な列のセル書式を再適用（データ行は2行目から）
    const wrapColIndices = COLUMNS
      .map((c, i) => ({ name: c.name, colNum: i + 1 }))
      .filter(c => WRAP_COLUMNS.has(c.name));

    for (let rowIdx = 2; rowIdx <= tickets.length + 1; rowIdx++) {
      for (const { colNum } of wrapColIndices) {
        sheet.getCell(rowIdx, colNum).alignment = {
          vertical: 'top',
          horizontal: 'left',
          wrapText: true,
        };
      }
    }

    // 先頭行（ヘッダー）を固定
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
