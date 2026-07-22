export interface Task {
  id: string;
  name: string;
  date: string;
  category: string;
  notes: string;
  recurrence?: string;
  alerts?: {
    thirtyDays: boolean;
    sevenDays: boolean;
    oneDay: boolean;
  };
  archived: boolean;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WebhookData {
  url: string;
  targetEmail?: string;
  secret?: string;
  lastStatus: string;
  lastTime: string;
}

export interface CategoryDef {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export type Category = string;

