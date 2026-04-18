import * as vscode from 'vscode';
import * as ja from './nls/ja.json';
import * as en from './nls/en.json';

type NlsKey = keyof typeof ja;
type Messages = Record<NlsKey, string>;

function resolveLocale(): string {
  const lang = vscode.env.language ?? 'en';
  return lang.startsWith('ja') ? 'ja' : 'en';
}

const MESSAGES: Record<string, Messages> = { ja, en };

export function t(key: NlsKey, ...args: (string | number)[]): string {
  const locale = resolveLocale();
  const messages = MESSAGES[locale] ?? MESSAGES['en'];
  let str = messages[key] ?? (MESSAGES['en'][key] as string) ?? key;
  args.forEach((arg, i) => {
    str = str.replace(`{${i}}`, String(arg));
  });
  return str;
}

export function getLocale(): string {
  return resolveLocale();
}
