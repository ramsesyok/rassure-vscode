import React, { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Fab from '@mui/material/Fab';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../types';
import { StatusChip } from './StatusChip';
import { PriorityChip } from './PriorityChip';
import { DueDateLabel } from './DueDateLabel';
import { CommentList } from './CommentList';
import { TicketForm } from './TicketForm';
import { postRequest, postNotification } from '../vscodeApi';
import dayjs from 'dayjs';

interface Props {
  ticket: Ticket;
  currentUser: string;
  onUpdated: () => void;
}

export const TicketDetail: React.FC<Props> = ({ ticket, currentUser, onUpdated }) => {
  const { t } = useTranslation();
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

  const metaCell = (label: string, value: React.ReactNode) => (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">{label}</Typography>
      <Box sx={{ mt: 0.25 }}>{value}</Box>
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
          {ticket.target || t('detail.noTarget')}
        </Typography>
        <Button size="small" startIcon={<EditIcon />} onClick={() => setEditOpen(true)}>
          {t('common.edit')}
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Description */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>{t('detail.description')}</Typography>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
              {ticket.description}
            </Typography>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={1}>
              <Grid item xs={4}>{metaCell(t('detail.target'),
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography variant="body2">{ticket.target || '—'}</Typography>
                  {ticket.target && (
                    <Tooltip title={t('detail.openTargetFile')}>
                      <IconButton size="small" onClick={() => postNotification('openTargetFile', { text: ticket.target })}>
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}</Grid>
              <Grid item xs={4}>{metaCell(t('detail.category'), <Typography variant="body2">{ticket.category || '—'}</Typography>)}</Grid>
              <Grid item xs={4}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 2 }}>
                  <StatusChip status={ticket.status} />
                  <PriorityChip priority={ticket.priority} />
                </Box>
              </Grid>
              <Grid item xs={4}>{metaCell(t('detail.reporter'), <Typography variant="body2">{ticket.reporter}</Typography>)}</Grid>
              <Grid item xs={4}>{metaCell(t('detail.assignee'), <Typography variant="body2">{ticket.assignee || '—'}</Typography>)}</Grid>
              <Grid item xs={4}>{metaCell(t('detail.dueDate'), <DueDateLabel dueDate={ticket.dueDate} />)}</Grid>
              <Grid item xs={4}>{metaCell(t('detail.createdAt'), <Typography variant="body2">{dayjs(ticket.createdAt).format('YYYY/MM/DD HH:mm')}</Typography>)}</Grid>
              <Grid item xs={4}>{metaCell(t('detail.updatedAt'), <Typography variant="body2">{dayjs(ticket.updatedAt).format('YYYY/MM/DD HH:mm')}</Typography>)}</Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Comments */}
        <Box>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            {t('detail.comments')} ({ticket.comments?.length ?? 0})
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
            placeholder={t('detail.commentPlaceholder')}
            value={commentBody}
            onChange={e => setCommentBody(e.target.value)}
            onKeyDown={handleKeyDown}
            inputRef={textRef}
            fullWidth
            size="small"
          />
          <Fab
            color="primary"
            size="small"
            onClick={handleAddComment}
            disabled={!commentBody.trim() || submitting}
          >
            {submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          </Fab>
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
