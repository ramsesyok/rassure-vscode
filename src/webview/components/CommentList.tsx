import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { CommentBubble } from './CommentBubble';
import { Comment } from '../types';

interface Props {
  comments: Comment[];
  currentUser: string;
}

export const CommentList: React.FC<Props> = ({ comments, currentUser }) => {
  if (!comments || comments.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
        コメントはありません
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
