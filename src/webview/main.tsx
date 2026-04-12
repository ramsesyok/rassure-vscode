import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme';
import { App } from './App';
import { DetailApp } from './DetailApp';

// <meta name="rassure-ticket-id"> が存在すれば DetailView、なければ BoardView
const ticketMeta = document.querySelector<HTMLMetaElement>('meta[name="rassure-ticket-id"]');
const isDetailView = Boolean(ticketMeta?.content);

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isDetailView ? <DetailApp /> : <App />}
    </ThemeProvider>
  );
}
