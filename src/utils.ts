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
