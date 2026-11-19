import { useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  ChevronRight,
  FileText,
  Plus,
  ReceiptText,
  Search,
} from 'lucide-react';
import {
  CURRENT_MONTH_LABEL,
  EXPENSE_CATEGORIES,
  Movement,
  MovementCategory,
  formatCOP,
} from '../data/budgetData';
import { CategoryIcon } from './CategoryIcon';

interface MovementsListScreenProps {
  expenses: Movement[];
  hasExpenses: boolean;
  onSelectExpense: (expense: Movement) => void;
  onBackToDashboard: () => void;
  onOpenRegister: () => void;
  onOpenRegisterIncome: () => void;
}

type TypeFilter = 'Todos' | 'Gastos' | 'Ingresos';

export function MovementsListScreen({
  expenses,
  hasExpenses,
  onSelectExpense,
  onBackToDashboard,
  onOpenRegister,
  onOpenRegisterIncome,
}: MovementsListScreenProps) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('Todos');
  const [selectedCategory, setSelectedCategory] = useState<'Todas' | MovementCategory>(
    'Todas'
  );
  const [searchTerm, setSearchTerm] = useState('');

  if (!hasExpenses) {
    return (
      <section
        aria-labelledby="movimientos-vacio-titulo"
        className="bg-[#111625] border border-white/[0.07] rounded-2xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-white/[0.07]">
          <div className="flex items-center gap-3.5">
            <button
              type="button"
              onClick={onBackToDashboard}
              className="w-10 h-10 rounded-xl bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
              aria-label="Volver al Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                Movimientos de {CURRENT_MONTH_LABEL.toLowerCase()}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                0 gastos registrados
              </p>
            </div>
          </div>
        </div>

        <div className="py-14 sm:py-16 px-4 text-center max-w-md mx-auto">
          <div
            className="w-14 h-14 rounded-2xl bg-[#5B3DF5]/15 border border-[#5B3DF5]/30 text-[#8673FF] flex items-center justify-center mx-auto"
            aria-hidden="true"
          >
            <ReceiptText className="w-7 h-7" />
          </div>

          <h3
            id="movimientos-vacio-titulo"
            className="mt-5 text-xl font-bold tracking-tight text-white"
          >
            Tus gastos van a vivir aquí
          </h3>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            Cada vez que pagues algo, lo registras y aparece en esta lista
          </p>

          <button
            type="button"
            onClick={onOpenRegister}
            className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5B3DF5] text-white text-sm font-semibold hover:bg-[#4B2FE0] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Registrar gasto</span>
          </button>
        </div>
      </section>
    );
  }

  const filteredMovements = expenses.filter((item) => {
    const matchesType =
      typeFilter === 'Todos' ||
      (typeFilter === 'Gastos' && item.type === 'expense') ||
      (typeFilter === 'Ingresos' && item.type === 'income');
    const matchesCategory =
      selectedCategory === 'Todas' || item.category === selectedCategory;
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const matchesQuery =
      normalizedQuery === '' ||
      item.description.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery) ||
      item.dateLabel.toLowerCase().includes(normalizedQuery);
    return matchesType && matchesCategory && matchesQuery;
  });

  const filteredExpensesTotal = filteredMovements
    .filter((m) => m.type === 'expense')
    .reduce((sum, item) => sum + item.amount, 0);

  const filteredIncomeTotal = filteredMovements
    .filter((m) => m.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <section
      aria-labelledby="movimientos-mes-titulo"
      className="bg-[#111625] border border-white/[0.07] rounded-2xl p-6 sm:p-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-white/[0.07]">
        <div className="flex items-start sm:items-center gap-3.5">
          <button
            type="button"
            onClick={onBackToDashboard}
            className="w-10 h-10 rounded-xl bg-white/[0.05] text-slate-300 hover:bg-white/[0.1] hover:text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
            aria-label="Volver al Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-[#5B3DF5]/15 border border-[#5B3DF5]/25 text-[#8673FF] hidden sm:flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="movimientos-mes-titulo"
                className="text-xl font-bold tracking-tight text-white"
              >
                Movimientos de {CURRENT_MONTH_LABEL.toLowerCase()}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5 tabular-nums">
                {filteredMovements.length}{' '}
                {filteredMovements.length === 1 ? 'movimiento' : 'movimientos'}
                {filteredExpensesTotal > 0 && (
                  <>
                    {' · '}Gastos:{' '}
                    <span className="font-semibold text-rose-400">
                      {formatCOP(filteredExpensesTotal)}
                    </span>
                  </>
                )}
                {filteredIncomeTotal > 0 && (
                  <>
                    {' · '}Ingresos:{' '}
                    <span className="font-semibold text-emerald-400">
                      +{formatCOP(filteredIncomeTotal)}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenRegisterIncome}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-sm font-semibold hover:bg-emerald-500/20 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Banknote className="w-4 h-4" aria-hidden="true" />
            <span>Nuevo ingreso</span>
          </button>

          <button
            type="button"
            onClick={onOpenRegister}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#5B3DF5] text-white text-sm font-semibold hover:bg-[#4B2FE0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Registrar nuevo gasto</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="mt-5 flex flex-col gap-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="inline-flex items-center p-1 bg-[#181E32] border border-white/[0.06] rounded-full self-start">
            {(['Todos', 'Gastos', 'Ingresos'] as TypeFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setTypeFilter(filter);
                  setSelectedCategory('Todas');
                }}
                className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  typeFilter === filter
                    ? 'bg-[#5B3DF5] text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72 shrink-0">
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar movimiento o fecha..."
              aria-label="Buscar movimiento o fecha"
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#181E32] border border-white/[0.08] rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors"
            />
          </div>
        </div>

        {typeFilter !== 'Ingresos' && (
          <div
            role="group"
            aria-label="Filtrar gastos por categoría"
            className="flex items-center gap-1.5 overflow-x-auto pb-1"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('Todas')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === 'Todas'
                  ? 'bg-[#5B3DF5]/20 text-indigo-300 border border-[#5B3DF5]/40'
                  : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
            >
              Todas las categorías
            </button>
            {EXPENSE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-[#5B3DF5]/20 text-indigo-300 border border-[#5B3DF5]/40'
                    : 'bg-white/[0.04] text-slate-400 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        )}
      </div>

      {filteredMovements.length === 0 ? (
        <div className="mt-8 py-12 text-center rounded-2xl bg-[#181E32] border border-white/[0.06] px-4">
          <p className="text-sm font-semibold text-white">
            No se encontraron movimientos con este filtro
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Prueba otro filtro o limpia el campo de búsqueda para ver todos los registros del mes.
          </p>
          <button
            type="button"
            onClick={() => {
              setTypeFilter('Todos');
              setSelectedCategory('Todas');
              setSearchTerm('');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-semibold text-slate-200 hover:bg-white/[0.1] transition-colors cursor-pointer"
          >
            Mostrar todos
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-white/[0.06] mt-5">
          {filteredMovements.map((movement) => {
            const isIncome = movement.type === 'income';

            return (
              <li key={movement.id}>
                <button
                  type="button"
                  onClick={() => onSelectExpense(movement)}
                  className="w-full text-left py-4 px-3 -mx-3 rounded-xl flex items-center justify-between gap-4 hover:bg-white/[0.04] transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <CategoryIcon
                      category={movement.category}
                      type={movement.type}
                    />
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-white truncate">
                        {movement.description}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-400 truncate mt-0.5">
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

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-bold tabular-nums whitespace-nowrap ${
                        isIncome ? 'text-emerald-400' : 'text-white'
                      }`}
                    >
                      {isIncome
                        ? `+${formatCOP(movement.amount)}`
                        : formatCOP(movement.amount)}
                    </span>
                    <ChevronRight
                      className="w-4 h-4 text-slate-500 group-hover:text-[#8673FF] transition-colors"
                      aria-hidden="true"
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
