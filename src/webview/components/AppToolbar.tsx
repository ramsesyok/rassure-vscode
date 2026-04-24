import React from 'react';
import MuiToolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import OutlinedInput from '@mui/material/OutlinedInput';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import SettingsIcon from '@mui/icons-material/Settings';
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../types';

interface Props {
  currentUser: string;
  onNewTicket: () => void;
  onRefresh: () => void;
  onOpenSettings: () => void;
  availableStatuses: Ticket['status'][];
  selectedStatuses: Ticket['status'][];
  onStatusFilterChange: (statuses: Ticket['status'][]) => void;
  searchKeyword: string;
  onSearchChange: (keyword: string) => void;
}

export const AppToolbar: React.FC<Props> = ({
  currentUser,
  onNewTicket,
  onRefresh,
  onOpenSettings,
  availableStatuses,
  selectedStatuses,
  onStatusFilterChange,
  searchKeyword,
  onSearchChange,
}) => {
  const { t } = useTranslation();

  const handleStatusChange = (event: SelectChangeEvent<Ticket['status'][]>) => {
    const val = event.target.value;
    onStatusFilterChange(typeof val === 'string' ? [val as Ticket['status']] : val);
  };

  const inputSx = {
    color: 'inherit',
    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
    '& .MuiSelect-icon': { color: 'inherit' },
  };

  return (
    <AppBar position="static" elevation={1}>
      <MuiToolbar variant="dense">
        <FolderSharedIcon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div" sx={{ fontWeight: 700, mr: 2 }}>
          Rassure
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* キーワード検索 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, opacity: 0.8 }}>
          <SearchIcon fontSize="small" sx={{ mr: 0.5 }} />
          <InputBase
            type="search"
            value={searchKeyword}
            onChange={e => onSearchChange(e.target.value)}
            placeholder={t('toolbar.searchPlaceholder')}
            size="small"
            sx={{
              color: 'inherit',
              fontSize: 13,
              width: 160,
              '& input::placeholder': { color: 'inherit', opacity: 0.6 },
              '& input::-webkit-search-cancel-button': { cursor: 'pointer' },
            }}
          />
        </Box>

        {/* ステータスフィルタ */}
        <FormControl size="small" sx={{ minWidth: 160, mr: 2 }}>
          <Select
            multiple
            displayEmpty
            value={selectedStatuses}
            onChange={handleStatusChange}
            input={<OutlinedInput sx={inputSx} />}
            renderValue={selected => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map(s => (
                  <Chip
                    key={s}
                    label={t(`status.${s}`)}
                    size="small"
                    sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.6)', height: 18, fontSize: 11 }}
                    variant="outlined"
                  />
                ))}
              </Box>
            )}
          >
            {availableStatuses.map(s => (
              <MenuItem key={s} value={s}>
                {t(`status.${s}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

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
