import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CircularProgress from '@mui/material/CircularProgress';
import { postRequest } from '../vscodeApi';
import { Settings } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const SettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const [folderPath, setFolderPath] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      postRequest<Settings>('getSettings').then(s => setFolderPath(s.folderPath ?? '')).catch(() => {});
    }
  }, [open]);

  const handleSelectFolder = async () => {
    try {
      const result = await postRequest<{ folderPath: string }>('selectFolder');
      if (result.folderPath) setFolderPath(result.folderPath);
    } catch {
      // user cancelled
    }
  };

  const handleSave = async () => {
    if (!folderPath.trim()) return;
    setLoading(true);
    try {
      await postRequest('saveSettings', { folderPath: folderPath.trim() });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>設定</DialogTitle>
      <DialogContent>
        <TextField
          label="チケット保存フォルダ"
          value={folderPath}
          onChange={e => setFolderPath(e.target.value)}
          fullWidth
          margin="normal"
          helperText="ローカルフォルダまたはWindowsネットワーク共有パス (例: \\server\share\tickets)"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleSelectFolder} edge="end">
                  <FolderOpenIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!folderPath.trim() || loading}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};
