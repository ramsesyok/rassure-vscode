import matter from 'gray-matter';
import { Comment, Ticket } from '../types';
import { TicketSerializer } from './types';

const TARGET_HEADING = '## 指摘対象';
const COMMENTS_HEADING = '## Comments';
const COMMENT_HEAD_RE = /^### (\S+) — (.+)$/;
const COMMENT_ID_RE = /^<!-- id: (.+?) -->$/;
const TITLE_DESCRIPTION_LENGTH = 15;

interface FrontMatter {
  title?: string;
  type?: string;
  tags?: unknown;
  aliases?: unknown;
  id?: string;
  status?: Ticket['status'];
  priority?: Ticket['priority'];
  target?: string;
  category?: string;
  assignee?: string;
  dueDate?: string;
  reporter?: string;
  createdAt?: string;
  updatedAt?: string;
}

export class MarkdownSerializer implements TicketSerializer {
  readonly extension = '.md' as const;

  stringify(ticket: Ticket): string {
    const fm: Record<string, unknown> = {
      title: buildTitle(ticket),
      type: 'rassure-ticket',
      tags: buildTags(ticket),
      aliases: [ticket.id],
      id: ticket.id,
      status: ticket.status,
      priority: ticket.priority,
      target: ticket.target,
      category: ticket.category,
      assignee: ticket.assignee,
      dueDate: ticket.dueDate,
      reporter: ticket.reporter,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
    };

    const sections: string[] = [];
    const description = (ticket.description ?? '').trim();
    if (description) {
      sections.push(description);
    }

    if (ticket.target && ticket.target.trim()) {
      sections.push(`${TARGET_HEADING}\n\n${ticket.target.trim()}`);
    }

    const comments = ticket.comments ?? [];
    if (comments.length > 0) {
      const commentsBody = comments.map(formatComment).join('\n\n');
      sections.push(`${COMMENTS_HEADING}\n\n${commentsBody}`);
    }

    const body = sections.join('\n\n');
    return matter.stringify(body ? `\n${body}\n` : '\n', fm);
  }

  parse(content: string): Ticket {
    const parsed = matter(content);
    const fm = (parsed.data ?? {}) as FrontMatter;
    const body = parsed.content ?? '';

    const { description, commentsBlock } = splitBody(body);
    const comments = parseComments(commentsBlock);

    return {
      id: stringOr(fm.id, ''),
      description,
      target: stringOr(fm.target, ''),
      category: stringOr(fm.category, ''),
      status: (fm.status ?? 'open') as Ticket['status'],
      priority: (fm.priority ?? 'medium') as Ticket['priority'],
      assignee: stringOr(fm.assignee, ''),
      dueDate: stringOr(fm.dueDate, ''),
      reporter: stringOr(fm.reporter, ''),
      createdAt: stringOr(fm.createdAt, ''),
      updatedAt: stringOr(fm.updatedAt, ''),
      comments,
    };
  }
}

function buildTitle(ticket: Ticket): string {
  const normalized = (ticket.description ?? '').replace(/\s+/g, ' ').trim();
  const head = normalized.slice(0, TITLE_DESCRIPTION_LENGTH);
  return head ? `${ticket.id} — ${head}` : ticket.id;
}

function buildTags(ticket: Ticket): string[] {
  const tags = ['rassure', 'ticket'];
  const category = (ticket.category ?? '').trim();
  if (category) {
    tags.push(category);
  }
  return tags;
}

function formatComment(comment: Comment): string {
  const head = `### ${comment.timestamp} — ${comment.author}`;
  const idLine = `<!-- id: ${comment.id} -->`;
  const body = (comment.body ?? '').trim();
  return body
    ? `${head}\n${idLine}\n\n${body}`
    : `${head}\n${idLine}`;
}

function splitBody(body: string): { description: string; commentsBlock: string } {
  const lines = body.split(/\r?\n/);

  let commentsStart = -1;
  let targetStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (commentsStart === -1 && line === COMMENTS_HEADING) {
      commentsStart = i;
    }
    if (targetStart === -1 && line === TARGET_HEADING) {
      targetStart = i;
    }
  }

  // description ends at the first '## ' heading (whichever comes first)
  const headingIndexes = [targetStart, commentsStart].filter(i => i >= 0);
  const descriptionEnd = headingIndexes.length > 0 ? Math.min(...headingIndexes) : lines.length;
  const description = trimBlankLines(lines.slice(0, descriptionEnd)).join('\n');

  const commentsBlock = commentsStart >= 0
    ? lines.slice(commentsStart + 1).join('\n')
    : '';

  return { description, commentsBlock };
}

function parseComments(block: string): Comment[] {
  if (!block.trim()) {
    return [];
  }

  const lines = block.split(/\r?\n/);
  const comments: Comment[] = [];
  let current: { timestamp: string; author: string; id?: string; bodyLines: string[] } | null = null;

  const flush = (): void => {
    if (!current) { return; }
    const id = current.id ?? generateCommentId();
    comments.push({
      id,
      author: current.author,
      timestamp: current.timestamp,
      body: trimBlankLines(current.bodyLines).join('\n'),
    });
    current = null;
  };

  for (const line of lines) {
    const headMatch = line.match(COMMENT_HEAD_RE);
    if (headMatch) {
      flush();
      current = {
        timestamp: headMatch[1],
        author: headMatch[2].trim(),
        bodyLines: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    const idMatch = line.match(COMMENT_ID_RE);
    if (idMatch && current.bodyLines.length === 0 && current.id === undefined) {
      current.id = idMatch[1].trim();
      continue;
    }

    current.bodyLines.push(line);
  }
  flush();

  return comments;
}

function trimBlankLines(lines: string[]): string[] {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') { start++; }
  while (end > start && lines[end - 1].trim() === '') { end--; }
  return lines.slice(start, end);
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function generateCommentId(): string {
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
