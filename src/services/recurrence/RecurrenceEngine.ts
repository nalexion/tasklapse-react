import { Task } from '../../types';

export const VALID_RECURRENCES = [
  'Every Week',
  'Every 1 Month',
  'Every 3 Months',
  'Every 6 Months',
  'Every 1 Year',
  'Every 2 Years'
] as const;

export type ValidRecurrence = typeof VALID_RECURRENCES[number];

export interface RollForwardResult {
  cloneRecord: Record<string, any>;
  nextDateStr: string;
  isExpired: boolean;
}

/**
 * Pure domain service for recurrence calculations and roll-forward logic.
 */
export class RecurrenceEngine {
  /**
   * Checks if a string is a recognized recurrence interval.
   */
  static isValidRecurrence(recurrence?: string): boolean {
    if (!recurrence) return false;
    return (VALID_RECURRENCES as readonly string[]).includes(recurrence);
  }

  /**
   * Calculates the next date given an initial date string and recurrence interval.
   */
  static calculateNextDate(baseDateStr: string, recurrence: string): string {
    const parts = baseDateStr.split('-');
    if (parts.length !== 3) return baseDateStr;
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));

    switch (recurrence) {
      case 'Every Week':
        d.setDate(d.getDate() + 7);
        break;
      case 'Every 1 Month':
        d.setMonth(d.getMonth() + 1);
        break;
      case 'Every 3 Months':
        d.setMonth(d.getMonth() + 3);
        break;
      case 'Every 6 Months':
        d.setMonth(d.getMonth() + 6);
        break;
      case 'Every 1 Year':
        d.setFullYear(d.getFullYear() + 1);
        break;
      case 'Every 2 Years':
        d.setFullYear(d.getFullYear() + 2);
        break;
      default:
        return baseDateStr;
    }

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Processes a task when checked off / completed:
   * - Evaluates expiration limits
   * - Computes overdue intervals to roll the task forward until it is in the present/future
   * - Generates the historical archive clone record
   */
  static rollForwardTask(task: Task): RollForwardResult {
    // Check if task already reached or passed its hard expiration cutoff
    if (task.expiresDate && task.date >= task.expiresDate) {
      return {
        cloneRecord: {},
        nextDateStr: task.date,
        isExpired: true
      };
    }

    const dateParts = task.date.split('-');
    let dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Keep rolling forward until the target date is no longer in the past
    do {
      if (task.recurrence === 'Every Week') dateObj.setDate(dateObj.getDate() + 7);
      else if (task.recurrence === 'Every 1 Month') dateObj.setMonth(dateObj.getMonth() + 1);
      else if (task.recurrence === 'Every 3 Months') dateObj.setMonth(dateObj.getMonth() + 3);
      else if (task.recurrence === 'Every 6 Months') dateObj.setMonth(dateObj.getMonth() + 6);
      else if (task.recurrence === 'Every 1 Year') dateObj.setFullYear(dateObj.getFullYear() + 1);
      else if (task.recurrence === 'Every 2 Years') dateObj.setFullYear(dateObj.getFullYear() + 2);
      else break;
    } while (dateObj < now);

    const nextDateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;

    // If next calculated cycle exceeds hard expiration cutoff, task must be terminated (archived)
    if (task.expiresDate && nextDateStr > task.expiresDate) {
      return {
        cloneRecord: {},
        nextDateStr,
        isExpired: true
      };
    }

    // Build the completed cycle clone record for archive history
    const { id: _oldId, ...cloneData } = task;
    const cloneRecord: Record<string, any> = {
      ...cloneData,
      archived: true,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Strip undefined keys to prevent Firestore serialization rejections
    Object.keys(cloneRecord).forEach(key => {
      if (cloneRecord[key] === undefined) delete cloneRecord[key];
    });

    return {
      cloneRecord,
      nextDateStr,
      isExpired: false
    };
  }
}
