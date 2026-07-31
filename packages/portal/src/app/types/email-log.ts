import { Entity } from './helper';

export enum EmailLogStatus {
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export interface EmailLogDTO extends Entity {
  type: string;
  subject: string;
  recipient: string;
  userId?: string | null;
  status: EmailLogStatus;
  error?: string | null;
  sentAt: string;
}

