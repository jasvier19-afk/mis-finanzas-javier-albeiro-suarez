export type MovementType = 'expense' | 'income';

export type ExpenseCategory =
  | 'Alimentación'
  | 'Transporte'
  | 'Servicios públicos'
  | 'Ropa y compras personales'
  | 'Entretenimiento y ocio';

export type IncomeCategory =
  | 'Salario'
  | 'Trabajo independiente'
  | 'Negocio'
  | 'Inversiones'
  | 'Regalo'
  | 'Bonificación'
  | 'Reembolso'
  | 'Otro';

export type PaymentMethod =
  | 'Efectivo'
  | 'Cuenta bancaria'
  | 'Nequi'
  | 'Daviplata'
  | 'Tarjeta'
  | 'Otro';

export type MovementCategory = ExpenseCategory | IncomeCategory;

export interface Movement {
  id: string;
  type: MovementType;
  day: number;
  dateLabel: string;
  isoDate?: string;
  category: MovementCategory;
  description: string;
  amount: number;
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAtOrder?: number;
}

// Backwards-compatible alias for existing components
export type Expense = Movement;

export interface DailySpendingPoint {
  day: number;
  dateLabel: string;
  total: number;
  cumulativeTotal: number;
  expenses: Movement[];
  hasData: boolean;
}

export const MONTHLY_BUDGET_COP = 2_500_000;
export const CURRENT_MONTH_LABEL = 'Noviembre 2026';
export const CURRENT_DAY_OF_MONTH = 18;
export const CURRENT_ISO_DATE = '2026-11-18';
export const DAYS_IN_MONTH = 30;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Alimentación',
  'Transporte',
  'Servicios públicos',
  'Ropa y compras personales',
  'Entretenimiento y ocio',
];

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Salario',
  'Trabajo independiente',
  'Negocio',
  'Inversiones',
  'Regalo',
  'Bonificación',
  'Reembolso',
  'Otro',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Efectivo',
  'Cuenta bancaria',
  'Nequi',
  'Daviplata',
  'Tarjeta',
  'Otro',
];

export const CATEGORY_STYLES: Record<
  ExpenseCategory,
  {
    colorHex: string;
    iconBgClass: string;
    iconTextClass: string;
    shortLabel: string;
  }
> = {
  Alimentación: {
    colorHex: '#F59E0B',
    iconBgClass: 'bg-amber-400/15 border border-amber-400/25',
    iconTextClass: 'text-amber-300',
    shortLabel: 'Alimentación',
  },
  Transporte: {
    colorHex: '#38BDF8',
    iconBgClass: 'bg-sky-400/15 border border-sky-400/25',
    iconTextClass: 'text-sky-300',
    shortLabel: 'Transporte',
  },
  'Servicios públicos': {
    colorHex: '#A3E635',
    iconBgClass: 'bg-lime-400/15 border border-lime-400/25',
    iconTextClass: 'text-lime-300',
    shortLabel: 'Servicios públicos',
  },
  'Ropa y compras personales': {
    colorHex: '#34D399',
    iconBgClass: 'bg-emerald-400/15 border border-emerald-400/25',
    iconTextClass: 'text-emerald-300',
    shortLabel: 'Ropa y compras',
  },
  'Entretenimiento y ocio': {
    colorHex: '#A78BFA',
    iconBgClass: 'bg-violet-400/15 border border-violet-400/25',
    iconTextClass: 'text-violet-300',
    shortLabel: 'Entretenimiento',
  },
};

