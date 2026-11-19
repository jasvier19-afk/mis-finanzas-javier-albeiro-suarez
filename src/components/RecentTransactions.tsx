import { ArrowRight } from 'lucide-react';
import { Movement, formatCOP } from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface RecentTransactionsProps {
  expenses: Movement[];
  totalCount: number;
  selectedDay: number;
  onSelectExpense: (expense: Movement) => void;
  onViewAll: () => void;
}

export function RecentTransactions({
  expenses,
  totalCount,
  selectedDay,
  onSelectExpense,
  onViewAll,
}: RecentTransactionsProps) {
  return (
    <section
      aria-labelledby="ultimos-movimientos-titulo"
      className="flex-1 bg-[#111625] border border-white/[0.07] rounded-2xl p-5 sm:p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2
            id="ultimos-movimientos-titulo"
            className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase"
          >
            Últimos movimientos
          </h2>

          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#8673FF] hover:text-indigo-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <span>Ver todos ({totalCount})</span>
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>

        <ul className="divide-y divide-white/[0.06] mt-3">
          {expenses.map((movement) => {
            const isIncome = movement.type === 'income';
            const isDayHighlighted = !isIncome && movement.day === selectedDay;

            return (
              <li key={movement.id}>
                <button
                  type="button"
                  onClick={() => onSelectExpense(movement)}
                  className={`w-full text-left py-3 px-2 -mx-2 rounded-xl flex items-center justify-between gap-3 transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] ${
                    isDayHighlighted ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon
                      category={movement.category}
                      type={movement.type}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">
                        {movement.description}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        <span>{movement.dateLabel}</span>
                        <span className="mx-1.5 text-slate-600" aria-hidden="true">
                          ·
                        </span>
                        <span>
                          {isIncome ? `Ingreso · ${movement.category}` : movement.category}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm font-bold tabular-nums whitespace-nowrap ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {isIncome
                        ? `+${formatCOP(movement.amount).replace(' COP', '')}`
                        : formatCOP(movement.amount).replace(' COP', '')}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
