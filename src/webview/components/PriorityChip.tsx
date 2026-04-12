import React from 'react';
import Chip from '@mui/material/Chip';
import { Ticket, PRIORITY_LABELS } from '../types';

const PRIORITY_COLORS: Record<Ticket['priority'], 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default'
};

interface Props {
  priority: Ticket['priority'];
  size?: 'small' | 'medium';
}

export const PriorityChip: React.FC<Props> = ({ priority, size = 'small' }) => (
  <Chip
    label={PRIORITY_LABELS[priority]}
    color={PRIORITY_COLORS[priority]}
    size={size}
  />
);