export const INITIAL_MONTHLY_EXPENSES: Movement[] = [
  {
    id: 'exp-01',
    type: 'expense',
    day: 1,
    dateLabel: '1 nov',
    isoDate: '2026-11-01',
    category: 'Alimentación',
    description: 'Mercado de la primera semana',
    amount: 145_000,
    createdAtOrder: 1,
  },
  {
    id: 'exp-02',
    type: 'expense',
    day: 1,
    dateLabel: '1 nov',
    isoDate: '2026-11-01',
    category: 'Transporte',
    description: 'Recarga de tarjeta de transporte',
    amount: 35_000,
    createdAtOrder: 2,
  },
  {
    id: 'exp-03',
    type: 'expense',
    day: 2,
    dateLabel: '2 nov',
    isoDate: '2026-11-02',
    category: 'Entretenimiento y ocio',
    description: 'Entradas a cine y crispetas',
    amount: 68_000,
    createdAtOrder: 3,
  },
  {
    id: 'exp-04',
    type: 'expense',
    day: 3,
    dateLabel: '3 nov',
    isoDate: '2026-11-03',
    category: 'Alimentación',
    description: 'Almuerzo ejecutivo',
    amount: 24_000,
    createdAtOrder: 4,
  },
  {
    id: 'exp-05',
    type: 'expense',
    day: 3,
    dateLabel: '3 nov',
    isoDate: '2026-11-03',
    category: 'Transporte',
    description: 'Pasajes de bus urbano',
    amount: 12_000,
    createdAtOrder: 5,
  },
  {
    id: 'exp-06',
    type: 'expense',
    day: 4,
    dateLabel: '4 nov',
    isoDate: '2026-11-04',
    category: 'Servicios públicos',
    description: 'Factura de internet hogar',
    amount: 115_000,
    createdAtOrder: 6,
  },
  {
    id: 'exp-07',
    type: 'expense',
    day: 5,
    dateLabel: '5 nov',
    isoDate: '2026-11-05',
    category: 'Alimentación',
    description: 'Café y panadería',
    amount: 16_500,
    createdAtOrder: 7,
  },
  {
    id: 'exp-08',
    type: 'expense',
    day: 5,
    dateLabel: '5 nov',
    isoDate: '2026-11-05',
    category: 'Transporte',
    description: 'Carrera en taxi',
    amount: 22_500,
    createdAtOrder: 8,
  },
  {
    id: 'exp-09',
    type: 'expense',
    day: 6,
    dateLabel: '6 nov',
    isoDate: '2026-11-06',
    category: 'Ropa y compras personales',
    description: 'Camiseta básica y medias',
    amount: 89_000,
    createdAtOrder: 9,
  },
  {
    id: 'exp-10',
    type: 'expense',
    day: 7,
    dateLabel: '7 nov',
    isoDate: '2026-11-07',
    category: 'Alimentación',
    description: 'Cena en restaurante',
    amount: 94_000,
    createdAtOrder: 10,
  },
  {
    id: 'exp-11',
    type: 'expense',
    day: 8,
    dateLabel: '8 nov',
    isoDate: '2026-11-08',
    category: 'Servicios públicos',
    description: 'Recibo de energía eléctrica',
    amount: 138_000,
    createdAtOrder: 11,
  },
  {
    id: 'exp-12',
    type: 'expense',
    day: 8,
    dateLabel: '8 nov',
    isoDate: '2026-11-08',
    category: 'Alimentación',
    description: 'Frutas y verduras frescas',
    amount: 42_000,
    createdAtOrder: 12,
  },
  {
    id: 'exp-13',
    type: 'expense',
    day: 9,
    dateLabel: '9 nov',
    isoDate: '2026-11-09',
    category: 'Entretenimiento y ocio',
    description: 'Tarde de bolos con amigos',
    amount: 76_000,
    createdAtOrder: 13,
  },
  {
    id: 'exp-14',
    type: 'expense',
    day: 10,
    dateLabel: '10 nov',
    isoDate: '2026-11-10',
    category: 'Alimentación',
    description: 'Almuerzo del día',
    amount: 28_500,
    createdAtOrder: 14,
  },
  {
    id: 'exp-15',
    type: 'expense',
    day: 10,
    dateLabel: '10 nov',
    isoDate: '2026-11-10',
    category: 'Transporte',
    description: 'Pasajes de transporte',
    amount: 9_500,
    createdAtOrder: 15,
  },
  {
    id: 'exp-16',
    type: 'expense',
    day: 11,
    dateLabel: '11 nov',
    isoDate: '2026-11-11',
    category: 'Servicios públicos',
    description: 'Factura de acueducto y alcantarillado',
    amount: 84_000,
    createdAtOrder: 16,
  },
  {
    id: 'exp-17',
    type: 'expense',
    day: 12,
    dateLabel: '12 nov',
    isoDate: '2026-11-12',
    category: 'Alimentación',
    description: 'Mercado semanal del hogar',
    amount: 156_000,
    createdAtOrder: 17,
  },
  {
    id: 'exp-18',
    type: 'expense',
    day: 13,
    dateLabel: '13 nov',
    isoDate: '2026-11-13',
    category: 'Ropa y compras personales',
    description: 'Artículos de cuidado personal',
    amount: 64_500,
    createdAtOrder: 18,
  },
  {
    id: 'exp-19',
    type: 'expense',
    day: 13,
    dateLabel: '13 nov',
    isoDate: '2026-11-13',
    category: 'Transporte',
    description: 'Pasajes del día',
    amount: 11_500,
    createdAtOrder: 19,
  },
  {
    id: 'exp-20',
    type: 'expense',
    day: 14,
    dateLabel: '14 nov',
    isoDate: '2026-11-14',
    category: 'Alimentación',
    description: 'Domicilio de almuerzo',
    amount: 36_000,
    createdAtOrder: 20,
  },
  {
    id: 'exp-21',
    type: 'expense',
    day: 15,
    dateLabel: '15 nov',
    isoDate: '2026-11-15',
    category: 'Entretenimiento y ocio',
    description: 'Boleta concierto acústico local',
    amount: 125_000,
    createdAtOrder: 21,
  },
  {
    id: 'exp-22',
    type: 'expense',
    day: 16,
    dateLabel: '16 nov',
    isoDate: '2026-11-16',
    category: 'Ropa y compras personales',
    description: 'Tenis deportivos en promoción',
    amount: 185_000,
    createdAtOrder: 22,
  },
  {
    id: 'exp-23',
    type: 'expense',
    day: 17,
    dateLabel: '17 nov',
    isoDate: '2026-11-17',
    category: 'Servicios públicos',
    description: 'Plan mensual de telefonía móvil',
    amount: 58_000,
    createdAtOrder: 23,
  },
  {
    id: 'exp-24',
    type: 'expense',
    day: 17,
    dateLabel: '17 nov',
    isoDate: '2026-11-17',
    category: 'Transporte',
    description: 'Recarga transporte urbano',
    amount: 28_000,
    createdAtOrder: 24,
  },
  {
    id: 'exp-25',
    type: 'expense',
    day: 18,
    dateLabel: '18 nov',
    isoDate: '2026-11-18',
    category: 'Alimentación',
    description: 'Almuerzo y café de la tarde',
    amount: 38_500,
    createdAtOrder: 25,
  },
];

