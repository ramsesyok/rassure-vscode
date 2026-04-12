import React, { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import { Ticket } from '../types';
import { StatusChip } from './StatusChip';
import { PriorityChip } from './PriorityChip';
import { DueDateLabel } from './DueDateLabel';
import { CommentList } from './CommentList';
import { TicketForm } from './TicketForm';
import { postRequest } from '../vscodeApi';
import dayjs from 'dayjs';

interface Props {
  ticket: Ticket;
  currentUser: string;
  onUpdated: () => void;
}

export const TicketDetail: React.FC<Props> = ({ ticket, currentUser, onUpdated }) => {
  const [commentBody, setCommentBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleAddComment = useCallback(async () => {
    const body = commentBody.trim();
    if (!body) return;
    setSubmitting(true);
    try {
      await postRequest('addComment', { id: ticket.id, body });
      setCommentBody('');
      onUpdated();
    } finally {
      setSubmitting(false);
    }
  }, [commentBody, ticket.id, onUpdated]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      handleAddComment();
    }
  };

  const metaRow = (label: string, value: React.ReactNode) => (
    <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
      <Typography variant="body2" color="text.secondary" sx={{ minWidth: 80 }}>{label}</Typography>
      <Box>{value}</Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="h6" sx={{ flex: 1 }}>
          <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 1, fontFamily: 'monospace' }}>
            {ticket.id}
          </Typography>
          {ticket.target || '（指摘対象なし）'}
        </Typography>
        <Button size="small" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          編集
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Description */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>説明</Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
              {ticket.description}
            </Typography>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card variant="outlined">
          <CardContent>
            {metaRow('指摘種別', <Typography variant="body2">{ticket.category || '—'}</Typography>)}
            {metaRow('ステータス', <StatusChip status={ticket.status} />)}
            {metaRow('重要度', <PriorityChip priority={ticket.priority} />)}
            {metaRow('担当者', <Typography variant="body2">{ticket.assignee || '—'}</Typography>)}
            {metaRow('期限', <DueDateLabel dueDate={ticket.dueDate} />)}
            {metaRow('指摘者', <Typography variant="body2">{ticket.reporter}</Typography>)}
            {metaRow('作成日', <Typography variant="body2">{dayjs(ticket.createdAt).format('YYYY/MM/DD HH:mm')}</Typography>)}
            {metaRow('更新日', <Typography variant="body2">{dayjs(ticket.updatedAt).format('YYYY/MM/DD HH:mm')}</Typography>)}
          </CardContent>
        </Card>

        {/* Comments */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            コメント ({ticket.comments?.length ?? 0})
          </Typography>
          <CommentList comments={ticket.comments ?? []} currentUser={currentUser} />
        </Box>

        <Divider />

        {/* Comment input */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            multiline
            minRows={2}
            maxRows={6}
            placeholder="コメントを追加... (Ctrl+Enter で送信)"
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            onKeyDown={handleKeyDown}
            inputRef={textRef}
            fullWidth
            size="small"
          />
          <Button
            variant="contained"
            onClick={handleAddComment}
            disabled={!commentBody.trim() || submitting}
            sx={{ minWidth: 48, height: 40 }}
            startIcon={submitting ? <CircularProgress size={14} /> : <SendIcon />}
          >
            送信
          </Button>
        </Box>
      </Box>

      <TicketForm
        open={editOpen}
        ticket={ticket}
        reporter={currentUser}
        onClose={() => setEditOpen(false)}
        onSaved={onUpdated}
      />
    </Box>
  );
};
