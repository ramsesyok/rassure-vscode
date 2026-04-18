import React from 'react';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../types';

const STATUS_COLORS: Record<Ticket['status'], 'default' | 'primary' | 'success' | 'error'> = {
  open: 'default',
  in_progress: 'primary',
  resolved: 'success',
  closed: 'error'
};

interface Props {
  status: Ticket['status'];
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<Props> = ({ status, size = 'small' }) => {
  const { t } = useTranslation();
  return (
    <Chip
      label={t(`status.${status}`)}
      color={STATUS_COLORS[status]}
      size={size}
      variant="outlined"
    />
  );
};
