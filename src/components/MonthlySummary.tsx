import { FormEvent, useState } from 'react';
import {
  Check,
  CreditCard,
  Pencil,
  TrendingDown,
  Wallet,
  X,
} from 'lucide-react';
import { formatCOP } from '../data/budgetData';

interface MonthlySummaryProps {
  baseMonthlyBudget: number;
  totalIncome: number;
  monthlyBudget: number;
  totalSpent: number;
  availableBalance: number;
  isPositiveBalance: boolean;
  onUpdateBudget: (newBaseBudget: number) => void;
  onFocusChartMode?: (mode: 'daily' | 'cumulative') => void;
}

function splitCOP(amount: number): { main: string } {
  const isNegative = amount < 0;
  const formattedNumber = Math.round(Math.abs(amount))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return {
    main: `${isNegative ? '-' : ''}$ ${formattedNumber}`,
  };
}

export function MonthlySummary({
  baseMonthlyBudget,
  totalIncome,
  monthlyBudget,
  totalSpent,
  availableBalance,
  isPositiveBalance,
  onUpdateBudget,
  onFocusChartMode,
}: MonthlySummaryProps) {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [rawBudgetInput, setRawBudgetInput] = useState(String(baseMonthlyBudget));
  const [budgetError, setBudgetError] = useState<string | null>(null);

  const startEditing = () => {
    setRawBudgetInput(String(baseMonthlyBudget));
    setBudgetError(null);
    setIsEditingBudget(true);
  };

  const cancelEditing = () => {
    setIsEditingBudget(false);
    setBudgetError(null);
  };

  const handleBudgetInputChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setRawBudgetInput(digitsOnly);
    if (budgetError) {
      setBudgetError(null);
    }
  };

  const handleBudgetSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (rawBudgetInput.trim() === '') {
      setBudgetError('Ingresa un valor válido.');
      return;
    }
    const parsed = Number(rawBudgetInput);
    if (!Number.isFinite(parsed) || parsed < 0) {
      setBudgetError('El presupuesto no puede ser negativo.');
      return;
    }
    if (parsed > 100_000_000) {
      setBudgetError('Ingresa un monto menor o igual a $100.000.000 COP.');
      return;
    }
    onUpdateBudget(parsed);
    setIsEditingBudget(false);
    setBudgetError(null);
  };

  const formattedEditValue =
    rawBudgetInput === ''
      ? ''
      : rawBudgetInput.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const budgetText = splitCOP(monthlyBudget);
  const spentText = splitCOP(totalSpent);
  const availableText = splitCOP(availableBalance);

  return (
    <section
      aria-label="Resumen financiero del mes"
      className="grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {/* 1. Presupuesto mensual (Editable inline) */}
      <div className="bg-[#111625] border border-white/[0.07] rounded-2xl px-5 py-5 flex items-center gap-4 min-h-[108px]">
        <div
          className="w-12 h-12 rounded-xl bg-[#1A2036] border border-[#5B3DF5]/20 text-[#8673FF] flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <Wallet className="w-5 h-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Presupuesto mensual
            </span>
            {!isEditingBudget && (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-indigo-300 transition-colors cursor-pointer shrink-0"
                aria-label="Editar presupuesto mensual"
              >
                <Pencil className="w-2.5 h-2.5" aria-hidden="true" />
                <span>Editar</span>
              </button>
            )}
          </div>

          {isEditingBudget ? (
            <form onSubmit={handleBudgetSubmit} className="mt-1.5 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 pointer-events-none">
                    $
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    value={formattedEditValue}
                    onChange={(e) => handleBudgetInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        cancelEditing();
                      }
                    }}
                    aria-label="Nuevo presupuesto mensual en pesos colombianos"
                    className="w-full pl-6 pr-10 py-1.5 text-sm font-bold tabular-nums rounded-lg border border-[#5B3DF5] bg-[#181E32] text-white focus:outline-none"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-400 pointer-events-none">
                    COP
                  </span>
                </div>
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-[#5B3DF5] text-white hover:bg-[#4B2FE0] transition-colors cursor-pointer"
                  aria-label="Aplicar presupuesto"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="p-1.5 rounded-lg bg-white/[0.06] text-slate-300 hover:bg-white/[0.12] transition-colors cursor-pointer"
                  aria-label="Cancelar edición"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {budgetError && (
                <p className="text-[11px] font-medium text-rose-400">
                  {budgetError}
                </p>
              )}
            </form>
          ) : (
            <>
              <button
                type="button"
                onClick={startEditing}
                className="mt-1.5 text-left flex items-baseline gap-1.5 group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] rounded"
                title="Haz clic para editar el presupuesto mensual"
              >
                <span className="text-2xl sm:text-[27px] font-bold tracking-tight text-white tabular-nums group-hover:text-indigo-200 transition-colors">
                  {budgetText.main}
                </span>
                <span className="text-[11px] font-semibold text-slate-400">
                  COP
                </span>
              </button>
              {totalIncome > 0 && (
                <p className="mt-0.5 text-[11px] text-emerald-400 tabular-nums truncate">
                  Base {formatCOP(baseMonthlyBudget)} + Ingresos{' '}
                  {formatCOP(totalIncome)}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 2. Total gastado */}
      <button
        type="button"
        onClick={() => onFocusChartMode?.('daily')}
        className="text-left bg-[#111625] border border-white/[0.07] border-b-rose-500/40 rounded-2xl px-5 py-5 flex items-center gap-4 min-h-[108px] hover:border-white/[0.14] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
      >
        <div
          className="w-12 h-12 rounded-xl bg-rose-500/15 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <TrendingDown className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <span className="block text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Total gastado
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[27px] font-bold tracking-tight text-rose-400 tabular-nums">
              {spentText.main}
            </span>
            <span className="text-[11px] font-semibold text-slate-400">COP</span>
          </div>
        </div>
      </button>

      {/* 3. Saldo disponible (Vibrant #5B3DF5 purple highlight or crimson alert if negative) */}
      <button
        type="button"
        onClick={() => onFocusChartMode?.('cumulative')}
        className={`text-left rounded-2xl px-5 py-5 flex items-center gap-4 min-h-[108px] transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isPositiveBalance
            ? 'bg-gradient-to-br from-[#6448FF] via-[#5B3DF5] to-[#4326D9] border border-indigo-300/25 shadow-[0_12px_32px_rgba(91,61,245,0.35)] focus-visible:outline-indigo-300'
            : 'bg-gradient-to-br from-rose-600 to-rose-800 border border-rose-300/30 shadow-[0_12px_32px_rgba(225,29,72,0.3)] focus-visible:outline-rose-300'
        }`}
      >
        <div
          className="w-12 h-12 rounded-xl bg-white/15 border border-white/15 text-white flex items-center justify-center shrink-0"
          aria-hidden="true"
        >
          <CreditCard className="w-5 h-5" />
        </div>

        <div className="min-w-0">
          <span className="block text-[11px] font-semibold tracking-wider text-white/80 uppercase">
            Saldo disponible
          </span>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-[27px] font-bold tracking-tight text-white tabular-nums">
              {availableText.main}
            </span>
            <span className="text-[11px] font-semibold text-white/75">COP</span>
          </div>
        </div>
      </button>
    </section>
  );
}
