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
import { postRequest } from '../vscodeApi';
import { Ticket } from '../types';

const STATUS_OPTIONS: { value: Ticket['status']; label: string }[] = [
  { value: 'open', label: '未着手' },
  { value: 'in_progress', label: '対応中' },
  { value: 'resolved', label: '解決済' },
  { value: 'closed', label: 'クローズ' }
];

const PRIORITY_OPTIONS: { value: Ticket['priority']; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' }
];

interface Props {
  open: boolean;
  ticket?: Partial<Ticket>;
  reporter: string;
  onClose: () => void;
  onSaved: () => void;
}

export const TicketForm: React.FC<Props> = ({ open, ticket, reporter, onClose, onSaved }) => {
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
  const [saving, setSaving] = useState(false);

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
      <DialogTitle>{isEdit ? 'チケット編集' : '新規チケット'}</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              label="説明 *"
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
              renderInput={params => <TextField {...params} label="指摘対象" fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>指摘種別</InputLabel>
              <Select value={category} onChange={e => setCategory(e.target.value)} label="指摘種別">
                <MenuItem value=""><em>未選択</em></MenuItem>
                {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>ステータス</InputLabel>
              <Select value={status} onChange={e => setStatus(e.target.value as Ticket['status'])} label="ステータス">
                {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>重要度</InputLabel>
              <Select value={priority} onChange={e => setPriority(e.target.value as Ticket['priority'])} label="重要度">
                {PRIORITY_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="担当者"
              value={assignee}
              onChange={e => setAssignee(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="期限"
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
        <Button onClick={onClose}>キャンセル</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!description.trim() || saving}
          startIcon={saving ? <CircularProgress size={16} /> : undefined}
        >
          保存
        </Button>
      </DialogActions>
    </Dialog>
  );
};
