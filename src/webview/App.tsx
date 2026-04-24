import React, { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import { AppToolbar } from './components/AppToolbar';
import { TicketTable } from './components/TicketTable';
import { SettingsDialog } from './components/SettingsDialog';
import { TicketForm } from './components/TicketForm';
import { useTicketList } from './hooks/useTicketList';
import { useCurrentUser } from './hooks/useCurrentUser';
import { postRequest } from './vscodeApi';
import { Ticket } from './types';

const ALL_STATUSES: Ticket['status'][] = ['open', 'in_progress', 'resolved', 'closed'];

const hideClosedDefault =
  document.querySelector<HTMLMetaElement>('meta[name="rassure-hide-closed"]')?.content === 'true';

export const App: React.FC = () => {
  const currentUser = useCurrentUser();
  const { tickets, loading, error, refresh } = useTicketList();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [newTicketOpen, setNewTicketOpen] = useState(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Ticket['status'][]>(() =>
    hideClosedDefault ? ALL_STATUSES.filter(s => s !== 'closed') : [...ALL_STATUSES]
  );
  const [searchKeyword, setSearchKeyword] = useState('');

  const availableStatuses = useMemo(() => {
    const set = new Set(tickets.map(t => t.status));
    return ALL_STATUSES.filter(s => set.has(s));
  }, [tickets]);

  const filteredTickets = tickets.filter(t => {
    if (!selectedStatuses.includes(t.status)) return false;
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return t.id.toLowerCase().includes(kw) || t.description.toLowerCase().includes(kw);
  });

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
        availableStatuses={availableStatuses}
        selectedStatuses={selectedStatuses}
        onStatusFilterChange={setSelectedStatuses}
        searchKeyword={searchKeyword}
        onSearchChange={setSearchKeyword}
      />
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <TicketTable
          tickets={filteredTickets}
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
