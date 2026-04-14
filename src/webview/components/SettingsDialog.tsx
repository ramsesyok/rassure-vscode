import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Checkbox from '@mui/material/Checkbox';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CircularProgress from '@mui/material/CircularProgress';
import { postRequest } from '../vscodeApi';
import { Settings } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

// 全カラムのマスター定義（並び順の基準）
const ALL_COLUMNS = ['ID','状況','重要度','指摘対象','指摘種別','説明','コメント','指摘者','担当者','期限','作成日','更新日'];

type ColumnItem = { name: string; enabled: boolean };

/** 保存済み順序（有効列のみ）から ColumnItem 配列を組み立てる */
function buildColumnItems(savedOrder: string[]): ColumnItem[] {
  const enabledSet = new Set(savedOrder);
  // 有効列を保存順で先に並べ、無効列はマスター順で末尾に追加
  const result: ColumnItem[] = savedOrder.map(name => ({ name, enabled: true }));
  for (const name of ALL_COLUMNS) {
    if (!enabledSet.has(name)) {
      result.push({ name, enabled: false });
    }
  }
  return result;
}

/** ColumnItem 配列から保存用配列（有効列のみ）を生成 */
function toSavedOrder(items: ColumnItem[]): string[] {
  return items.filter(c => c.enabled).map(c => c.name);
}

export const SettingsDialog: React.FC<Props> = ({ open, onClose }) => {
  const [folderPath, setFolderPath] = useState('');
  const [columns, setColumns] = useState<ColumnItem[]>(() => buildColumnItems(ALL_COLUMNS));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    postRequest<Settings>('getSettings').then(s => setFolderPath(s.folderPath ?? '')).catch(() => {});
    postRequest<string[]>('getExportColumnOrder').then(order => {
      setColumns(buildColumnItems(order));
    }).catch(() => {});
  }, [open]);

  const handleSelectFolder = async () => {
    try {
      const result = await postRequest<{ folderPath: string }>('selectFolder');
      if (result.folderPath) setFolderPath(result.folderPath);
    } catch {
      // user cancelled
    }
  };

  const handleToggle = (idx: number) => {
    setColumns(prev => prev.map((c, i) => i === idx ? { ...c, enabled: !c.enabled } : c));
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    setColumns(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  };

  const handleMoveDown = (idx: number) => {
    setColumns(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  };

  const handleSave = async () => {
    if (!folderPath.trim()) return;
    setLoading(true);
    try {
      await postRequest('saveSettings', { folderPath: folderPath.trim() });
      await postRequest('saveExportColumnOrder', { order: toSavedOrder(columns) });
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

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Excelエクスポート — カラム順序
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          チェックで出力対象を選択し、上下ボタンで列順を変更します。
        </Typography>

        <List dense disablePadding>
          {columns.map((col, idx) => (
            <ListItem
              key={col.name}
              disablePadding
              sx={{ py: 0.25 }}
              secondaryAction={
                <>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    aria-label="上に移動"
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === columns.length - 1}
                    aria-label="下に移動"
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </>
              }
            >
              <Checkbox
                edge="start"
                checked={col.enabled}
                onChange={() => handleToggle(idx)}
                size="small"
                tabIndex={-1}
                disableRipple
              />
              <ListItemText primary={col.name} />
            </ListItem>
          ))}
        </List>
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
