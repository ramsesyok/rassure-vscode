import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Paper from '@mui/material/Paper';
import dayjs from 'dayjs';
import { Comment } from '../types';

function hashColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash) % 360;
  return `hsl(${h}, 55%, 45%)`;
}

interface Props {
  comment: Comment;
  currentUser: string;
}

export const CommentBubble: React.FC<Props> = ({ comment, currentUser }) => {
  const isOwn = comment.author === currentUser;
  const initial = comment.author.charAt(0).toUpperCase();
  const bgColor = hashColor(comment.author);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isOwn ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
        mb: 1.5
      }}
    >
      {!isOwn && (
        <Avatar sx={{ bgcolor: bgColor, width: 32, height: 32, fontSize: 14 }}>
          {initial}
        </Avatar>
      )}
      <Box sx={{ maxWidth: '70%' }}>
        {!isOwn && (
          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
            {comment.author}
          </Typography>
        )}
        <Paper
          elevation={0}
          sx={{
            p: 1.2,
            bgcolor: isOwn ? 'primary.main' : 'grey.100',
            color: isOwn ? 'primary.contrastText' : 'text.primary',
            borderRadius: 2,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}
        >
          <Typography variant="body2">{comment.body}</Typography>
        </Paper>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.3, display: 'block', textAlign: isOwn ? 'right' : 'left' }}>
          {dayjs(comment.timestamp).format('MM/DD HH:mm')}
        </Typography>
      </Box>
    </Box>
  );
};
