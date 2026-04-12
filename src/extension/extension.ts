import * as vscode from 'vscode';
import { BoardPanel } from './BoardPanel';
import { TicketStorage } from './TicketStorage';

let storage: TicketStorage;

export function activate(context: vscode.ExtensionContext): void {
  storage = new TicketStorage(context);

  context.subscriptions.push(
    vscode.commands.registerCommand('rassure-vscode.openBoard', () => {
      storage.ensureDefaultFiles();
      BoardPanel.createOrShow(context, storage);
    })
  );
}

export function deactivate(): void {
  // cleanup handled by disposables
}
