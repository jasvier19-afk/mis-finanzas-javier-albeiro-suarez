import { FormEvent, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
} from 'lucide-react';
import {
  CURRENT_ISO_DATE,
  INCOME_CATEGORIES,
  IncomeCategory,
  PAYMENT_METHODS,
  PaymentMethod,
  formatCOP,
} from '../data/budgetData';

interface RegisterIncomeScreenProps {
  currentAvailableBalance: number;
  onSaveIncome: (data: {
    amount: number;
    description: string;
    category: IncomeCategory;
    isoDate: string;
    paymentMethod: PaymentMethod;
    notes: string;
  }) => void;
  onCancel: () => void;
}

const QUICK_INCOME_AMOUNTS = [200_000, 500_000, 850_000, 1_500_000];

export function RegisterIncomeScreen({
  currentAvailableBalance,
  onSaveIncome,
  onCancel,
}: RegisterIncomeScreenProps) {
  const [rawAmount, setRawAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<IncomeCategory>('Salario');
  const [isoDate, setIsoDate] = useState<string>(CURRENT_ISO_DATE);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cuenta bancaria');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errors, setErrors] = useState<{
    amount?: string;
    description?: string;
    isoDate?: string;
  }>({});

  const parsedAmount = Number(rawAmount.replace(/\D/g, '')) || 0;
  const projectedBalance = currentAvailableBalance + parsedAmount;

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

  const formattedDisplayAmount =
    rawAmount === ''
      ? ''
      : rawAmount.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const nextErrors: {
      amount?: string;
      description?: string;
      isoDate?: string;
    } = {};

    if (!rawAmount || parsedAmount <= 0) {
      nextErrors.amount =
        'Ingresa un valor mayor a cero en pesos colombianos (COP).';
    } else if (parsedAmount > 500_000_000) {
      nextErrors.amount =
        'El valor máximo permitido por registro es $500.000.000 COP.';
    }

    const cleanDescription = description.trim();
    if (cleanDescription.length < 2) {
      nextErrors.description =
        'Por favor ingresa una descripción del ingreso (mínimo 2 caracteres).';
    }

    if (!isoDate) {
      nextErrors.isoDate = 'Selecciona una fecha válida para el ingreso.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSaving(true);
    window.setTimeout(() => {
      onSaveIncome({
        amount: parsedAmount,
        description: cleanDescription,
        category,
        isoDate,
        paymentMethod,
        notes: notes.trim(),
      });
    }, 260);
  };

  return (
    <section
      aria-labelledby="registrar-ingreso-titulo"
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

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hidden sm:flex items-center justify-center shrink-0"
              aria-hidden="true"
            >
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="registrar-ingreso-titulo"
                className="text-xl font-bold tracking-tight text-white"
              >
                Registrar Nuevo Ingreso
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Aumenta tu presupuesto disponible y actualiza automáticamente el Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
        <div>
          <label
            htmlFor="ingreso-monto"
            className="block text-sm font-semibold text-slate-200 mb-2"
          >
            Valor del ingreso <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-slate-500 pointer-events-none">
              $
            </span>
            <input
              id="ingreso-monto"
              type="text"
              inputMode="numeric"
              autoFocus
              value={formattedDisplayAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="850.000"
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
            <span className="text-xs text-slate-400 mr-1">Valores sugeridos:</span>
            {QUICK_INCOME_AMOUNTS.map((quick) => (
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
                +{formatCOP(quick)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="ingreso-descripcion"
            className="block text-sm font-semibold text-slate-200 mb-2"
          >
            Descripción <span className="text-rose-400">*</span>
          </label>
          <input
            id="ingreso-descripcion"
            type="text"
            maxLength={80}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (errors.description) {
                setErrors((prev) => ({ ...prev, description: undefined }));
              }
            }}
            placeholder="Ej: Salario, Freelance, Venta de computador, Bonificación, Reembolso"
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
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="ingreso-categoria"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Categoría
            </label>
            <select
              id="ingreso-categoria"
              value={category}
              onChange={(e) => setCategory(e.target.value as IncomeCategory)}
              className="w-full px-3.5 py-3 text-sm font-medium rounded-xl border border-white/[0.08] bg-[#181E32] text-white focus:outline-none focus:border-[#5B3DF5] transition-colors"
            >
              {INCOME_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="ingreso-fecha"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Fecha del ingreso
            </label>
            <input
              id="ingreso-fecha"
              type="date"
              value={isoDate}
              onChange={(e) => {
                setIsoDate(e.target.value);
                if (errors.isoDate) {
                  setErrors((prev) => ({ ...prev, isoDate: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.isoDate)}
              className={`w-full px-3.5 py-3 text-sm font-medium rounded-xl border bg-[#181E32] text-white focus:outline-none transition-colors tabular-nums ${
                errors.isoDate
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-white/[0.08] focus:border-[#5B3DF5]'
              }`}
            />
            {errors.isoDate && (
              <p className="mt-1.5 text-xs font-medium text-rose-400">
                {errors.isoDate}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="ingreso-medio-pago"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Medio de pago
            </label>
            <select
              id="ingreso-medio-pago"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full px-3.5 py-3 text-sm font-medium rounded-xl border border-white/[0.08] bg-[#181E32] text-white focus:outline-none focus:border-[#5B3DF5] transition-colors"
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label
            htmlFor="ingreso-observaciones"
            className="block text-sm font-semibold text-slate-200 mb-2"
          >
            Observaciones{' '}
            <span className="text-xs font-normal text-slate-500">(opcional)</span>
          </label>
          <textarea
            id="ingreso-observaciones"
            rows={3}
            maxLength={240}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notas adicionales sobre este ingreso..."
            className="w-full px-4 py-3 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors resize-none"
          />
        </div>

        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 px-4 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs sm:text-sm">
          <span className="text-emerald-300 font-medium">
            Nuevo saldo disponible después de guardar:
          </span>
          <span className="font-bold tabular-nums text-emerald-300 text-sm sm:text-base">
            {formatCOP(projectedBalance)}
          </span>
        </div>

        <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-white/[0.06] text-sm font-semibold text-slate-200 hover:bg-white/[0.1] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            Cancelar
          </button>

          <motion.button
            type="submit"
            disabled={isSaving}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#5B3DF5] text-sm font-semibold text-white hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5] disabled:opacity-90"
          >
            {isSaving ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" aria-hidden="true" />
                <span>Guardando ingreso...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Guardar ingreso</span>
              </>
            )}
          </motion.button>
        </div>
      </form>
    </section>
  );
}
