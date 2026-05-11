import { Ticket } from '../types';

export type TicketFileExtension = '.json' | '.md';

export interface TicketSerializer {
  readonly extension: TicketFileExtension;
  parse(content: string): Ticket;
  stringify(ticket: Ticket): string;
}
