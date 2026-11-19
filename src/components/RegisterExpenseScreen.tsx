import { FormEvent, useRef, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Zap } from 'lucide-react';
import {
  CURRENT_DAY_OF_MONTH,
  DAYS_IN_MONTH,
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  formatCOP,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface RegisterExpenseScreenProps {
  currentAvailableBalance: number;
  onSaveExpense: (data: {
    amount: number;
    category: ExpenseCategory;
    day: number;
    description: string;
  }) => void;
  onCancel: () => void;
}

const QUICK_AMOUNTS = [15_000, 25_000, 50_000, 100_000];

const QUICK_DESCRIPTIONS: Record<ExpenseCategory, string[]> = {
  Alimentación: ['Almuerzo', 'Café y panadería', 'Mercado', 'Domicilio'],
  Transporte: ['Pasaje bus / metro', 'Taxi / App', 'Recarga tarjeta', 'Parqueadero'],
  'Servicios públicos': ['Internet hogar', 'Energía eléctrica', 'Agua', 'Plan celular'],
  'Ropa y compras personales': ['Ropa', 'Farmacia', 'Cuidado personal', 'Compra tienda'],
  'Entretenimiento y ocio': ['Cine', 'Salida con amigos', 'Suscripción', 'Eventos'],
};

export function RegisterExpenseScreen({
  currentAvailableBalance,
  onSaveExpense,
  onCancel,
}: RegisterExpenseScreenProps) {
  const [rawAmount, setRawAmount] = useState<string>('');
  const [category, setCategory] = useState<ExpenseCategory>('Alimentación');
  const [day, setDay] = useState<number>(CURRENT_DAY_OF_MONTH);
  const [description, setDescription] = useState<string>('');
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    day?: string;
  }>({});

  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLInputElement>(null);

  const parsedAmount = Number(rawAmount.replace(/\D/g, '')) || 0;
  const projectedBalance = currentAvailableBalance - parsedAmount;

  const handleAmountChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setRawAmount(digitsOnly);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleQuickAmount = (quickValue: number) => {
    setRawAmount(String(quickValue));
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleQuickDescription = (quickText: string) => {
    setDescription(quickText);
    if (errors.description) {
      setErrors((prev) => ({ ...prev, description: undefined }));
    }
  };

  const formattedDisplayAmount =
    rawAmount === ''
      ? ''
      : rawAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: {
      amount?: string;
      description?: string;
      day?: string;
    } = {};

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Ingresa un monto válido mayor a $0 COP.';
    } else if (parsedAmount > 50_000_000) {
      nextErrors.amount = 'El monto máximo permitido por movimiento es $50.000.000 COP.';
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 2) {
      nextErrors.description = 'Escribe una breve descripción (mínimo 2 caracteres).';
    }

    if (day < 1 || day > DAYS_IN_MONTH) {
      nextErrors.day = 'Selecciona un día válido de noviembre.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      if (nextErrors.amount) {
        amountInputRef.current?.focus();
      } else if (nextErrors.description) {
        descriptionInputRef.current?.focus();
      }
      return;
    }

    onSaveExpense({
      amount: parsedAmount,
      category,
      day,
      description: cleanDescription,
    });
  };

  return (
    <section
      aria-labelledby="registrar-gasto-titulo"
      className="max-w-2xl mx-auto bg-[#111625] border border-white/[0.07] rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
        <div className="flex items-center gap-3.5">
          <button
            type="button"
            onClick={onCancel}
            className="w-10 h-10 rounded-xl bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
            aria-label="Volver sin guardar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h2
              id="registrar-gasto-titulo"
              className="text-xl font-bold tracking-tight text-white"
            >
              Registrar nuevo gasto
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#8673FF] shrink-0" aria-hidden="true" />
              <span>Registro rápido en menos de 30 segundos</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
        <div>
          <label
            htmlFor="gasto-monto"
            className="block text-sm font-semibold text-slate-200 mb-2"
          >
            1. ¿Cuánto pagaste?
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-slate-500 pointer-events-none">
              $
            </span>
            <input
              ref={amountInputRef}
              id="gasto-monto"
              type="text"
              inputMode="numeric"
              autoFocus
              value={formattedDisplayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0"
              aria-invalid={Boolean(errors.amount)}
              className={`w-full pl-10 pr-16 py-4 text-2xl sm:text-3xl font-bold tabular-nums rounded-2xl border bg-[#181E32] text-white placeholder:text-slate-600 focus:outline-none transition-colors ${
                errors.amount
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-white/[0.08] focus:border-[#5B3DF5]'
              }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
              COP
            </span>
          </div>

          {errors.amount && (
            <p className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{errors.amount}</span>
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400 mr-1">Montos frecuentes:</span>
            {QUICK_AMOUNTS.map((quick) => (
              <button
                key={quick}
                type="button"
                onClick={() => handleQuickAmount(quick)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                  parsedAmount === quick
                    ? 'bg-[#5B3DF5] text-white'
                    : 'bg-white/[0.05] border border-white/[0.07] text-slate-300 hover:bg-white/[0.1]'
                }`}
              >
                {formatCOP(quick)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-semibold text-slate-200 mb-2.5">
            2. ¿En qué categoría?
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {EXPENSE_CATEGORIES.map((cat) => {
              const isSelected = category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  aria-pressed={isSelected}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between gap-3 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] ${
                    isSelected
                      ? 'bg-[#5B3DF5]/15 border-[#5B3DF5]'
                      : 'bg-[#181E32] border-white/[0.07] hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryIcon category={cat} size="sm" />
                    <span className="text-sm font-semibold text-slate-100 truncate">
                      {cat}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      className="w-5 h-5 rounded-full bg-[#5B3DF5] text-white flex items-center justify-center shrink-0"
                      aria-hidden="true"
                    >
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label
              htmlFor="gasto-descripcion"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              3. Descripción corta
            </label>
            <input
              ref={descriptionInputRef}
              id="gasto-descripcion"
              type="text"
              maxLength={60}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => ({ ...prev, description: undefined }));
                }
              }}
              placeholder="Ej: Almuerzo, café, pasaje..."
              aria-invalid={Boolean(errors.description)}
              className={`w-full px-4 py-3 text-sm rounded-xl border bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none transition-colors ${
                errors.description
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-white/[0.08] focus:border-[#5B3DF5]'
              }`}
            />
            {errors.description && (
              <p className="mt-1.5 text-xs font-medium text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>{errors.description}</span>
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {QUICK_DESCRIPTIONS[category].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleQuickDescription(suggestion)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                    description.trim() === suggestion
                      ? 'bg-[#5B3DF5]/25 text-indigo-200 border border-[#5B3DF5]/50'
                      : 'bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor="gasto-fecha"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Fecha
            </label>
            <select
              id="gasto-fecha"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
              className="w-full px-3.5 py-3 text-sm font-medium rounded-xl border border-white/[0.08] bg-[#181E32] text-white focus:outline-none focus:border-[#5B3DF5] transition-colors"
            >
              {Array.from(
                { length: CURRENT_DAY_OF_MONTH },
                (_, i) => CURRENT_DAY_OF_MONTH - i
              ).map((d) => (
                <option key={d} value={d}>
                  {d === CURRENT_DAY_OF_MONTH ? `Hoy (${d} nov)` : `${d} nov 2026`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-2xl bg-[#181E32] border border-white/[0.07] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <span className="text-slate-400">
            Saldo disponible después de guardar:
          </span>
          <span
            className={`font-bold tabular-nums ${
              projectedBalance < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {formatCOP(projectedBalance)}
          </span>
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.06] text-sm font-semibold text-slate-200 hover:bg-white/[0.1] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#5B3DF5] text-sm font-semibold text-white hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            Guardar gasto
          </button>
        </div>
      </form>
    </section>
  );
}