export function formatCOP(amount: number): string {
  const isNegative = amount < 0;
  const formattedNumber = Math.round(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${isNegative ? '-' : ''}$${formattedNumber} COP`;
}

export function formatCompactCOP(amount: number): string {
  if (amount === 0) return '$0';
  if (amount >= 1_000_000) {
    const millions = amount / 1_000_000;
    const label = Number.isInteger(millions)
      ? millions.toString()
      : millions.toFixed(1).replace('.', ',');
    return `$${label}M`;
  }
  return `$${Math.round(amount / 1_000)}k`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1).replace('.', ',')}%`;
}

export function formatIsoDateShort(isoDate: string): {
  label: string;
  dayNumber: number;
} {
  if (isoDate === CURRENT_ISO_DATE) {
    return { label: 'Hoy', dayNumber: CURRENT_DAY_OF_MONTH };
  }
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return { label: isoDate, dayNumber: CURRENT_DAY_OF_MONTH };
  }
  const monthNames = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  const monthIdx = Math.max(0, Math.min(11, Number(parts[1]) - 1));
  const dayNumber = Math.max(1, Math.min(31, Number(parts[2])));
  return {
    label: `${dayNumber} ${monthNames[monthIdx]}`,
    dayNumber,
  };
}

export function getFullDateLabel(day: number, isoDate?: string): string {
  if (isoDate) {
    const parts = isoDate.split('-');
    if (parts.length === 3) {
      const year = Number(parts[0]);
      const month = Number(parts[1]) - 1;
      const d = Number(parts[2]);
      const dateObj = new Date(year, month, d);
      if (!Number.isNaN(dateObj.getTime())) {
        const weekdays = [
          'Domingo',
          'Lunes',
          'Martes',
          'Miércoles',
          'Jueves',
          'Viernes',
          'Sábado',
        ];
        const months = [
          'enero',
          'febrero',
          'marzo',
          'abril',
          'mayo',
          'junio',
          'julio',
          'agosto',
          'septiembre',
          'octubre',
          'noviembre',
          'diciembre',
        ];
        return `${weekdays[dateObj.getDay()]}, ${d} de ${months[month]} de ${year}`;
      }
    }
  }

  const weekdays = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
  ];
  const weekday = weekdays[(day - 1) % 7];
  return `${weekday}, ${day} de noviembre de 2026`;
}

