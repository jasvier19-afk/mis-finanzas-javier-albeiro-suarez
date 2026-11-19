import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  Pencil,
  PieChart,
  Tag,
} from 'lucide-react';
import {
  CURRENT_MONTH_LABEL,
  Movement,
  formatCOP,
  formatPercentage,
  getFullDateLabel,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface MovementDetailScreenProps {
  expense: Movement | null;
  monthlyBudget: number;
  totalSpent: number;
  onBack: () => void;
}

export function MovementDetailScreen({
  expense,
  monthlyBudget,
  totalSpent,
  onBack,
}: MovementDetailScreenProps) {
  if (!expense) {
    return (
      <section
        aria-label="Detalle vacío"
        className="max-w-2xl mx-auto bg-[#111625] border border-white/[0.07] rounded-2xl px-6 py-20 text-center"
      >
        <p className="text-sm sm:text-base text-slate-400">
          Selecciona un gasto en Movimientos para ver el detalle
        </p>
      </section>
    );
  }

  const isIncome = expense.type === 'income';
  const budgetShare = monthlyBudget > 0 ? (expense.amount / monthlyBudget) * 100 : 0;
  const spentShare = totalSpent > 0 ? (expense.amount / totalSpent) * 100 : 0;

  return (
    <section
      aria-labelledby="detalle-gasto-titulo"
      className="max-w-2xl mx-auto bg-[#111625] border border-white/[0.07] rounded-2xl p-6 sm:p-8"
    >
      <div className="flex items-center justify-between gap-3 pb-6 border-b border-white/[0.07]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] text-sm font-semibold text-slate-200 hover:bg-white/[0.1] hover:text-white transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Volver</span>
        </button>

        {/* Botón Editar explícitamente sin funcionalidad según especificación */}
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Edición no disponible en esta demostración"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.02] border border-white/[0.08] text-sm font-semibold text-slate-500 cursor-not-allowed"
        >
          <Pencil className="w-4 h-4" aria-hidden="true" />
          <span>Editar</span>
        </button>
      </div>

      {/* Hero amount & category header */}
      <div
        className={`mt-6 rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          isIncome
            ? 'bg-emerald-500/10 border-emerald-500/25'
            : 'bg-[#181E32] border-white/[0.08]'
        }`}
      >
        <div className="flex items-center gap-4 min-w-0">
          <CategoryIcon category={expense.category} type={expense.type} />
          <div className="min-w-0">
            <p
              className={`text-xs font-semibold ${
                isIncome ? 'text-emerald-400' : 'text-[#8673FF]'
              }`}
            >
              {isIncome ? 'Detalle del ingreso registrado' : 'Detalle del gasto registrado'}
            </p>
            <h2
              id="detalle-gasto-titulo"
              className="text-lg sm:text-xl font-bold text-white mt-0.5 truncate"
            >
              {expense.description}
            </h2>
          </div>
        </div>

        <p
          className={`text-2xl sm:text-3xl font-bold tracking-tight tabular-nums shrink-0 ${
            isIncome ? 'text-emerald-400' : 'text-white'
          }`}
        >
          {isIncome ? `+${formatCOP(expense.amount)}` : formatCOP(expense.amount)}
        </p>
      </div>

      <dl className="mt-6 divide-y divide-white/[0.06]">
        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="text-sm text-slate-400">Tipo de movimiento</dt>
          <dd className="text-sm font-semibold text-white">
            {isIncome ? 'Ingreso' : 'Gasto'}
          </dd>
        </div>

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="flex items-center gap-2 text-sm text-slate-400">
            <Tag className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Categoría</span>
          </dt>
          <dd className="text-sm font-semibold text-white">
            {expense.category}
          </dd>
        </div>

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="flex items-center gap-2 text-sm text-slate-400">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Fecha</span>
          </dt>
          <dd className="text-sm font-semibold text-white">
            {getFullDateLabel(expense.day, expense.isoDate)}
          </dd>
        </div>

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="flex items-center gap-2 text-sm text-slate-400">
            <FileText className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>Descripción</span>
          </dt>
          <dd className="text-sm font-semibold text-white">
            {expense.description}
          </dd>
        </div>

        {expense.paymentMethod && (
          <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <dt className="flex items-center gap-2 text-sm text-slate-400">
              <CreditCard className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Medio de pago</span>
            </dt>
            <dd className="text-sm font-semibold text-white">
              {expense.paymentMethod}
            </dd>
          </div>
        )}

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="flex items-center gap-2 text-sm text-slate-400">
            <PieChart className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <span>
              {isIncome
                ? 'Aporte al presupuesto mensual'
                : 'Peso en el presupuesto mensual'}
            </span>
          </dt>
          <dd className="text-sm font-semibold text-white tabular-nums">
            {isIncome
              ? `+${formatPercentage(budgetShare)} del presupuesto disponible`
              : `${formatPercentage(budgetShare)} del presupuesto (${formatPercentage(spentShare)} de lo gastado)`}
          </dd>
        </div>

        {expense.notes && (
          <div className="py-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <dt className="flex items-center gap-2 text-sm text-slate-400 shrink-0">
              <MessageSquare className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              <span>Observaciones</span>
            </dt>
            <dd className="text-sm text-slate-200 sm:text-right max-w-md whitespace-pre-line">
              {expense.notes}
            </dd>
          </div>
        )}

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="text-sm text-slate-400">Periodo</dt>
          <dd className="text-sm font-medium text-slate-300">
            {CURRENT_MONTH_LABEL}
          </dd>
        </div>

        <div className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <dt className="text-sm text-slate-400">Referencia de registro</dt>
          <dd className="text-sm font-medium text-slate-300 tabular-nums">
            #{expense.id}
          </dd>
        </div>
      </dl>
    </section>
  );
}
