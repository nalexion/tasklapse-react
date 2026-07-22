import React from 'react';
import { 
  User, Home, Heart, Car, Repeat, Briefcase, Coffee, ShoppingCart, 
  Book, Music, Film, Plane, Smartphone, Monitor, Star, Zap, 
  Activity, DollarSign, Gift, Map, Truck, Wrench, Utensils, 
  Calendar, Camera, Bell, Circle 
} from 'lucide-react';

export const ICON_MAP: Record<string, React.ElementType> = {
  User, Home, Heart, Car, Repeat, Briefcase, Coffee, ShoppingCart, 
  Book, Music, Film, Plane, Smartphone, Monitor, Star, Zap, 
  Activity, DollarSign, Gift, Map, Truck, Wrench, Utensils, 
  Calendar, Camera, Bell
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const CategoryIcon = ({ name, className }: { name: string, className?: string }) => {
  const IconComponent = ICON_MAP[name] || Circle;
  return <IconComponent className={className} />;
};
