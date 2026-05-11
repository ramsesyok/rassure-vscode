import { TicketFormat } from '../types';
import { JsonSerializer } from './JsonSerializer';
import { MarkdownSerializer } from './MarkdownSerializer';
import { TicketSerializer } from './types';

const jsonSerializer = new JsonSerializer();
const markdownSerializer = new MarkdownSerializer();

export function getSerializer(format: TicketFormat): TicketSerializer {
  return format === 'markdown' ? markdownSerializer : jsonSerializer;
}

export function getSerializerByFileName(fileName: string): TicketSerializer | undefined {
  if (fileName.endsWith('.md')) { return markdownSerializer; }
  if (fileName.endsWith('.json')) { return jsonSerializer; }
  return undefined;
}

export { jsonSerializer, markdownSerializer };
export type { TicketSerializer } from './types';
