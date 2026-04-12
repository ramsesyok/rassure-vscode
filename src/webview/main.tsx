import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useVscodeTheme } from './hooks/useVscodeTheme';
import { App } from './App';
import { DetailApp } from './DetailApp';

// <meta name="rassure-ticket-id"> が存在すれば DetailView、なければ BoardView
const ticketMeta = document.querySelector<HTMLMetaElement>('meta[name="rassure-ticket-id"]');
const isDetailView = Boolean(ticketMeta?.content);

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  override render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, color: 'red', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <b>Render Error:</b>{'\n'}{this.state.error.message}{'\n'}{this.state.error.stack}
        </div>
      );
    }
    return this.props.children;
  }
}

const Root: React.FC = () => {
  const theme = useVscodeTheme();
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isDetailView ? <DetailApp /> : <App />}
    </ThemeProvider>
  );
};

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <Root />
    </ErrorBoundary>
  );
}
