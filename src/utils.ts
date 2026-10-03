export const resolveIcon = (iconName: string): string => {
  const legacyMap: Record<string, string> = {
    'User': '👤', 'Home': '🏠', 'Heart': '❤️', 'Car': '🚗', 'Repeat': '💳',
    'Briefcase': '💼', 'Coffee': '☕', 'ShoppingCart': '🛒', 'Book': '📚',
    'Music': '🎵', 'Film': '🎬', 'Plane': '✈️', 'Smartphone': '📱',
    'Monitor': '🖥️', 'Star': '⭐', 'Zap': '⚡', 'Activity': '📈',
    'DollarSign': '💲', 'Gift': '🎁', 'Map': '🗺️', 'Truck': '🚚',
    'Wrench': '🔧', 'Utensils': '🍴', 'Calendar': '📅', 'Camera': '📷',
    'Bell': '🔔', 'Circle': '⚪', 'Tag': '🏷️'
  };
  return legacyMap[iconName] || iconName;
};

/**
 * Calculates days relative to today.
 * Positive = future, 0 = today, Negative = past.
 * Uses local midnight comparison to avoid UTC timezone off-by-one discrepancies.
 */
export const calculateDaysFromToday = (dateString?: string): number => {
  if (!dateString) return 0;
  const parts = dateString.split('-');
  let target: Date;
  if (parts.length === 3) {
    target = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  } else {
    target = new Date(dateString);
  }
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const isFutureDate = (dateString?: string): boolean => {
  if (!dateString) return false;
  return calculateDaysFromToday(dateString) > 0;
};

/**
 * Calculates the Next Due Date based on the Start Date and the Recurrence interval.
 */
export const calculateDueDateFromStart = (startDate: string, recurrence: string): string => {
  if (!startDate) return '';
  const parts = startDate.split('-');
  if (parts.length !== 3) return startDate;
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
      // Does not repeat: default due date matches start date
      return startDate;
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
