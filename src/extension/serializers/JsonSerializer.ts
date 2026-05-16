import { Ticket } from '../types';
import { TicketSerializer } from './types';

export class JsonSerializer implements TicketSerializer {
  readonly extension = '.json' as const;

  parse(content: string): Ticket {
    return JSON.parse(content) as Ticket;
  }

  stringify(ticket: Ticket): string {
    return JSON.stringify(ticket, null, 2);
  }
}
