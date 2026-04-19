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
4. [Creating a Ticket](#creating-a-ticket)
5. [Ticket Detail / Edit](#ticket-detail--edit)
6. [Adding Comments](#adding-comments)
7. [Excel Export](#excel-export)
8. [Settings Customization](#settings-customization)
9. [Category Customization](#category-customization)
10. [Ticket Data Format (Reference)](#ticket-data-format-reference)
11. [Development / Build](#development--build)

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

Place a plain-text file named `categories` in the ticket storage folder to customize the category dropdown options.

If the file does not exist, it is auto-generated when the board opens with the following defaults:

```
Typo
Missing Info
Needs Review
Change Request
Question
```

Edit it freely in a text editor — one category per line. Reload the board to apply changes.

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
4. [チケットの作成](#チケットの作成)
5. [チケットの詳細・編集](#チケットの詳細編集)
6. [コメントの追加](#コメントの追加)
7. [Excel エクスポート](#excel-エクスポート)
8. [設定のカスタマイズ](#設定のカスタマイズ)
9. [指摘種別のカスタマイズ](#指摘種別のカスタマイズ)
10. [チケットデータ形式（参考）](#チケットデータ形式参考)
11. [開発・ビルド](#開発ビルド)

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

チケット保存フォルダに `categories` というテキストファイルを置くと、チケット作成・編集時の「指摘種別」プルダウンの選択肢をカスタマイズできます。

ファイルが存在しない場合は、ボードを開いた際に以下の内容で自動生成されます。

```
誤記
記載不足
要確認
修正依頼
質問
```

1 行 1 カテゴリの形式でテキストエディタから自由に編集できます。編集後にボードを再読み込みすると反映されます。

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
