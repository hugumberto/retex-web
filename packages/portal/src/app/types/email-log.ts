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

// Rótulos PT-PT dos tipos de email (o `type` corresponde ao template no backend).
export const EMAIL_TYPE_LABEL: Record<string, string> = {
  'account-activation': 'Ativação de conta',
  'out-of-service-zone': 'Fora da zona',
  'password-reset': 'Reposição de palavra-passe',
  'package-confirmation': 'Confirmação de pacote',
  'collection-confirmation': 'Confirmação de recolha',
  'collection-cancelled': 'Recolha cancelada',
  'contact-form': 'Formulário de contacto',
  survey: 'Questionário de satisfação',
};

export const EMAIL_STATUS_LABEL: Record<EmailLogStatus, string> = {
  [EmailLogStatus.SENT]: 'Enviado',
  [EmailLogStatus.FAILED]: 'Falhou',
};
