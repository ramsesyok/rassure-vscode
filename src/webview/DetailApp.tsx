import React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { TicketDetail } from './components/TicketDetail';
import { useTicketDetail } from './hooks/useTicketDetail';
import { useCurrentUser } from './hooks/useCurrentUser';

export const DetailApp: React.FC = () => {
  // Extension Host が <meta name="rassure-ticket-id"> に注入
  const meta = document.querySelector<HTMLMetaElement>('meta[name="rassure-ticket-id"]');
  const ticketId = meta?.content ?? '';
  const currentUser = useCurrentUser();
  const { ticket, loading, error, refresh } = useTicketDetail(ticketId);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error ?? 'チケットが見つかりません'}</Typography>
      </Box>
    );
  }

  return <TicketDetail ticket={ticket} currentUser={currentUser} onUpdated={refresh} />;
};
