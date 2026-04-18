import React from 'react';
import MuiToolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import { useTranslation } from 'react-i18next';

interface Props {
  currentUser: string;
  onNewTicket: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const AppToolbar: React.FC<Props> = ({ currentUser, onNewTicket, onRefresh, onOpenSettings }) => {
  const { t } = useTranslation();
  return (
    <AppBar position="static" elevation={1}>
      <MuiToolbar variant="dense">
        <FolderSharedIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 700 }}>
          Rassure
        </Typography>
        <Typography variant="body2" sx={{ mr: 2, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <PersonIcon fontSize="small" />
          {currentUser}
        </Typography>
        <Tooltip title={t('toolbar.newTicket')}>
          <IconButton color="inherit" onClick={onNewTicket} size="small">
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('toolbar.refresh')}>
          <IconButton color="inherit" onClick={onRefresh} size="small">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('toolbar.settings')}>
          <IconButton color="inherit" onClick={onOpenSettings} size="small">
            <SettingsIcon />
          </IconButton>
        </Tooltip>
      </MuiToolbar>
    </AppBar>
  );
};
