import React, { useState } from 'react';
import Box from '@mui/material/Box';
import { AppToolbar } from './components/AppToolbar';
import { TicketTable } from './components/TicketTable';
import { SettingsDialog } from './components/SettingsDialog';
import { TicketForm } from './components/TicketForm';
import { useTicketList } from './hooks/useTicketList';
import { useCurrentUser } from './hooks/useCurrentUser';
import { postRequest } from './vscodeApi';

export const App: React.FC = () => {
  const currentUser = useCurrentUser();
  const { tickets, loading, error, refresh } = useTicketList();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);

  const handleSelectTicket = (id: string) => {
    postRequest('openDetail', { id }).catch(() => {});
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <AppToolbar
        currentUser={currentUser}
        onNewTicket={() => setNewTicketOpen(true)}
        onRefresh={refresh}
        onOpenSettings={() => setSettingsOpen(true)}
      />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TicketTable
          tickets={tickets}
          loading={loading}
          error={error}
          onSelectTicket={handleSelectTicket}
        />
      </Box>

      <SettingsDialog
        open={settingsOpen}
        onClose={() => { setSettingsOpen(false); refresh(); }}
      />
      <TicketForm
        open={newTicketOpen}
        reporter={currentUser}
        onClose={() => setNewTicketOpen(false)}
        onSaved={refresh}
      />
    </Box>
  );
};
