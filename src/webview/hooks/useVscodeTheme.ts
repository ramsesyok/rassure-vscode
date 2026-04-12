import { useState, useEffect } from 'react';
import { Theme } from '@mui/material/styles';
import { buildTheme } from '../theme';

function getMode(): 'light' | 'dark' {
  return document.body.classList.contains('vscode-light') ? 'light' : 'dark';
}

export function useVscodeTheme(): Theme {
  const [theme, setTheme] = useState(() => buildTheme(getMode()));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(buildTheme(getMode()));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return theme;
}
