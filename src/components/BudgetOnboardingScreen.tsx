import { FormEvent, useState } from 'react';
import { AlertCircle, ArrowRight, LogOut, Sparkles, User, Wallet } from 'lucide-react';
import { formatCOP } from '../data/budgetData';

interface BudgetOnboardingScreenProps {
  email: string;
  initialDisplayName: string;
  onComplete: (data: {
    displayName: string;
    baseMonthlyBudget: number;
  }) => Promise<void>;
  onSignOut: () => Promise<void>;
}

const PRESET_BUDGETS = [1_500_000, 2_500_000, 3_500_000, 5_000_000];

export function BudgetOnboardingScreen({
  email,
  initialDisplayName,
  onComplete,
  onSignOut,
}: BudgetOnboardingScreenProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [rawBudget, setRawBudget] = useState('2500000');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const parsedBudget = Number(rawBudget.replace(/\D/g, '')) || 0;
  const formattedBudget =
    rawBudget === ''
      ? ''
      : rawBudget.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  const handleBudgetChange = (value: string) => {
    setRawBudget(value.replace(/\D/g, ''));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const cleanName = displayName.trim();
    if (cleanName.length < 2) {
      setErrorMsg('Escribe tu nombre (mínimo 2 caracteres).');
      return;
    }

    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setErrorMsg('Ingresa un presupuesto mensual mayor a $0 COP.');
      return;
    }

    if (parsedBudget > 100_000_000) {
      setErrorMsg('Ingresa un presupuesto menor o igual a $100.000.000 COP.');
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);
    try {
      await onComplete({
        displayName: cleanName.slice(0, 80),
        baseMonthlyBudget: parsedBudget,
      });
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No pudimos guardar tu presupuesto inicial. Intenta nuevamente.'
      );
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090C15] text-slate-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg bg-[#111625] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-[0_16px_48px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/15 border border-[#5B3DF5]/35 text-[#8673FF] flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                Primera vez en tu cuenta
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
                ¿Cuál es tu presupuesto mensual?
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void onSignOut()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.05] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Salir</span>
          </button>
        </div>

        <p className="mt-4 text-sm text-slate-400 leading-relaxed">
          Tu cuenta (<span className="text-slate-200 font-medium">{email}</span>) empieza
          desde cero. Define tu presupuesto base de este mes para calcular automáticamente tu
          saldo disponible.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          <div>
            <label
              htmlFor="onboarding-name"
              className="block text-xs font-semibold text-slate-300 mb-1.5"
            >
              ¿Cómo quieres que te llamemos?
            </label>
            <div className="relative">
              <User
                className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                id="onboarding-name"
                type="text"
                maxLength={80}
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Tu nombre"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-500 focus:outline-none focus:border-[#5B3DF5] transition-colors"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="onboarding-budget"
              className="block text-sm font-semibold text-slate-200 mb-2"
            >
              Presupuesto mensual inicial (COP)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl sm:text-2xl font-bold text-slate-500 pointer-events-none">
                $
              </span>
              <input
                id="onboarding-budget"
                type="text"
                inputMode="numeric"
                autoFocus
                value={formattedBudget}
                onChange={(e) => handleBudgetChange(e.target.value)}
                placeholder="2.500.000"
                className="w-full pl-10 pr-16 py-4 text-2xl sm:text-3xl font-bold tabular-nums rounded-2xl border border-white/[0.08] bg-[#181E32] text-white placeholder:text-slate-600 focus:outline-none focus:border-[#5B3DF5] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">
                COP
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-400 mr-1">Sugeridos:</span>
              {PRESET_BUDGETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRawBudget(String(preset));
                    if (errorMsg) setErrorMsg(null);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums transition-colors cursor-pointer ${
                    parsedBudget === preset
                      ? 'bg-[#5B3DF5] text-white'
                      : 'bg-white/[0.05] border border-white/[0.07] text-slate-300 hover:bg-white/[0.1]'
                  }`}
                >
                  {formatCOP(preset)}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl bg-rose-950/60 border border-rose-500/35 px-3.5 py-2.5 text-xs text-rose-200 flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="w-full h-12 rounded-xl bg-[#5B3DF5] text-white text-sm font-semibold hover:bg-[#4B2FE0] shadow-[0_6px_20px_rgba(91,61,245,0.35)] transition-colors inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5B3DF5]"
          >
            <span>{isSaving ? 'Guardando presupuesto...' : 'Comenzar mi presupuesto'}</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  );
}
