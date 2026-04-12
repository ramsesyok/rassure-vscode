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
import { Ticket } from '../types';
import { StatusChip } from './StatusChip';
import { PriorityChip } from './PriorityChip';
import { DueDateLabel } from './DueDateLabel';

type SortKey = 'id' | 'target' | 'status' | 'priority' | 'assignee' | 'dueDate';

interface Props {
  tickets: Ticket[];
  loading: boolean;
  error: string | null;
  onSelectTicket: (id: string) => void;
}

export const TicketTable: React.FC<Props> = ({ tickets, loading, error, onSelectTicket }) => {
  const [sortKey, setSortKey] = useState<SortKey>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
    <TableContainer component={Paper} elevation={0} sx={{ flex: 1, overflow: 'auto' }}>
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 80 }}><SortHeader label="ID" k="id" /></TableCell>
            <TableCell sx={{ width: 120 }}><SortHeader label="指摘対象" k="target" /></TableCell>
            <TableCell>説明</TableCell>
            <TableCell sx={{ width: 120 }}>指摘種別</TableCell>
            <TableCell sx={{ width: 110 }}><SortHeader label="ステータス" k="status" /></TableCell>
            <TableCell sx={{ width: 80 }}><SortHeader label="重要度" k="priority" /></TableCell>
            <TableCell sx={{ width: 100 }}><SortHeader label="担当者" k="assignee" /></TableCell>
            <TableCell sx={{ width: 110 }}><SortHeader label="期限" k="dueDate" /></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center">
                <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                  チケットがありません
                </Typography>
              </TableCell>
            </TableRow>
          ) : sorted.map(ticket => (
            <TableRow
              key={ticket.id}
              hover
              onClick={() => onSelectTicket(ticket.id)}
              sx={{ cursor: 'pointer' }}
            >
              <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>{ticket.id}</TableCell>
              <TableCell>{ticket.target}</TableCell>
              <TableCell>
                <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
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
  );
};
