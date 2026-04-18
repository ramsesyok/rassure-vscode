import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Autocomplete from '@mui/material/Autocomplete';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import { useTranslation } from 'react-i18next';
import { postRequest } from '../vscodeApi';
import { Ticket } from '../types';

interface Props {
  open: boolean;
  ticket?: Partial<Ticket>;
  reporter: string;
  onClose: () => void;
  onSaved: () => void;
}

export const TicketForm: React.FC<Props> = ({ open, ticket, reporter, onClose, onSaved }) => {
  const { t } = useTranslation();
  const isEdit = Boolean(ticket?.id);

  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<Ticket['status']>('open');
  const [priority, setPriority] = useState<Ticket['priority']>('medium');
  const [assignee, setAssignee] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [targetSuggestions, setTargetSuggestions] = useState<string[]>([]);
  const [assigneeSuggestions, setAssigneeSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const STATUS_OPTIONS: { value: Ticket['status']; label: string }[] = [
    { value: 'open',        label: t('status.open') },
    { value: 'in_progress', label: t('status.in_progress') },
    { value: 'resolved',    label: t('status.resolved') },
    { value: 'closed',      label: t('status.closed') },
  ];

  const PRIORITY_OPTIONS: { value: Ticket['priority']; label: string }[] = [
    { value: 'high',   label: t('priority.high') },
    { value: 'medium', label: t('priority.medium') },
    { value: 'low',    label: t('priority.low') },
  ];

  useEffect(() => {
    if (open) {
      setDescription(ticket?.description ?? '');
      setTarget(ticket?.target ?? '');
      setCategory(ticket?.category ?? '');
      setStatus(ticket?.status ?? 'open');
      setPriority(ticket?.priority ?? 'medium');
      setAssignee(ticket?.assignee ?? '');
      setDueDate(ticket?.dueDate ?? '');

      postRequest<string[]>('getCategories').then(setCategories).catch(() => setCategories([]));
      postRequest<string[]>('getTargetSuggestions').then(setTargetSuggestions).catch(() => setTargetSuggestions([]));
      postRequest<string[]>('getAssigneeSuggestions').then(setAssigneeSuggestions).catch(() => setAssigneeSuggestions([]));
    }
  }, [open, ticket]);

  const handleSave = async () => {
    if (!description.trim()) return;
    setSaving(true);
    try {
      await postRequest('saveTicket', {
        ...(ticket?.id ? { id: ticket.id } : {}),
        description: description.trim(),
        target: target.trim(),
        category,
        status,
        priority,
        assignee: assignee.trim(),
        dueDate,
        reporter: ticket?.reporter ?? reporter
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{isEdit ? t('form.editTicket') : t('form.newTicket')}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label={t('form.description')}
              value={description}
              onChange={e => setDescription(e.target.value)}
              multiline
              rows={5}
              fullWidth
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Autocomplete
              freeSolo
              options={targetSuggestions}
              value={target}
              onInputChange={(_, v) => setTarget(v)}
              renderInput={params => <TextField {...params} label={t('form.target')} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>{t('form.category')}</InputLabel>
              <Select value={category} onChange={e => setCategory(e.target.value)} label={t('form.category')}>
                <MenuItem value=""><em>{t('form.noneSelected')}</em></MenuItem>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('form.status')}</InputLabel>
              <Select value={status} onChange={e => setStatus(e.target.value as Ticket['status'])} label={t('form.status')}>
                {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>{t('form.priority')}</InputLabel>
              <Select value={priority} onChange={e => setPriority(e.target.value as Ticket['priority'])} label={t('form.priority')}>
                {PRIORITY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Autocomplete
              freeSolo
              options={assigneeSuggestions}
              value={assignee}
              onInputChange={(_, v) => setAssignee(v)}
              renderInput={params => <TextField {...params} label={t('form.assignee')} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label={t('form.dueDate')}
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!description.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
