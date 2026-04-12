/** Extension Host が <meta name="rassure-user"> に注入したユーザー名を読む */
export function useCurrentUser(): string {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="rassure-user"]');
  return meta?.content ?? '';
}
