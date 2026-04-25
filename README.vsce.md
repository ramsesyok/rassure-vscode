# Rassure for VS Code — User Manual

A **serverless, fully offline** issue-tracking VS Code extension that saves tickets as JSON files in a local folder.  
No database or server setup required. Works in closed-network environments.

> [!WARNING]
> **This tool is designed for small teams.**  
> There is no file-locking or exclusive-access mechanism. If multiple users edit the same ticket simultaneously, the last save wins and earlier changes may be lost.  
> When running on a shared network folder, establish a team rule to **avoid editing the same ticket at the same time**.

→ [日本語版はこちら](#rassure-for-vs-code--操作マニュアル)

---

## Table of Contents

1. [Installation](#installation)
2. [Getting Started — Storage Folder Setup](#getting-started--storage-folder-setup)
3. [Board View](#board-view)
4. [Filtering & Search](#filtering--search)
5. [Creating a Ticket](#creating-a-ticket)
6. [Ticket Detail / Edit](#ticket-detail--edit)
7. [Smart Jump](#smart-jump)
8. [Adding Comments](#adding-comments)
9. [Excel Export](#excel-export)
10. [Settings Customization](#settings-customization)
11. [Category Customization](#category-customization)
12. [Ticket Data Format (Reference)](#ticket-data-format-reference)
13. [Development / Build](#development--build)

---

## Installation

Search for **Rassure** in the VS Code Extensions Marketplace, or install manually from a `.vsix` file.

**Manual installation (offline environment):**

1. Obtain the `.vsix` file
2. Open the Command Palette (`Ctrl+Shift+P`) and run `Extensions: Install from VSIX...`
3. Select the file to install

---

## Getting Started — Storage Folder Setup

Set the folder where tickets will be saved before first use.

Open the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) and run:

```
Rassure: Open Board
```

When the board opens, a folder selection field appears at the top.

| Method | Operation |
|--------|-----------|
| Type a path directly | Enter the path in the text box and press Enter |
| Browse with dialog | Click the folder icon on the right |

The selected folder is remembered for future sessions.  
To change it, re-run the command or click the **Settings button** in the top-right of the board.

> Switching folders automatically closes any open detail tabs.

---

## Board View

Displays all tickets in the storage folder as a list.

### Columns

| Column | Content |
|--------|---------|
| ID | Ticket number |
| Status | Open / In Progress / Resolved / Closed |
| Priority | High / Medium / Low |
| Target | Target file or screen name |
| Category | Category |
| Description | Beginning of the ticket body |
| Assignee | Assignee name |
| Due Date | Response deadline |

### Toolbar Buttons (top-right)

| Button | Function |
|--------|----------|
| New | Create a new ticket |
| Excel | Export ticket list to .xlsx |
| Settings | Change the storage folder |

---

## Filtering & Search

The board toolbar provides two ways to narrow down tickets.

### Status Filter

Use the **Status** dropdown to show only tickets with a specific status.

| Selection | Result |
|-----------|--------|
| (All) | All tickets |
| Open | Open tickets only |
| In Progress | In Progress tickets only |
| Resolved | Resolved tickets only |
| Closed | Closed tickets only |

### Keyword Search

Type in the **search box** to filter tickets in real time across **ID, Target, Category, and Description** (case-insensitive).

Both filters can be combined.

---

## Creating a Ticket

Click the **New** button in the top-right of the board to open the ticket creation form in a new tab.

### Fields

| Field | Description | Required |
|-------|-------------|----------|
| Description | Issue content | ✓ |
| Target | Target file or screen name | |
| Category | Category (dropdown) | |
| Status | Open / In Progress / Resolved / Closed | |
| Priority | High / Medium / Low | |
| Assignee | Assignee name | |
| Due Date | Deadline (date picker) | |
| Reporter | Submitter name (defaults to the display name in settings) | |

Click **Save** to store the ticket as a JSON file in the storage folder.  
Ticket IDs (e.g. `#001`) are assigned automatically.

---

## Ticket Detail / Edit

Click a row on the board to open the detail view in a new tab.

Click **Edit** to make fields editable. Click **Save** to persist changes, or **Cancel** to revert.

---

## Smart Jump

When the **Target** field contains a value, a small **Open File** icon appears next to it in the detail view.  
Clicking it opens the referenced file in the VS Code editor (split beside the current view).

### Supported path formats

| Format | Example |
|--------|---------|
| Relative path | `src/login.tsx` |
| Relative path + line (`:`) | `src/login.tsx:42` |
| Relative path + line (space + `L`) | `src/login.tsx L42` |
| Absolute path | `C:\project\src\login.tsx` |

### Base path resolution order

1. **`targetRoot`** — set in the board's Settings dialog (saved to `rassure.json`)
2. **Workspace folder** — the folder open in VS Code
3. Error notification if neither is available

Configure `targetRoot` via the board's **Settings dialog** (gear icon, top-right of the board).

---

## Adding Comments

A comment input field is located at the bottom of the detail view.

Enter text and click **Add Comment** to save the comment with a timestamp and author name.  
Comments are displayed in chronological order and stored inside the ticket's JSON file.

---

## Excel Export

Click the **Excel** button in the top-right of the board, or run from the Command Palette:

```
Rassure: Export to Excel
```

A save dialog will appear — specify the filename and destination.

### Output Specs

- Output as an Excel Table (`TableStyleMedium2`) with column header filters and sorting ready to use
- Multiple comments are merged into a single cell with word-wrap applied
- Works without the board open; tickets are read directly from the configured folder

### Output Columns

| Column | Content |
|--------|---------|
| ID | Ticket number |
| Status | Open / In Progress / Resolved / Closed |
| Priority | High / Medium / Low |
| Target | Target file or screen name |
| Category | Category |
| Description | Full ticket body |
| Comments | Timestamp, author, and body joined chronologically |
| Reporter | Submitter name |
| Assignee | Assignee name |
| Due Date | Deadline |
| Created At | Registration date/time |
| Updated At | Last updated date/time |

Column order and selection can be customized in VS Code settings (see [below](#excel-export-column-customization)).

---

## Settings Customization

### In-app Settings Dialog

Click the **Settings button** (gear icon) in the top-right of the board.

| Field | Description |
|-------|-------------|
| Ticket Storage Folder | Folder where ticket JSON files are stored. Use the folder icon to browse. |
| Target Root Path | Base directory for resolving relative paths in the Target field ([see Smart Jump](#smart-jump)). Leave blank to use the VS Code workspace folder. |

### VS Code Settings

Open VS Code settings with `Ctrl+,` (`Cmd+,` on Mac) and search for **`Rassure`**.

| Setting Key | Default | Description |
|---|---|---|
| `rassure-vscode.username` | (OS username) | Display name recorded on tickets |
| `rassure-vscode.idPrefix` | `#` | Prefix added to ticket IDs and filenames |
| `rassure-vscode.exportColumnOrder` | All 12 columns | Column order and selection for Excel export |

### Changing the Ticket ID Prefix

Changing `rassure-vscode.idPrefix` affects **newly created tickets** only.

```
Example: changing idPrefix to "No."
  New tickets  → No.001.json (id: "No.001")
  Existing     → #001.json continues to load as-is
```

- Maximum 5 characters
- OS-reserved filename characters (`\ / : * ? " < > |`) are not allowed
- Existing tickets are not deleted or moved

### Excel Export Column Customization

`rassure-vscode.exportColumnOrder` accepts an array of column keys.

- Reorder items to change output column order
- Remove items to exclude those columns
- Valid values: `ID` `status` `priority` `target` `category` `description` `comments` `reporter` `assignee` `dueDate` `createdAt` `updatedAt`

---

## Category Customization

Category dropdown options are configured via a `rassure.json` file (JSON with Comments format) in the ticket storage folder.

If the file does not exist, it is auto-generated when the board opens with the following defaults:

```json
{
  "categories": ["Typo", "Missing Info", "Needs Review", "Change Request", "Question"]
}
```

Edit `rassure.json` with any text editor to customize the list. Reload the board to apply changes.

> **Migrating from an older version:** If a `categories` plain-text file exists in the folder and `rassure.json` does not, the extension automatically converts it to `rassure.json` when the board is opened. No manual action is required.

---

## Ticket Data Format (Reference)

Tickets are saved in the storage folder as `#001.json` (prefix is configurable).

```json
{
  "id": "#001",
  "description": "Typo in the login screen button label",
  "target": "login.tsx",
  "category": "Typo",
  "status": "open",
  "priority": "medium",
  "assignee": "yamada",
  "dueDate": "2026-04-30",
  "reporter": "tanaka",
  "createdAt": "2026-04-12T09:00:00.000Z",
  "updatedAt": "2026-04-12T09:00:00.000Z",
  "comments": []
}
```

JSON is plain text — suitable for Git management or sharing via network folders.

### status values

| Value | Display |
|-------|---------|
| `open` | Open |
| `in_progress` | In Progress |
| `resolved` | Resolved |
| `closed` | Closed |

### priority values

| Value | Display |
|-------|---------|
| `high` | High |
| `medium` | Medium |
| `low` | Low |

---

## Development / Build

### Requirements

- Node.js 18+
- VS Code 1.85+

### Setup

```bash
npm install
npm run build
```

### Debug

Press `F5` in VS Code to launch the Extension Development Host.

### Build Scripts

| Command | Description |
|---------|-------------|
| `npm run compile` | Extension Host (TypeScript → CommonJS) |
| `npm run build:webview` | Webview (React+MUI → Vite bundle) |
| `npm run build` | Both of the above |
| `npm run watch` | Watch-compile Extension Host TypeScript |

### Creating a VSIX Package

```bash
npm run package
```

---

## License

MIT

---

# Rassure for VS Code — 操作マニュアル

ローカルフォルダに JSON ファイルとしてチケットを保存する、**サーバーレス・オフライン完結**の課題管理 VS Code 拡張です。  
データベースやサーバーの準備は一切不要。クローズドネットワーク環境でも動作します。

> [!WARNING]
> **本ツールは少人数・小規模チームでの運用を前提としています。**  
> チケットファイルへの排他制御・ロック機構は実装されていません。複数人が同じチケットを同時に編集した場合、後から保存した内容で上書きされ、変更が失われる可能性があります。  
> ネットワーク共有フォルダで運用する際は、**同じチケットを同時に編集しない**よう、チーム内でのルール付けをおすすめします。

---

## 目次

1. [インストール](#インストール)
2. [はじめに — 保存フォルダの設定](#はじめに--保存フォルダの設定)
3. [ボード画面](#ボード画面)
4. [絞り込み・検索](#絞り込み検索)
5. [チケットの作成](#チケットの作成)
6. [チケットの詳細・編集](#チケットの詳細編集)
7. [スマートジャンプ](#スマートジャンプ)
8. [コメントの追加](#コメントの追加)
9. [Excel エクスポート](#excel-エクスポート)
10. [設定のカスタマイズ](#設定のカスタマイズ)
11. [指摘種別のカスタマイズ](#指摘種別のカスタマイズ)
12. [チケットデータ形式（参考）](#チケットデータ形式参考)
13. [開発・ビルド](#開発ビルド)

---

## インストール

VS Code の拡張機能マーケットプレイスから **Rassure** を検索してインストールするか、`.vsix` ファイルを手動でインストールしてください。

**手動インストール（オフライン環境）:**

1. `.vsix` ファイルを入手する
2. VS Code のコマンドパレット（`Ctrl+Shift+P`）で `Extensions: Install from VSIX...` を実行する
3. ファイルを選択してインストール

---

## はじめに — 保存フォルダの設定

チケットを保存するフォルダを最初に設定します。

**コマンドパレット**（`Ctrl+Shift+P` / `Cmd+Shift+P`）を開き、以下のコマンドを実行します。

```
Rassure: ボードを開く
```

ボード画面が開くと、上部にフォルダ選択欄が表示されます。

フォルダの指定方法は 2 通りあります。

| 方法 | 操作 |
|------|------|
| パスを直接入力 | テキストボックスにパスを入力して Enter |
| ダイアログから選択 | 右端のフォルダアイコンをクリック |

選択したフォルダは記憶され、次回以降は自動入力されます。  
フォルダを変更したい場合は、コマンドを再実行するか、ボード右上の **「設定」ボタン**から変更できます。

> フォルダを切り替えると、開いている詳細画面は自動的に閉じられます。

---

## ボード画面

保存フォルダ内のチケットが一覧で表示されます。

### 列の構成

| 列 | 内容 |
|----|------|
| ID | チケット番号 |
| 状況 | 未着手 / 対応中 / 解決済 / クローズ |
| 重要度 | 高 / 中 / 低 |
| 指摘対象 | 対象ファイル・画面名など |
| 指摘種別 | カテゴリ |
| 説明 | チケット本文の冒頭 |
| 担当者 | 担当者名 |
| 期限 | 対応期限 |

### ボード右上のボタン

| ボタン | 機能 |
|--------|------|
| 新規 | 新しいチケットを作成する |
| Excel | チケット一覧を .xlsx に出力する |
| 設定 | 保存フォルダを変更する |

---

## 絞り込み・検索

### ステータスフィルター

ツールバーの **「ステータスフィルター」** ドロップダウンで、特定の状況のチケットのみ表示できます。

| 選択値 | 表示対象 |
|--------|----------|
| （すべて） | 全チケット |
| 未着手 | 未着手のみ |
| 対応中 | 対応中のみ |
| 解決済 | 解決済のみ |
| クローズ | クローズのみ |

### キーワード検索

**検索ボックス**に入力すると **ID・指摘対象・指摘種別・説明** を対象にリアルタイム絞り込みを行います（大文字小文字不問）。

ステータスフィルターと検索は同時に使用できます。

---

## チケットの作成

ボード右上の **「新規」ボタン**をクリックすると、チケット作成フォームが別タブで開きます。

### 入力項目

| 項目 | 説明 | 必須 |
|------|------|------|
| 説明 | 課題の内容 | ○ |
| 指摘対象 | 対象ファイル・画面名など | |
| 指摘種別 | カテゴリ（プルダウン） | |
| 状況 | 未着手 / 対応中 / 解決済 / クローズ | |
| 重要度 | 高 / 中 / 低 | |
| 担当者 | 担当者名 | |
| 期限 | 対応期限（日付ピッカー） | |
| 指摘者 | 登録者名（初期値は設定の表示名） | |

入力後、**「保存」ボタン**をクリックするとチケットが JSON ファイルとして保存フォルダに作成されます。  
チケット ID（`#001` など）は自動で採番されます。

---

## チケットの詳細・編集

ボードの行をクリックすると、詳細画面が別タブで開きます。

**「編集」ボタン**をクリックすると各フィールドが編集可能になります。

編集後、**「保存」ボタン**で変更を保存します。「キャンセル」で編集前の状態に戻ります。

---

## スマートジャンプ

詳細画面の **「指摘対象」** フィールドに値が入っている場合、右横に **「ファイルを開く」** アイコンが表示されます。  
クリックすると、参照先ファイルを VS Code のエディターで開きます（分割表示）。

### 対応するパス形式

| 形式 | 例 |
|------|----|
| 相対パス | `src/login.tsx` |
| 相対パス + 行番号（`:`） | `src/login.tsx:42` |
| 相対パス + 行番号（スペース + `L`） | `src/login.tsx L42` |
| 絶対パス | `C:\project\src\login.tsx` |

### 起点パスの決定順

1. **`targetRoot`** — ボードの設定ダイアログで設定した値（`rassure.json` に保存）
2. **ワークスペースフォルダ** — VS Code で現在開いているフォルダ
3. どちらも未設定の場合はエラー通知を表示

`targetRoot` はボード右上の **「設定」ダイアログ**（歯車アイコン）から設定できます。

---

## コメントの追加

詳細画面の下部にコメント入力欄があります。

本文を入力して **「コメントを追加」ボタン**をクリックすると、投稿日時・投稿者名とともにコメントが保存されます。  
コメントは時系列で表示され、チケット JSON ファイル内に記録されます。

---

## Excel エクスポート

ボード右上の **「Excel」ボタン**、またはコマンドパレットから実行できます。

```
Rassure: Excel にエクスポート
```

保存ダイアログが表示されるので、ファイル名と保存先を指定してください。

### 出力仕様

- Excel テーブル形式（`TableStyleMedium2`）で出力されるため、列ヘッダーのフィルター・並べ替えがすぐに使用できます
- コメントが複数ある場合は 1 セル内にまとめて出力され、折り返し表示が適用されます
- ボードを開いていなくても、設定済みのフォルダからチケットを読み込んで出力します

### 出力列

| 列 | 内容 |
|----|------|
| ID | チケット番号 |
| 状況 | 未着手 / 対応中 / 解決済 / クローズ |
| 重要度 | 高 / 中 / 低 |
| 指摘対象 | 対象ファイル・画面名など |
| 指摘種別 | カテゴリ |
| 説明 | チケット本文 |
| コメント | 日時・投稿者・本文を時系列で結合 |
| 指摘者 | 登録者名 |
| 担当者 | 担当者名 |
| 期限 | 対応期限 |
| 作成日 | 登録日時 |
| 更新日 | 最終更新日時 |

出力する列の順序・取捨選択は VS Code 設定でカスタマイズできます（[後述](#excel-エクスポートのカラムカスタマイズ)）。

---

## 設定のカスタマイズ

### ボード内設定ダイアログ

ボード右上の **「設定」ボタン**（歯車アイコン）から開く設定ダイアログで以下の項目を変更できます。

| 項目 | 説明 |
|------|------|
| チケット保存フォルダ | チケット JSON ファイルを保存するフォルダ。フォルダアイコンで参照可能。 |
| 指摘対象のルートパス | 「指摘対象」フィールドの相対パスを解決する起点フォルダ（[スマートジャンプ参照](#スマートジャンプ)）。空欄の場合はワークスペースフォルダを使用。 |

### VS Code 設定

`Ctrl+,`（Mac: `Cmd+,`）で VS Code の設定を開き、検索欄に **`Rassure`** と入力すると設定項目が表示されます。

| 設定キー | 既定値 | 説明 |
|---|---|---|
| `rassure-vscode.username` | （OS ユーザー名） | チケットに記録する表示名 |
| `rassure-vscode.idPrefix` | `#` | チケット ID・ファイル名の先頭に付与するプレフィックス |
| `rassure-vscode.exportColumnOrder` | 全 12 列 | Excel エクスポート時の列の順序・取捨選択 |

### チケット ID プレフィックスの変更

`rassure-vscode.idPrefix` を変更すると、**新規作成するチケット**のファイル名と ID が新しいプレフィックスで採番されます。

```
例: idPrefix を "No." に変更した場合
  新規チケット → No.001.json（id: "No.001"）
  既存チケット → #001.json のままで引き続き読み込まれます
```

- プレフィックスは最大 5 文字まで設定できます
- OS のファイル名禁止文字（`\ / : * ? " < > |`）は使用できません（設定画面でエラーが表示されます）
- プレフィックスを変更しても**既存チケットは削除・移動されません**。旧プレフィックスのファイルはそのまま一覧に表示されます

### Excel エクスポートのカラムカスタマイズ

`rassure-vscode.exportColumnOrder` では、出力する列の順序と項目を配列で指定します。

- リスト内の文字列を並べ替えると出力列の順序が変わります
- 不要な項目を削除するとその列は出力されません

| 指定値 | 列名（日本語） |
|--------|--------------|
| `ID` | ID |
| `status` | 状況 |
| `priority` | 重要度 |
| `target` | 指摘対象 |
| `category` | 指摘種別 |
| `description` | 説明 |
| `comments` | コメント |
| `reporter` | 指摘者 |
| `assignee` | 担当者 |
| `dueDate` | 期限 |
| `createdAt` | 作成日 |
| `updatedAt` | 更新日 |

---

## 指摘種別のカスタマイズ

チケット保存フォルダの `rassure.json`（JSON with Comments 形式）で、チケット作成・編集時の「指摘種別」プルダウンの選択肢をカスタマイズできます。

ファイルが存在しない場合は、ボードを開いた際に以下の内容で自動生成されます。

```json
{
  "categories": ["誤記", "記載不足", "要確認", "修正依頼", "質問"]
}
```

テキストエディタで `rassure.json` を編集し、ボードを再読み込みすると変更が反映されます。

> **旧バージョンからのマイグレーション:** フォルダに `categories` テキストファイルが存在し、かつ `rassure.json` が存在しない場合、ボードを開いた際に自動的に `rassure.json` へ変換されます。手動作業は不要です。

---

## チケットデータ形式（参考）

チケットは保存フォルダに `#001.json` のような形式で保存されます（プレフィックスは変更可能）。

```json
{
  "id": "#001",
  "description": "ログイン画面のボタンラベルに誤字あり",
  "target": "login.tsx",
  "category": "誤記",
  "status": "open",
  "priority": "medium",
  "assignee": "yamada",
  "dueDate": "2026-04-30",
  "reporter": "tanaka",
  "createdAt": "2026-04-12T09:00:00.000Z",
  "updatedAt": "2026-04-12T09:00:00.000Z",
  "comments": []
}
```

JSON はプレーンテキストなので Git 管理やネットワーク共有フォルダでのチーム共有が可能です。

### status の値

| 値 | 表示 |
|----|------|
| `open` | 未着手 |
| `in_progress` | 対応中 |
| `resolved` | 解決済 |
| `closed` | クローズ |

### priority の値

| 値 | 表示 |
|----|------|
| `high` | 高 |
| `medium` | 中 |
| `low` | 低 |

---

## 開発・ビルド

### 必要環境

- Node.js 18 以上
- VS Code 1.85 以上

### セットアップ

```bash
npm install
npm run build
```

### デバッグ実行

VS Code で `F5` を押すと Extension Development Host が起動します。

### ビルドスクリプト

| コマンド | 内容 |
|----------|------|
| `npm run compile` | Extension Host（TypeScript → CommonJS） |
| `npm run build:webview` | Webview（React+MUI → Vite バンドル） |
| `npm run build` | 上記両方を実行 |
| `npm run watch` | Extension Host の TypeScript 監視コンパイル |

### VSIX パッケージ作成

```bash
npm run package
```

---

## ライセンス

MIT
