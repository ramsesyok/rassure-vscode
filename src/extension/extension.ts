import * as vscode from 'vscode';
import { BoardPanel } from './BoardPanel';
import { TicketStorage } from './TicketStorage';
import { exportToExcel } from './ExportService';

let storage: TicketStorage;

async function openBoardWithFolderSelection(context: vscode.ExtensionContext): Promise<void> {
  const currentPath = storage.getSettings().folderPath;

  const input = vscode.window.createInputBox();
  input.title = 'rassure-vscode: 作業フォルダの選択';
  input.placeholder = 'フォルダのパスを入力、または右のアイコンから選択してください';
  input.value = currentPath;
  input.buttons = [
    { iconPath: new vscode.ThemeIcon('folder'), tooltip: 'フォルダを選択' }
  ];

  let selectingFolder = false;
  let accepted = false;

  input.onDidTriggerButton(async () => {
    selectingFolder = true;
    const result = await vscode.window.showOpenDialog({
      canSelectFiles: false,
      canSelectFolders: true,
      canSelectMany: false,
      title: 'チケット保存フォルダを選択'
    });
    selectingFolder = false;
    if (result && result.length > 0) {
      input.value = result[0].fsPath;
    }
    input.show();
  });

  input.onDidAccept(async () => {
    const folderPath = input.value.trim();
    accepted = true;
    input.hide();
    if (!folderPath) {
      return;
    }
    await storage.saveSettings({ folderPath });
    storage.ensureDefaultFiles();
    BoardPanel.createOrShow(context, storage);
  });

  input.onDidHide(() => {
    if (!selectingFolder && !accepted) {
      input.dispose();
    } else if (accepted) {
      input.dispose();
    }
  });

  input.show();
}

export function activate(context: vscode.ExtensionContext): void {
  storage = new TicketStorage(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('rassure-vscode.openBoard', () => {
      openBoardWithFolderSelection(context);
    }),
    vscode.commands.registerCommand('rassure-vscode.exportToExcel', () => {
      exportToExcel(storage);
    })
  );
}

export function deactivate(): void {
  // cleanup handled by disposables
}
