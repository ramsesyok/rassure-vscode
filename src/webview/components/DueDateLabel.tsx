import React from 'react';
import Typography from '@mui/material/Typography';
import dayjs from 'dayjs';

interface Props {
  dueDate: string;
}

export const DueDateLabel: React.FC<Props> = ({ dueDate }) => {
  if (!dueDate) return <Typography variant="body2" color="text.secondary">—</Typography>;

  const today = dayjs().startOf('day');
  const due = dayjs(dueDate);
  const isOverdue = due.isBefore(today);
  const isNear = !isOverdue && due.diff(today, 'day') <= 3;

  const color = isOverdue ? 'error' : isNear ? 'warning.main' : 'text.primary';

  return (
    <Typography variant="body2" color={color} sx={{ fontWeight: isOverdue ? 700 : 400 }}>
      {due.format('YYYY/MM/DD')}
      {isOverdue && ' ⚠'}
    </Typography>
  );
};
