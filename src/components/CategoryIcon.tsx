import React from 'react';
import * as LucideIcons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = 'w-5 h-5', size }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (LucideIcons as any)[name] || LucideIcons.CircleDot;
  return <IconComponent className={className} size={size} />;
};

export const AVAILABLE_ICONS = [
  // Chi tiêu & sinh hoạt
  'Utensils', 'Coffee', 'ShoppingBag', 'ShoppingCart', 'Car', 'Fuel', 'Bus', 'Home', 
  'Zap', 'Wifi', 'Smartphone', 'HeartPulse', 'Stethoscope', 'GraduationCap', 'BookOpen',
  'Plane', 'Film', 'Gamepad2', 'Dumbbell', 'Scissors', 'Key', 'Gift', 'Dog',
  // Thu nhập & Tài chính
  'Briefcase', 'TrendingUp', 'TrendingDown', 'Building2', 'Landmark', 'PiggyBank',
  'Wallet', 'CreditCard', 'Banknote', 'Award', 'Receipt', 'CirclePercent', 'Sparkles',
  'Coins', 'FileText', 'ShieldCheck', 'HeartHandshake', 'HandHeart', 'BadgeDollarSign', 'Undo2'
];
