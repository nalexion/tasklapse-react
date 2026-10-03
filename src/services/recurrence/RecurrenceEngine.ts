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
 * Formats a Date object to YYYY-MM-DD format.
 */
export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safely adds months to a Date with day-of-month clamping.
 * Prevents JavaScript month overflow drift:
 * - Jan 31 + 1 month = Feb 28 (or Feb 29 on leap years), NEVER March 3!
 * - Preserves anchorDay so subsequent cycles can restore original month-end day
 *   (e.g., Jan 31 -> Feb 28 -> Mar 31 -> Apr 30).
 */
export function addMonthsClamped(baseDate: Date, months: number, originalAnchorDay?: number): Date {
  const anchorDay = originalAnchorDay !== undefined ? originalAnchorDay : baseDate.getDate();
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  // Create date pointing to the 1st of the target month
  const target = new Date(year, month + months, 1);
  // Calculate maximum valid days in the target month (28, 29, 30, or 31)
  const maxDaysInTargetMonth = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(anchorDay, maxDaysInTargetMonth));
  return target;
}

/**
 * Safely adds years to a Date with day clamping (e.g. Feb 29 -> Feb 28 on non-leap years).
 */
export function addYearsClamped(baseDate: Date, years: number, originalAnchorDay?: number): Date {
  return addMonthsClamped(baseDate, years * 12, originalAnchorDay);
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
   * Employs deterministic day-of-month clamping.
   */
  static calculateNextDate(baseDateStr: string, recurrence: string, anchorDay?: number): string {
    const parts = baseDateStr.split('-');
    if (parts.length !== 3) return baseDateStr;
    const baseDay = Number(parts[2]);
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, baseDay);
    const anchor = anchorDay !== undefined ? anchorDay : baseDay;

    let result: Date;
    switch (recurrence) {
      case 'Every Week': {
        result = new Date(d.getTime());
        result.setDate(result.getDate() + 7);
        break;
      }
      case 'Every 1 Month':
        result = addMonthsClamped(d, 1, anchor);
        break;
      case 'Every 3 Months':
        result = addMonthsClamped(d, 3, anchor);
        break;
      case 'Every 6 Months':
        result = addMonthsClamped(d, 6, anchor);
        break;
      case 'Every 1 Year':
        result = addYearsClamped(d, 1, anchor);
        break;
      case 'Every 2 Years':
        result = addYearsClamped(d, 2, anchor);
        break;
      default:
        return baseDateStr;
    }

    return formatDateISO(result);
  }

  /**
   * Processes a task when checked off / completed:
   * - Evaluates expiration limits
   * - Computes overdue intervals to roll the task forward until it is in the present/future
   * - Preserves anchor day-of-month so month-end items (e.g. 31st) don't drift into subsequent days
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
    const anchorDay = Number(dateParts[2]);
    let dateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, anchorDay);
    
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Keep rolling forward using clamped math until the target date is in the present/future
    do {
      if (task.recurrence === 'Every Week') {
        dateObj.setDate(dateObj.getDate() + 7);
      } else if (task.recurrence === 'Every 1 Month') {
        dateObj = addMonthsClamped(dateObj, 1, anchorDay);
      } else if (task.recurrence === 'Every 3 Months') {
        dateObj = addMonthsClamped(dateObj, 3, anchorDay);
      } else if (task.recurrence === 'Every 6 Months') {
        dateObj = addMonthsClamped(dateObj, 6, anchorDay);
      } else if (task.recurrence === 'Every 1 Year') {
        dateObj = addYearsClamped(dateObj, 1, anchorDay);
      } else if (task.recurrence === 'Every 2 Years') {
        dateObj = addYearsClamped(dateObj, 2, anchorDay);
      } else {
        break;
      }
    } while (dateObj < now);

    const nextDateStr = formatDateISO(dateObj);

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
