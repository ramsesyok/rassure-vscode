import React, { useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../types';
import { StatusChip } from './StatusChip';
import { PriorityChip } from './PriorityChip';
import { DueDateLabel } from './DueDateLabel';

type SortKey = 'id' | 'target' | 'category' | 'status' | 'priority' | 'assignee' | 'dueDate';

const ALL_STATUSES: Ticket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

interface Props {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  onSelectTicket: (id: string) => void;
  onChangeStatus: (id: string, status: Ticket['status']) => void;
}

interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  ticket: Ticket;
}

export const TicketTable: React.FC<Props> = ({ tickets, loading, error, onSelectTicket, onChangeStatus }) => {
  const { t } = useTranslation();
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...tickets].sort((a, b) => {
    const av = String(a[sortKey] ?? '');
    const bv = String(b[sortKey] ?? '');
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
  });

  const handleContextMenu = (event: React.MouseEvent, ticket: Ticket) => {
    event.preventDefault();
    setContextMenu({ mouseX: event.clientX, mouseY: event.clientY, ticket });
  };

  const handleCloseMenu = () => {
    setContextMenu(null);
  };

  const handleStatusSelect = (status: Ticket['status']) => {
    if (contextMenu) {
      onChangeStatus(contextMenu.ticket.id, status);
    }
    handleCloseMenu();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  const SortHeader = ({ label, k }: { label: string; k: SortKey }) => (
    <TableSortLabel active={sortKey === k} direction={sortKey === k ? sortDir : 'asc'} onClick={() => handleSort(k)}>
      {label}
    </TableSortLabel>
  );

  return (
    <>
      <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 80 }}><SortHeader label={t('table.id')} k="id" /></TableCell>
              <TableCell sx={{ width: 120 }}><SortHeader label={t('table.target')} k="target" /></TableCell>
              <TableCell sx={{ minWidth: 200 }}>{t('table.description')}</TableCell>
              <TableCell sx={{ width: 120 }}><SortHeader label={t('table.category')} k="category" /></TableCell>
              <TableCell sx={{ width: 110 }}><SortHeader label={t('table.status')} k="status" /></TableCell>
              <TableCell sx={{ width: 90, minWidth: 100 }}><SortHeader label={t('table.priority')} k="priority" /></TableCell>
              <TableCell sx={{ width: 100 }}><SortHeader label={t('table.assignee')} k="assignee" /></TableCell>
              <TableCell sx={{ width: 110, whiteSpace: 'nowrap' }}><SortHeader label={t('table.dueDate')} k="dueDate" /></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                    {t('table.noTickets')}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : sorted.map(ticket => (
              <TableRow
                key={ticket.id}
                hover
                onClick={() => onSelectTicket(ticket.id)}
                onContextMenu={(e) => handleContextMenu(e, ticket)}
                sx={{ cursor: 'pointer' }}
              >
                <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{ticket.id}</TableCell>
                <TableCell>{ticket.target}</TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {ticket.description}
                  </Typography>
                </TableCell>
                <TableCell>{ticket.category}</TableCell>
                <TableCell><StatusChip status={ticket.status} /></TableCell>
                <TableCell><PriorityChip priority={ticket.priority} /></TableCell>
                <TableCell>{ticket.assignee}</TableCell>
                <TableCell><DueDateLabel dueDate={ticket.dueDate} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Menu
        open={contextMenu !== null}
        onClose={handleCloseMenu}
        anchorReference="anchorPosition"
        anchorPosition={contextMenu ? { top: contextMenu.mouseY, left: contextMenu.mouseX } : undefined}
      >
        <ListSubheader sx={{ lineHeight: '32px' }}>{t('contextMenu.changeStatus')}</ListSubheader>
        {ALL_STATUSES.map(status => (
          <MenuItem
            key={status}
            onClick={() => handleStatusSelect(status)}
            disabled={contextMenu?.ticket.status === status}
            selected={contextMenu?.ticket.status === status}
          >
            <StatusChip status={status} />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};
