import { createTheme, Theme } from '@mui/material/styles';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

export function buildTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      // MUI の色計算（alpha/darken/lighten）が走るためパレットには CSS 変数を渡さない。
      // mode のみ指定し、背景・文字色は CssBaseline の styleOverrides でオーバーライドする。
      mode,
    },
    typography: {
      fontFamily: 'Roboto, sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          body {
            background-color: var(--vscode-editor-background) !important;
            color: var(--vscode-editor-foreground) !important;
          }
          .MuiPaper-root, .MuiCard-root {
            background-color: var(--vscode-editorWidget-background, var(--vscode-editor-background)) !important;
            color: var(--vscode-editor-foreground) !important;
          }
          .MuiTableCell-root {
            color: var(--vscode-editor-foreground) !important;
            border-bottom-color: var(--vscode-panel-border) !important;
          }
          .MuiDivider-root {
            border-color: var(--vscode-panel-border) !important;
          }
          .MuiTypography-colorTextSecondary,
          .MuiTypography-root.MuiTypography-colorTextSecondary {
            color: var(--vscode-descriptionForeground) !important;
          }
        `,
      },
    },
  });
}
