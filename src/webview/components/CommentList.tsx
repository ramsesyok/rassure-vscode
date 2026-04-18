import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { CommentBubble } from './CommentBubble';
import { Comment } from '../types';

interface Props {
  comments: Comment[];
  currentUser: string;
}

export const CommentList: React.FC<Props> = ({ comments, currentUser }) => {
  const { t } = useTranslation();
  if (!comments || comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        {t('comments.noComments')}
      </Typography>
    );
  }
  return (
    <Box>
      {comments.map(c => (
        <CommentBubble key={c.id} comment={c} currentUser={currentUser} />
      ))}
    </Box>
  );
};
