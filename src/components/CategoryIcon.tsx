import {
  Banknote,
  Bus,
  Clapperboard,
  Lightbulb,
  ShoppingBag,
  Utensils,
} from 'lucide-react';
import {
  CATEGORY_STYLES,
  ExpenseCategory,
  MovementCategory,
  MovementType,
} from '../data/budgetData';

interface CategoryIconProps {
  category: MovementCategory;
  type?: MovementType;
  size?: 'sm' | 'md';
}

export function CategoryIcon({
  category,
  type = 'expense',
  size = 'md',
}: CategoryIconProps) {
  const boxSize = size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-[18px] h-[18px]';

  if (type === 'income') {
    return (
      <div
        className={`${boxSize} bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 rounded-full flex items-center justify-center shrink-0`}
      >
        <Banknote className={iconSize} aria-hidden="true" />
      </div>
    );
  }

  const style = CATEGORY_STYLES[category as ExpenseCategory] ?? {
    iconBgClass: 'bg-slate-800 border border-white/10',
    iconTextClass: 'text-slate-300',
  };

  const renderExpenseIcon = () => {
    switch (category) {
      case 'Alimentación':
        return <Utensils className={iconSize} aria-hidden="true" />;
      case 'Transporte':
        return <Bus className={iconSize} aria-hidden="true" />;
      case 'Servicios públicos':
        return <Lightbulb className={iconSize} aria-hidden="true" />;
      case 'Ropa y compras personales':
        return <ShoppingBag className={iconSize} aria-hidden="true" />;
      case 'Entretenimiento y ocio':
        return <Clapperboard className={iconSize} aria-hidden="true" />;
      default:
        return <ShoppingBag className={iconSize} aria-hidden="true" />;
    }
  };

  return (
    <div
      className={`${boxSize} ${style.iconBgClass} ${style.iconTextClass} rounded-full flex items-center justify-center shrink-0`}
    >
      {renderExpenseIcon()}
    </div>
  );
}
