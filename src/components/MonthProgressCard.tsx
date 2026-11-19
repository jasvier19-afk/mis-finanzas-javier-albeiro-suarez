import {
  CURRENT_DAY_OF_MONTH,
  DAYS_IN_MONTH,
  formatCOP,
  formatPercentage,
} from '../data/budgetData';

interface MonthProgressCardProps {
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  spentPercentage: number;
  spentBarWidth: number;
  availablePercentage: number;
  isPositiveBalance: boolean;
}

export function MonthProgressCard({
  monthlyBudget,
  totalSpent,
  availableBalance,
  spentPercentage,
  spentBarWidth,
  availablePercentage,
  isPositiveBalance,
}: MonthProgressCardProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (spentBarWidth / 100) * circumference;

  const remainingDays = DAYS_IN_MONTH - CURRENT_DAY_OF_MONTH;

  return (
    <section
      aria-labelledby="progreso-mes-titulo"
      className="bg-[#111625] border border-white/[0.07] rounded-2xl p-5 sm:p-6"
    >
      <h2
        id="progreso-mes-titulo"
        className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
      >
        Progreso del mes
      </h2>

      <div className="mt-4 flex items-center gap-5">
        {/* Donut Circular Progress Indicator */}
        <div className="relative w-24 h-24 shrink-0">
          <svg
            viewBox="0 0 96 96"
            className="w-24 h-24 -rotate-90"
            role="img"
            aria-label={`Progreso del mes: ${Math.round(spentPercentage)}% gastado`}
          >
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke="#1E253D"
              strokeWidth="8"
            />
            <circle
              cx="48"
              cy="48"
              r={radius}
              fill="none"
              stroke={isPositiveBalance ? '#5B3DF5' : '#F43F5E'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-bold text-white tabular-nums leading-none">
              {Math.round(spentPercentage)}%
            </span>
            <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mt-1">
              Gastado
            </span>
          </div>
        </div>

        {/* Right Breakdown & Mini Progress Bar */}
        <div className="min-w-0 flex-1">
          <p
            className={`text-sm sm:text-base font-bold tabular-nums ${
              isPositiveBalance ? 'text-[#8673FF]' : 'text-rose-400'
            }`}
          >
            {formatCOP(totalSpent)}
          </p>
          <p className="text-xs text-slate-400 tabular-nums mt-0.5">
            de {formatCOP(monthlyBudget)}
          </p>

          <div
            role="progressbar"
            aria-label="Porcentaje gastado del presupuesto mensual"
            aria-valuenow={Math.round(spentBarWidth)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2.5 w-full h-1.5 rounded-full bg-[#1E253D] overflow-hidden"
          >
            <div
              style={{ width: `${spentBarWidth}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                isPositiveBalance ? 'bg-[#5B3DF5]' : 'bg-rose-500'
              }`}
            />
          </div>

          <p className="mt-2.5 text-xs text-slate-400 leading-relaxed tabular-nums">
            {isPositiveBalance
              ? `Te queda el ${formatPercentage(availablePercentage)} del presupuesto para los próximos ${remainingDays} días.`
              : `Excediste tu presupuesto por ${formatCOP(Math.abs(availableBalance))} (${formatPercentage(spentPercentage)} gastado).`}
          </p>
        </div>
      </div>
    </section>
  );
}
