import { Task, CategoryDef } from '../../types';
import { VALID_RECURRENCES } from '../recurrence/RecurrenceEngine';

export interface ValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedTasks: Task[];
  sanitizedCategories: CategoryDef[];
}

/**
 * Strict Schema and Contract Validator for Data Portability, Tasks, and Backup Files.
 */
export class SchemaValidator {
  /**
   * Validates if a string is a strict ISO calendar date (YYYY-MM-DD)
   * and corresponds to an actual date on the calendar (rejects e.g. 2026-02-30 or 2026-04-31).
   */
  static isValidCalendarDate(dateStr?: string): boolean {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
    if (!match) return false;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Check days in specific month
    const maxDays = new Date(year, month, 0).getDate();
    return day <= maxDays;
  }

  /**
   * Sanitizes and validates a single task document against strict contract rules.
   */
  static validateAndSanitizeTask(raw: unknown, index: number): { task?: Task; error?: string; warning?: string } {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return { error: `Item #${index + 1}: Invalid item structure (expected an object).` };
    }

    const record = raw as Record<string, unknown>;
    const name = String(record.name || '').trim();
    if (!name) {
      return { error: `Item #${index + 1}: Missing required title/name.` };
    }
    if (name.length > 250) {
      return { error: `Item #${index + 1}: Title exceeds 250 character limit.` };
    }

    // Determine target start / active date
    let rawDate = record.date || record.startDate;
    if (!rawDate) {
      rawDate = new Date().toISOString().split('T')[0];
    } else {
      rawDate = String(rawDate).trim();
    }

    if (!this.isValidCalendarDate(String(rawDate))) {
      return { error: `Item #${index + 1} ("${name}"): Invalid date format or calendar day "${rawDate}". Expected YYYY-MM-DD.` };
    }

    const validDateStr = String(rawDate);

    // Optional expiresDate
    let sanitizedExpiresDate: string | undefined = undefined;
    if (record.expiresDate) {
      const expStr = String(record.expiresDate).trim();
      if (!this.isValidCalendarDate(expStr)) {
        return { error: `Item #${index + 1} ("${name}"): Invalid Expires Date "${expStr}". Expected YYYY-MM-DD.` };
      }
      if (expStr < validDateStr) {
        return { error: `Item #${index + 1} ("${name}"): Expires Date (${expStr}) cannot be earlier than the Target Date (${validDateStr}).` };
      }
      sanitizedExpiresDate = expStr;
    }

    // Optional recurrence
    let sanitizedRecurrence = 'Does not repeat';
    if (record.recurrence) {
      const rec = String(record.recurrence).trim();
      if ((VALID_RECURRENCES as readonly string[]).includes(rec) || rec === 'Does not repeat') {
        sanitizedRecurrence = rec;
      }
    }

    // Alerts
    const rawAlerts = (record.alerts && typeof record.alerts === 'object' ? record.alerts : {}) as Record<string, unknown>;
    const alerts = {
      thirtyDays: Boolean(rawAlerts.thirtyDays),
      sevenDays: rawAlerts.sevenDays !== undefined ? Boolean(rawAlerts.sevenDays) : true,
      oneDay: rawAlerts.oneDay !== undefined ? Boolean(rawAlerts.oneDay) : true
    };

    const task: Task = {
      id: record.id && typeof record.id === 'string' ? record.id : crypto.randomUUID(),
      name,
      date: validDateStr,
      expiresDate: sanitizedExpiresDate,
      startDate: record.startDate && this.isValidCalendarDate(String(record.startDate)) ? String(record.startDate) : undefined,
      category: String(record.category || 'Personal').trim() || 'Personal',
      notes: String(record.notes || '').slice(0, 2000),
      recurrence: sanitizedRecurrence,
      alerts,
      archived: Boolean(record.archived),
      archivedAt: record.archivedAt ? String(record.archivedAt) : undefined,
      createdAt: record.createdAt ? String(record.createdAt) : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { task };
  }

  /**
   * Sanitizes and validates a category definition.
   */
  static validateAndSanitizeCategory(raw: unknown, index: number): CategoryDef {
    const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    return {
      id: record.id && typeof record.id === 'string' ? record.id : `cat_${index}_${crypto.randomUUID()}`,
      name: String(record.name || 'Custom Category').slice(0, 50).trim(),
      color: String(record.color || 'bg-slate-500/20 text-slate-300 border-slate-500/30'),
      icon: String(record.icon || '📁').slice(0, 10)
    };
  }

  /**
   * Validates a complete backup import payload (supporting modern structure or legacy arrays).
   */
  static validateBackupPayload(rawInput: unknown): ValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const sanitizedTasks: Task[] = [];
    const sanitizedCategories: CategoryDef[] = [];

    if (!rawInput || (typeof rawInput !== 'object' && !Array.isArray(rawInput))) {
      return {
        isValid: false,
        errors: ['Invalid backup payload. Expected a JSON object or array.'],
        warnings: [],
        sanitizedTasks: [],
        sanitizedCategories: []
      };
    }

    let rawTasks: unknown[] = [];
    let rawCats: unknown[] = [];

    if (Array.isArray(rawInput)) {
      rawTasks = rawInput;
      warnings.push('Importing from a legacy task array format.');
    } else {
      const payloadObj = rawInput as Record<string, unknown>;
      if (Array.isArray(payloadObj.tasks)) {
        rawTasks = payloadObj.tasks;
      }
      if (Array.isArray(payloadObj.categories)) {
        rawCats = payloadObj.categories;
      }
    }

    if (rawTasks.length === 0 && rawCats.length === 0) {
      return {
        isValid: false,
        errors: ['The selected backup file contains no tasks or categories.'],
        warnings,
        sanitizedTasks: [],
        sanitizedCategories: []
      };
    }

    // Process tasks
    for (let i = 0; i < rawTasks.length; i++) {
      const res = this.validateAndSanitizeTask(rawTasks[i], i);
      if (res.error) {
        errors.push(res.error);
      } else if (res.task) {
        sanitizedTasks.push(res.task);
      }
      if (res.warning) {
        warnings.push(res.warning);
      }
    }

    // Process categories
    for (let i = 0; i < rawCats.length; i++) {
      sanitizedCategories.push(this.validateAndSanitizeCategory(rawCats[i], i));
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedTasks,
      sanitizedCategories
    };
  }
}
