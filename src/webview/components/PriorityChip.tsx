import React from 'react';
import Chip from '@mui/material/Chip';
import { useTranslation } from 'react-i18next';
import { Ticket } from '../types';

const PRIORITY_COLORS: Record<Ticket['priority'], 'error' | 'warning' | 'default'> = {
  high: 'error',
  medium: 'warning',
  low: 'default'
};

interface Props {
  priority: Ticket['priority'];
  size?: 'small' | 'medium';
}

export const PriorityChip: React.FC<Props> = ({ priority, size = 'small' }) => {
  const { t } = useTranslation();
  return (
    <Chip
      label={t(`priority.${priority}`)}
      color={PRIORITY_COLORS[priority]}
      size={size}
    />
  );
};