export function getBudgetSummary(
  movements: Movement[],
  baseMonthlyBudget: number = MONTHLY_BUDGET_COP
) {
  const totalSpent = movements
    .filter((m) => m.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalIncome = movements
    .filter((m) => m.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  const effectiveBudget = baseMonthlyBudget + totalIncome;
  const availableBalance = effectiveBudget - totalSpent;

  const spentPercentage =
    effectiveBudget > 0
      ? (totalSpent / effectiveBudget) * 100
      : totalSpent > 0
        ? 100
        : 0;

  const spentBarWidth = Math.min(100, Math.max(0, spentPercentage));
  const availablePercentage = Math.max(0, 100 - spentPercentage);
  const isPositiveBalance = availableBalance >= 0;

  return {
    baseMonthlyBudget,
    totalIncome,
    monthlyBudget: effectiveBudget,
    totalSpent,
    availableBalance,
    spentPercentage,
    spentBarWidth,
    availablePercentage,
    isPositiveBalance,
  };
}

export function getDailySpendingSeries(movements: Movement[]): DailySpendingPoint[] {
  const expensesByDay = new Map<number, Movement[]>();
  let maxRecordedDay = CURRENT_DAY_OF_MONTH;

  for (const item of movements) {
    if (item.type !== 'expense') continue;
    if (item.day > maxRecordedDay && item.day <= DAYS_IN_MONTH) {
      maxRecordedDay = item.day;
    }
    const list = expensesByDay.get(item.day) ?? [];
    list.push(item);
    expensesByDay.set(item.day, list);
  }

  const series: DailySpendingPoint[] = [];
  let runningTotal = 0;

  for (let day = 1; day <= DAYS_IN_MONTH; day += 1) {
    const dayExpenses = expensesByDay.get(day) ?? [];
    const total = dayExpenses.reduce((sum, item) => sum + item.amount, 0);
    const hasData = day <= maxRecordedDay;
    if (hasData) {
      runningTotal += total;
    }
    series.push({
      day,
      dateLabel: `${day} nov`,
      total,
      cumulativeTotal: runningTotal,
      expenses: dayExpenses,
      hasData,
    });
  }

  return series;
}

export function getChronologicalExpenses(movements: Movement[]): Movement[] {
  return [...movements].sort((a, b) => {
    const dateA = a.isoDate ?? `2026-11-${String(a.day).padStart(2, '0')}`;
    const dateB = b.isoDate ?? `2026-11-${String(b.day).padStart(2, '0')}`;
    if (dateB !== dateA) return dateB.localeCompare(dateA);
    const orderA = a.createdAtOrder ?? 0;
    const orderB = b.createdAtOrder ?? 0;
    if (orderB !== orderA) return orderB - orderA;
    return b.id.localeCompare(a.id);
  });
}

export function getRecentExpenses(movements: Movement[], limit = 5): Movement[] {
  return getChronologicalExpenses(movements).slice(0, limit);
}
